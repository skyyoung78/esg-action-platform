import { classifyEsgCategory, isEsgRelatedNews } from "@/lib/esg-news-filter";
import { fetchRecentNews } from "@/lib/live-news";
import { findLocalNewsById, findLocalNewsByUrl } from "@/lib/local-news-store";
import { newsItems } from "@/lib/mock-data";
import { buildStudentTrendSummary, buildTemplateSummary } from "@/lib/news-summary";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripHtmlToText } from "@/lib/text-sanitize";
import type { EsgCategory } from "@/lib/esg-news-filter";

export type NewsDetail = {
  id: string;
  title: string;
  originalUrl: string;
  source: string;
  publishedAt: string;
  category: EsgCategory;
  summaryLines: string[];
  originalBody: string;
  originalSnippet: string;
  studentTrendSummary: string;
};

function summaryToLines(summary: unknown): string[] {
  if (!Array.isArray(summary)) return [];
  return summary.map((line) => String(line ?? "").trim()).filter(Boolean);
}

function summaryToText(summary: unknown): string {
  if (Array.isArray(summary)) {
    return summary.map((line) => String(line ?? "")).join(" ");
  }
  return String(summary ?? "");
}

function cleanText(input: string): string {
  return stripHtmlToText(input);
}

function storedToDetail(row: {
  id: string;
  title: string;
  original_url: string;
  source: string;
  published_at: string;
  original_body: string;
  summary: [string, string, string];
  student_trend_summary: string;
  esg_category: EsgCategory;
  original_snippet: string;
}): NewsDetail {
  return {
    id: row.id,
    title: cleanText(row.title),
    originalUrl: row.original_url,
    source: row.source,
    publishedAt: row.published_at,
    category: row.esg_category,
    summaryLines: row.summary.map((line) => cleanText(line)).filter(Boolean),
    originalBody: cleanText(row.original_body),
    originalSnippet: cleanText(row.original_snippet || row.original_body).slice(0, 500),
    studentTrendSummary: cleanText(row.student_trend_summary),
  };
}

function rowToDetail(row: Record<string, unknown>): NewsDetail | null {
  const title = String(row.title ?? "");
  const summaryText = summaryToText(row.summary);
  const originalBody = String(row.original_body ?? row.original_snippet ?? summaryText);
  const originalSnippet = String(row.original_snippet ?? originalBody);
  const studentTrendSummary = String(
    row.student_trend_summary ?? buildStudentTrendSummary(title, originalBody),
  );

  if (!isEsgRelatedNews(title, originalBody || originalSnippet)) {
    return null;
  }

  const cat = String(row.esg_category ?? "");
  const category: EsgCategory =
    cat === "E" || cat === "S" || cat === "G"
      ? cat
      : (classifyEsgCategory(title, originalBody || originalSnippet) ?? "E");

  return {
    id: String(row.id),
    title,
    originalUrl: String(row.original_url ?? ""),
    source: String(row.source ?? ""),
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    category,
    summaryLines: summaryToLines(row.summary),
    originalBody,
    originalSnippet,
    studentTrendSummary,
  };
}

function mockToDetail(id: string): NewsDetail | null {
  const item = newsItems.find((row) => row.id === id);
  if (!item) return null;

  const originalBody = item.originalBody ?? item.summary.join("\n\n");

  return {
    id: item.id,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    publishedAt: new Date().toISOString(),
    category: item.category,
    summaryLines: [...item.summary],
    originalBody,
    originalSnippet: originalBody,
    studentTrendSummary:
      item.studentTrendSummary ?? buildStudentTrendSummary(item.title, originalBody),
  };
}

async function liveToDetail(id: string): Promise<NewsDetail | null> {
  if (!id.startsWith("live:")) return null;

  let originalUrl = "";
  try {
    originalUrl = decodeURIComponent(id.slice(5));
  } catch {
    return null;
  }

  const recent = await fetchRecentNews();
  const item = recent.find((row) => row.originalUrl === originalUrl);
  if (!item) return null;

  const summaryLines = [...buildTemplateSummary(item.title, item.snippet)];

  return {
    id,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    publishedAt: item.publishedAt,
    category: classifyEsgCategory(item.title, item.snippet) ?? "E",
    summaryLines,
    originalBody: item.snippet,
    originalSnippet: item.snippet,
    studentTrendSummary: buildStudentTrendSummary(item.title, item.snippet),
  };
}

export async function getNewsDetailById(id: string): Promise<NewsDetail | null> {
  const decodedId = decodeURIComponent(id);
  const local = findLocalNewsById(decodedId);
  if (local) {
    return storedToDetail(local);
  }

  if (decodedId.startsWith("live:")) {
    const liveDetail = await liveToDetail(decodedId);
    if (liveDetail) {
      const byUrl = findLocalNewsByUrl(liveDetail.originalUrl);
      if (byUrl) return storedToDetail(byUrl);
    }
    return liveDetail;
  }

  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select(
        "id,title,original_url,source,published_at,summary,esg_category,original_snippet,original_body,student_trend_summary",
      )
      .eq("id", decodedId)
      .maybeSingle();

    if (data) {
      return rowToDetail(data as Record<string, unknown>);
    }
  }

  return mockToDetail(decodedId);
}
