import { stripHtmlToText } from "@/lib/text-sanitize";

export type NewsSummaryTriple = [string, string, string];

function shortText(input: string, max = 120): string {
  const text = String(input ?? "").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function stripTemplateLabels(input: string): string {
  return input
    .replace(/^\(WHAT-핵심사건\)\s*/i, "")
    .replace(/^\(WHY\/HOW\)\s*/i, "")
    .replace(/^\(INSIGHT-대학생관점\)\s*/i, "")
    .replace(/기사에 제시된 배경\/방법:\s*/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim();
}

export function sanitizeSummaryLine(input: string): string {
  return stripTemplateLabels(String(input ?? "")).replace(/\s+/g, " ").trim();
}

function isSimilarText(a: string, b: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function extractCoreTitle(title: string): string {
  return title.replace(/\s*[-–|]\s*.+$/, "").trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8);
}

export function buildTemplateSummary(title: string, snippet: string): NewsSummaryTriple {
  const cleanTitle = shortText(stripHtmlToText(extractCoreTitle(title)), 110);
  const cleanSnippet = shortText(stripHtmlToText(snippet), 220);
  const hasUsefulSnippet = Boolean(cleanSnippet) && !isSimilarText(cleanTitle, cleanSnippet);
  const snippetSentences = hasUsefulSnippet ? splitSentences(cleanSnippet) : [];

  const what = snippetSentences[0]
    ? snippetSentences[0]
    : cleanTitle.endsWith(".") || cleanTitle.endsWith("…")
      ? cleanTitle
      : `${cleanTitle}.`;

  const whyHow = snippetSentences[1]
    ? snippetSentences[1]
    : "원문에 원인, 방법, 수치에 대한 구체적 설명은 제공되지 않았습니다.";

  const insight = /탄소|기후|환경|에너지|재생/.test(`${title} ${snippet}`)
    ? "환경·에너지 전환 흐름을 이해하고 ESG 관련 직무·과제 사례로 활용할 수 있습니다."
    : /사회|복지|노동|공헌|csr|일자리/.test(`${title} ${snippet}`)
      ? "사회적 책임 이슈를 파악하고 취업·과제에서 사례 분석 자료로 활용할 수 있습니다."
      : /지배|공시|거버넌스|투명|이사회/.test(`${title} ${snippet}`)
        ? "기업 지배구조·공시 이슈를 이해하는 데 도움이 되며, 관련 취업 준비에 참고할 수 있습니다."
        : "ESG 이슈 흐름을 파악하고 취업·과제 사례 분석에 참고할 수 있습니다.";

  return [what, whyHow, insight];
}

/** OpenAI 없이 원문 기반 대학생 ESG 트렌드 요약 생성 */
export function buildStudentTrendSummary(title: string, body: string): string {
  const summary = buildTemplateSummary(title, body);
  const categoryHint = /탄소|기후|환경|에너지|재생/.test(`${title} ${body}`)
    ? "환경(E) 분야"
    : /사회|복지|노동|공헌|csr|일자리|상생/.test(`${title} ${body}`)
      ? "사회(S) 분야"
      : /지배|공시|거버넌스|투명|이사회/.test(`${title} ${body}`)
        ? "지배구조(G) 분야"
        : "ESG 전반";

  return [
    summary[0],
    `${categoryHint} 최신 이슈로, 대학생이 ESG 트렌드를 파악하는 데 도움이 됩니다.`,
    summary[2],
    "관련 키워드를 과제·리포트·면접 준비에 연결해 보면 실무 감각을 키울 수 있습니다.",
  ].join(" ");
}

export function buildSummaryPrompt(title: string, description: string): string {
  return [
    "아래 뉴스 정보를 바탕으로 3줄 요약과 ESG 카테고리를 반환하라.",
    "",
    "summary 3줄 작성 기준(내용 구조만 참고, 라벨/템플릿 문구는 출력하지 말 것):",
    "1줄: 핵심 팩트 및 기업/기관의 액션",
    "2줄: 원인, 정량 수치, 구체적 방법(없으면 '원문에 해당 정보가 명시되지 않았습니다.')",
    "3줄: 대학생 관점(취업준비, 과제, 상식, 트렌드) 의미",
    "",
    "규칙:",
    "- (WHAT-핵심사건), (WHY/HOW), (INSIGHT-대학생관점) 같은 템플릿 라벨을 summary에 쓰지 말 것",
    "- URL, 출처명, '기사에 제시된' 같은 메타 문구를 summary에 쓰지 말 것",
    "- 원문(제목+본문 요약)에 없는 수치, 인용, 사실, 추측을 절대 추가하지 말 것",
    "- summary는 자연스러운 한국어 문장 3개",
    "- category는 E/S/G 중 하나",
    "",
    `제목: ${title}`,
    `본문 요약: ${description}`,
    "",
    'JSON만 반환: {"summary":["핵심 사건 문장","원인/방법 문장","대학생 관점 문장"],"category":"E"}',
  ].join("\n");
}

export function validateSummaryTriple(summary: unknown): NewsSummaryTriple | null {
  if (!Array.isArray(summary) || summary.length !== 3) return null;

  const normalized = summary.map((line) => sanitizeSummaryLine(String(line ?? ""))) as NewsSummaryTriple;
  if (normalized.some((line) => line.length < 8)) return null;
  if (normalized.some((line) => /https?:\/\//i.test(line))) return null;

  return normalized;
}
