/**
 * 기존 DB 뉴스에 original_body · student_trend_summary 를 채우는 백필 스크립트
 *
 * 사용법 (user-web 폴더에서):
 *   npx tsx scripts/backfill-news.ts
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchArticleBody, truncateArticleBody } from "../src/lib/article-fetcher";
import { classifyEsgCategory } from "../src/lib/esg-news-filter";
import { getWeekStartKey } from "../src/lib/news-week";

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

type SummaryResult = {
  summary: [string, string, string];
  studentTrendSummary: string;
  category: "E" | "S" | "G";
};

async function getArticleSummaries(params: {
  openAiApiKey: string;
  title: string;
  originalBody: string;
}): Promise<SummaryResult | null> {
  const bodyForAi = truncateArticleBody(params.originalBody, 12_000);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        {
          role: "system",
          content:
            "너는 ESG 뉴스를 대학생에게 쉽게 설명하는 편집자다. 반드시 한국어로 답한다. 원문에 없는 정보는 절대 추가하지 않는다.",
        },
        {
          role: "user",
          content: [
            `제목: ${params.title}`,
            `기사 원문:\n${bodyForAi}`,
            'JSON만 반환: {"summary":["핵심","원인/방법","맥락"],"student_trend_summary":"대학생 트렌드 요약","category":"E"}',
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    const category = parsed?.category;
    if (category !== "E" && category !== "S" && category !== "G") return null;
    if (!Array.isArray(parsed?.summary) || parsed.summary.length !== 3) return null;
    const studentTrendSummary = String(parsed.student_trend_summary ?? "").trim();
    if (studentTrendSummary.length < 40) return null;

    return {
      summary: parsed.summary.map((line: unknown) => String(line ?? "").trim()) as [
        string,
        string,
        string,
      ],
      studentTrendSummary,
      category,
    };
  } catch {
    return null;
  }
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  const placeholders = [
    [!supabaseUrl || supabaseUrl.includes("xxxx"), "NEXT_PUBLIC_SUPABASE_URL"],
    [!serviceRoleKey || serviceRoleKey.startsWith("your_"), "SUPABASE_SERVICE_ROLE_KEY"],
    [!openAiApiKey || openAiApiKey.includes("your_openai"), "OPENAI_API_KEY"],
  ].filter(([invalid]) => invalid) as Array<[boolean, string]>;

  if (placeholders.length > 0) {
    console.error("\n❌ user-web/.env.local 에 실제 API 키가 필요합니다.\n");
    console.error("아직 예시 값인 항목:");
    for (const [, name] of placeholders) {
      console.error(`  - ${name}`);
    }
    console.error("\n설정 방법:");
    console.error("  1. Cursor에서 user-web/.env.local 파일 열기");
    console.error("  2. Supabase 대시보드 → Project Settings → API 에서 URL·service_role 키 복사");
    console.error("  3. OpenAI 대시보드에서 API 키 복사");
    console.error("  4. 저장 후 다시: npm run news:backfill\n");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("news")
    .select("id,title,original_url,published_at,original_snippet,original_body")
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("DB 조회 실패:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("백필할 기사가 없습니다.");
    return;
  }

  console.log(`기존 기사 ${data.length}건 백필 시작...`);

  let updated = 0;
  let skippedByAi = 0;
  let skippedByBody = 0;
  let failed = 0;
  const collectedAt = new Date().toISOString();

  for (const row of data) {
    const title = String(row.title ?? "");
    const originalUrl = String(row.original_url ?? "");
    const snippet = String(row.original_snippet ?? "");
    const publishedAt = String(row.published_at ?? new Date().toISOString());

    process.stdout.write(`- ${title.slice(0, 40)}... `);

    const fetched = await fetchArticleBody(originalUrl);
    const originalBody = fetched.body.trim() || snippet || String(row.original_body ?? "");
    if (originalBody.length < 40) {
      skippedByBody += 1;
      console.log("SKIP (본문 없음)");
      continue;
    }

    const summaryResult = await getArticleSummaries({ openAiApiKey, title, originalBody });
    if (!summaryResult) {
      skippedByAi += 1;
      console.log("SKIP (AI 요약 실패)");
      continue;
    }

    const { error: updateError } = await supabase
      .from("news")
      .update({
        original_body: originalBody,
        summary: summaryResult.summary,
        student_trend_summary: summaryResult.studentTrendSummary,
        esg_category: classifyEsgCategory(title, originalBody) ?? summaryResult.category,
        collected_at: collectedAt,
        week_start: getWeekStartKey(publishedAt),
        original_snippet: snippet || originalBody.slice(0, 500),
      })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      console.log(`FAIL (${updateError.message})`);
      continue;
    }

    updated += 1;
    console.log("OK");
  }

  console.log("\n백필 완료");
  console.log({ total: data.length, updated, skippedByAi, skippedByBody, failed });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
