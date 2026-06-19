import { NextResponse } from "next/server";
import { buildCompanyNewsDashboard } from "@/lib/company-news-dashboard";
import { searchCompanyNews } from "@/lib/company-news-search";
import { recordSearchQuery } from "@/lib/record-search-query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() ?? "";

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "기업명을 2글자 이상 입력해 주세요." }, { status: 400 });
  }

  const articles = await searchCompanyNews(name);
  const dashboard = buildCompanyNewsDashboard(name, articles);

  recordSearchQuery({
    query: name,
    searchType: "company_news",
    resultCount: articles.length,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    companyName: name,
    articles,
    dashboard,
  });
}
