import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type VolunteerClickLog = {
  id: string;
  volunteer_id: string;
  clicked_at: string;
  user_agent: string | null;
};

type ClickStoreFile = {
  updatedAt: string;
  logs: VolunteerClickLog[];
};

function storePath(): string {
  return join(process.cwd(), "data", "volunteer-clicks.json");
}

export function readVolunteerClickLogs(): VolunteerClickLog[] {
  const path = storePath();
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as ClickStoreFile;
    return Array.isArray(parsed?.logs) ? parsed.logs : [];
  } catch {
    return [];
  }
}

export function appendVolunteerClickLog(volunteerId: string, userAgent: string | null): VolunteerClickLog {
  const logs = readVolunteerClickLogs();
  const entry: VolunteerClickLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    volunteer_id: volunteerId,
    clicked_at: new Date().toISOString(),
    user_agent: userAgent,
  };

  logs.unshift(entry);
  writeVolunteerClickLogs(logs.slice(0, 5000));
  return entry;
}

function writeVolunteerClickLogs(logs: VolunteerClickLog[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(
    path,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), logs }, null, 2)}\n`,
    "utf8",
  );
}
