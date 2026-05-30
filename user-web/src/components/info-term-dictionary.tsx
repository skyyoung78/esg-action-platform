"use client";

import { useMemo, useState } from "react";
import type { InfoTerm } from "@/lib/info-content";
import { termCategories } from "@/lib/info-content";

const categoryColor: Record<InfoTerm["category"], string> = {
  핵심용어: "bg-slate-100 text-slate-700",
  E지표: "bg-green-100 text-green-700",
  S지표: "bg-blue-100 text-blue-700",
  G지표: "bg-purple-100 text-purple-700",
  공시프레임워크: "bg-orange-100 text-orange-700",
};

export default function InfoTermDictionary({ terms }: { terms: InfoTerm[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof termCategories)[number]>("전체");

  const filtered = useMemo(() => {
    return terms.filter((term) => {
      const matchCategory = activeCategory === "전체" || term.category === activeCategory;
      const matchQuery =
        query.trim().length === 0 ||
        term.term.toLowerCase().includes(query.toLowerCase()) ||
        term.summary.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [terms, query, activeCategory]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-4">
        {termCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              activeCategory === category
                ? "bg-[#085041] text-white border-[#085041]"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="용어 또는 설명 검색"
        className="mt-4 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
      />

      <ul className="mt-4 space-y-3">
        {filtered.map((term) => (
          <li key={term.term} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[#111827]">{term.term}</p>
              <span className={`text-xs px-2 py-1 rounded ${categoryColor[term.category]}`}>{term.category}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{term.summary}</p>
            <a
              href={term.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-medium text-[#085041] hover:underline"
            >
              자세히 보기
            </a>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? <p className="mt-4 text-sm text-slate-500">검색 결과가 없습니다.</p> : null}
    </div>
  );
}
