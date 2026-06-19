import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { findLocalVolunteerById, softDeleteLocalVolunteer } from "@/lib/local-volunteers-store";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = findLocalVolunteerById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "공고를 찾을 수 없습니다." }, { status: 404 });
  }
  if (existing.deleted_at) {
    return NextResponse.json({ ok: false, error: "이미 삭제된 공고입니다." }, { status: 400 });
  }

  const volunteer = softDeleteLocalVolunteer(id);
  return NextResponse.json({ ok: true, volunteer });
}
