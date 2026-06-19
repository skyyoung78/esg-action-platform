import type { SearchQueryLog, SearchQueryType } from "@/lib/local-search-queries";

export type SearchTypeStat = {
  type: SearchQueryType;
  label: string;
  count: number;
  percent: number;
};

export type TopSearchQueryItem = {
  query: string;
  searchType: SearchQueryType;
  searchTypeLabel: string;
  count: number;
  lastSearchedAt: string;
};

export type RecentSearchQueryItem = {
  query: string;
  searchType: SearchQueryType;
  searchTypeLabel: string;
  context: string | null;
  resultCount: number | null;
  searchedAt: string;
};

export type SearchQueryStats = {
  totalSearches: number;
  uniqueQueries: number;
  typeStats: SearchTypeStat[];
  topQueries: TopSearchQueryItem[];
  topByType: Record<SearchQueryType, TopSearchQueryItem[]>;
  recentQueries: RecentSearchQueryItem[];
};

const SEARCH_TYPE_LABEL: Record<SearchQueryType, string> = {
  news: "ESG 뉴스 키워드",
  company_news: "기업별 뉴스",
  disclosure: "기업 공시",
};

const SEARCH_TYPE_ORDER: SearchQueryType[] = ["news", "company_news", "disclosure"];

function buildTopQueries(logs: SearchQueryLog[], limit: number): TopSearchQueryItem[] {
  const map = new Map<string, TopSearchQueryItem>();

  for (const log of logs) {
    const key = `${log.search_type}:${log.normalized_query}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        query: log.query,
        searchType: log.search_type,
        searchTypeLabel: SEARCH_TYPE_LABEL[log.search_type],
        count: 1,
        lastSearchedAt: log.searched_at,
      });
      continue;
    }

    existing.count += 1;
    if (log.query.length > existing.query.length) {
      existing.query = log.query;
    }
    if (new Date(log.searched_at).getTime() > new Date(existing.lastSearchedAt).getTime()) {
      existing.lastSearchedAt = log.searched_at;
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function buildSearchQueryStats(logs: SearchQueryLog[]): SearchQueryStats {
  const totalSearches = logs.length;
  const uniqueQueries = new Set(logs.map((log) => `${log.search_type}:${log.normalized_query}`)).size;

  const typeCounts: Record<SearchQueryType, number> = {
    news: 0,
    company_news: 0,
    disclosure: 0,
  };

  for (const log of logs) {
    typeCounts[log.search_type] += 1;
  }

  const typeStats = SEARCH_TYPE_ORDER.map((type) => ({
    type,
    label: SEARCH_TYPE_LABEL[type],
    count: typeCounts[type],
    percent: totalSearches > 0 ? Math.round((typeCounts[type] / totalSearches) * 100) : 0,
  }));

  const topQueries = buildTopQueries(logs, 15);
  const topByType = Object.fromEntries(
    SEARCH_TYPE_ORDER.map((type) => [
      type,
      buildTopQueries(
        logs.filter((log) => log.search_type === type),
        8,
      ),
    ]),
  ) as Record<SearchQueryType, TopSearchQueryItem[]>;

  const recentQueries = logs.slice(0, 12).map((log) => ({
    query: log.query,
    searchType: log.search_type,
    searchTypeLabel: SEARCH_TYPE_LABEL[log.search_type],
    context: log.context,
    resultCount: log.result_count,
    searchedAt: log.searched_at,
  }));

  return {
    totalSearches,
    uniqueQueries,
    typeStats,
    topQueries,
    topByType,
    recentQueries,
  };
}
