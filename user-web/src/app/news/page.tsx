import AppShell from "@/components/app-shell";
import NewsList, { type NewsItemView } from "@/components/news-list";
import { newsItems } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { classifyEsgCategory, isEsgRelatedNews } from "@/lib/esg-news-filter";
import { fetchLiveNews } from "@/lib/live-news";

function summaryToText(summary: unknown): string {
  if (Array.isArray(summary)) {
    return summary.map((line) => String(line ?? "")).join(" ");
  }
  return String(summary ?? "");
}

export default async function NewsPage() {
  const live = await fetchLiveNews(24);
  let items: NewsItemView[] =
    live.length > 0
      ? live.map((item) => ({
          id: item.originalUrl,
          title: item.title,
          originalUrl: item.originalUrl,
          source: item.source,
          searchText: item.snippet,
          category: classifyEsgCategory(item.title, item.snippet),
        }))
      : newsItems.map((item) => ({
          id: item.id,
          title: item.title,
          originalUrl: item.originalUrl,
          searchText: item.summary.join(" "),
        }));

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("id,title,original_url,source,published_at,summary,esg_category")
      .order("published_at", { ascending: false })
      .limit(48);

    if (data && data.length > 0) {
      const fromDb = data
        .filter((row) => {
          const title = String(row.title ?? "");
          const summaryText = summaryToText(row.summary);
          return isEsgRelatedNews(title, summaryText);
        })
        .slice(0, 24)
        .map((row) => ({
          id: String(row.id),
          title: String(row.title),
          originalUrl: String(row.original_url),
          source: String(row.source ?? ""),
          searchText: summaryToText(row.summary),
          category: (() => {
            const cat = String(row.esg_category ?? "");
            if (cat === "E" || cat === "S" || cat === "G") return cat;
            return classifyEsgCategory(String(row.title), summaryToText(row.summary));
          })(),
        }));

      if (fromDb.length > 0) {
        items = fromDb;
      }
    }
  }

  items = items.filter((item) => isEsgRelatedNews(item.title, item.searchText ?? ""));

  return (
    <AppShell
      title="ESG 뉴스"
      description="최신 ESG 뉴스를 키워드로 검색하고, 제목을 클릭해 원문 기사로 이동할 수 있습니다."
    >
      <NewsList items={items} />
    </AppShell>
  );
}
