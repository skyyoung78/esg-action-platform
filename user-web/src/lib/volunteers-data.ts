import type { VolunteerItem } from "@/lib/mock-data";
import { readLocalVolunteersStore, type StoredVolunteer } from "@/lib/local-volunteers-store";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { volunteers as mockVolunteers } from "@/lib/mock-data";

function storedToVolunteerItem(row: StoredVolunteer): VolunteerItem {
  return {
    id: row.id,
    title: row.title,
    category: row.esg_category,
    capacity: row.capacity || "미정",
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    targetOutlinkUrl: row.target_outlink_url,
    is1365: row.is_1365,
  };
}

function rowToVolunteerItem(row: Record<string, unknown>): VolunteerItem {
  return {
    id: String(row.id),
    title: String(row.title),
    category: String(row.esg_category) as "E" | "S",
    capacity: String(row.capacity ?? "미정"),
    description: String(row.description ?? ""),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    targetOutlinkUrl: String(row.target_outlink_url),
    is1365: Boolean(row.is_1365),
  };
}

export async function loadPublicVolunteers(limit = 24): Promise<VolunteerItem[]> {
  const localItems = readLocalVolunteersStore(false).map(storedToVolunteerItem);
  if (localItems.length > 0) {
    return localItems.slice(0, limit);
  }

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("volunteers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data && data.length > 0) {
      return data.map((row) => rowToVolunteerItem(row as Record<string, unknown>));
    }
  }

  return mockVolunteers.slice(0, limit);
}

export function isValidVolunteerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
