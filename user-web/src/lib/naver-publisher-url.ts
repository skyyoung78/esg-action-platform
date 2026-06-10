function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[-–|]\s*.+$/, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(a: string, b: string): boolean {
  const left = a.replace(/\s+/g, "").toLowerCase();
  const right = b.replace(/\s+/g, "").toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/** 네이버 뉴스 API로 기사 제목과 매칭되는 언론사 원문 URL 검색 */
export async function findPublisherUrlByTitle(title: string): Promise<string | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const query = normalizeTitle(title);
  if (query.length < 4) return null;

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const items: Array<{ title?: string; originallink?: string; link?: string }> = Array.isArray(payload?.items)
    ? payload.items
    : [];

  for (const item of items) {
    const itemTitle = String(item.title ?? "").replace(/<[^>]*>/g, "");
    const publisherUrl = item.originallink || item.link;
    if (!publisherUrl || publisherUrl.includes("news.google.com")) continue;
    if (titlesMatch(query, itemTitle)) {
      return publisherUrl;
    }
  }

  const first = items[0];
  const fallbackUrl = first?.originallink || first?.link;
  if (fallbackUrl && !fallbackUrl.includes("news.google.com")) {
    return fallbackUrl;
  }

  return null;
}
