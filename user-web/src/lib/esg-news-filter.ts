export type EsgCategory = "E" | "S" | "G";

/** E · S · G 하위 도메인 확장 키워드 (뉴스 검색·분류·필터 공통) */
export const ESG_CATEGORY_KEYWORDS: Record<EsgCategory, readonly string[]> = {
  E: [
    "탄소중립",
    "RE100",
    "친환경",
    "친환경 테크",
    "업사이클링",
    "기후위기",
    "기후변화",
    "순환경제",
    "탄소배출권",
    "신재생에너지",
    "재생에너지",
    "온실가스",
    "넷제로",
    "net zero",
    "녹색금융",
    "녹색채권",
    "그린본드",
    "K-택소노미",
    "에너지전환",
    "그린워싱",
    "전환금융",
    "TCFD",
  ],
  S: [
    "사회공헌",
    "상생경영",
    "상생",
    "다양성",
    "DEI",
    "노동권",
    "노동",
    "공급망 실사",
    "인권경영",
    "인권",
    "지역사회 공헌",
    "지역사회",
    "CSR",
    "사회적책임",
    "사회적가치",
    "동반성장",
    "산업안전",
    "임팩트",
    "포용",
  ],
  G: [
    "지배구조",
    "지배구조 개선",
    "이사회",
    "이사회 독립성",
    "사외이사",
    "전자투표",
    "전자투표제",
    "주주환원",
    "주주",
    "윤리경영",
    "컴플라이언스",
    "내부통제",
    "거버넌스",
    "투명경영",
    "공시",
    "ESG 공시",
    "ESG공시",
  ],
};

/** 카테고리 무관 ESG·지속가능성 공통 키워드 */
export const ESG_GENERAL_KEYWORDS = [
  "ESG",
  "이에스지",
  "지속가능",
  "지속가능경영",
  "지속가능성",
  "지속가능발전",
  "sustainability",
  "ESG 경영",
  "ESG경영",
  "ESG 투자",
  "ESG투자",
  "ESG 평가",
  "ESG평가",
  "책임투자",
  "K-ESG",
  "지속가능금융",
  "지속가능경영보고서",
] as const;

/** Naver API 순회 검색용 — 중복 제거된 전체 키워드 */
export const ESG_NEWS_SEARCH_KEYWORDS: string[] = [
  ...ESG_GENERAL_KEYWORDS,
  ...ESG_CATEGORY_KEYWORDS.E,
  ...ESG_CATEGORY_KEYWORDS.S,
  ...ESG_CATEGORY_KEYWORDS.G,
].filter((keyword, index, arr) => arr.indexOf(keyword) === index);

/** Google RSS OR 쿼리 배치 (한 번에 너무 길면 분할) */
export function buildGoogleRssOrQueries(batchSize = 8, afterDate?: string): string[] {
  const quoted = ESG_NEWS_SEARCH_KEYWORDS.map((kw) => `"${kw}"`);
  const batches: string[] = [];
  const dateSuffix = afterDate ? ` after:${afterDate}` : "";

  for (let i = 0; i < quoted.length; i += batchSize) {
    batches.push(`${quoted.slice(i, i + batchSize).join(" OR ")}${dateSuffix}`);
  }

  return batches;
}

const EXCLUDE_TITLE_PATTERNS = [
  /esg\s*(챔피언|대회|골프|축구|야구|농구)/i,
  /(연예|아이돌|드라마|예능).*esg/i,
];

export function normalizeNewsText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function textIncludesKeyword(text: string, keyword: string): boolean {
  return text.includes(normalizeNewsText(keyword));
}

function countCategoryMatches(text: string, category: EsgCategory): number {
  return ESG_CATEGORY_KEYWORDS[category].filter((keyword) =>
    textIncludesKeyword(text, keyword),
  ).length;
}

function hasGeneralEsgSignal(text: string): boolean {
  return ESG_GENERAL_KEYWORDS.some((keyword) => textIncludesKeyword(text, keyword));
}

function hasCategoryKeywordMatch(text: string): boolean {
  return (["E", "S", "G"] as const).some((cat) => countCategoryMatches(text, cat) > 0);
}

/**
 * 제목·요약에 E/S/G 확장 키워드 또는 ESG 공통 키워드가 포함되는지 판별
 */
export function isEsgRelatedNews(title: string, snippet = ""): boolean {
  const text = normalizeNewsText(`${title} ${snippet}`);
  if (!text) return false;

  if (EXCLUDE_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }

  return hasCategoryKeywordMatch(text) || hasGeneralEsgSignal(text);
}

/**
 * 매칭된 확장 키워드 기준 E/S/G 자동 분류 (동점 시 E → S → G 우선)
 */
export function classifyEsgCategory(title: string, snippet = ""): EsgCategory | null {
  const text = normalizeNewsText(`${title} ${snippet}`);
  if (!text) return null;

  const scores: Record<EsgCategory, number> = {
    E: countCategoryMatches(text, "E"),
    S: countCategoryMatches(text, "S"),
    G: countCategoryMatches(text, "G"),
  };

  const max = Math.max(scores.E, scores.S, scores.G);
  if (max === 0) {
    return hasGeneralEsgSignal(text) ? "E" : null;
  }

  if (scores.E === max) return "E";
  if (scores.S === max) return "S";
  return "G";
}

/** UI 필터용 카테고리 라벨 */
export const ESG_CATEGORY_LABEL: Record<EsgCategory, string> = {
  E: "환경(E)",
  S: "사회(S)",
  G: "지배구조(G)",
};

export const ESG_CATEGORY_BADGE_CLASS: Record<EsgCategory, string> = {
  E: "bg-green-100 text-green-700",
  S: "bg-blue-100 text-blue-700",
  G: "bg-purple-100 text-purple-700",
};
