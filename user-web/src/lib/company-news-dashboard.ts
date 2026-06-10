import type { NewsItemView } from "@/components/news-list";
import {
  ESG_CATEGORY_KEYWORDS,
  ESG_CATEGORY_LABEL,
  isEsgRelatedNews,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import { COMPANY_NEWS_ANALYSIS_YEARS } from "@/lib/news-window";

export type CompanyCategoryStat = {
  category: EsgCategory;
  label: string;
  count: number;
  percent: number;
};

export type YearlyStat = {
  year: string;
  count: number;
};

export type CompanyNewsDashboard = {
  companyName: string;
  periodLabel: string;
  totalArticles: number;
  esgArticleCount: number;
  generalArticleCount: number;
  overview: string;
  trendInsight: string;
  yearlyStats: YearlyStat[];
  hotCategory: EsgCategory | null;
  hotCategoryLabel: string | null;
  categoryStats: CompanyCategoryStat[];
  keyThemes: string[];
  resumeGuide: {
    hook: string;
    bullets: string[];
    keywords: string[];
  };
  interviewGuide: {
    knowAboutCompany: string[];
    expectedQuestions: string[];
    questionsToAsk: string[];
  };
};

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];
const PERIOD_LABEL = `최근 ${COMPANY_NEWS_ANALYSIS_YEARS}년`;

function articleText(item: NewsItemView): string {
  return [item.title, item.searchText, item.originalSnippet, item.studentTrendSummary, ...(item.summaryLines ?? [])].join(
    " ",
  );
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function isEsgArticle(item: NewsItemView): boolean {
  return isEsgRelatedNews(item.title, item.searchText ?? item.originalSnippet ?? "");
}

function countEsgArticles(articles: NewsItemView[]): number {
  return articles.filter(isEsgArticle).length;
}

function buildCategoryStats(articles: NewsItemView[]): CompanyCategoryStat[] {
  const esgArticles = articles.filter(isEsgArticle);
  const total = esgArticles.length || 1;
  const counts: Record<EsgCategory, number> = { E: 0, S: 0, G: 0 };

  for (const item of esgArticles) {
    if (item.category === "E" || item.category === "S" || item.category === "G") {
      counts[item.category] += 1;
    }
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    label: ESG_CATEGORY_LABEL[category],
    count: counts[category],
    percent: Math.round((counts[category] / total) * 100),
  }));
}

function buildYearlyStats(articles: NewsItemView[]): YearlyStat[] {
  const counts = new Map<string, number>();

  for (const item of articles) {
    const date = new Date(item.publishedAt ?? "");
    if (Number.isNaN(date.getTime())) continue;
    const year = String(date.getFullYear());
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));
}

function buildTrendInsight(articles: NewsItemView[], yearlyStats: YearlyStat[]): string {
  if (yearlyStats.length < 2) {
    return yearlyStats.length === 1
      ? `${yearlyStats[0].year}년에 ${yearlyStats[0].count}건의 관련 보도가 확인되었습니다.`
      : "연도별 비교를 위한 기사가 충분하지 않습니다.";
  }

  const recent = yearlyStats[yearlyStats.length - 1];
  const previous = yearlyStats[yearlyStats.length - 2];
  const diff = recent.count - previous.count;
  const direction = diff > 0 ? "증가" : diff < 0 ? "감소" : "유사";

  const recentArticles = articles.filter((item) => {
    const year = new Date(item.publishedAt ?? "").getFullYear();
    return String(year) === recent.year;
  });
  const recentHot = buildCategoryStats(recentArticles)
    .sort((a, b) => b.count - a.count)
    .find((s) => s.count > 0);

  const hotText = recentHot ? `ESG 관련 ${recentHot.label} 이슈가 두드러집니다` : "전반적으로 보도가 이어지고 있습니다";

  return `${previous.year}년 ${previous.count}건 → ${recent.year}년 ${recent.count}건으로 보도량이 ${direction}했습니다. 최근에는 ${hotText}.`;
}

function extractKeyThemes(articles: NewsItemView[], limit = 6): string[] {
  const themeCounts = new Map<string, number>();

  for (const category of CATEGORY_ORDER) {
    for (const keyword of ESG_CATEGORY_KEYWORDS[category]) {
      const count = articles.filter((item) => normalize(articleText(item)).includes(normalize(keyword))).length;
      if (count > 0) themeCounts.set(keyword, count);
    }
  }

  return [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function pickHotCategory(stats: CompanyCategoryStat[]): EsgCategory | null {
  const sorted = [...stats].sort((a, b) => b.count - a.count);
  return sorted[0]?.count ? sorted[0].category : null;
}

function buildOverview(
  companyName: string,
  articles: NewsItemView[],
  hotCategory: EsgCategory | null,
  themes: string[],
  yearlyStats: YearlyStat[],
  esgCount: number,
): string {
  if (articles.length === 0) {
    return `최근 ${COMPANY_NEWS_ANALYSIS_YEARS}년간 ‘${companyName}’ 관련 뉴스를 찾지 못했습니다. 기업명을 다르게 입력하거나 약칭(예: SK하이닉스)으로 검색해 보세요.`;
  }

  const hotLabel = hotCategory ? ESG_CATEGORY_LABEL[hotCategory] : "ESG";
  const themeText =
    themes.length > 0 ? `ESG 키워드 중 ‘${themes.slice(0, 3).join("’, ‘")}’가 자주 등장했습니다.` : "";
  const yearRange =
    yearlyStats.length > 0
      ? `${yearlyStats[0].year}~${yearlyStats[yearlyStats.length - 1].year}년`
      : `최근 ${COMPANY_NEWS_ANALYSIS_YEARS}년`;
  const latestTitle = articles[0]?.title ?? "";

  return `${yearRange} 동안 ‘${companyName}’ 관련 뉴스 ${articles.length}건(ESG 관련 ${esgCount}건)을 분석했습니다. ESG 보도 기준 ${hotLabel} 영역이 가장 많았으며, ${themeText} 최신 기사: ‘${latestTitle}’.`;
}

function buildResumeGuide(
  companyName: string,
  hotCategory: EsgCategory | null,
  themes: string[],
  articles: NewsItemView[],
): CompanyNewsDashboard["resumeGuide"] {
  const keywords = themes.length > 0 ? themes : ["ESG", "지속가능경영"];
  const exampleTitle = articles[0]?.title ?? `${companyName} ESG 활동`;
  const area = hotCategory ? ESG_CATEGORY_LABEL[hotCategory] : "ESG";

  return {
    hook: `‘${companyName}’에 관심을 갖게 된 계기를 최근 2년 뉴스 중 ‘${exampleTitle}’와 연결해 서술하세요.`,
    bullets: [
      `2년간 뉴스 흐름과 ESG 키워드(${keywords.slice(0, 2).join(", ")})를 지원 동기에 넣고, 본인 경험과 1:1로 연결하세요.`,
      `${companyName}의 사업·ESG 이슈 변화(2년 추이)를 ‘과거 → 현재 → 내가 기여할 점’ 순으로 3문장 구성해 보세요.`,
      "숫자·성과 중심 표현을 사용하세요. 예: ‘온실가스 ○% 감축’, ‘사회공헌 참여 ○명’, ‘공시 항목 ○개 개선’.",
      `마지막 문단에 ‘입사 후 ${keywords[0] ?? "ESG"} 관련 업무에서 ○○ 역량을 발휘하겠다’는 구체적 포부를 한 줄 넣으세요.`,
    ],
    keywords,
  };
}

function buildInterviewGuide(
  companyName: string,
  hotCategory: EsgCategory | null,
  themes: string[],
  articles: NewsItemView[],
  yearlyStats: YearlyStat[],
): CompanyNewsDashboard["interviewGuide"] {
  const area = hotCategory ? ESG_CATEGORY_LABEL[hotCategory] : "ESG";
  const headlines = articles.slice(0, 3).map((a) => a.title);
  const yearSummary =
    yearlyStats.length > 0
      ? yearlyStats.map((y) => `${y.year}년 ${y.count}건`).join(", ")
      : "연도별 보도 추이를 확인하세요";

  const categoryQuestions: Record<EsgCategory, string[]> = {
    E: [
      `${companyName}의 탄소·에너지·환경 목표를 2년간 뉴스 흐름과 함께 설명해 보세요.`,
      "기후 리스크가 우리 산업과 회사에 미치는 영향은 무엇이라고 보시나요?",
      "환경 규제 강화에 대비해 신입이 기여할 수 있는 일은 무엇일까요?",
    ],
    S: [
      `${companyName}의 사회공헌·노동·인권 이슈 중 2년간 가장 눈에 띈 변화는 무엇인가요?`,
      "이해관계자(직원·지역사회·고객) 관점에서 ESG를 어떻게 설명하시겠습니까?",
      "사회적 책임 활동이 사업 성과와 어떻게 연결된다고 보시나요?",
    ],
    G: [
      `${companyName}의 지배구조·공시·윤리경영에서 2년간의 강점과 변화는 무엇인가요?`,
      "ESG 공시가 투자자와 구성원에게 주는 의미는 무엇이라고 생각하시나요?",
      "윤리·컴플라이언스 문화를 신입이 실무에서 어떻게 실천할 수 있을까요?",
    ],
  };

  return {
    knowAboutCompany: [
      `최근 ${COMPANY_NEWS_ANALYSIS_YEARS}년 전체 뉴스 ${articles.length}건을 읽고, ESG 관련 ${countEsgArticles(articles)}건에서 ${area} 이슈를 중심으로 준비하세요.`,
      `연도별 보도: ${yearSummary}`,
      headlines.length > 0 ? `반드시 읽을 기사: ${headlines.join(" / ")}` : "관련 헤드라인을 미리 2~3건 정리해 두세요.",
      themes.length > 0
        ? `면접 전 '${themes.slice(0, 3).join("', '")}' 키워드 정의와 ${companyName} 2년 사례를 30초로 설명할 수 있어야 합니다.`
        : "ESG, 지속가능경영의 기본 개념을 회사 사례와 함께 설명할 수 있어야 합니다.",
    ],
    expectedQuestions: hotCategory ? categoryQuestions[hotCategory] : categoryQuestions.E,
    questionsToAsk: [
      `${companyName}의 ${themes[0] ?? "ESG"} 추진에서 신입·주니어가 맡는 역할은 무엇인가요?`,
      "향후 1~2년 ESG 목표와 우선순위는 어떻게 설정되어 있나요?",
      "최근 2년 ESG 성과를 내부 의사결정과 어떻게 연결하고 있나요?",
    ],
  };
}

export function buildCompanyNewsDashboard(companyName: string, articles: NewsItemView[]): CompanyNewsDashboard {
  const esgArticleCount = countEsgArticles(articles);
  const categoryStats = buildCategoryStats(articles);
  const yearlyStats = buildYearlyStats(articles);
  const hotCategory = pickHotCategory(categoryStats);
  const keyThemes = extractKeyThemes(articles);

  return {
    companyName,
    periodLabel: PERIOD_LABEL,
    totalArticles: articles.length,
    esgArticleCount,
    generalArticleCount: articles.length - esgArticleCount,
    overview: buildOverview(companyName, articles, hotCategory, keyThemes, yearlyStats, esgArticleCount),
    trendInsight: buildTrendInsight(articles, yearlyStats),
    yearlyStats,
    hotCategory,
    hotCategoryLabel: hotCategory ? ESG_CATEGORY_LABEL[hotCategory] : null,
    categoryStats,
    keyThemes,
    resumeGuide: buildResumeGuide(companyName, hotCategory, keyThemes, articles),
    interviewGuide: buildInterviewGuide(companyName, hotCategory, keyThemes, articles, yearlyStats),
  };
}
