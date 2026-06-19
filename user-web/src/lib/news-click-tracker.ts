import { classifyEsgCategory, type EsgCategory } from "@/lib/esg-news-filter";
import { findLocalNewsById } from "@/lib/local-news-store";
import { appendNewsClickLog, type NewsClickType } from "@/lib/local-news-clicks";
import { newsItems } from "@/lib/mock-data";

export function resolveNewsClickMeta(
  newsId: string,
  fallback?: { title?: string; category?: string },
): { title: string; category: EsgCategory } {
  const decodedId = decodeURIComponent(newsId);
  const local = findLocalNewsById(decodedId);

  if (local) {
    return { title: local.title, category: local.esg_category };
  }

  const mock = newsItems.find((item) => item.id === decodedId);
  if (mock) {
    return { title: mock.title, category: mock.category };
  }

  const title = String(fallback?.title ?? "ESG 뉴스").trim() || "ESG 뉴스";
  const rawCategory = String(fallback?.category ?? "E");
  const category: EsgCategory =
    rawCategory === "E" || rawCategory === "S" || rawCategory === "G"
      ? rawCategory
      : (classifyEsgCategory(title) ?? "E");

  return { title, category };
}

export function recordNewsClick(
  newsId: string,
  clickType: NewsClickType,
  userAgent: string | null,
  fallback?: { title?: string; category?: string },
) {
  const meta = resolveNewsClickMeta(newsId, fallback);
  return appendNewsClickLog({
    news_id: decodeURIComponent(newsId),
    title: meta.title,
    esg_category: meta.category,
    click_type: clickType,
    user_agent: userAgent,
  });
}
