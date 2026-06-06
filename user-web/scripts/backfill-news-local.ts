/**
 * API 키 없이 로컬 JSON(news-store.json)에 뉴스 백필
 * - Google RSS / 네이버(키 있으면) 로 최근 7일 뉴스 수집
 * - 원문 본문 추출 + 템플릿 요약 + 대학생 트렌드 요약
 */

import { fetchArticleBody } from "../src/lib/article-fetcher";
import { classifyEsgCategory } from "../src/lib/esg-news-filter";
import { fetchRecentNews } from "../src/lib/live-news";
import {
  findLocalNewsByUrl,
  readLocalNewsStore,
  urlToLocalNewsId,
  writeLocalNewsStore,
  type StoredNewsArticle,
} from "../src/lib/local-news-store";
import { newsItems } from "../src/lib/mock-data";
import { getWeekStartKey } from "../src/lib/news-week";
import { buildStudentTrendSummary, buildTemplateSummary } from "../src/lib/news-summary";
import { isReadableArticleText, stripHtmlToText } from "../src/lib/text-sanitize";

const MAX_ARTICLES = 24;
const BODY_FETCH_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockToStored(): StoredNewsArticle[] {
  const collectedAt = new Date().toISOString();
  return newsItems.map((item) => {
    const body = item.originalBody ?? item.summary.join("\n\n");
    const summary = [...item.summary] as [string, string, string];
    return {
      id: item.id,
      title: item.title,
      original_url: item.originalUrl,
      published_at: collectedAt,
      original_body: body,
      summary,
      student_trend_summary:
        item.studentTrendSummary ?? buildStudentTrendSummary(item.title, body),
      esg_category: item.category,
      source: item.source,
      original_snippet: body.slice(0, 500),
      week_start: getWeekStartKey(collectedAt),
      collected_at: collectedAt,
    };
  });
}

async function liveItemToStored(item: {
  title: string;
  originalUrl: string;
  source: string;
  snippet: string;
  publishedAt: string;
}): Promise<StoredNewsArticle | null> {
  await sleep(BODY_FETCH_DELAY_MS);

  const fetched = await fetchArticleBody(item.originalUrl);
  const snippetText = stripHtmlToText(item.snippet);
  const fetchedText = stripHtmlToText(fetched.body);
  const originalBody = isReadableArticleText(fetchedText)
    ? fetchedText
    : isReadableArticleText(snippetText)
      ? snippetText
      : "";
  if (originalBody.length < 20) return null;

  const cleanTitle = stripHtmlToText(item.title);

  const summary = buildTemplateSummary(cleanTitle, originalBody);
  const category = classifyEsgCategory(cleanTitle, originalBody) ?? "E";

  return {
    id: urlToLocalNewsId(item.originalUrl),
    title: cleanTitle,
    original_url: item.originalUrl,
    published_at: item.publishedAt,
    original_body: originalBody,
    summary,
    student_trend_summary: buildStudentTrendSummary(cleanTitle, originalBody),
    esg_category: category,
    source: item.source,
    original_snippet: snippetText || originalBody.slice(0, 500),
    week_start: getWeekStartKey(item.publishedAt),
    collected_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("로컬 뉴스 백필 시작 (API 키 불필요)...\n");

  const existing = readLocalNewsStore();
  const merged = new Map<string, StoredNewsArticle>();
  for (const article of existing) {
    merged.set(article.original_url, article);
  }

  for (const mock of mockToStored()) {
    if (mock.original_url) {
      merged.set(mock.original_url, mock);
    } else {
      merged.set(mock.id, mock);
    }
  }

  console.log("최근 7일 뉴스 수집 중...");
  const liveItems = await fetchRecentNews(7);
  console.log(`수집된 후보: ${liveItems.length}건 (최대 ${MAX_ARTICLES}건 본문 처리)\n`);

  let processed = 0;
  for (const item of liveItems.slice(0, MAX_ARTICLES)) {
    process.stdout.write(`- ${item.title.slice(0, 40)}... `);
    const stored = await liveItemToStored(item);
    if (!stored) {
      console.log("SKIP");
      continue;
    }

    merged.set(stored.original_url, stored);
    processed += 1;
    console.log("OK");
  }

  const articles = [...merged.values()].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );

  writeLocalNewsStore(articles);

  console.log("\n로컬 백필 완료");
  console.log({
    total: articles.length,
    newlyProcessed: processed,
    savedTo: "user-web/data/news-store.json",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
