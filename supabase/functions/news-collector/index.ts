import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ESGCategory = "E" | "S" | "G";

type NewsItem = {
  title: string;
  source: string;
  original_url: string;
  published_at: string;
  summary: [string, string, string];
  esg_category: ESGCategory;
  collected_at: string;
};

const NAVER_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const NEWS_KEYWORDS = ["ESG", "탄소중립", "지속가능경영", "ESG공시", "사회공헌"];

function decodeHtmlEntities(input: string): string {
  const entities: Record<string, string> = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&#39;": "'",
  };

  return input.replace(/(&quot;|&amp;|&lt;|&gt;|&#39;)/g, (m) => entities[m] ?? m);
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, "")).trim();
}

function toIsoDate(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function extractOriginalUrl(link: string, originallink?: string): string {
  if (originallink && originallink.trim().length > 0) {
    return originallink.trim();
  }
  return link.trim();
}

function extractSourceHostname(originallink?: string, fallbackLink?: string): string {
  const candidates = [originallink, fallbackLink].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      return new URL(candidate).hostname;
    } catch (_error) {
      continue;
    }
  }
  return "unknown";
}

function sanitizeSummaryLine(input: string): string {
  return input
    .replace(/^\(WHAT-핵심사건\)\s*/i, "")
    .replace(/^\(WHY\/HOW\)\s*/i, "")
    .replace(/^\(INSIGHT-대학생관점\)\s*/i, "")
    .replace(/기사에 제시된 배경\/방법:\s*/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim();
}

function validateSummaryTriple(summary: unknown): [string, string, string] | null {
  if (!Array.isArray(summary) || summary.length !== 3) return null;

  const normalized = summary.map((line) => sanitizeSummaryLine(String(line ?? ""))) as [
    string,
    string,
    string,
  ];
  if (normalized.some((line) => line.length < 8)) return null;
  if (normalized.some((line) => /https?:\/\//i.test(line))) return null;

  return normalized;
}

async function getSummaryAndCategory(params: {
  openAiApiKey: string;
  title: string;
  description: string;
}): Promise<{ summary: [string, string, string]; category: ESGCategory } | null> {
  const systemPrompt =
    "너는 ESG 뉴스를 대학생에게 쉽게 설명하는 편집자다. 반드시 한국어로 답한다. 원문에 없는 정보는 절대 추가하지 않는다.";
  const userPrompt = [
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
    `제목: ${params.title}`,
    `본문 요약: ${params.description}`,
    "",
    'JSON만 반환: {"summary":["핵심 사건 문장","원인/방법 문장","대학생 관점 문장"],"category":"E"}',
  ].join("\n");

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API failed", await response.text());
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    const category = parsed?.category;
    const isValidCategory = category === "E" || category === "S" || category === "G";
    const normalizedSummary = validateSummaryTriple(parsed?.summary);

    if (!normalizedSummary || !isValidCategory) {
      return null;
    }

    return {
      summary: normalizedSummary,
      category,
    };
  } catch (_error) {
    return null;
  }
}

async function fetchNewsByKeyword(params: {
  keyword: string;
  naverClientId: string;
  naverClientSecret: string;
}): Promise<Array<Record<string, unknown>>> {
  const url = new URL(NAVER_ENDPOINT);
  url.searchParams.set("query", params.keyword);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "date");

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": params.naverClientId,
      "X-Naver-Client-Secret": params.naverClientSecret,
    },
  });

  if (!response.ok) {
    console.error(`Naver API failed for keyword=${params.keyword}`, await response.text());
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload?.items) ? payload.items : [];
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const naverClientId = Deno.env.get("NAVER_CLIENT_ID");
  const naverClientSecret = Deno.env.get("NAVER_CLIENT_SECRET");
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !naverClientId || !naverClientSecret || !openAiApiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing required environment variables",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const collectedAt = new Date().toISOString();
  const allRows: NewsItem[] = [];
  let skippedByAi = 0;

  for (const keyword of NEWS_KEYWORDS) {
    const items = await fetchNewsByKeyword({
      keyword,
      naverClientId,
      naverClientSecret,
    });

    for (const item of items) {
      const title = stripHtml(String(item?.title ?? ""));
      const description = stripHtml(String(item?.description ?? ""));
      const source = extractSourceHostname(
        typeof item?.originallink === "string" ? item.originallink : undefined,
        typeof item?.link === "string" ? item.link : undefined,
      );
      const originalUrl = extractOriginalUrl(
        String(item?.link ?? ""),
        typeof item?.originallink === "string" ? item.originallink : undefined,
      );
      const publishedAt = toIsoDate(String(item?.pubDate ?? ""));

      if (!title || !description || !originalUrl) {
        continue;
      }

      const summaryResult = await getSummaryAndCategory({
        openAiApiKey,
        title,
        description,
      });

      if (!summaryResult) {
        skippedByAi += 1;
        continue;
      }

      allRows.push({
        title,
        source: stripHtml(source),
        original_url: originalUrl,
        published_at: publishedAt,
        summary: summaryResult.summary,
        esg_category: summaryResult.category,
        collected_at: collectedAt,
      });
    }
  }

  if (allRows.length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        inserted: 0,
        skippedByAi,
        message: "No rows to insert",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { error } = await supabase.from("news").upsert(allRows, {
    onConflict: "original_url",
    ignoreDuplicates: true,
  });

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        inserted: 0,
        skippedByAi,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      attempted: allRows.length,
      inserted: "upsert completed (deduplicated by original_url)",
      skippedByAi,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
