"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NewsOutlinkButton from "@/components/news-outlink-button";
import {
  ESG_CATEGORY_BADGE_CLASS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import { getSummarySentence } from "@/lib/news-summary";
import type { NewsWeekGroup } from "@/lib/news-week";
import { normalizeExternalUrl } from "@/lib/url";

export type NewsItemView = {
  id: string;
  title: string;
  originalUrl: string;
  source?: string;
  searchText?: string;
  category?: EsgCategory | null;
  publishedAt?: string;
  summaryLines?: string[];
  originalSnippet?: string;
  studentTrendSummary?: string;
};

const CATEGORY_FILTERS: Array<{ value: "all" | EsgCategory; label: string }> = [
  { value: "all", label: "전체" },
  { value: "E", label: "환경(E)" },
  { value: "S", label: "사회(S)" },
  { value: "G", label: "지배구조(G)" },
];

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];

type NewsListProps = {
  weeks: NewsWeekGroup<NewsItemView>[];
  recentPeriodLabel?: string;
  emptyMessage?: string;
};

function formatPublishedDate(publishedAt?: string): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsArticleCard({ item }: { item: NewsItemView }) {
  const articleUrl = normalizeExternalUrl(item.originalUrl);
  const publishedLabel = formatPublishedDate(item.publishedAt);
  const preview = item.summaryLines?.length
    ? getSummarySentence(item.summaryLines, {
        title: item.title,
        body: item.originalSnippet ?? item.searchText,
        publishedAt: item.publishedAt,
      })
    : item.originalSnippet ?? item.searchText ?? "";

  return (
    <article className="border border-slate-100 rounded-lg bg-white p-4 hover:border-[#085041]/30 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {item.category ? (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
          >
            {ESG_CATEGORY_LABEL[item.category]}
          </span>
        ) : null}
        {publishedLabel ? <span className="text-xs text-slate-400">{publishedLabel}</span> : null}
        {item.source ? <span className="text-xs text-slate-400">· {item.source}</span> : null}
      </div>

      <Link
        href={`/news/${encodeURIComponent(item.id)}`}
        className="font-medium text-[#111827] leading-snug hover:text-[#085041] hover:underline block"
      >
        {item.title}
      </Link>

      {preview ? (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{preview}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/news/${encodeURIComponent(item.id)}`}
          className="inline-flex items-center gap-1 rounded-md bg-[#085041] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#064535] transition-colors"
        >
          원문·요약·트렌드 보기 →
        </Link>
        {articleUrl ? (
          <NewsOutlinkButton
            newsId={item.id}
            href={articleUrl}
            title={item.title}
            category={item.category ?? undefined}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#085041]/40 transition-colors"
          >
            언론사 원문 열기 ↗
          </NewsOutlinkButton>
        ) : null}
      </div>
    </article>
  );
}

function NewsArticleList({ items }: { items: NewsItemView[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <NewsArticleCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function NewsList({ weeks, recentPeriodLabel, emptyMessage }: NewsListProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | EsgCategory>("all");
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]?.weekStart ?? "");
  const [searchResults, setSearchResults] = useState<NewsItemView[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isSearchMode = query.trim().length > 0;

  useEffect(() => {
    if (!weeks.some((week) => week.weekStart === selectedWeek)) {
      setSelectedWeek(weeks[0]?.weekStart ?? "");
    }
  }, [weeks, selectedWeek]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({ q, category: categoryFilter });
        const response = await fetch(`/api/news/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "검색에 실패했습니다.");
        }

        setSearchResults(Array.isArray(payload.items) ? payload.items : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSearchResults([]);
        setSearchError(error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, categoryFilter]);

  const activeWeek = weeks.find((week) => week.weekStart === selectedWeek) ?? weeks[0];
  const browseItems = activeWeek?.items ?? [];
  const items = isSearchMode ? searchResults : browseItems;

  const filtered = useMemo(() => {
    if (isSearchMode) return items;

    return items.filter((item) => categoryFilter === "all" || item.category === categoryFilter);
  }, [items, categoryFilter, isSearchMode]);

  const groupedByCategory = useMemo(() => {
    if (categoryFilter !== "all" || isSearchMode) return null;

    const groups = CATEGORY_ORDER.map((category) => ({
      category,
      label: ESG_CATEGORY_LABEL[category],
      items: filtered.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);

    const uncategorized = filtered.filter(
      (item) => !item.category || !CATEGORY_ORDER.includes(item.category),
    );
    if (uncategorized.length > 0) {
      groups.push({
        category: "E",
        label: "기타",
        items: uncategorized,
      });
    }

    return groups;
  }, [categoryFilter, filtered, isSearchMode]);

  if (weeks.length === 0) {
    return (
      <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6 text-center">
        {emptyMessage ?? "표시할 주간 뉴스가 없습니다."}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 space-y-3">
        {!isSearchMode ? (
          <div className="flex flex-wrap gap-2">
            {weeks.map((week) => {
              const active = selectedWeek === week.weekStart;
              return (
                <button
                  key={week.weekStart}
                  type="button"
                  onClick={() => setSelectedWeek(week.weekStart)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#085041] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-[#085041]/40"
                  }`}
                >
                  {week.label}
                  <span className="ml-1 opacity-80">({week.items.length})</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#085041] bg-[#085041]/5 border border-[#085041]/15 rounded-md px-3 py-2">
            2026.6.1 이후 저장된 전체 기사에서 검색합니다. 검색어를 지우면 최근 7일 목록으로 돌아갑니다.
          </p>
        )}

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="키워드 검색 — 저장된 전체 기사 포함 (예: 탄소중립, 사회공헌)"
          className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white"
          autoComplete="off"
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => {
            const active = categoryFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategoryFilter(filter.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          {isSearchMode
            ? searchLoading
              ? "저장된 전체 기사에서 검색 중..."
              : searchError
                ? searchError
                : `검색 결과 ${filtered.length}건`
            : `${recentPeriodLabel ?? activeWeek?.label ?? "최근 7일"} · ${
                categoryFilter !== "all" ? `${filtered.length}건 / ${browseItems.length}건` : `${browseItems.length}건`
              }`}
          {" · "}제목 또는 버튼을 눌러 원문·요약·트렌드를 확인하세요.
        </p>
      </div>

      {searchLoading ? (
        <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6 text-center">
          저장된 뉴스 기사에서 검색하고 있습니다...
        </p>
      ) : filtered.length > 0 ? (
        categoryFilter === "all" && groupedByCategory ? (
          <div className="space-y-6">
            {groupedByCategory.map((group) => (
              <section key={group.category}>
                <h2
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold mb-3 ${ESG_CATEGORY_BADGE_CLASS[group.category]}`}
                >
                  {group.label}
                  <span className="ml-2 font-normal opacity-80">{group.items.length}건</span>
                </h2>
                <NewsArticleList items={group.items} />
              </section>
            ))}
          </div>
        ) : (
          <NewsArticleList items={filtered} />
        )
      ) : (
        <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6 text-center">
          {query.trim()
            ? `'${query.trim()}'에 해당하는 뉴스가 저장된 전체 기사에서 없습니다.`
            : "선택한 기간·카테고리에 해당하는 뉴스가 없습니다."}
        </p>
      )}
    </div>
  );
}
