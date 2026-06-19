import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { volunteers as mockVolunteers } from "@/lib/mock-data";

export type StoredVolunteer = {
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

type VolunteerStoreFile = {
  updatedAt: string;
  volunteers: StoredVolunteer[];
};

function storePath(): string {
  return join(process.cwd(), "data", "volunteers-store.json");
}

function seedFromMock(): StoredVolunteer[] {
  return mockVolunteers.map((item) => ({
    id: item.id,
    title: item.title,
    esg_category: item.category,
    hours: "미정",
    location: "미정",
    capacity: item.capacity,
    benefit: "",
    description: item.description,
    image_url: item.imageUrl ?? null,
    target_outlink_url: item.targetOutlinkUrl,
    is_1365: item.is1365,
    deleted_at: null,
    created_at: new Date().toISOString(),
  }));
}

export function readLocalVolunteersStore(includeDeleted = false): StoredVolunteer[] {
  const path = storePath();
  if (!existsSync(path)) {
    const seeded = seedFromMock();
    writeLocalVolunteersStore(seeded);
    return includeDeleted ? seeded : seeded.filter((item) => !item.deleted_at);
  }

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as VolunteerStoreFile;
    const volunteers = Array.isArray(parsed?.volunteers) ? parsed.volunteers : [];
    if (volunteers.length === 0) {
      const seeded = seedFromMock();
      writeLocalVolunteersStore(seeded);
      return includeDeleted ? seeded : seeded.filter((item) => !item.deleted_at);
    }
    return includeDeleted ? volunteers : volunteers.filter((item) => !item.deleted_at);
  } catch {
    return [];
  }
}

export function writeLocalVolunteersStore(volunteers: StoredVolunteer[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const payload: VolunteerStoreFile = {
    updatedAt: new Date().toISOString(),
    volunteers,
  };

  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function findLocalVolunteerById(id: string): StoredVolunteer | null {
  return readLocalVolunteersStore(true).find((item) => item.id === id) ?? null;
}

export function upsertLocalVolunteer(input: Omit<StoredVolunteer, "id" | "created_at" | "deleted_at"> & {
  id?: string;
  deleted_at?: string | null;
  created_at?: string;
}): StoredVolunteer {
  const all = readLocalVolunteersStore(true);
  const now = new Date().toISOString();
  const record: StoredVolunteer = {
    id: input.id ?? randomUUID(),
    title: input.title,
    esg_category: input.esg_category,
    hours: input.hours,
    location: input.location,
    capacity: input.capacity,
    benefit: input.benefit,
    description: input.description,
    image_url: input.image_url,
    target_outlink_url: input.target_outlink_url,
    is_1365: input.is_1365,
    deleted_at: input.deleted_at ?? null,
    created_at: input.created_at ?? now,
  };

  const index = all.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    all[index] = { ...all[index], ...record, created_at: all[index].created_at };
  } else {
    all.unshift(record);
  }

  writeLocalVolunteersStore(all);
  return record;
}

export function softDeleteLocalVolunteer(id: string): StoredVolunteer | null {
  const all = readLocalVolunteersStore(true);
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;

  all[index] = { ...all[index], deleted_at: new Date().toISOString() };
  writeLocalVolunteersStore(all);
  return all[index];
}
