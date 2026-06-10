import {
  buildArticleSummaryPrompt,
  buildSummaryPrompt,
  buildTemplateSummary,
  sanitizeSummaryLine,
  validateSummarySentence,
  type NewsSummaryArray,
} from "@/lib/news-summary";

export type ESGCategory = "E" | "S" | "G";

function inferCategory(title: string, snippet: string): ESGCategory {
  const text = `${title} ${snippet}`.toLowerCase();
  if (/지배|거버넌스|공시|이사회|투명|컴플라이언스|governance/.test(text)) return "G";
  if (/사회|복지|노동|인권|다양성|공헌|csr|일자리/.test(text)) return "S";
  return "E";
}

function isSimilarText(a: string, b: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export async function generateNewsSummary(params: {
  title: string;
  snippet: string;
  publishedAt?: string;
}): Promise<{ summary: NewsSummaryArray; category: ESGCategory }> {
  const title = params.title.trim();
  const snippet = params.snippet.trim();
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    const aiResult = await requestAiSummary(apiKey, title, snippet);
    if (aiResult) return aiResult;
  }

  const fallbackSummary = buildTemplateSummary(title, snippet, params.publishedAt);
  return {
    summary: fallbackSummary,
    category: inferCategory(title, snippet),
  };
}

async function requestAiSummary(
  apiKey: string,
  title: string,
  snippet: string,
): Promise<{ summary: NewsSummaryArray; category: ESGCategory } | null> {
  const input = snippet && !isSimilarText(title, snippet) ? snippet : title;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 ESG 뉴스를 대학생에게 쉽게 설명하는 편집자다. 반드시 한국어로 답한다. 원문에 없는 정보는 절대 추가하지 않는다.",
        },
        {
          role: "user",
          content: buildSummaryPrompt(title, input),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    const category = parsed?.category;
    const isValidCategory = category === "E" || category === "S" || category === "G";
    const sentence = validateSummarySentence(parsed?.summary);
    if (!sentence || !isValidCategory) return null;

    return {
      summary: [sentence],
      category,
    };
  } catch {
    return null;
  }
}

export async function generateArticleSummaries(params: {
  title: string;
  originalBody: string;
}): Promise<{
  summary: NewsSummaryArray;
  studentTrendSummary: string;
  category: ESGCategory;
} | null> {
  const title = params.title.trim();
  const originalBody = params.originalBody.trim();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || originalBody.length < 40) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 ESG 뉴스를 대학생에게 쉽게 설명하는 편집자다. 반드시 한국어로 답한다. 원문에 없는 정보는 절대 추가하지 않는다.",
        },
        {
          role: "user",
          content: buildArticleSummaryPrompt(title, originalBody),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    const category = parsed?.category;
    const isValidCategory = category === "E" || category === "S" || category === "G";
    const sentence = validateSummarySentence(parsed?.summary);
    const studentTrendSummary = sanitizeSummaryLine(String(parsed?.student_trend_summary ?? ""));

    if (!sentence || !isValidCategory || studentTrendSummary.length < 40) {
      return null;
    }

    return {
      summary: [sentence],
      studentTrendSummary,
      category,
    };
  } catch {
    return null;
  }
}

export async function generateNewsSummaries(
  items: Array<{ title: string; snippet: string; publishedAt?: string }>,
  concurrency = 3,
): Promise<Array<{ summary: NewsSummaryArray; category: ESGCategory }>> {
  const results: Array<{ summary: NewsSummaryArray; category: ESGCategory }> = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((item) =>
        generateNewsSummary({
          title: item.title,
          snippet: item.snippet,
          publishedAt: item.publishedAt,
        }),
      ),
    );
    results.push(...chunkResults);
  }

  return results;
}
