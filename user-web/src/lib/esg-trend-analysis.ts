import type { NewsItemView } from "@/components/news-list";
import {
  ESG_CATEGORY_KEYWORDS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import { NEWS_ROLLING_DAYS } from "@/lib/news-window";

export type CategoryStat = {
  category: EsgCategory;
  label: string;
  count: number;
  percent: number;
};

export type KeywordStat = {
  keyword: string;
  category: EsgCategory;
  count: number;
};

export type CareerGuide = {
  summary: string;
  resumeTips: string[];
  interviewTips: string[];
  sampleQuestions: string[];
};

export type EsgTrendDashboard = {
  periodLabel: string;
  totalArticles: number;
  hotCategory: EsgCategory;
  hotCategoryLabel: string;
  categoryStats: CategoryStat[];
  topKeywords: KeywordStat[];
  trendSummary: string;
  careerFocus: string;
  guides: Record<EsgCategory, CareerGuide>;
  headlineExamples: Array<{ category: EsgCategory; title: string; id: string }>;
};

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];

function articleText(item: NewsItemView): string {
  return [
    item.title,
    item.searchText ?? "",
    item.originalSnippet ?? "",
    item.studentTrendSummary ?? "",
    ...(item.summaryLines ?? []),
  ].join(" ");
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function countKeywordInArticles(articles: NewsItemView[], keyword: string): number {
  const needle = normalize(keyword);
  return articles.filter((item) => normalize(articleText(item)).includes(needle)).length;
}

function buildCategoryStats(articles: NewsItemView[]): CategoryStat[] {
  const total = articles.length || 1;
  const counts: Record<EsgCategory, number> = { E: 0, S: 0, G: 0 };

  for (const item of articles) {
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

function buildTopKeywords(articles: NewsItemView[], limit = 8): KeywordStat[] {
  const stats: KeywordStat[] = [];

  for (const category of CATEGORY_ORDER) {
    for (const keyword of ESG_CATEGORY_KEYWORDS[category]) {
      const count = countKeywordInArticles(articles, keyword);
      if (count > 0) stats.push({ keyword, category, count });
    }
  }

  return stats.sort((a, b) => b.count - a.count).slice(0, limit);
}

function pickHotCategory(stats: CategoryStat[]): EsgCategory {
  const sorted = [...stats].sort((a, b) => b.count - a.count);
  return sorted[0]?.count ? sorted[0].category : "E";
}

function buildTrendSummary(
  stats: CategoryStat[],
  hotCategory: EsgCategory,
  topKeywords: KeywordStat[],
  total: number,
): string {
  if (total === 0) {
    return "최근 7일간 분석할 ESG 뉴스가 충분하지 않습니다.";
  }

  const hot = stats.find((s) => s.category === hotCategory);
  const keywordPart =
    topKeywords.length > 0
      ? `핵심 키워드는 ‘${topKeywords.slice(0, 3).map((k) => k.keyword).join("’, ‘")}’ 순으로 자주 등장했습니다.`
      : "";

  const secondary = [...stats]
    .sort((a, b) => b.count - a.count)
    .slice(1)
    .filter((s) => s.count > 0)
    .map((s) => `${s.label} ${s.percent}%`)
    .join(", ");

  return `최근 ${NEWS_ROLLING_DAYS}일 ${total}건의 ESG 뉴스를 분석한 결과, ${hot?.label ?? "환경(E)"} 영역이 ${hot?.percent ?? 0}%로 가장 많이 다뤄졌습니다.${secondary ? ` 이어서 ${secondary} 순입니다.` : ""} ${keywordPart}`;
}

function categoryGuide(category: EsgCategory, keywords: KeywordStat[], examples: string[]): CareerGuide {
  const topKw = keywords.filter((k) => k.category === category).slice(0, 3).map((k) => k.keyword);
  const kwText = topKw.length > 0 ? topKw.join(", ") : "ESG, 지속가능경영";

  const guides: Record<EsgCategory, CareerGuide> = {
    E: {
      summary: `환경(E) 이슈가 두드러집니다. 탄소·에너지·기후 관련 정책과 기업 대응이 뉴스의 중심입니다.`,
      resumeTips: [
        `지원 동기에 ‘${kwText}’ 중 관심 키워드를 1~2개 골라 본인 경험(동아리, 과제, 인턴, 봉사)과 연결하세요.`,
        "숫자로 말하기: ‘온실가스 ○% 감축 목표’, ‘재생에너지 비중 ○%’처럼 기사에서 본 지표를 본인 프로젝트에 대입해 표현하면 설득력이 높아집니다.",
        "환경 이슈를 ‘비용’이 아니라 ‘리스크 관리·혁신 기회’로 이해했다는 인상을 주는 문장을 1문단 넣어보세요.",
      ],
      interviewTips: [
        "‘우리 회사/산업의 탄소·에너지 리스크는 무엇일까?’를 면접 전 3분 브리핑으로 정리해 두세요.",
        "RE100, TCFD, K-택소노미 중 하나를 골라 ‘무엇인지 → 왜 중요한지 → 기업이 무엇을 해야 하는지’ 30초 답변을 준비하세요.",
        "최근 기사 제목 1건을 들고 ‘이 뉴스가 우리 산업에 주는 시사점’을 1문장으로 말할 수 있으면 좋습니다.",
      ],
      sampleQuestions: [
        "기후변화가 우리 회사의 사업에 미치는 영향은 무엇이라고 보시나요?",
        "탄소중립 목표 달성을 위해 신입·주니어가 기여할 수 있는 일은 무엇일까요?",
        "환경 규제 강화에 대비해 기업이 가장 먼저 해야 할 일은 무엇인가요?",
      ],
    },
    S: {
      summary: `사회(S) 이슈가 강조됩니다. 사회공헌, 노동, 공급망·인권, 지역사회 연계가 뉴스에서 반복됩니다.`,
      resumeTips: [
        `‘${kwText}’ 키워드와 연결되는 본인 경험(멘토링, 사회공헌, 팀 프로젝트)을 STAR(상황-과제-행동-결과) 구조로 쓰세요.`,
        "‘참여 인원 ○명, 기간 ○개월, 성과 ○%’처럼 사회적 가치를 수치화하면 CSR·ESG 직무와 잘 맞습니다.",
        "다양성·포용, 산업안전, 공급망 중 관심 주제 1개를 골라 관련 뉴스 1건과 본인 관점을 연결해 보세요.",
      ],
      interviewTips: [
        "‘사회적 책임’을 슬로건이 아니라 ‘이해관계자(직원·지역·고객) 관점의 의사결정’으로 설명할 수 있어야 합니다.",
        "최근 사회공헌·노동·인권 기사 1건을 읽고 ‘우리 회사에 적용하면?’ 질문에 30초 답변을 준비하세요.",
        "ESG 면접에서 ‘본인이 가장 중요하게 보는 S 이슈’를 한 가지 정해 근거와 함께 말할 수 있게 하세요.",
      ],
      sampleQuestions: [
        "사회공헌 활동이 브랜드와 실질적 사업 성과에 어떻게 연결된다고 보시나요?",
        "노동·인권 이슈를 관리하지 못할 때 기업에 어떤 리스크가 생기나요?",
        "지역사회와의 상생을 신입이 실무에서 어떻게 기여할 수 있을까요?",
      ],
    },
    G: {
      summary: `지배구조(G) 이슈가 부각됩니다. 이사회, 공시, 윤리·내부통제, 주주환원 관련 소식이 많습니다.`,
      resumeTips: [
        `‘${kwText}’ 중 익숙한 키워드를 골라 팀 프로젝트·학생회·동아리 운영 경험과 연결하세요.`,
        "투명한 의사결정, 규정 준수, 이해충돌 관리 경험이 있다면 G 영역 역량으로 어필할 수 있습니다.",
        "공시·컴플라이언스 관심이 있다면 관련 뉴스 1건을 읽고 ‘왜 공시가 중요한지’ 본인 언어로 3문장 정리해 보세요.",
      ],
      interviewTips: [
        "이사회 독립성, 내부통제, 윤리경영 중 하나를 골라 정의와 기업 사례를 30초로 설명할 수 있게 하세요.",
        "‘ESG 공시가 투자자·채용에 주는 의미’를 본인 관점에서 1문장으로 말할 수 있으면 좋습니다.",
        "최근 지배구조·공시 기사 1건을 근거로 ‘우리 회사가 강화해야 할 거버넌스 포인트’를 질문으로 준비하세요.",
      ],
      sampleQuestions: [
        "투명한 지배구조가 ESG 경영의 출발점이라는 말에 동의하시나요? 근거는?",
        "ESG 공시를 강화하면 기업과 구성원에게 어떤 변화가 생길까요?",
        "윤리·컴플라이언스 문화를 신입이 어떻게 실천할 수 있을까요?",
      ],
    },
  };

  const guide = guides[category];
  if (examples.length > 0) {
    guide.resumeTips.push(`이번 주 기사 예시: ‘${examples[0]}’ — 이 제목을 자소서 관심분야 문장에 자연스럽게 인용해 보세요.`);
  }

  return guide;
}

export function buildEsgTrendDashboard(articles: NewsItemView[]): EsgTrendDashboard {
  const categoryStats = buildCategoryStats(articles);
  const topKeywords = buildTopKeywords(articles);
  const hotCategory = pickHotCategory(categoryStats);
  const totalArticles = articles.length;

  const headlineExamples = CATEGORY_ORDER.flatMap((category) =>
    articles
      .filter((item) => item.category === category)
      .slice(0, 2)
      .map((item) => ({ category, title: item.title, id: item.id })),
  ).slice(0, 6);

  const guides = Object.fromEntries(
    CATEGORY_ORDER.map((category) => {
      const examples = articles
        .filter((item) => item.category === category)
        .slice(0, 1)
        .map((item) => item.title);
      return [category, categoryGuide(category, topKeywords, examples)];
    }),
  ) as Record<EsgCategory, CareerGuide>;

  const hotGuide = guides[hotCategory];
  const secondStat = [...categoryStats].sort((a, b) => b.count - a.count)[1];

  return {
    periodLabel: `최근 ${NEWS_ROLLING_DAYS}일`,
    totalArticles,
    hotCategory,
    hotCategoryLabel: ESG_CATEGORY_LABEL[hotCategory],
    categoryStats,
    topKeywords,
    trendSummary: buildTrendSummary(categoryStats, hotCategory, topKeywords, totalArticles),
    careerFocus: `이번 주는 ${ESG_CATEGORY_LABEL[hotCategory]} 영역을 우선 준비하고${secondStat && secondStat.count > 0 ? `, ${secondStat.label} 이슈를 보조 키워드로` : ""} 자소서·면접에 활용하는 것을 추천합니다.`,
    guides,
    headlineExamples,
  };
}
