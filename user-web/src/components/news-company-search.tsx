"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsItemView } from "@/components/news-list";
import {
  ESG_CATEGORY_BADGE_CLASS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import type { CompanyNewsDashboard } from "@/lib/company-news-dashboard";

type Suggestion = {
  name: string;
  stockCode: string;
  orgType: string;
  orgTypeLabel: string;
};

type CompanyNewsResponse = {
  ok: boolean;
  companyName: string;
  articles: NewsItemView[];
  dashboard: CompanyNewsDashboard;
  error?: string;
};

const BAR_TONE: Record<EsgCategory, string> = {
  E: "bg-green-500",
  S: "bg-blue-500",
  G: "bg-purple-500",
};

function formatDate(publishedAt?: string): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

type NewsCompanySearchProps = {
  embedded?: boolean;
};

export default function NewsCompanySearch({ embedded = false }: NewsCompanySearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyNewsResponse | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { companies: Suggestion[] };
        setSuggestions(data.companies ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  const searchCompany = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    setQuery(trimmed);

    try {
      const response = await fetch(`/api/news/company?name=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as CompanyNewsResponse;

      if (!response.ok || !data.ok) {
        setResult(null);
        setError(data.error ?? "기업 뉴스를 불러오지 못했습니다.");
        return;
      }

      setResult(data);
    } catch {
      setResult(null);
      setError("기업 뉴스 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const dashboard = result?.dashboard;
  const articles = result?.articles ?? [];

  const Wrapper = embedded ? "div" : "section";
  const wrapperClass = embedded ? "" : "mb-6 rounded-xl border border-[#085041]/20 bg-white p-4 md:p-5 shadow-sm";

  return (
    <Wrapper className={wrapperClass}>
      {!embedded ? (
        <>
          <h2 className="font-semibold text-lg text-[#111827]">기업별 뉴스 · 취업 준비 대시보드</h2>
          <p className="text-sm text-slate-600 mt-1">
            지원 기업을 검색하면 최근 2년 전체 뉴스를 분석하고, ESG 이슈를 중심으로 자소서·면접 가이드를 정리해 드립니다.
          </p>
        </>
      ) : null}

      <div ref={searchRef} className={`relative max-w-xl ${embedded ? "" : "mt-4"}`}>
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                searchCompany(query);
              }
            }}
            placeholder="기업명 검색 (예: 삼성전자, SK하이닉스)"
            className="flex-1 border border-slate-200 rounded-md px-3 py-2.5 text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => searchCompany(query)}
            disabled={loading || query.trim().length < 2}
            className="rounded-md bg-[#085041] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#064535] disabled:opacity-50 transition-colors"
          >
            {loading ? "2년치 분석 중…" : "검색"}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={`${item.name}-${item.stockCode}`}>
                <button
                  type="button"
                  onClick={() => searchCompany(item.name)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{item.orgTypeLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {dashboard ? (
        <div className={`space-y-5 ${embedded ? "mt-5" : "mt-5 border-t border-slate-100 pt-5"}`}>
          <div className="rounded-xl border border-[#085041]/15 bg-gradient-to-br from-[#085041]/5 to-[#1D9E75]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#085041]">
              {dashboard.companyName} · {dashboard.periodLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              전체 {dashboard.totalArticles}건 · ESG 관련 {dashboard.esgArticleCount}건 · 일반{" "}
              {dashboard.generalArticleCount}건
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{dashboard.overview}</p>
            {dashboard.hotCategoryLabel ? (
              <p className="mt-2 text-sm font-medium text-[#085041]">
                핵심 영역: {dashboard.hotCategoryLabel}
                {dashboard.keyThemes.length > 0 ? ` · 키워드: ${dashboard.keyThemes.join(", ")}` : ""}
              </p>
            ) : null}
            {dashboard.trendInsight ? (
              <p className="mt-2 text-sm text-slate-600">{dashboard.trendInsight}</p>
            ) : null}
          </div>

          {dashboard.totalArticles > 0 ? (
            <>
              {dashboard.yearlyStats.length > 0 ? (
                <div className="rounded-lg border border-slate-100 p-4">
                  <h4 className="text-sm font-semibold text-[#111827] mb-3">연도별 뉴스 보도량</h4>
                  <div className="flex flex-wrap gap-3">
                    {dashboard.yearlyStats.map((stat) => (
                      <div
                        key={stat.year}
                        className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 min-w-[88px] text-center"
                      >
                        <p className="text-xs text-slate-500">{stat.year}년</p>
                        <p className="text-lg font-bold text-[#085041]">{stat.count}</p>
                        <p className="text-xs text-slate-400">건</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h4 className="text-sm font-semibold text-[#111827] mb-3">ESG 영역별 분포 (ESG 관련 기사 기준)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dashboard.categoryStats.map((stat) => (
                  <div key={stat.category} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{stat.label}</span>
                      <span className="text-slate-500">
                        {stat.count}건 · {stat.percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_TONE[stat.category]}`}
                        style={{ width: `${Math.max(stat.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <h3 className="font-semibold text-[#085041] text-sm">자소서 작성 가이드</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{dashboard.resumeGuide.hook}</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
                    {dashboard.resumeGuide.bullets.map((tip) => (
                      <li key={tip} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">
                    추천 키워드: {dashboard.resumeGuide.keywords.join(", ")}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <h3 className="font-semibold text-[#085041] text-sm">면접 준비 가이드</h3>
                  <p className="mt-2 text-xs font-medium text-slate-500">회사 이해 포인트</p>
                  <ul className="mt-1 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {dashboard.interviewGuide.knowAboutCompany.map((tip) => (
                      <li key={tip} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-medium text-slate-500">예상 질문</p>
                  <ol className="mt-1 space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
                    {dashboard.interviewGuide.expectedQuestions.map((q) => (
                      <li key={q} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs font-medium text-slate-500">면접관에게 물어볼 질문</p>
                  <ul className="mt-1 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {dashboard.interviewGuide.questionsToAsk.map((q) => (
                      <li key={q} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#111827] mb-3">
                  {dashboard.companyName} 관련 뉴스 {articles.length}건
                </h3>
                <ul className="space-y-2">
                  {articles.slice(0, 12).map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-slate-100 p-3 hover:border-[#085041]/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {item.category ? (
                          <span
                            className={`text-xs rounded-full px-2 py-0.5 ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
                          >
                            {ESG_CATEGORY_LABEL[item.category]}
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400">{formatDate(item.publishedAt)}</span>
                      </div>
                      <Link
                        href={`/news/${encodeURIComponent(item.id)}`}
                        className="text-sm font-medium hover:text-[#085041] hover:underline"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </Wrapper>
  );
}
