import type { JobItem } from "@/lib/mock-data";
import { jobs as mockJobs } from "@/lib/mock-data";
import { extractRegionFromLocation } from "@/lib/job-region";
import { readLocalJobsStore, type StoredJobPosting } from "@/lib/local-jobs-store";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type JobItemView = JobItem & {
  source?: string;
  location?: string | null;
  region?: string | null;
};

function formatDeadlineLabel(deadline: string | null): string {
  if (!deadline) return "상시";

  const now = new Date();
  const end = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(end.getTime())) return "상시";

  const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "마감";
  return `D-${diffDays}`;
}

function storedToJobItem(row: StoredJobPosting): JobItemView {
  const sourceLabel = row.source === "saramin" ? "사람인" : "잡코리아";
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    jobType: row.job_type ?? "미정",
    deadline: formatDeadlineLabel(row.deadline),
    applyUrl: row.apply_url,
    source: sourceLabel,
    location: row.location,
    region: extractRegionFromLocation(row.location),
  };
}

function rowToJobItem(row: Record<string, unknown>): JobItemView {
  const deadline = row.deadline ? String(row.deadline) : null;
  return {
    id: String(row.id),
    title: String(row.title),
    company: String(row.company),
    jobType: String(row.job_type ?? "미정"),
    deadline: formatDeadlineLabel(deadline),
    applyUrl: String(row.apply_url),
    source: "DB",
    location: row.location ? String(row.location) : null,
    region: extractRegionFromLocation(row.location ? String(row.location) : null),
  };
}

function sortJobs(items: JobItemView[]): JobItemView[] {
  const rank = (deadline: string) => {
    if (deadline === "마감") return 99;
    if (deadline === "상시") return 50;
    const match = deadline.match(/^D-(\d+)$/);
    return match ? Number(match[1]) : 40;
  };

  return [...items].sort((a, b) => rank(a.deadline) - rank(b.deadline));
}

export async function loadRecentJobs(limit = 24): Promise<JobItemView[]> {
  const localItems = readLocalJobsStore().map(storedToJobItem);

  let dbItems: JobItemView[] = [];
  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("id,title,company,location,job_type,deadline,apply_url,created_at")
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data && data.length > 0) {
      dbItems = data.map((row) => rowToJobItem(row as Record<string, unknown>));
    }
  }

  const merged = new Map<string, JobItemView>();
  for (const item of dbItems) {
    merged.set(item.applyUrl || item.id, item);
  }
  for (const item of localItems) {
    merged.set(item.applyUrl || item.id, item);
  }

  let items = sortJobs([...merged.values()]);
  if (items.length === 0) {
    items = mockJobs.map((item) => ({
      ...item,
      source: "데모",
      location: "서울 중구",
      region: "서울",
    }));
  }

  return items.slice(0, limit);
}
