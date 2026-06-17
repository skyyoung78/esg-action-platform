import { NextResponse } from "next/server";
import type { NewsItemView } from "@/components/news-list";
import { loadAccumulatedNewsItems, toCompactNewsItem } from "@/lib/recent-news";

function buildSearchHaystack(item: NewsItemView): string {
  return [
    item.title,
    item.source ?? "",
    item.searchText ?? "",
    item.originalSnippet ?? "",
    item.studentTrendSummary ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") ?? "").trim().toLowerCase();
  const category = String(searchParams.get("category") ?? "all").trim();

  if (!query) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const { items } = await loadAccumulatedNewsItems();
  const matched = items
    .filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      return buildSearchHaystack(item).includes(query);
    })
    .slice(0, 80)
    .map(toCompactNewsItem);

  return NextResponse.json({ ok: true, items: matched });
}
