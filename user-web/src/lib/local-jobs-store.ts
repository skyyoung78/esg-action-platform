import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { JobCategory } from "@/lib/esg-jobs-filter";

export type StoredJobPosting = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  deadline: string | null;
  apply_url: string;
  source: "saramin" | "jobkorea";
  source_id: string;
  keyword: string;
  category: JobCategory;
  collected_at: string;
};

type JobsStoreFile = {
  updatedAt: string;
  jobs: StoredJobPosting[];
};

function storePath(): string {
  return join(process.cwd(), "data", "jobs-store.json");
}

export function urlToLocalJobId(source: string, sourceId: string): string {
  const hash = createHash("sha256").update(`${source}:${sourceId}`).digest("hex");
  return `job-${hash.slice(0, 20)}`;
}

export function readLocalJobsStore(): StoredJobPosting[] {
  const path = storePath();
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as JobsStoreFile;
    const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];
    return normalizeLocalJobsStore(jobs);
  } catch {
    return [];
  }
}

export function writeLocalJobsStore(jobs: StoredJobPosting[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const payload: JobsStoreFile = {
    updatedAt: new Date().toISOString(),
    jobs,
  };

  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function findLocalJobById(id: string): StoredJobPosting | null {
  return readLocalJobsStore().find((job) => job.id === id) ?? null;
}

export function findLocalJobBySourceKey(source: string, sourceId: string): StoredJobPosting | null {
  return readLocalJobsStore().find((job) => job.source === source && job.source_id === sourceId) ?? null;
}

export function normalizeLocalJobsStore(jobs: StoredJobPosting[]): StoredJobPosting[] {
  return jobs.map((job) => ({
    ...job,
    id: job.id.startsWith("job-") ? urlToLocalJobId(job.source, job.source_id) : job.id,
  }));
}
