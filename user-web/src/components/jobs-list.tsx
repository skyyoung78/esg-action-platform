"use client";

import { useMemo, useState } from "react";
import { buildRegionFilters } from "@/lib/job-region";
import type { JobItemView } from "@/lib/recent-jobs";

type JobsListProps = {
  items: JobItemView[];
};

function ddayTone(deadline: string) {
  if (deadline === "D-2" || deadline === "D-1" || deadline === "D-0") return "bg-red-100 text-red-700";
  if (deadline === "D-3" || deadline === "D-4" || deadline === "D-5" || deadline === "D-6" || deadline === "D-7") {
    return "bg-orange-100 text-orange-700";
  }
  return "bg-green-100 text-green-700";
}

export default function JobsList({ items }: JobsListProps) {
  const regionFilters = useMemo(() => buildRegionFilters(items), [items]);
  const [regionFilter, setRegionFilter] = useState("all");

  const filtered = useMemo(() => {
    if (regionFilter === "all") return items;
    if (regionFilter === "지역 미정") {
      return items.filter((item) => !item.region);
    }
    return items.filter((item) => item.region === regionFilter);
  }, [items, regionFilter]);

  return (
    <div>
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <p className="text-sm text-slate-600 mb-3">
          사람인·잡코리아 ESG 관련 채용공고를 지역(시·도)별로 확인할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {regionFilters.map((filter) => {
            const active = regionFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRegionFilter(filter.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
        <p className="text-xs text-slate-500 mt-3">
          {regionFilter === "all" ? `${items.length}건` : `${filtered.length}건 / ${items.length}건`}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <article key={job.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${ddayTone(job.deadline)}`}>
                  {job.deadline}
                </span>
                {job.region ? (
                  <span className="text-xs rounded-full bg-[#085041]/10 px-2 py-0.5 text-[#085041]">{job.region}</span>
                ) : null}
                {job.source ? <span className="text-xs text-slate-400">{job.source}</span> : null}
              </div>
              <h2 className="font-semibold leading-snug">{job.title}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {job.company} · {job.jobType}
                {job.location ? ` · ${job.location}` : ""}
              </p>
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm font-medium text-[#085041] hover:underline"
              >
                지원 페이지 이동 ↗
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-100 p-6 text-center">
          선택한 지역에 해당하는 채용공고가 없습니다.
        </p>
      )}
    </div>
  );
}
