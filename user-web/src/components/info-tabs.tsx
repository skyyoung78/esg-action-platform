"use client";

import { useState } from "react";
import type { NewsItemView } from "@/components/news-list";
import InfoCompanySearch from "@/components/info-company-search";
import InfoEsgOverview from "@/components/info-esg-overview";
import InfoResourceList from "@/components/info-resource-list";
import InfoTermDictionary from "@/components/info-term-dictionary";
import {
  careerResources,
  disclosureResources,
  esgTerms,
  guidelineResources,
} from "@/lib/info-content";

const tabs = [
  { id: "overview", label: "ESG 종합" },
  { id: "disclosure", label: "기업 공시·평가" },
  { id: "dictionary", label: "용어 사전" },
  { id: "career", label: "직무·취업" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InfoTabs({ featuredArticles }: { featuredArticles: NewsItemView[] }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === tab.id ? "bg-[#085041] text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">ESG 종합 · 주요 기사</h2>
          <p className="text-sm text-slate-600 mt-1">
            최근 7일 ESG 뉴스를 원문 → 핵심 요약 → 대학생 맞춤 트렌드 요약 순서로 제공합니다.
          </p>
          <div className="mt-5">
            <InfoEsgOverview articles={featuredArticles} />
          </div>
        </section>
      ) : null}

      {activeTab === "disclosure" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">ESG 기업 공시 및 평가지표</h2>
          <p className="text-sm text-slate-600 mt-1">
            KRX·KCGS·DART 등 공식 기관 자료와 함께, 상장사·공기업·공공기관명을 검색해 ESG 등급·공시 목록을 확인할 수 있습니다.
          </p>
          <InfoCompanySearch />
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="font-semibold">공식 정보 출처</h3>
            <p className="text-sm text-slate-600 mt-1">아래 기관 사이트에서 원문·통계를 확인할 수 있습니다.</p>
            <InfoResourceList items={disclosureResources} />
          </div>
        </section>
      ) : null}

      {activeTab === "dictionary" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">ESG 용어 사전</h2>
          <p className="text-sm text-slate-600 mt-1">
            한국ESG연구소·KCGS·한국신용평가·금융위원회·KCMI·UNGC 등 공식 자료 기준으로 정리한 핵심 용어입니다. E/S/G 카테고리·출처 필터·자동완성 검색을 지원하며, 출처 태그 클릭 시 해당 기관 사이트로 이동합니다.
          </p>
          <InfoTermDictionary terms={esgTerms} />
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="font-semibold">가이드라인 원문 자료</h3>
            <p className="text-sm text-slate-600 mt-1">용어 해설과 함께 참고할 공식 가이드라인 사이트입니다.</p>
            <InfoResourceList items={guidelineResources} />
          </div>
        </section>
      ) : null}

      {activeTab === "career" ? (
        <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-lg">ESG 직무 가이드 및 취업 정보</h2>
          <p className="text-sm text-slate-600 mt-1">
            ESG 시장 트렌드와 대학생 커리어 프로그램 정보를 제공하는 공식 자료입니다.
          </p>
          <InfoResourceList items={careerResources} />
        </section>
      ) : null}
    </div>
  );
}
