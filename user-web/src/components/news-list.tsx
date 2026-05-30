"use client";

import { useMemo, useState } from "react";
import {
  ESG_CATEGORY_BADGE_CLASS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import { normalizeExternalUrl } from "@/lib/url";

export type NewsItemView = {
  id: string;
  title: string;
  originalUrl: string;
  source?: string;
  searchText?: string;
  category?: EsgCategory | null;
};

const CATEGORY_FILTERS: Array<{ value: "all" | EsgCategory; label: string }> = [
  { value: "all", label: "전체" },
  { value: "E", label: "환경(E)" },
  { value: "S", label: "사회(S)" },
  { value: "G", label: "지배구조(G)" },
];

export default function NewsList({ items }: { items: NewsItemView[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | EsgCategory>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (!q) return true;

      const haystack = `${item.title} ${item.source ?? ""} ${item.searchText ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, categoryFilter]);

  return (
    <div>
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="키워드로 뉴스 검색 (예: 탄소중립, 사회공헌, 지배구조)"
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
                    ? "bg-[#085041] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-[#085041]/40"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          {query.trim() || categoryFilter !== "all"
            ? `${filtered.length}건 / 전체 ${items.length}건`
            : `전체 ${items.length}건`}
        </p>
      </div>

      {filtered.length > 0 ? (
        <ul className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {filtered.map((item) => {
            const articleUrl = normalizeExternalUrl(item.originalUrl);
            return (
              <li key={item.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {item.category ? (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
                    >
                      {ESG_CATEGORY_LABEL[item.category]}
                    </span>
                  ) : null}
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
                </div>
                {item.source ? <p className="text-xs text-slate-500 mt-1">{item.source}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6 text-center">
          {query.trim()
            ? `'${query.trim()}'에 해당하는 뉴스가 없습니다.`
            : "선택한 카테고리에 해당하는 뉴스가 없습니다."}
        </p>
      )}
    </div>
  );
}
