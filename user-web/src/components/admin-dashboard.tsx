"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type TopVolunteer = {
  volunteerId: string;
  title: string;
  count: number;
};

type AdminStats = {
  totalClicks: number;
  registeredCount: number;
  activeCount: number;
  topVolunteers: TopVolunteer[];
};

type NewsCategoryClickStat = {
  category: "E" | "S" | "G";
  label: string;
  count: number;
  percent: number;
};

type TopNewsClickItem = {
  newsId: string;
  title: string;
  category: "E" | "S" | "G";
  count: number;
  detailCount: number;
  outlinkCount: number;
};

type NewsClickStats = {
  totalClicks: number;
  detailClicks: number;
  outlinkClicks: number;
  categoryStats: NewsCategoryClickStat[];
  topArticles: TopNewsClickItem[];
};

type SearchTypeStat = {
  type: "news" | "company_news" | "disclosure";
  label: string;
  count: number;
  percent: number;
};

type TopSearchQueryItem = {
  query: string;
  searchType: "news" | "company_news" | "disclosure";
  searchTypeLabel: string;
  count: number;
  lastSearchedAt: string;
};

type RecentSearchQueryItem = {
  query: string;
  searchType: "news" | "company_news" | "disclosure";
  searchTypeLabel: string;
  context: string | null;
  resultCount: number | null;
  searchedAt: string;
};

type SearchQueryStats = {
  totalSearches: number;
  uniqueQueries: number;
  typeStats: SearchTypeStat[];
  topQueries: TopSearchQueryItem[];
  topByType: Record<"news" | "company_news" | "disclosure", TopSearchQueryItem[]>;
  recentQueries: RecentSearchQueryItem[];
};

type AdminVolunteer = {
  id: string;
  title: string;
  esg_category: "E" | "S";
  hours: string;
  location: string;
  capacity: string;
  benefit: string;
  description: string;
  image_url: string | null;
  target_outlink_url: string;
  is_1365: boolean;
  deleted_at: string | null;
  created_at: string;
};

const NEWS_BAR_TONE: Record<"E" | "S" | "G", string> = {
  E: "bg-green-500",
  S: "bg-blue-500",
  G: "bg-purple-500",
};

const tabs = [
  { id: "stats", label: "봉사 통계" },
  { id: "news-stats", label: "뉴스 통계" },
  { id: "search-stats", label: "검색 통계" },
  { id: "create", label: "봉사 등록" },
  { id: "manage", label: "공고 관리" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const emptyForm = {
  title: "",
  esg_category: "E" as "E" | "S",
  hours: "",
  location: "",
  capacity: "",
  benefit: "",
  description: "",
  image_url: "",
  target_outlink_url: "",
  is_1365: false,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [newsStats, setNewsStats] = useState<NewsClickStats | null>(null);
  const [searchStats, setSearchStats] = useState<SearchQueryStats | null>(null);
  const [volunteers, setVolunteers] = useState<AdminVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, volunteersRes, newsStatsRes, searchStatsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/volunteers"),
        fetch("/api/admin/news-stats"),
        fetch("/api/admin/search-stats"),
      ]);

      if (
        statsRes.status === 401 ||
        volunteersRes.status === 401 ||
        newsStatsRes.status === 401 ||
        searchStatsRes.status === 401
      ) {
        router.push("/admin");
        return;
      }

      const statsPayload = await statsRes.json();
      const volunteersPayload = await volunteersRes.json();
      const newsStatsPayload = await newsStatsRes.json();
      const searchStatsPayload = await searchStatsRes.json();

      if (!statsPayload.ok) throw new Error(statsPayload.error ?? "통계를 불러오지 못했습니다.");
      if (!volunteersPayload.ok) throw new Error(volunteersPayload.error ?? "공고 목록을 불러오지 못했습니다.");
      if (!newsStatsPayload.ok) throw new Error(newsStatsPayload.error ?? "뉴스 통계를 불러오지 못했습니다.");
      if (!searchStatsPayload.ok) throw new Error(searchStatsPayload.error ?? "검색 통계를 불러오지 못했습니다.");

      setStats(statsPayload.stats);
      setNewsStats(newsStatsPayload.stats);
      setSearchStats(searchStatsPayload.stats);
      setVolunteers(volunteersPayload.volunteers ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "대시보드 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "등록에 실패했습니다.");
      }

      setForm(emptyForm);
      setMessage("봉사 공고가 등록되었습니다.");
      setActiveTab("manage");
      await loadDashboard();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSoftDelete(id: string, title: string) {
    if (!window.confirm(`"${title}" 공고를 삭제(비활성) 처리할까요?`)) return;

    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/volunteers/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "삭제에 실패했습니다.");
      }

      setMessage("공고가 soft delete 처리되었습니다.");
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  const maxTopCount = Math.max(...(stats?.topVolunteers.map((item) => item.count) ?? [1]), 1);
  const maxNewsTopCount = Math.max(...(newsStats?.topArticles.map((item) => item.count) ?? [1]), 1);
  const maxNewsCategoryCount = Math.max(...(newsStats?.categoryStats.map((item) => item.count) ?? [1]), 1);
  const maxSearchTopCount = Math.max(...(searchStats?.topQueries.map((item) => item.count) ?? [1]), 1);
  const maxSearchTypeCount = Math.max(...(searchStats?.typeStats.map((item) => item.count) ?? [1]), 1);

  function formatSearchDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">관리자 대시보드</h1>
            <p className="text-sm text-slate-600 mt-1">봉사 공고 등록·관리와 봉사·뉴스·검색 통계를 확인합니다.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#085041] text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-[#085041]/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6">불러오는 중...</p>
        ) : null}

        {!loading && activeTab === "news-stats" && newsStats ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">총 뉴스 클릭</p>
                <p className="text-3xl font-bold mt-1 text-[#085041]">{newsStats.totalClicks}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">상세 조회</p>
                <p className="text-3xl font-bold mt-1">{newsStats.detailClicks}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">원문 링크 클릭</p>
                <p className="text-3xl font-bold mt-1">{newsStats.outlinkClicks}</p>
              </article>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h2 className="font-semibold text-lg">E / S / G 클릭 비중</h2>
                <p className="text-sm text-slate-500 mt-1">ESG 분류별 기사 클릭 통계</p>
                {newsStats.categoryStats.some((item) => item.count > 0) ? (
                  <div className="mt-4 space-y-3">
                    {newsStats.categoryStats.map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-slate-800">{item.label}</span>
                          <span className="text-slate-500">
                            {item.count}회 · {item.percent}%
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${NEWS_BAR_TONE[item.category]}`}
                            style={{
                              width: `${Math.max((item.count / maxNewsCategoryCount) * 100, item.count > 0 ? 6 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">아직 뉴스 클릭 로그가 없습니다.</p>
                )}
              </article>

              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h2 className="font-semibold text-lg">클릭 유형 안내</h2>
                <p className="text-sm text-slate-500 mt-1">수집되는 클릭 이벤트</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-[#085041]">상세 조회</span>
                    <p className="mt-1 text-slate-600">뉴스 상세 페이지(`/news/[id]`) 진입 시 기록</p>
                  </li>
                  <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-[#085041]">원문 링크</span>
                    <p className="mt-1 text-slate-600">언론사 원문 열기 버튼 클릭 시 기록</p>
                  </li>
                </ul>
              </article>
            </div>

            <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-lg">인기 ESG 기사 Top 10</h2>
              {newsStats.topArticles.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {newsStats.topArticles.map((item) => (
                    <div key={item.newsId}>
                      <div className="flex flex-wrap items-start justify-between gap-2 text-sm mb-1">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 mr-2">
                            {item.category}
                          </span>
                          <span className="font-medium text-slate-800 line-clamp-2">{item.title}</span>
                        </div>
                        <span className="text-slate-500 shrink-0">
                          {item.count}회 (상세 {item.detailCount} · 원문 {item.outlinkCount})
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D9E75]"
                          style={{ width: `${Math.max((item.count / maxNewsTopCount) * 100, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">아직 뉴스 클릭 로그가 없습니다.</p>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "search-stats" && searchStats ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">총 검색 수</p>
                <p className="text-3xl font-bold mt-1 text-[#085041]">{searchStats.totalSearches}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">고유 검색어</p>
                <p className="text-3xl font-bold mt-1">{searchStats.uniqueQueries}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">수집 유형</p>
                <p className="text-sm font-medium mt-2 text-slate-700 leading-relaxed">
                  ESG 뉴스 · 기업별 뉴스 · 기업 공시
                </p>
              </article>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h2 className="font-semibold text-lg">검색 유형별 비중</h2>
                <p className="text-sm text-slate-500 mt-1">어디서 검색이 많이 발생했는지</p>
                {searchStats.typeStats.some((item) => item.count > 0) ? (
                  <div className="mt-4 space-y-3">
                    {searchStats.typeStats.map((item) => (
                      <div key={item.type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-slate-800">{item.label}</span>
                          <span className="text-slate-500">
                            {item.count}회 · {item.percent}%
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#085041]"
                            style={{
                              width: `${Math.max((item.count / maxSearchTypeCount) * 100, item.count > 0 ? 6 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">아직 검색 로그가 없습니다.</p>
                )}
              </article>

              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h2 className="font-semibold text-lg">최근 검색</h2>
                <p className="text-sm text-slate-500 mt-1">최근 12건의 검색 기록</p>
                {searchStats.recentQueries.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {searchStats.recentQueries.map((item, index) => (
                      <li
                        key={`${item.searchedAt}-${item.query}-${index}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">{item.query}</span>
                          <span className="text-xs text-slate-500">{formatSearchDate(item.searchedAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.searchTypeLabel}
                          {item.context ? ` · ${item.context}` : ""}
                          {item.resultCount != null ? ` · 결과 ${item.resultCount}건` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">아직 검색 로그가 없습니다.</p>
                )}
              </article>
            </div>

            <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-lg">누적 인기 검색어 Top 15</h2>
              {searchStats.topQueries.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {searchStats.topQueries.map((item) => (
                    <div key={`${item.searchType}-${item.query}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2 text-sm mb-1">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 mr-2">
                            {item.searchTypeLabel}
                          </span>
                          <span className="font-medium text-slate-800">{item.query}</span>
                        </div>
                        <span className="text-slate-500 shrink-0">
                          {item.count}회 · 최근 {formatSearchDate(item.lastSearchedAt)}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D9E75]"
                          style={{ width: `${Math.max((item.count / maxSearchTopCount) * 100, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">아직 검색 로그가 없습니다.</p>
              )}
            </article>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(["news", "company_news", "disclosure"] as const).map((type) => {
                const label =
                  type === "news" ? "ESG 뉴스" : type === "company_news" ? "기업별 뉴스" : "기업 공시";
                const items = searchStats.topByType[type] ?? [];

                return (
                  <article key={type} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-[#111827]">{label} Top 8</h3>
                    {items.length > 0 ? (
                      <ol className="mt-4 space-y-2">
                        {items.map((item, index) => (
                          <li key={`${type}-${item.query}`} className="text-sm">
                            <span className="text-slate-400 mr-2">{index + 1}.</span>
                            <span className="font-medium text-slate-800">{item.query}</span>
                            <span className="text-slate-500 ml-2">{item.count}회</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">검색 기록 없음</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "stats" && stats ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">총 클릭 수</p>
                <p className="text-3xl font-bold mt-1 text-[#085041]">{stats.totalClicks}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">등록 봉사 수</p>
                <p className="text-3xl font-bold mt-1">{stats.registeredCount}</p>
              </article>
              <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">활성 공고</p>
                <p className="text-3xl font-bold mt-1">{stats.activeCount}</p>
              </article>
            </div>

            <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-lg">Top 5 선호 봉사 (클릭 기준)</h2>
              {stats.topVolunteers.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {stats.topVolunteers.map((item) => (
                    <div key={item.volunteerId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-slate-800 line-clamp-1">{item.title}</span>
                        <span className="text-slate-500 shrink-0 ml-2">{item.count}회</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D9E75]"
                          style={{ width: `${Math.max((item.count / maxTopCount) * 100, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">아직 클릭 로그가 없습니다.</p>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "create" ? (
          <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-lg">봉사 공고 등록</h2>
            <p className="text-sm text-slate-600 mt-1">등록된 공고는 사용자 봉사활동 페이지에 노출됩니다.</p>

            <form className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreate}>
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm md:col-span-2"
                placeholder="제목 *"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <select
                className="border border-slate-200 rounded-md p-2.5 text-sm"
                value={form.esg_category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, esg_category: event.target.value as "E" | "S" }))
                }
              >
                <option value="E">환경(E)</option>
                <option value="S">사회(S)</option>
              </select>
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm"
                placeholder="모집 인원"
                value={form.capacity}
                onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm"
                placeholder="활동 시간 (예: 토 10:00~13:00)"
                value={form.hours}
                onChange={(event) => setForm((prev) => ({ ...prev, hours: event.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm"
                placeholder="장소"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm md:col-span-2"
                placeholder="혜택 (예: 1365 봉사시간 인증)"
                value={form.benefit}
                onChange={(event) => setForm((prev) => ({ ...prev, benefit: event.target.value }))}
              />
              <textarea
                className="border border-slate-200 rounded-md p-2.5 text-sm md:col-span-2"
                rows={4}
                placeholder="봉사 설명 *"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm md:col-span-2"
                placeholder="대표 이미지 URL (선택)"
                value={form.image_url}
                onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-md p-2.5 text-sm md:col-span-2"
                placeholder="신청 링크 (target_outlink_url) *"
                value={form.target_outlink_url}
                onChange={(event) => setForm((prev) => ({ ...prev, target_outlink_url: event.target.value }))}
                required
              />
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_1365}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_1365: event.target.checked }))}
                />
                VMS 인증 가능
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="md:col-span-2 bg-[#085041] text-white rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {submitting ? "등록 중..." : "봉사 공고 등록"}
              </button>
            </form>
          </section>
        ) : null}

        {!loading && activeTab === "manage" ? (
          <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-lg">공고 관리</h2>
            <p className="text-sm text-slate-600 mt-1">삭제는 soft delete(`deleted_at`)로 처리됩니다.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">제목</th>
                    <th className="py-2 pr-4">카테고리</th>
                    <th className="py-2 pr-4">모집</th>
                    <th className="py-2 pr-4">상태</th>
                    <th className="py-2">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      </td>
                      <td className="py-3 pr-4">{item.esg_category}</td>
                      <td className="py-3 pr-4">{item.capacity || "미정"}</td>
                      <td className="py-3 pr-4">
                        {item.deleted_at ? (
                          <span className="text-red-600">삭제됨</span>
                        ) : (
                          <span className="text-green-700">활성</span>
                        )}
                      </td>
                      <td className="py-3">
                        {!item.deleted_at ? (
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(item.id, item.title)}
                            className="text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
