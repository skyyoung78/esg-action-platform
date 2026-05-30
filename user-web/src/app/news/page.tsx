import AppShell from "@/components/app-shell";
import { newsItems } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeExternalUrl } from "@/lib/url";
import { fetchLiveNews } from "@/lib/live-news";

type NewsListItem = {
  id: string;
  title: string;
  originalUrl: string;
  source?: string;
};

export default async function NewsPage() {
  const live = await fetchLiveNews(24);
  let items: NewsListItem[] =
    live.length > 0
      ? live.map((item) => ({
          id: item.originalUrl,
          title: item.title,
          originalUrl: item.originalUrl,
          source: item.source,
        }))
      : newsItems.map((item) => ({
          id: item.id,
          title: item.title,
          originalUrl: item.originalUrl,
        }));

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("id,title,original_url,source,published_at")
      .order("published_at", { ascending: false })
      .limit(24);

    if (data && data.length > 0) {
      items = data.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        originalUrl: String(row.original_url),
        source: String(row.source ?? ""),
      }));
    }
  }

  return (
    <AppShell title="ESG 뉴스" description="최신 ESG 뉴스 제목을 확인하고 원문으로 이동할 수 있습니다.">
      <ul className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {items.map((item) => {
          const articleUrl = normalizeExternalUrl(item.originalUrl);
          return (
            <li key={item.id} className="p-4">
              {articleUrl ? (
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#111827] hover:text-[#085041] hover:underline"
                >
                  {item.title}
                </a>
              ) : (
                <p className="font-medium text-slate-500">{item.title}</p>
              )}
              {item.source ? <p className="text-xs text-slate-500 mt-1">{item.source}</p> : null}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
