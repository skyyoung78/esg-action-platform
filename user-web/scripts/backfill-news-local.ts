/**
 * API 키 없이 로컬 JSON(news-store.json)에 뉴스 백필
 * - Google RSS / 네이버(키 있으면) 로 최근 7일 뉴스 수집
 * - 원문 본문 추출 + 요약 + 대학생 트렌드 요약 저장
 */

import { fetchRecentNews } from "../src/lib/live-news";
import { readLocalNewsStore } from "../src/lib/local-news-store";
import { ingestLiveNewsItems } from "../src/lib/news-ingest";

const MAX_ARTICLES = 24;

async function main() {
  console.log("로컬 뉴스 백필 시작...\n");

  const beforeCount = readLocalNewsStore().length;
  console.log("최근 7일 뉴스 수집 중...");
  const liveItems = await fetchRecentNews(7);
  console.log(`수집된 후보: ${liveItems.length}건 (최대 ${MAX_ARTICLES}건 본문 처리)\n`);

  const result = await ingestLiveNewsItems(liveItems, {
    maxItems: MAX_ARTICLES,
    onlyMissing: false,
  });

  const afterCount = readLocalNewsStore().length;

  console.log("\n로컬 백필 완료");
  console.log({
    total: afterCount,
    before: beforeCount,
    processed: result.processed,
    saved: result.saved,
    savedTo: "user-web/data/news-store.json",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
