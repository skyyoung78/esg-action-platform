import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  findOrganization,
  ORG_TYPE_LABEL,
  searchOrganizations,
  toSearchResult,
  type OrgType,
  type SearchableOrg,
} from "@/lib/listed-companies";

const DART_BASE = "https://opendart.fss.or.kr/api";
const ESG_REPORT_KEYWORDS = [
  "지속가능",
  "ESG",
  "기업지배구조",
  "사회책임",
  "환경·사회",
  "환경, 사회",
  "지배구조보고서",
  "지속가능경영",
  "사회적책임",
  "ESG경영",
  "경영공시",
  "공공기관 경영",
];

export type CompanyProfile = {
  corpName: string;
  corpCode: string | null;
  stockCode: string | null;
  orgType: OrgType;
  orgTypeLabel: string;
};

export type CompanyEsgGrade = {
  eScore: number | null;
  sScore: number | null;
  gScore: number | null;
  overallGrade: string | null;
  asOfDate: string | null;
  sourceUrl: string | null;
};

export type DisclosureItem = {
  title: string;
  submittedAt: string;
  category: string;
  reportUrl: string;
};

export type ExternalLink = {
  label: string;
  url: string;
};

export type CompanyDisclosureResult = {
  company: CompanyProfile;
  grade: CompanyEsgGrade | null;
  disclosures: DisclosureItem[];
  externalLinks: ExternalLink[];
  dataSource: "live" | "demo";
  notice?: string;
};

type DartCompanyResponse = {
  status: string;
  message: string;
  corp_code?: string;
  corp_name?: string;
  stock_code?: string;
};

type DartListItem = {
  rcept_no: string;
  report_nm: string;
  rcept_dt: string;
  corp_name: string;
  stock_code: string;
  corp_cls?: string;
};

type DartListResponse = {
  status: string;
  message: string;
  list?: DartListItem[];
};

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatDisplayDate(ymd: string): string {
  if (ymd.length !== 8) return ymd;
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`;
}

function categorizeReport(title: string): string {
  if (title.includes("지속가능") || title.includes("ESG")) return "지속가능경영";
  if (title.includes("지배구조")) return "지배구조";
  if (title.includes("사회") || title.includes("환경")) return "ESG 공시";
  return "기타 공시";
}

function isEsgRelatedReport(title: string): boolean {
  return ESG_REPORT_KEYWORDS.some((keyword) => title.includes(keyword));
}

function dartViewerUrl(rceptNo: string): string {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
}

type DartCompanyProfile = {
  corpName: string;
  corpCode: string;
  stockCode: string | null;
};

async function fetchDartCompany(
  apiKey: string,
  params: { stockCode?: string; corpName?: string },
): Promise<DartCompanyProfile | null> {
  const url = new URL(`${DART_BASE}/company.json`);
  url.searchParams.set("crtfc_key", apiKey);
  if (params.stockCode) url.searchParams.set("stock_code", params.stockCode);
  if (params.corpName) url.searchParams.set("corp_name", params.corpName);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return null;

  const data = (await response.json()) as DartCompanyResponse;
  if (data.status !== "000" || !data.corp_code) return null;

  return {
    corpName: String(data.corp_name ?? params.corpName ?? "").replace(/\(주\)/g, "").trim(),
    corpCode: data.corp_code,
    stockCode: data.stock_code && data.stock_code !== " " ? data.stock_code : params.stockCode ?? null,
  };
}

async function resolveDartProfile(
  apiKey: string,
  org: SearchableOrg,
): Promise<DartCompanyProfile | null> {
  if (org.stockCode) {
    const byStock = await fetchDartCompany(apiKey, { stockCode: org.stockCode });
    if (byStock) {
      return {
        corpName: byStock.corpName || org.name,
        corpCode: byStock.corpCode,
        stockCode: byStock.stockCode ?? org.stockCode,
      };
    }
  }

  const namesToTry = [...(org.dartNames ?? []), org.name];
  for (const dartName of namesToTry) {
    const profile = await fetchDartCompany(apiKey, { corpName: dartName });
    if (profile) {
      return {
        corpName: org.name,
        corpCode: profile.corpCode,
        stockCode: profile.stockCode,
      };
    }
  }

  return null;
}

async function fetchDartDisclosures(
  apiKey: string,
  corpCode: string,
): Promise<DisclosureItem[]> {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 3);

  const url = new URL(`${DART_BASE}/list.json`);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bgn_de", formatYmd(start));
  url.searchParams.set("end_de", formatYmd(end));
  url.searchParams.set("page_no", "1");
  url.searchParams.set("page_count", "100");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as DartListResponse;
  if (data.status !== "000" || !data.list) return [];

  return data.list
    .filter((item) => isEsgRelatedReport(item.report_nm))
    .map((item) => ({
      title: item.report_nm,
      submittedAt: formatDisplayDate(item.rcept_dt),
      category: categorizeReport(item.report_nm),
      reportUrl: dartViewerUrl(item.rcept_no),
    }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

async function fetchSupabaseGrade(companyName: string): Promise<CompanyEsgGrade | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const normalized = companyName.replace(/\(주\)/g, "").trim();

  const { data } = await supabase
    .from("esg_company_grades")
    .select("e_score,s_score,g_score,overall_grade,as_of_date,source_url,company_name")
    .eq("is_active", true)
    .ilike("company_name", `%${normalized}%`)
    .order("as_of_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    eScore: data.e_score != null ? Number(data.e_score) : null,
    sScore: data.s_score != null ? Number(data.s_score) : null,
    gScore: data.g_score != null ? Number(data.g_score) : null,
    overallGrade: data.overall_grade ? String(data.overall_grade) : null,
    asOfDate: data.as_of_date ? String(data.as_of_date) : null,
    sourceUrl: data.source_url ? String(data.source_url) : null,
  };
}

function buildExternalLinks(profile: CompanyProfile): ExternalLink[] {
  const dartSearchUrl = `https://dart.fss.or.kr/search/search.do?textCrpNm=${encodeURIComponent(profile.corpName)}`;
  const links: ExternalLink[] = [
    { label: "DART 공시 검색", url: dartSearchUrl },
    { label: "KRX ESG포털", url: "https://esg.krx.co.kr/" },
    { label: "한국ESG기준원 (KCGS)", url: "https://www.cgs.or.kr" },
  ];

  if (profile.orgType === "listed" && profile.stockCode) {
    links.unshift({
      label: "KIND 상장사 정보",
      url: `https://kind.krx.co.kr/disclosureSimpleSearch.do?method=searchSimpleList&searchType=13&searchText=${profile.stockCode}`,
    });
  }

  if (profile.orgType === "public-enterprise" || profile.orgType === "public-institution") {
    links.push({
      label: "K-ESG 가이드라인",
      url: "https://k-esg.org/guide/guideline01",
    });
  }

  return links;
}

function buildProfile(org: SearchableOrg, dart: DartCompanyProfile | null): CompanyProfile {
  return {
    corpName: org.name,
    corpCode: dart?.corpCode ?? null,
    stockCode: dart?.stockCode ?? org.stockCode ?? null,
    orgType: org.orgType,
    orgTypeLabel: ORG_TYPE_LABEL[org.orgType],
  };
}

function demoDisclosureTitles(org: SearchableOrg): [string, string] {
  if (org.orgType === "public-institution") {
    return [
      `${org.name} 지속가능경영·ESG 경영보고서 (샘플)`,
      `${org.name} 경영공시·책임경영 보고 (샘플)`,
    ];
  }
  if (org.orgType === "public-enterprise") {
    return [
      `${org.name} 지속가능경영보고서 (샘플)`,
      `${org.name} ESG·지배구조 공시 (샘플)`,
    ];
  }
  return [
    `${org.name} 지속가능경영보고서 (샘플)`,
    `${org.name} 기업지배구조보고서 (샘플)`,
  ];
}

/** API 키 없을 때 참고용 샘플 (실제 공시 링크는 DART 검색 페이지) */
function getDemoResult(org: SearchableOrg): CompanyDisclosureResult {
  const demoGrades: Record<string, CompanyEsgGrade> = {
    "005930": {
      eScore: 82.5,
      sScore: 78.0,
      gScore: 85.0,
      overallGrade: "A",
      asOfDate: "2024-12-31",
      sourceUrl: "https://esg.krx.co.kr/",
    },
    "000660": {
      eScore: 79.0,
      sScore: 76.5,
      gScore: 80.0,
      overallGrade: "A",
      asOfDate: "2024-12-31",
      sourceUrl: "https://esg.krx.co.kr/",
    },
    "005380": {
      eScore: 77.0,
      sScore: 80.0,
      gScore: 83.0,
      overallGrade: "A",
      asOfDate: "2024-12-31",
      sourceUrl: "https://esg.krx.co.kr/",
    },
    "015760": {
      eScore: 74.0,
      sScore: 79.0,
      gScore: 81.0,
      overallGrade: "B+",
      asOfDate: "2024-12-31",
      sourceUrl: "https://esg.krx.co.kr/",
    },
    "036460": {
      eScore: 76.0,
      sScore: 77.0,
      gScore: 80.0,
      overallGrade: "A",
      asOfDate: "2024-12-31",
      sourceUrl: "https://esg.krx.co.kr/",
    },
  };

  const profile = buildProfile(org, null);
  const [title1, title2] = demoDisclosureTitles(org);
  const dartSearch = `https://dart.fss.or.kr/search/search.do?textCrpNm=${encodeURIComponent(org.name)}`;

  return {
    company: profile,
    grade: (org.stockCode ? demoGrades[org.stockCode] : undefined) ?? {
      eScore: null,
      sScore: null,
      gScore: null,
      overallGrade: null,
      asOfDate: null,
      sourceUrl: "https://esg.krx.co.kr/",
    },
    disclosures: [
      {
        title: title1,
        submittedAt: "2024.03.28",
        category: "지속가능경영",
        reportUrl: dartSearch,
      },
      {
        title: title2,
        submittedAt: "2024.03.28",
        category: org.orgType === "public-institution" ? "경영공시" : "지배구조",
        reportUrl: dartSearch,
      },
    ],
    externalLinks: buildExternalLinks(profile),
    dataSource: "demo",
    notice:
      "DART API 키(OPENDART_API_KEY)가 설정되지 않아 샘플 데이터를 표시합니다. .env.local에 키를 추가하면 실제 공시 목록을 불러옵니다.",
  };
}

export async function searchCompanies(query: string) {
  return searchOrganizations(query, 12).map(toSearchResult);
}

export async function fetchCompanyDisclosure(input: {
  name: string;
  stockCode?: string;
}): Promise<CompanyDisclosureResult | null> {
  const trimmed = input.name.trim();
  if (!trimmed) return null;

  const org =
    findOrganization(trimmed, input.stockCode) ??
    (input.stockCode
      ? ({
          name: trimmed,
          orgType: "listed" as const,
          stockCode: input.stockCode,
        } satisfies SearchableOrg)
      : null);

  if (!org) return null;

  const apiKey = process.env.OPENDART_API_KEY?.trim();
  const supabaseGrade = await fetchSupabaseGrade(org.name);

  if (!apiKey) {
    const demo = getDemoResult(org);
    if (supabaseGrade) demo.grade = supabaseGrade;
    return demo;
  }

  const dart = await resolveDartProfile(apiKey, org);

  if (!dart) {
    const demo = getDemoResult(org);
    if (supabaseGrade) demo.grade = supabaseGrade;
    demo.notice =
      "DART에서 법인 정보를 찾지 못했습니다. 공기업·공공기관은 DART 등록 명칭과 다를 수 있어, 아래 DART 검색 링크에서 직접 확인해 주세요.";
    return demo;
  }

  const profile = buildProfile(org, dart);
  const disclosures = await fetchDartDisclosures(apiKey, dart.corpCode);

  const grade =
    supabaseGrade ??
    ({
      eScore: null,
      sScore: null,
      gScore: null,
      overallGrade: null,
      asOfDate: null,
      sourceUrl: "https://esg.krx.co.kr/",
    } satisfies CompanyEsgGrade);

  return {
    company: profile,
    grade,
    disclosures,
    externalLinks: buildExternalLinks(profile),
    dataSource: "live",
    notice:
      disclosures.length === 0
        ? "최근 3년간 DART에 등록된 ESG·지속가능·경영공시 관련 자료가 없거나, 아직 제출되지 않았을 수 있습니다."
        : undefined,
  };
}
