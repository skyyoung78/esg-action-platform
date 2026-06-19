import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readLocalVolunteersStore, upsertLocalVolunteer } from "@/lib/local-volunteers-store";
import { isValidVolunteerUrl } from "@/lib/volunteers-data";

function parseVolunteerInput(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const esg_category = String(body.esg_category ?? "E").trim() as "E" | "S";
  const hours = String(body.hours ?? "미정").trim();
  const location = String(body.location ?? "미정").trim();
  const capacity = String(body.capacity ?? "미정").trim();
  const benefit = String(body.benefit ?? "").trim();
  const description = String(body.description ?? "").trim();
  const image_url = String(body.image_url ?? "").trim();
  const target_outlink_url = String(body.target_outlink_url ?? "").trim();
  const is_1365 = Boolean(body.is_1365);

  if (!title) return { error: "제목을 입력해 주세요." };
  if (esg_category !== "E" && esg_category !== "S") return { error: "카테고리는 E 또는 S만 가능합니다." };
  if (!target_outlink_url || !isValidVolunteerUrl(target_outlink_url)) {
    return { error: "유효한 신청 링크(http/https)를 입력해 주세요." };
  }
  if (image_url && !isValidVolunteerUrl(image_url)) {
    return { error: "대표 이미지 URL은 http/https 형식이어야 합니다." };
  }

  return {
    data: {
      title,
      esg_category,
      hours,
      location,
      capacity,
      benefit,
      description,
      image_url: image_url || null,
      target_outlink_url,
      is_1365,
    },
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const volunteers = readLocalVolunteersStore(true).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return NextResponse.json({ ok: true, volunteers });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseVolunteerInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const volunteer = upsertLocalVolunteer(parsed.data);
  return NextResponse.json({ ok: true, volunteer });
}
