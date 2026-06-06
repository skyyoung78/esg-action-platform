/**
 * API 키 없이 로컬 JSON(jobs-store.json)에 ESG 채용공고 백필
 * - 사람인 / 잡코리아 검색 결과 수집
 */

import { fetchEsgJobPostings } from "../src/lib/jobs-fetcher";
import {
  findLocalJobBySourceKey,
  readLocalJobsStore,
  urlToLocalJobId,
  writeLocalJobsStore,
  type StoredJobPosting,
} from "../src/lib/local-jobs-store";

const MAX_JOBS = 60;

async function main() {
  console.log("로컬 채용공고 백필 시작 (API 키 불필요)...\n");
  console.log("사람인·잡코리아에서 ESG 관련 채용공고 수집 중...");

  const fetched = await fetchEsgJobPostings();
  const saraminItems = fetched.filter((item) => item.source === "saramin");
  const jobKoreaItems = fetched.filter((item) => item.source === "jobkorea");
  const balanced = [
    ...saraminItems.slice(0, Math.ceil(MAX_JOBS * 0.6)),
    ...jobKoreaItems.slice(0, Math.floor(MAX_JOBS * 0.4)),
  ].slice(0, MAX_JOBS);

  console.log(
    `수집된 후보: ${fetched.length}건 (사람인 ${saraminItems.length}, 잡코리아 ${jobKoreaItems.length}, 저장 ${balanced.length}건)\n`,
  );

  const existing = readLocalJobsStore();
  const byKey = new Map(existing.map((job) => [`${job.source}:${job.source_id}`, job]));
  const collectedAt = new Date().toISOString();
  let newlyProcessed = 0;

  for (const item of balanced) {
    const key = `${item.source}:${item.sourceId}`;
    const prev = byKey.get(key) ?? findLocalJobBySourceKey(item.source, item.sourceId);

    const row: StoredJobPosting = {
      id: urlToLocalJobId(item.source, item.sourceId),
      title: item.title,
      company: item.company,
      location: item.location,
      job_type: item.jobType,
      deadline: item.deadline,
      apply_url: item.applyUrl,
      source: item.source,
      source_id: item.sourceId,
      keyword: item.keyword,
      category: item.category,
      collected_at: prev?.collected_at ?? collectedAt,
    };

    byKey.set(key, row);
    newlyProcessed += 1;
    const sourceLabel = item.source === "saramin" ? "사람인" : "잡코리아";
    console.log(`- [${sourceLabel}] ${item.title.slice(0, 48)}... OK`);
  }

  const merged = [...byKey.values()].sort((a, b) => {
    const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  writeLocalJobsStore(merged);

  console.log("\n로컬 백필 완료");
  console.log({
    total: merged.length,
    newlyProcessed,
    savedTo: "user-web/data/jobs-store.json",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
