import { NextResponse } from "next/server";
import type { NewsItemView } from "@/components/news-list";
import { loadAccumulatedNewsItems, toCompactNewsItem } from "@/lib/recent-news";
import { recordSearchQuery } from "@/lib/record-search-query";

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
  const rawQuery = String(searchParams.get("q") ?? "").trim();
  const query = rawQuery.toLowerCase();
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

  recordSearchQuery({
    query: rawQuery,
    searchType: "news",
    context: category === "all" ? null : category,
    resultCount: matched.length,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true, items: matched });
}
