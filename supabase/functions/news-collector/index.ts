import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchArticleBody, truncateArticleBody } from "../_shared/article-fetcher.ts";
import {
  classifyEsgCategory,
  ESG_NEWS_SEARCH_KEYWORDS,
  isEsgRelatedNews,
} from "../_shared/esg-news-filter.ts";
import { getOldestRetainedWeekStart, getWeekStartKey } from "../_shared/news-week.ts";

const COLLECT_ROLLING_DAYS = 7;

function isWithinRollingDays(pubDate: string, days = COLLECT_ROLLING_DAYS): boolean {
  const published = new Date(pubDate);
  if (Number.isNaN(published.getTime())) return false;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return published >= cutoff;
}

type ESGCategory = "E" | "S" | "G";

type NewsItem = {
  title: string;
  source: string;
  original_url: string;
  published_at: string;
  original_body: string;
  summary: [string, string, string];
  student_trend_summary: string;
  esg_category: ESGCategory;
  collected_at: string;
  week_start: string;
  original_snippet: string;
};

const NAVER_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const NEWS_KEYWORDS = ESG_NEWS_SEARCH_KEYWORDS;

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

async function getArticleSummaries(params: {
  openAiApiKey: string;
  title: string;
  originalBody: string;
}): Promise<{
  summary: [string, string, string];
  studentTrendSummary: string;
  category: ESGCategory;
} | null> {
  const bodyForAi = truncateArticleBody(params.originalBody, 12_000);

  const systemPrompt =
    "너는 ESG 뉴스를 대학생에게 쉽게 설명하는 편집자다. 반드시 한국어로 답한다. 원문에 없는 정보는 절대 추가하지 않는다.";

  const userPrompt = [
    "아래 기사 원문을 2단계로 처리하라.",
    "",
    "1단계 summary: 기사 원문을 바탕으로 핵심 3줄 요약",
    "- 1줄: 핵심 팩트 및 기업/기관의 액션",
    "- 2줄: 원인, 정량 수치, 구체적 방법(없으면 '원문에 해당 정보가 명시되지 않았습니다.')",
    "- 3줄: 사건의 배경·맥락",
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
    `제목: ${params.title}`,
    `기사 원문:\n${bodyForAi}`,
    "",
    'JSON만 반환: {"summary":["핵심 사건","원인/방법","배경/맥락"],"student_trend_summary":"대학생 맞춤 트렌드 요약 문단","category":"E"}',
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
    const studentTrendSummary = sanitizeSummaryLine(String(parsed?.student_trend_summary ?? ""));

    if (!normalizedSummary || !isValidCategory || studentTrendSummary.length < 40) {
      return null;
    }

    return {
      summary: normalizedSummary,
      studentTrendSummary,
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
  url.searchParams.set("display", "100");
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

async function backfillExistingArticles(params: {
  supabase: ReturnType<typeof createClient>;
  openAiApiKey: string;
}): Promise<{
  updated: number;
  skippedByAi: number;
  skippedByBody: number;
  failed: number;
}> {
  const { data, error } = await params.supabase
    .from("news")
    .select("id,title,original_url,source,published_at,original_snippet,original_body,student_trend_summary")
    .order("published_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load existing news rows");
  }

  let updated = 0;
  let skippedByAi = 0;
  let skippedByBody = 0;
  let failed = 0;
  const collectedAt = new Date().toISOString();

  for (const row of data) {
    const title = stripHtml(String(row.title ?? ""));
    const originalUrl = String(row.original_url ?? "").trim();
    const publishedAt = toIsoDate(String(row.published_at ?? ""));
    const snippet = stripHtml(String(row.original_snippet ?? ""));

    if (!title || !originalUrl) {
      failed += 1;
      continue;
    }

    const fetched = await fetchArticleBody(originalUrl);
    const originalBody = fetched.body.trim() || snippet || String(row.original_body ?? "");
    if (originalBody.length < 40) {
      skippedByBody += 1;
      continue;
    }

    const summaryResult = await getArticleSummaries({
      openAiApiKey: params.openAiApiKey,
      title,
      originalBody,
    });

    if (!summaryResult) {
      skippedByAi += 1;
      continue;
    }

    const keywordCategory = classifyEsgCategory(title, originalBody);
    const { error: updateError } = await params.supabase
      .from("news")
      .update({
        original_body: originalBody,
        summary: summaryResult.summary,
        student_trend_summary: summaryResult.studentTrendSummary,
        esg_category: keywordCategory ?? summaryResult.category,
        collected_at: collectedAt,
        week_start: getWeekStartKey(publishedAt),
        original_snippet: snippet || originalBody.slice(0, 500),
      })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    updated += 1;
  }

  return { updated, skippedByAi, skippedByBody, failed };
}

Deno.serve(async (req) => {
  const requestUrl = new URL(req.url);
  const mode = requestUrl.searchParams.get("mode") ?? "collect";

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

  if (mode === "backfill") {
    try {
      const result = await backfillExistingArticles({ supabase, openAiApiKey });
      return new Response(JSON.stringify({ ok: true, mode: "backfill", ...result }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          mode: "backfill",
          error: error instanceof Error ? error.message : "backfill failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const collectedAt = new Date().toISOString();
  const allRows: NewsItem[] = [];
  const seenUrls = new Set<string>();
  let skippedByAi = 0;
  let skippedByFilter = 0;
  let skippedByDuplicate = 0;
  let skippedByBody = 0;

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

      if (!isWithinRollingDays(publishedAt)) {
        continue;
      }

      if (!isEsgRelatedNews(title, description)) {
        skippedByFilter += 1;
        continue;
      }

      if (seenUrls.has(originalUrl)) {
        skippedByDuplicate += 1;
        continue;
      }
      seenUrls.add(originalUrl);

      const fetched = await fetchArticleBody(originalUrl);
      const originalBody = fetched.body.trim() || description;
      if (originalBody.length < 40) {
        skippedByBody += 1;
        continue;
      }

      const keywordCategory = classifyEsgCategory(title, originalBody);

      const summaryResult = await getArticleSummaries({
        openAiApiKey,
        title,
        originalBody,
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
        original_body: originalBody,
        summary: summaryResult.summary,
        student_trend_summary: summaryResult.studentTrendSummary,
        esg_category: keywordCategory ?? summaryResult.category,
        collected_at: collectedAt,
        week_start: getWeekStartKey(publishedAt),
        original_snippet: description,
      });
    }
  }

  if (allRows.length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        inserted: 0,
        skippedByAi,
        skippedByFilter,
        skippedByDuplicate,
        skippedByBody,
        message: "No rows to insert",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { error } = await supabase.from("news").upsert(allRows, {
    onConflict: "original_url",
    ignoreDuplicates: false,
  });

  const retentionCutoff = getOldestRetainedWeekStart();
  const { error: pruneError } = await supabase
    .from("news")
    .delete()
    .lt("week_start", retentionCutoff);

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        inserted: 0,
        skippedByAi,
        skippedByFilter,
        skippedByDuplicate,
        skippedByBody,
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
      skippedByFilter,
      skippedByDuplicate,
      skippedByBody,
      retentionCutoff,
      pruned: pruneError ? null : "older than retention window removed",
      pruneError: pruneError?.message ?? null,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
