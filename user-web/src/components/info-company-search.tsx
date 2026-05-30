"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompanyDisclosureResult } from "@/lib/company-disclosure";

type Suggestion = {
  name: string;
  stockCode: string;
  orgType: "listed" | "public-enterprise" | "public-institution";
  orgTypeLabel: string;
};

const orgTypeBadgeClass: Record<Suggestion["orgType"], string> = {
  listed: "bg-slate-100 text-slate-600",
  "public-enterprise": "bg-blue-100 text-blue-700",
  "public-institution": "bg-teal-100 text-teal-700",
};

export default function InfoCompanySearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyDisclosureResult | null>(null);
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

  const loadCompany = useCallback(async (name: string, stockCode?: string) => {
    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const params = new URLSearchParams({ name });
      if (stockCode) params.set("stockCode", stockCode);

      const response = await fetch(`/api/companies/disclosure?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setResult(null);
        setError(data.error ?? "기업 정보를 불러오지 못했습니다.");
        return;
      }

      setResult(data as CompanyDisclosureResult);
      setQuery(name);
    } catch {
      setResult(null);
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const exact = suggestions.find((s) => s.name === trimmed);
    if (exact) {
      void loadCompany(exact.name, exact.stockCode);
      return;
    }

    if (suggestions.length > 0) {
      void loadCompany(suggestions[0].name, suggestions[0].stockCode);
      return;
    }

    void loadCompany(trimmed);
  }

  const hasGradeScores =
    result?.grade &&
    (result.grade.eScore != null ||
      result.grade.sScore != null ||
      result.grade.gScore != null ||
      result.grade.overallGrade);

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <h3 className="font-semibold text-[#111827]">기업 ESG 공시 검색</h3>
      <p className="text-sm text-slate-600 mt-1">
        상장사·공기업·공공기관명을 검색하면 ESG 등급·점수와 DART 지속가능·경영공시 목록을 확인할 수 있습니다.
      </p>

      <div ref={searchRef} className="relative mt-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="예: 삼성전자, 한국철도공사, 국민건강보험공단"
            className="flex-1 border border-slate-200 rounded-md px-3 py-2.5 text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 1}
            className="rounded-md bg-[#085041] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#064036] disabled:opacity-50"
          >
            {loading ? "조회 중…" : "조회"}
          </button>
        </form>

        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full sm:max-w-[calc(100%-6rem)] bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={`${item.orgType}-${item.name}`}>
                <button
                  type="button"
                  onClick={() => void loadCompany(item.name, item.stockCode || undefined)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-[#111827]">{item.name}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${orgTypeBadgeClass[item.orgType]}`}
                    >
                      {item.orgTypeLabel}
                    </span>
                    {item.stockCode ? (
                      <span className="text-xs text-slate-500">{item.stockCode}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-[#111827]">{result.company.corpName}</h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                orgTypeBadgeClass[result.company.orgType]
              }`}
            >
              {result.company.orgTypeLabel}
            </span>
            {result.company.stockCode ? (
              <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                {result.company.stockCode}
              </span>
            ) : null}
            {result.dataSource === "demo" ? (
              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">샘플 데이터</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">DART 연동</span>
            )}
          </div>

          {result.notice ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              {result.notice}
            </p>
          ) : null}

          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-[#111827]">ESG 평가·등급</p>
            {hasGradeScores ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {result.grade?.overallGrade ? (
                  <div className="rounded-lg bg-[#085041]/5 p-3 text-center">
                    <p className="text-xs text-slate-500">종합 등급</p>
                    <p className="text-xl font-bold text-[#085041] mt-1">{result.grade.overallGrade}</p>
                  </div>
                ) : null}
                {result.grade?.eScore != null ? (
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-xs text-slate-500">E (환경)</p>
                    <p className="text-lg font-semibold text-green-700 mt-1">{result.grade.eScore}</p>
                  </div>
                ) : null}
                {result.grade?.sScore != null ? (
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs text-slate-500">S (사회)</p>
                    <p className="text-lg font-semibold text-blue-700 mt-1">{result.grade.sScore}</p>
                  </div>
                ) : null}
                {result.grade?.gScore != null ? (
                  <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <p className="text-xs text-slate-500">G (지배구조)</p>
                    <p className="text-lg font-semibold text-purple-700 mt-1">{result.grade.gScore}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                등록된 ESG 등급 데이터가 없습니다.{" "}
                <a
                  href="https://esg.krx.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#085041] hover:underline"
                >
                  KRX ESG포털
                </a>
                에서 확인해 보세요.
              </p>
            )}
            {result.grade?.asOfDate ? (
              <p className="mt-2 text-xs text-slate-500">기준일: {result.grade.asOfDate}</p>
            ) : null}
            {result.grade?.sourceUrl ? (
              <a
                href={result.grade.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-medium text-[#085041] hover:underline"
              >
                등급 출처 확인 →
              </a>
            ) : null}
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-[#111827]">
              ESG·지속가능 관련 공시 ({result.disclosures.length}건)
            </p>
            {result.disclosures.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {result.disclosures.map((item) => (
                  <li
                    key={`${item.submittedAt}-${item.title}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-slate-100 rounded-md p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.submittedAt} · {item.category}
                      </p>
                    </div>
                    <a
                      href={item.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-medium text-[#085041] hover:underline"
                    >
                      공시 원문 →
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                최근 3년간 관련 공시가 조회되지 않았습니다. DART에서 직접 검색해 보세요.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {result.externalLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:border-[#085041] hover:text-[#085041]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
