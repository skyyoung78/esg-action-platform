import { classifyJobCategory, ESG_JOB_KEYWORDS, isEsgRelatedJob } from "@/lib/esg-jobs-filter";
import { stripHtmlToText } from "@/lib/text-sanitize";

export type FetchedJobPosting = {
  title: string;
  company: string;
  location: string | null;
  jobType: string | null;
  deadline: string | null;
  applyUrl: string;
  source: "saramin" | "jobkorea";
  sourceId: string;
  keyword: string;
  category: ReturnType<typeof classifyJobCategory>;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function inferJobType(text: string): string | null {
  if (text.includes("인턴")) return "인턴";
  if (text.includes("계약직")) return "계약직";
  if (text.includes("정규직")) return "정규직";
  if (text.includes("파견")) return "파견";
  if (text.includes("아르바이트")) return "아르바이트";
  return null;
}

function parseSaraminDeadline(raw: string, now = new Date()): string | null {
  const cleaned = raw.replace(/[~]/g, "").trim();
  const match = cleaned.match(/(\d{2})\/(\d{2})/);
  if (!match) return null;

  const [, month, day] = match;
  const year = now.getFullYear();
  const candidate = new Date(`${year}-${month}-${day}T23:59:59`);
  if (Number.isNaN(candidate.getTime())) return null;

  if (candidate.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 30) {
    candidate.setFullYear(year + 1);
  }

  return candidate.toISOString().slice(0, 10);
}

function parseJobKoreaDeadline(raw: string, now = new Date()): string | null {
  const match = raw.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }

  const short = raw.match(/(\d{2})[.\-/](\d{2})/);
  if (short) {
    const [, month, day] = short;
    const year = now.getFullYear();
    return `${year}-${month}-${day}`;
  }

  return null;
}

function extractCompanyFromTitle(title: string): string | null {
  const bracket = title.match(/^\[(.+?)\]/);
  if (bracket?.[1]) return bracket[1].trim();

  const paren = title.match(/^\((?:주\)|㈜)?([^)]+)\)/);
  if (paren?.[1]) return paren[1].trim();

  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

export function parseSaraminSearchHtml(html: string, keyword: string): FetchedJobPosting[] {
  const results: FetchedJobPosting[] = [];
  const blocks = html.split('<div class="item_recruit"');

  for (const block of blocks.slice(1)) {
    const recIdxMatch = block.match(/value="(\d+)"/);
    const titleMatch =
      block.match(/class="job_tit"[\s\S]*?title="([^"]+)"/) ??
      block.match(/class="job_tit"[\s\S]*?<span>([\s\S]*?)<\/span>/);
    const hrefMatch = block.match(/href="(\/zf_user\/jobs\/relay\/view[^"]+)"/);
    const companyMatch = block.match(/class="corp_name"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    const dateMatch = block.match(/class="date">([^<]+)</);
    const conditionMatch = block.match(/class="job_condition">([\s\S]*?)<\/div>/);

    if (!recIdxMatch || !titleMatch || !hrefMatch) continue;

    const title = stripHtmlToText(decodeHtml(titleMatch[1]));
    const companyFromCorp = companyMatch ? stripHtmlToText(decodeHtml(companyMatch[1])) : "";
    const company = companyFromCorp || extractCompanyFromTitle(title) || "미상";
    const applyUrl = `https://www.saramin.co.kr${decodeHtml(hrefMatch[1]).replace(/&amp;/g, "&")}`;

    let location: string | null = null;
    let jobType: string | null = null;
    if (conditionMatch) {
      const spans = [...conditionMatch[1].matchAll(/<span>([\s\S]*?)<\/span>/g)].map((match) =>
        stripHtmlToText(decodeHtml(match[1])),
      );
      location = spans[0] ?? null;
      jobType = inferJobType(spans.join(" "));
    }

    if (!isEsgRelatedJob(title, company)) continue;

    results.push({
      title,
      company,
      location,
      jobType,
      deadline: dateMatch ? parseSaraminDeadline(dateMatch[1]) : null,
      applyUrl,
      source: "saramin",
      sourceId: recIdxMatch[1],
      keyword,
      category: classifyJobCategory(title, company),
    });
  }

  return results;
}

export function parseJobKoreaSearchHtml(html: string, keyword: string): FetchedJobPosting[] {
  const results: FetchedJobPosting[] = [];
  const seen = new Set<string>();
  const cards = html.split('data-sentry-component="CardJob"');

  for (const card of cards.slice(1)) {
    const urlMatch = card.match(/href="(https:\/\/www\.jobkorea\.co\.kr\/Recruit\/GI_Read\/(\d+)[^"]*)"/);
    const titleMatch = card.match(
      /data-sentry-component="Title"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/,
    );
    if (!urlMatch || !titleMatch) continue;

    const sourceId = urlMatch[2];
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const title = stripHtmlToText(decodeHtml(titleMatch[1]));
    const companyMatch = card.match(/text-gray700 text-typo-b2-16">([^<]+)</);
    const locationMatch = card.match(/emoji--basicemoji-place2[\s\S]*?<span[^>]*>([^<]+)</);
    const careerMatch = card.match(/text-gray700 text-typo-c1-13">([^<•]+)</);
    const deadlineMatch = card.match(/(?:마감일|접수마감|~)\s*([0-9./-]{4,10})/);

    const company =
      (companyMatch ? stripHtmlToText(companyMatch[1]) : null) ||
      extractCompanyFromTitle(title) ||
      "미상";

    if (!isEsgRelatedJob(title, company)) continue;

    results.push({
      title,
      company,
      location: locationMatch ? stripHtmlToText(locationMatch[1]) : null,
      jobType: inferJobType(`${title} ${careerMatch?.[1] ?? ""}`),
      deadline: deadlineMatch ? parseJobKoreaDeadline(deadlineMatch[1]) : null,
      applyUrl: decodeHtml(urlMatch[1]).replace(/&amp;/g, "&"),
      source: "jobkorea",
      sourceId,
      keyword,
      category: classifyJobCategory(title, company),
    });
  }

  return results;
}

async function fetchSaraminByKeyword(keyword: string): Promise<FetchedJobPosting[]> {
  const url = new URL("https://www.saramin.co.kr/zf_user/search");
  url.searchParams.set("searchword", keyword);
  url.searchParams.set("searchType", "search");

  const html = await fetchHtml(url.toString());
  return parseSaraminSearchHtml(html, keyword);
}

async function fetchJobKoreaByKeyword(keyword: string): Promise<FetchedJobPosting[]> {
  const url = new URL("https://www.jobkorea.co.kr/Search/");
  url.searchParams.set("stext", keyword);

  const html = await fetchHtml(url.toString());
  return parseJobKoreaSearchHtml(html, keyword);
}

export async function fetchEsgJobPostings(
  keywords: readonly string[] = ESG_JOB_KEYWORDS,
): Promise<FetchedJobPosting[]> {
  const merged = new Map<string, FetchedJobPosting>();

  for (const keyword of keywords) {
    try {
      const saraminItems = await fetchSaraminByKeyword(keyword);
      for (const item of saraminItems) {
        merged.set(`${item.source}:${item.sourceId}`, item);
      }
    } catch (error) {
      console.warn(`[jobs] Saramin fetch failed (${keyword}):`, error);
    }

    await sleep(FETCH_DELAY_MS);

    try {
      const jobKoreaItems = await fetchJobKoreaByKeyword(keyword);
      for (const item of jobKoreaItems) {
        merged.set(`${item.source}:${item.sourceId}`, item);
      }
    } catch (error) {
      console.warn(`[jobs] JobKorea fetch failed (${keyword}):`, error);
    }

    await sleep(FETCH_DELAY_MS);
  }

  return [...merged.values()].sort((a, b) => {
    const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}
