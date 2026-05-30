export type OrgType = "listed" | "public-enterprise" | "public-institution";

export type SearchableOrg = {
  name: string;
  orgType: OrgType;
  stockCode?: string;
  /** DART company.json 조회용 법인명 후보 */
  dartNames?: string[];
  /** 검색어 매칭용 별칭 */
  searchAliases?: string[];
};

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  listed: "상장사",
  "public-enterprise": "공기업",
  "public-institution": "공공기관",
};

const LISTED: SearchableOrg[] = [
  { name: "삼성전자", orgType: "listed", stockCode: "005930" },
  { name: "SK하이닉스", orgType: "listed", stockCode: "000660" },
  { name: "LG에너지솔루션", orgType: "listed", stockCode: "373220" },
  { name: "삼성바이오로직스", orgType: "listed", stockCode: "207940" },
  { name: "현대차", orgType: "listed", stockCode: "005380", searchAliases: ["현대자동차"] },
  { name: "기아", orgType: "listed", stockCode: "000270" },
  { name: "NAVER", orgType: "listed", stockCode: "035420", searchAliases: ["네이버"] },
  { name: "카카오", orgType: "listed", stockCode: "035720" },
  { name: "셀트리온", orgType: "listed", stockCode: "068270" },
  { name: "POSCO홀딩스", orgType: "listed", stockCode: "005490", searchAliases: ["포스코"] },
  { name: "LG화학", orgType: "listed", stockCode: "051910" },
  { name: "삼성SDI", orgType: "listed", stockCode: "006400" },
  { name: "KB금융", orgType: "listed", stockCode: "105560" },
  { name: "신한지주", orgType: "listed", stockCode: "055550" },
  { name: "하나금융지주", orgType: "listed", stockCode: "086790" },
  { name: "삼성물산", orgType: "listed", stockCode: "028260" },
  { name: "HD현대중공업", orgType: "listed", stockCode: "329180" },
  { name: "LG전자", orgType: "listed", stockCode: "066570" },
  { name: "SK이노베이션", orgType: "listed", stockCode: "096770" },
  { name: "SK텔레콤", orgType: "listed", stockCode: "017670" },
  { name: "KT", orgType: "listed", stockCode: "030200" },
  { name: "LG디스플레이", orgType: "listed", stockCode: "034220" },
  { name: "한화에어로스페이스", orgType: "listed", stockCode: "012450" },
  { name: "두산에너빌리티", orgType: "listed", stockCode: "034020" },
  { name: "현대모비스", orgType: "listed", stockCode: "012330" },
  { name: "아모레퍼시픽", orgType: "listed", stockCode: "090430" },
  { name: "CJ제일제당", orgType: "listed", stockCode: "097950" },
  { name: "S-Oil", orgType: "listed", stockCode: "010950", searchAliases: ["에스오일"] },
  { name: "삼성생명", orgType: "listed", stockCode: "032830" },
  { name: "삼성화재", orgType: "listed", stockCode: "000810" },
  { name: "Meritz금융지주", orgType: "listed", stockCode: "138040" },
  { name: "HMM", orgType: "listed", stockCode: "011200" },
  { name: "크래프톤", orgType: "listed", stockCode: "259960" },
  { name: "카카오뱅크", orgType: "listed", stockCode: "323410" },
  { name: "카카오페이", orgType: "listed", stockCode: "377300" },
  { name: "포스코퓨처엠", orgType: "listed", stockCode: "003670" },
  { name: "LG유플러스", orgType: "listed", stockCode: "032640" },
  { name: "한국조선해양", orgType: "listed", stockCode: "009540" },
  { name: "현대글로비스", orgType: "listed", stockCode: "086280" },
  { name: "LS ELECTRIC", orgType: "listed", stockCode: "010120" },
  { name: "효성중공업", orgType: "listed", stockCode: "298040" },
  { name: "DB하이텍", orgType: "listed", stockCode: "000990" },
  { name: "한미반도체", orgType: "listed", stockCode: "042700" },
  { name: "에코프로비엠", orgType: "listed", stockCode: "247540" },
  { name: "엔씨소프트", orgType: "listed", stockCode: "036570" },
  { name: "넷마블", orgType: "listed", stockCode: "251270" },
  { name: "한국타이어앤테크놀로지", orgType: "listed", stockCode: "161390" },
];

const PUBLIC_ENTERPRISES: SearchableOrg[] = [
  {
    name: "한국전력",
    orgType: "public-enterprise",
    stockCode: "015760",
    searchAliases: ["한국전력공사", "KEPCO"],
  },
  {
    name: "한국가스공사",
    orgType: "public-enterprise",
    stockCode: "036460",
    searchAliases: ["KOGAS"],
  },
  {
    name: "한국수력원자력",
    orgType: "public-enterprise",
    dartNames: ["한국수력원자력(주)", "한국수력원자력"],
    searchAliases: ["KHNP", "수력원자력"],
  },
  {
    name: "한국철도공사",
    orgType: "public-enterprise",
    dartNames: ["한국철도공사", "(사)한국철도공사"],
    searchAliases: ["KORAIL", "코레일"],
  },
  {
    name: "인천국제공항공사",
    orgType: "public-enterprise",
    dartNames: ["인천국제공항공사"],
    searchAliases: ["IIAC", "인천공항공사"],
  },
  {
    name: "한국토지주택공사",
    orgType: "public-enterprise",
    dartNames: ["한국토지주택공사", "(사)한국토지주택공사"],
    searchAliases: ["LH", "토지주택공사"],
  },
  {
    name: "한국도로공사",
    orgType: "public-enterprise",
    dartNames: ["한국도로공사", "(사)한국도로공사"],
    searchAliases: ["EX", "도로공사"],
  },
  {
    name: "한국수자원공사",
    orgType: "public-enterprise",
    dartNames: ["한국수자원공사", "(사)한국수자원공사"],
    searchAliases: ["K-water", "KWS"],
  },
  {
    name: "한국농어촌공사",
    orgType: "public-enterprise",
    dartNames: ["한국농어촌공사", "(사)한국농어촌공사"],
    searchAliases: ["aT", "농어촌공사"],
  },
  {
    name: "한국석유공사",
    orgType: "public-enterprise",
    dartNames: ["한국석유공사", "(사)한국석유공사"],
    searchAliases: ["KNOC"],
  },
  {
    name: "한국광물자원공사",
    orgType: "public-enterprise",
    dartNames: ["한국광물자원공사"],
    searchAliases: ["KOMIR", "광물자원공사"],
  },
  {
    name: "한국조폐공사",
    orgType: "public-enterprise",
    dartNames: ["한국조폐공사", "(사)한국조폐공사"],
    searchAliases: ["KOMSCO"],
  },
  {
    name: "공항철도",
    orgType: "public-enterprise",
    dartNames: ["공항철도(주)", "공항철도"],
    searchAliases: ["AREX"],
  },
  {
    name: "한국마사회",
    orgType: "public-enterprise",
    stockCode: "071090",
  },
  {
    name: "한국공항공사",
    orgType: "public-enterprise",
    dartNames: ["한국공항공사", "(사)한국공항공사"],
    searchAliases: ["KAC"],
  },
  {
    name: "한국철도시설공단",
    orgType: "public-enterprise",
    dartNames: ["한국철도시설공단"],
    searchAliases: ["KR", "철도시설공단"],
  },
];

const PUBLIC_INSTITUTIONS: SearchableOrg[] = [
  {
    name: "국민건강보험공단",
    orgType: "public-institution",
    dartNames: ["국민건강보험공단"],
    searchAliases: ["건보공단", "NHIS"],
  },
  {
    name: "국민연금공단",
    orgType: "public-institution",
    dartNames: ["국민연금공단"],
    searchAliases: ["NPS"],
  },
  {
    name: "근로복지공단",
    orgType: "public-institution",
    dartNames: ["근로복지공단"],
    searchAliases: ["COMWEL"],
  },
  {
    name: "한국산업안전보건공단",
    orgType: "public-institution",
    dartNames: ["한국산업안전보건공단"],
    searchAliases: ["KOSHA", "안전보건공단"],
  },
  {
    name: "중소벤처기업진흥공단",
    orgType: "public-institution",
    dartNames: ["중소벤처기업진흥공단"],
    searchAliases: ["KOSME", "중진공"],
  },
  {
    name: "한국환경공단",
    orgType: "public-institution",
    dartNames: ["한국환경공단"],
    searchAliases: ["KECO"],
  },
  {
    name: "한국에너지공단",
    orgType: "public-institution",
    dartNames: ["한국에너지공단"],
    searchAliases: ["KEA"],
  },
  {
    name: "예금보험공사",
    orgType: "public-institution",
    dartNames: ["예금보험공사"],
    searchAliases: ["KDIC"],
  },
  {
    name: "신용보증기금",
    orgType: "public-institution",
    dartNames: ["신용보증기금"],
    searchAliases: ["KODIT"],
  },
  {
    name: "기술보증기금",
    orgType: "public-institution",
    dartNames: ["기술보증기금"],
    searchAliases: ["KIBO"],
  },
  {
    name: "한국연구재단",
    orgType: "public-institution",
    dartNames: ["한국연구재단"],
    searchAliases: ["NRF"],
  },
  {
    name: "한국장학재단",
    orgType: "public-institution",
    dartNames: ["한국장학재단"],
    searchAliases: ["KOSAF"],
  },
  {
    name: "한국보훈복지의료공단",
    orgType: "public-institution",
    dartNames: ["한국보훈복지의료공단"],
    searchAliases: ["보훈공단"],
  },
  {
    name: "한국철도공단",
    orgType: "public-institution",
    dartNames: ["한국철도공단"],
    searchAliases: ["KRA"],
  },
];

export const SEARCHABLE_ORGS: SearchableOrg[] = [
  ...LISTED,
  ...PUBLIC_ENTERPRISES,
  ...PUBLIC_INSTITUTIONS,
];

/** @deprecated SEARCHABLE_ORGS 사용 */
export const LISTED_COMPANIES = SEARCHABLE_ORGS;

function matchesOrg(org: SearchableOrg, q: string): boolean {
  const lower = q.toLowerCase();
  if (org.name.toLowerCase().includes(lower)) return true;
  if (org.stockCode?.includes(q)) return true;
  return (org.searchAliases ?? []).some(
    (alias) => alias.toLowerCase().includes(lower) || lower.includes(alias.toLowerCase()),
  );
}

function sortScore(org: SearchableOrg, q: string): number {
  const lower = q.toLowerCase();
  if (org.name.toLowerCase() === lower) return 0;
  if (org.name.toLowerCase().startsWith(lower)) return 1;
  if ((org.searchAliases ?? []).some((a) => a.toLowerCase() === lower)) return 2;
  if (org.name.toLowerCase().includes(lower)) return 3;
  return 4;
}

export function searchOrganizations(query: string, limit = 12): SearchableOrg[] {
  const q = query.trim();
  if (!q) return [];

  return SEARCHABLE_ORGS.filter((org) => matchesOrg(org, q))
    .sort((a, b) => sortScore(a, q) - sortScore(b, q) || a.name.localeCompare(b.name, "ko"))
    .slice(0, limit);
}

/** @deprecated searchOrganizations 사용 */
export function searchListedCompanies(query: string, limit = 12): SearchableOrg[] {
  return searchOrganizations(query, limit);
}

export function findOrganization(name: string, stockCode?: string): SearchableOrg | null {
  const trimmed = name.trim();
  if (stockCode) {
    const byCode = SEARCHABLE_ORGS.find((o) => o.stockCode === stockCode);
    if (byCode) return byCode;
  }
  const exact = SEARCHABLE_ORGS.find((o) => o.name === trimmed);
  if (exact) return exact;
  const byAlias = SEARCHABLE_ORGS.find((o) =>
    (o.searchAliases ?? []).some((a) => a === trimmed || a.toLowerCase() === trimmed.toLowerCase()),
  );
  if (byAlias) return byAlias;
  const matches = searchOrganizations(trimmed, 1);
  return matches[0] ?? null;
}

export type OrgSearchResult = {
  name: string;
  stockCode: string;
  orgType: OrgType;
  orgTypeLabel: string;
};

export function toSearchResult(org: SearchableOrg): OrgSearchResult {
  return {
    name: org.name,
    stockCode: org.stockCode ?? "",
    orgType: org.orgType,
    orgTypeLabel: ORG_TYPE_LABEL[org.orgType],
  };
}
