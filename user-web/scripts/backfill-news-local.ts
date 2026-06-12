/**
 * API 키 없이 로컬 JSON(news-store.json)에 뉴스 백필
 * - Google RSS / 네이버(키 있으면) 로 2026.6.1 이후 누적 뉴스 수집
 * - 원문 본문 추출 + 요약 + 대학생 트렌드 요약 저장
 */

import { fetchAccumulatedNews } from "../src/lib/live-news";
import { readLocalNewsStore } from "../src/lib/local-news-store";
import { ingestLiveNewsItems } from "../src/lib/news-ingest";
import { getAccumulationNewsWindow } from "../src/lib/news-window";

const MAX_ARTICLES = 32;

async function main() {
  const window = getAccumulationNewsWindow();
  console.log("로컬 뉴스 백필 시작...\n");
  console.log(`누적 구간: ${window.label}\n`);

  const beforeCount = readLocalNewsStore().length;
  console.log("누적 기간 ESG 뉴스 수집 중...");
  const liveItems = await fetchAccumulatedNews(window);
  console.log(`수집된 후보: ${liveItems.length}건 (최대 ${MAX_ARTICLES}건 본문 처리)\n`);

  const result = await ingestLiveNewsItems(liveItems, {
    maxItems: MAX_ARTICLES,
    onlyMissing: true,
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
