import { NextResponse } from "next/server";
import { fetchArticleParagraphs, isFetchableArticleUrl } from "@/lib/article-fetcher";
import { findLocalNewsById } from "@/lib/local-news-store";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = String(searchParams.get("url") ?? "").trim();
  const newsId = String(searchParams.get("id") ?? "").trim();

  if (!url || !isFetchableArticleUrl(url)) {
    return NextResponse.json({ ok: false, error: "유효한 기사 URL이 필요합니다." }, { status: 400 });
  }

  if (newsId && !newsId.startsWith("live:")) {
    const local = findLocalNewsById(newsId);
    if (local) {
      if (local.original_url !== url) {
        return NextResponse.json({ ok: false, error: "등록된 뉴스와 URL이 일치하지 않습니다." }, { status: 403 });
      }
    } else {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data } = await supabase
          .from("news")
          .select("id,original_url")
          .eq("id", newsId)
          .maybeSingle();

        if (!data || String(data.original_url) !== url) {
          return NextResponse.json({ ok: false, error: "등록된 뉴스와 URL이 일치하지 않습니다." }, { status: 403 });
        }
      }
    }
  }

  const result = await fetchArticleParagraphs(url);

  return NextResponse.json({
    ok: result.paragraphs.length > 0,
    paragraphs: result.paragraphs,
    error: result.error ?? null,
  });
}
