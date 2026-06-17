"use client";

import { useState } from "react";
import NewsCompanySearch from "@/components/news-company-search";
import NewsList, { type NewsItemView } from "@/components/news-list";
import type { NewsWeekGroup } from "@/lib/news-week";

const tabs = [
  { id: "recent", label: "최근 뉴스" },
  { id: "company", label: "기업별 분석" },
] as const;

type TabId = (typeof tabs)[number]["id"];

type NewsTabsProps = {
  weeks: NewsWeekGroup<NewsItemView>[];
  recentPeriodLabel?: string;
  emptyMessage?: string;
};

export default function NewsTabs({ weeks, recentPeriodLabel, emptyMessage }: NewsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("recent");

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#085041] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:border-[#085041]/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "recent" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">최근 7일 ESG 뉴스</h2>
          <p className="text-sm text-slate-600 mt-1">
            접속일 기준 최근 7일 E/S/G 뉴스를 주간별로 보여줍니다. 키워드 검색 시 2026.6.1 이후 저장된 전체 기사에서도
            찾을 수 있습니다.
          </p>
          <div className="mt-5">
            <NewsList weeks={weeks} recentPeriodLabel={recentPeriodLabel} emptyMessage={emptyMessage} />
          </div>
        </section>
      ) : null}

      {activeTab === "company" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">기업별 뉴스 · 취업 준비</h2>
          <p className="text-sm text-slate-600 mt-1">
            지원 기업을 검색하면 최근 2년 전체 뉴스를 분석하고, ESG 이슈를 중심으로 자소서·면접 대시보드를 제공합니다.
          </p>
          <div className="mt-5">
            <NewsCompanySearch embedded />
          </div>
        </section>
      ) : null}
    </div>
  );
}
