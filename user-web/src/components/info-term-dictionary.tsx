"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EsgPillar, InfoTerm, TermSourceId } from "@/lib/info-content";
import {
  dictionarySourceIds,
  getTermSourceUrl,
  pillarTabs,
  termSources,
} from "@/lib/info-content";

const pillarColor: Record<EsgPillar, string> = {
  E: "bg-green-100 text-green-700",
  S: "bg-blue-100 text-blue-700",
  G: "bg-purple-100 text-purple-700",
  공통: "bg-slate-100 text-slate-700",
};

const pillarLabel: Record<EsgPillar, string> = {
  E: "환경(E)",
  S: "사회(S)",
  G: "지배구조(G)",
  공통: "공통",
};

type PillarTab = (typeof pillarTabs)[number];

export default function InfoTermDictionary({ terms }: { terms: InfoTerm[] }) {
  const [query, setQuery] = useState("");
  const [activePillar, setActivePillar] = useState<PillarTab>("전체");
  const [activeSource, setActiveSource] = useState<TermSourceId | "전체">("전체");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    return terms
      .filter(
        (term) =>
          term.term.toLowerCase().includes(q) ||
          term.summary.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [terms, query]);

  const filtered = useMemo(() => {
    return terms.filter((term) => {
      const matchPillar =
        activePillar === "전체" ||
        term.pillar === activePillar ||
        term.pillar === "공통";
      const matchSource = activeSource === "전체" || term.sourceId === activeSource;
      const q = query.trim().toLowerCase();
      const matchQuery =
        q.length === 0 ||
        term.term.toLowerCase().includes(q) ||
        term.summary.toLowerCase().includes(q);
      return matchPillar && matchSource && matchQuery;
    });
  }, [terms, query, activePillar, activeSource]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!highlightTerm || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-term="${CSS.escape(highlightTerm)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = window.setTimeout(() => setHighlightTerm(null), 2000);
    return () => window.clearTimeout(timer);
  }, [highlightTerm, filtered]);

  function selectSuggestion(term: InfoTerm) {
    setQuery(term.term);
    setShowSuggestions(false);
    setHighlightTerm(term.term);
  }

  return (
    <div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 mb-2">카테고리 (E / S / G)</p>
        <div className="flex flex-wrap gap-2">
          {pillarTabs.map((pillar) => (
            <button
              key={pillar}
              type="button"
              onClick={() => setActivePillar(pillar)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                activePillar === pillar
                  ? "bg-[#085041] text-white border-[#085041]"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {pillar === "전체" ? "전체" : pillarLabel[pillar as EsgPillar]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 mb-2">출처 필터</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSource("전체")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              activeSource === "전체"
                ? "bg-[#085041] text-white border-[#085041]"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            전체
          </button>
          {dictionarySourceIds.map((sourceId) => {
            const source = termSources[sourceId];
            return (
              <button
                key={sourceId}
                type="button"
                onClick={() => setActiveSource(sourceId)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  activeSource === sourceId
                    ? "bg-[#085041] text-white border-[#085041]"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {source.tag}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={searchRef} className="relative mt-4">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="용어 검색 (실시간 자동완성)"
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          autoComplete="off"
        />

        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((term) => {
              const source = termSources[term.sourceId];
              return (
                <li key={term.term}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(term)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-[#111827]">{term.term}</span>
                    <span className="text-xs text-slate-500 shrink-0">{source.tag}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {filtered.length}개 용어 · 출처 태그를 클릭하면 해당 기관 공식 사이트로 이동합니다.
      </p>

      <ul ref={listRef} className="mt-4 space-y-3">
        {filtered.map((term) => {
          const source = termSources[term.sourceId];
          const isHighlighted = highlightTerm === term.term;

          return (
            <li
              key={term.term}
              data-term={term.term}
              className={`border rounded-lg p-4 transition-colors ${
                isHighlighted
                  ? "border-[#085041] bg-[#f0faf7]"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#111827]">{term.term}</p>
                <span className={`text-xs px-2 py-1 rounded ${pillarColor[term.pillar]}`}>
                  {pillarLabel[term.pillar]}
                </span>
                <a
                  href={getTermSourceUrl(term)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded bg-[#085041]/10 text-[#085041] font-medium hover:bg-[#085041]/20 transition-colors"
                  title={`${source.name} 공식 사이트`}
                >
                  {source.tag}
                </a>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{term.summary}</p>
              <a
                href={getTermSourceUrl(term)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-medium text-[#085041] hover:underline"
              >
                {source.name}에서 자세히 보기 →
              </a>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">검색 결과가 없습니다.</p>
      ) : null}
    </div>
  );
}
