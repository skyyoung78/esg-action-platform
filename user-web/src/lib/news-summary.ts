import { stripHtmlToText } from "@/lib/text-sanitize";

export type Summary5W1HKey = "who" | "when" | "where" | "what" | "why" | "how";

export const SUMMARY_5W1H_ORDER: ReadonlyArray<{ key: Summary5W1HKey; label: string }> = [
  { key: "who", label: "누가" },
  { key: "when", label: "언제" },
  { key: "where", label: "어디서" },
  { key: "what", label: "무엇을" },
  { key: "why", label: "왜" },
  { key: "how", label: "어떻게" },
];

export type NewsSummary5W1H = Record<Summary5W1HKey, string>;

/** DB 저장용 한 문장 요약 */
export type NewsSummaryArray = [string];

const MISSING = "원문에 명시되지 않았습니다.";

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
    .replace(/^(누가|언제|어디서|무엇을|왜|어떻게)\s*[:：]\s*/i, "")
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

function formatPublishedWhen(publishedAt?: string): string {
  if (!publishedAt) return MISSING;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return MISSING;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function extractWho(title: string, body: string): string {
  const sourceMatch = title.match(/\s*[-–|]\s*(.+)$/);
  if (sourceMatch?.[1]) {
    const source = sourceMatch[1].trim();
    if (source.length >= 2 && source.length <= 40) return source;
  }

  const orgMatch = body.match(
    /([가-힣A-Za-z0-9·]+(?:공사|공단|기업|그룹|협회|재단|센터|연구원|정부|기관|은행|증권|대학|시청|군청|도청|부|청))/,
  );
  if (orgMatch?.[1]) return orgMatch[1];

  const titleCore = extractCoreTitle(title);
  if (titleCore.length >= 4 && titleCore.length <= 60) return titleCore;

  return MISSING;
}

function extractWhen(body: string, publishedAt?: string): string {
  const dateMatch = body.match(
    /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}|\d{1,2}월\s*\d{1,2}일)/,
  );
  if (dateMatch?.[1]) return dateMatch[1];
  return formatPublishedWhen(publishedAt);
}

function extractWhere(body: string): string {
  const whereMatch = body.match(
    /([가-힣]+(?:시|도|군|구|읍|면|동|국|지역|센터|본사|현장|공장|캠퍼스)(?:\s+[가-힣]+(?:시|도|군|구))?)/,
  );
  if (whereMatch?.[1] && whereMatch[1].length <= 30) return whereMatch[1];
  return MISSING;
}

export function summary5W1HToArray(summary: NewsSummary5W1H): NewsSummaryArray {
  return SUMMARY_5W1H_ORDER.map(({ key }) => sanitizeSummaryLine(summary[key])) as NewsSummaryArray;
}

export function arrayToSummary5W1H(lines: string[]): NewsSummary5W1H | null {
  const normalized = lines.map((line) => sanitizeSummaryLine(line)).filter(Boolean);
  if (normalized.length !== 6) return null;

  return {
    who: normalized[0],
    when: normalized[1],
    where: normalized[2],
    what: normalized[3],
    why: normalized[4],
    how: normalized[5],
  };
}

/** 기존 3줄 요약을 육하원칙으로 변환 */
export function legacyTripleTo5W1H(lines: [string, string, string], title: string, body: string, publishedAt?: string): NewsSummary5W1H {
  return {
    who: extractWho(title, body),
    when: extractWhen(body, publishedAt),
    where: extractWhere(body),
    what: lines[0] || MISSING,
    why: lines[1] || MISSING,
    how: lines[2] || MISSING,
  };
}

function isMissing(value: string): boolean {
  return !value || value === MISSING;
}

/** 육하원칙 요소를 자연스러운 한 문장으로 합침 */
export function composeSummarySentence(parts: NewsSummary5W1H): string {
  const pick = (value: string) => (isMissing(value) ? "" : value.replace(/\.$/, "").trim());

  const when = pick(parts.when);
  const where = pick(parts.where);
  const who = pick(parts.who);
  const what = pick(parts.what);
  const why = pick(parts.why);
  const how = pick(parts.how);

  if (!what) return "";

  const prefix = [when, where ? `${where}에서` : "", who ? `${who}가(이)` : ""].filter(Boolean).join(" ");
  let sentence = prefix ? `${prefix} ${what}` : what;

  const tail = why && how ? `${why} 목적으로 ${how}` : why || how;
  if (tail) {
    if (/[다요]$/.test(sentence)) {
      sentence = `${sentence.replace(/[다요]$/, "으며")}, ${tail}`;
    } else {
      sentence = `${sentence}하며, ${tail}`;
    }
  }

  if (!sentence.endsWith(".")) sentence += ".";
  return sentence.replace(/\s+/g, " ").trim();
}

/** 저장된 요약(1줄·3줄·6줄)을 화면용 한 문장으로 변환 */
export function getSummarySentence(
  lines: string[],
  context?: { title?: string; body?: string; publishedAt?: string },
): string {
  const normalized = lines.map((line) => sanitizeSummaryLine(line)).filter(Boolean);
  if (normalized.length === 0) return "";
  if (normalized.length === 1) return normalized[0];

  return composeSummarySentence(parseSummary5W1H(normalized, context));
}

export function parseSummary5W1H(
  lines: string[],
  context?: { title?: string; body?: string; publishedAt?: string },
): NewsSummary5W1H {
  const fromSix = arrayToSummary5W1H(lines);
  if (fromSix) return fromSix;

  if (lines.length === 3) {
    return legacyTripleTo5W1H(
      lines as [string, string, string],
      context?.title ?? "",
      context?.body ?? "",
      context?.publishedAt,
    );
  }

  const title = context?.title ?? "";
  const body = context?.body ?? "";
  return {
    who: extractWho(title, body),
    when: extractWhen(body, context?.publishedAt),
    where: extractWhere(body),
    what: lines[0] || shortText(extractCoreTitle(title), 110) || MISSING,
    why: lines[1] || MISSING,
    how: lines[2] || MISSING,
  };
}

export function buildTemplateSummary(
  title: string,
  snippet: string,
  publishedAt?: string,
): NewsSummaryArray {
  const summary = buildTemplateSummary5W1H(title, snippet, publishedAt);
  return [composeSummarySentence(summary)];
}

export function buildTemplateSummary5W1H(
  title: string,
  snippet: string,
  publishedAt?: string,
): NewsSummary5W1H {
  const cleanTitle = shortText(stripHtmlToText(extractCoreTitle(title)), 110);
  const cleanSnippet = shortText(stripHtmlToText(snippet), 500);
  const hasUsefulSnippet = Boolean(cleanSnippet) && !isSimilarText(cleanTitle, cleanSnippet);
  const snippetSentences = hasUsefulSnippet ? splitSentences(cleanSnippet) : [];
  const combined = `${title} ${snippet}`;

  const what = snippetSentences[0]
    ? snippetSentences[0]
    : cleanTitle.endsWith(".") || cleanTitle.endsWith("…")
      ? cleanTitle
      : `${cleanTitle}.`;

  const why = snippetSentences[1] ?? MISSING;

  const how =
    snippetSentences[2] ??
    (/탄소|기후|환경|에너지|재생/.test(combined)
      ? "환경·에너지 전환 관련 정책·사업을 추진하는 방식으로 진행되었습니다."
      : /사회|복지|노동|공헌|csr|일자리/.test(combined)
        ? "사회적 책임 프로그램·협력 체계를 통해 추진되었습니다."
        : /지배|공시|거버넌스|투명|이사회/.test(combined)
          ? "지배구조·공시·내부통제 관련 조치를 통해 진행되었습니다."
          : MISSING);

  return {
    who: extractWho(title, snippet),
    when: extractWhen(snippet, publishedAt),
    where: extractWhere(snippet),
    what,
    why,
    how,
  };
}

/** OpenAI 없이 원문 기반 대학생 ESG 트렌드 요약 생성 */
export function buildStudentTrendSummary(title: string, body: string): string {
  const summary = buildTemplateSummary5W1H(title, body);
  const categoryHint = /탄소|기후|환경|에너지|재생/.test(`${title} ${body}`)
    ? "환경(E) 분야"
    : /사회|복지|노동|공헌|csr|일자리|상생/.test(`${title} ${body}`)
      ? "사회(S) 분야"
      : /지배|공시|거버넌스|투명|이사회/.test(`${title} ${body}`)
        ? "지배구조(G) 분야"
        : "ESG 전반";

  const oneLine = composeSummarySentence(summary);

  return [
    oneLine,
    `${categoryHint} 최신 이슈로, 대학생이 ESG 트렌드를 파악하는 데 도움이 됩니다.`,
    summary.why !== MISSING ? summary.why : "관련 배경과 맥락을 파악하면 취업·과제 준비에 활용할 수 있습니다.",
    "관련 키워드를 과제·리포트·면접 준비에 연결해 보면 실무 감각을 키울 수 있습니다.",
  ].join(" ");
}

export function buildSummaryPrompt(title: string, description: string): string {
  return [
    "아래 뉴스 정보를 바탕으로 육하원칙(누가·언제·어디서·무엇을·왜·어떻게)을 모두 반영한 한 문장 요약과 ESG 카테고리를 반환하라.",
    "",
    "summary 작성 기준:",
    "- 반드시 자연스러운 한국어 한 문장",
    "- 누가/언제/어디서/무엇을/왜/어떻게 라벨을 문장에 붙이지 말 것",
    "- 원문에 없는 정보는 넣지 말고, 없는 요소는 생략",
    "- URL, 출처명, 메타 문구 금지",
    "- category는 E/S/G 중 하나",
    "",
    `제목: ${title}`,
    `본문 요약: ${description}`,
    "",
    'JSON만 반환: {"summary":"육하원칙을 담은 한 문장 요약","category":"E"}',
  ].join("\n");
}

export function buildArticleSummaryPrompt(title: string, originalBody: string): string {
  const bodyForAi = originalBody.length > 12_000 ? `${originalBody.slice(0, 12_000)}…` : originalBody;

  return [
    "아래 기사 원문을 2단계로 처리하라.",
    "",
    "1단계 summary: 육하원칙(누가·언제·어디서·무엇을·왜·어떻게)을 모두 반영한 한 문장 핵심 요약",
    "- 라벨(누가/언제 등)을 문장에 붙이지 말 것",
    "- 원문에 없는 정보는 넣지 말고, 없는 요소는 생략",
    "",
    "2단계 student_trend_summary: 같은 원문을 바탕으로 대학생 맞춤 ESG 트렌드 요약",
    "- 4~6문장, 자연스러운 한국어",
    "- 취업준비, 과제·리포트, ESG 상식, 최신 트렌드 관점에서 왜 중요한지 설명",
    "- 원문에 없는 수치·사실·추측 금지",
    "",
    "공통 규칙:",
    "- 템플릿 라벨, URL, 메타 문구 금지",
    "- category는 E/S/G 중 하나",
    "",
    `제목: ${title}`,
    `기사 원문:\n${bodyForAi}`,
    "",
    'JSON만 반환: {"summary":"육하원칙을 담은 한 문장 요약","student_trend_summary":"대학생 맞춤 트렌드 요약 문단","category":"E"}',
  ].join("\n");
}

function isValidSummaryValue(value: string): boolean {
  return value.length >= 4 && !/https?:\/\//i.test(value);
}

export function validateSummarySentence(summary: unknown): string | null {
  if (typeof summary === "string") {
    const line = sanitizeSummaryLine(summary);
    return line.length >= 16 ? line : null;
  }

  const parts = validateSummary5W1H(summary);
  if (!parts) return null;

  const sentence = composeSummarySentence(parts);
  return sentence.length >= 16 ? sentence : null;
}

export function validateSummary5W1H(summary: unknown): NewsSummary5W1H | null {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;

  const record = summary as Record<string, unknown>;
  const parsed: NewsSummary5W1H = {
    who: sanitizeSummaryLine(String(record.who ?? "")) || MISSING,
    when: sanitizeSummaryLine(String(record.when ?? "")) || MISSING,
    where: sanitizeSummaryLine(String(record.where ?? "")) || MISSING,
    what: sanitizeSummaryLine(String(record.what ?? "")),
    why: sanitizeSummaryLine(String(record.why ?? "")) || MISSING,
    how: sanitizeSummaryLine(String(record.how ?? "")) || MISSING,
  };

  if (!isValidSummaryValue(parsed.what)) return null;

  return parsed;
}

export function validateSummaryTriple(summary: unknown): NewsSummaryArray | null {
  const sentence = validateSummarySentence(summary);
  return sentence ? [sentence] : null;
}
