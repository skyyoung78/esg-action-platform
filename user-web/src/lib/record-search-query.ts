import { appendSearchQueryLog, type SearchQueryType } from "@/lib/local-search-queries";

type RecordSearchQueryInput = {
  query: string;
  searchType: SearchQueryType;
  context?: string | null;
  resultCount?: number | null;
  userAgent?: string | null;
};

export function recordSearchQuery({
  query,
  searchType,
  context = null,
  resultCount = null,
  userAgent = null,
}: RecordSearchQueryInput) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (searchType === "news" && trimmed.length < 2) {
    return null;
  }

  return appendSearchQueryLog({
    query: trimmed,
    search_type: searchType,
    context,
    result_count: resultCount,
    user_agent: userAgent,
  });
}
