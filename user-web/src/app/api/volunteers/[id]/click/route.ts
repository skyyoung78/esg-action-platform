import { NextResponse } from "next/server";
import { appendVolunteerClickLog } from "@/lib/local-volunteer-clicks";
import { findLocalVolunteerById } from "@/lib/local-volunteers-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const volunteer = findLocalVolunteerById(id);

  if (!volunteer || volunteer.deleted_at) {
    return NextResponse.json({ ok: false, error: "공고를 찾을 수 없습니다." }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  appendVolunteerClickLog(id, userAgent);

  return NextResponse.json({ ok: true });
}
