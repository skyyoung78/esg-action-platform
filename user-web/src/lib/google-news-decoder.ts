/**
 * Google News RSS 리다이렉트 URL을 언론사 원문 URL로 디코딩
 * @see https://github.com/dbernheisel/google_news_decoder
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  Cookie: "CONSENT=PENDING+987",
};

const XHR_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  Origin: "https://news.google.com",
  Referer: "https://news.google.com/",
  "X-Same-Domain": "1",
  Cookie: "CONSENT=PENDING+987",
};

function extractArticleId(sourceUrl: string): string | null {
  try {
    const match = new URL(sourceUrl).pathname.match(/\/(?:articles|read)\/([^/?]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractAttr(html: string, attrName: string): string | null {
  const match = html.match(new RegExp(`${attrName}="([^"]+)"`));
  return match?.[1] ?? null;
}

function parseBatchExecuteResponse(body: string): string | null {
  const parts = body.split("\n\n");
  if (parts.length < 2) return null;

  try {
    const parsed = JSON.parse(parts[1].trim());
    const innerJson = parsed?.[0]?.[2];
    if (typeof innerJson !== "string") return null;

    const inner = JSON.parse(innerJson);
    const decodedUrl = inner?.[1];
    if (typeof decodedUrl === "string" && decodedUrl.startsWith("http")) {
      return decodedUrl;
    }
  } catch {
    return null;
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDecodingParams(articleId: string): Promise<{
  signature: string;
  timestamp: string;
} | null> {
  const pageUrls = [
    `https://news.google.com/articles/${articleId}`,
    `https://news.google.com/rss/articles/${articleId}`,
  ];

  for (const pageUrl of pageUrls) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(pageUrl, {
        headers: BROWSER_HEADERS,
        cache: "no-store",
        redirect: "follow",
      });

      if (response.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }

      if (!response.ok) break;

      const html = await response.text();
      const signature = extractAttr(html, "data-n-a-sg");
      const timestamp = extractAttr(html, "data-n-a-ts");

      if (signature && timestamp) {
        return { signature, timestamp };
      }
      break;
    }
  }

  return null;
}

async function decodeViaBatchExecute(
  articleId: string,
  signature: string,
  timestamp: string,
): Promise<string | null> {
  const innerJson = JSON.stringify([
    "garturlreq",
    [
      ["X", "X", ["X", "X"], null, null, 1, 1, "KR:ko", null, 1, null, null, null, null, null, 0, 1],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleId,
    Number(timestamp),
    signature,
  ]);

  const payload = JSON.stringify([[["Fbv4je", innerJson]]]);
  const response = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
    method: "POST",
    headers: {
      ...XHR_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `f.req=${encodeURIComponent(payload)}`,
    cache: "no-store",
  });

  if (!response.ok) return null;
  return parseBatchExecuteResponse(await response.text());
}

export function isGoogleNewsArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "news.google.com" &&
      /\/(articles|read)\//.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  if (!isGoogleNewsArticleUrl(sourceUrl)) {
    return sourceUrl;
  }

  const articleId = extractArticleId(sourceUrl);
  if (!articleId) return sourceUrl;

  const params = await fetchDecodingParams(articleId);
  if (!params) return sourceUrl;

  const decoded = await decodeViaBatchExecute(articleId, params.signature, params.timestamp);
  if (decoded && (decoded.startsWith("http://") || decoded.startsWith("https://"))) {
    return decoded;
  }

  return sourceUrl;
}
