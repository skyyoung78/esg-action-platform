import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readVolunteerClickLogs } from "@/lib/local-volunteer-clicks";
import { readLocalVolunteersStore } from "@/lib/local-volunteers-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const volunteers = readLocalVolunteersStore(true);
  const activeVolunteers = volunteers.filter((item) => !item.deleted_at);
  const logs = readVolunteerClickLogs();

  const clickCounts = new Map<string, number>();
  for (const log of logs) {
    clickCounts.set(log.volunteer_id, (clickCounts.get(log.volunteer_id) ?? 0) + 1);
  }

  const topVolunteers = [...clickCounts.entries()]
    .map(([volunteerId, count]) => {
      const volunteer = volunteers.find((item) => item.id === volunteerId);
      return {
        volunteerId,
        title: volunteer?.title ?? "삭제된 공고",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    ok: true,
    stats: {
      totalClicks: logs.length,
      registeredCount: volunteers.length,
      activeCount: activeVolunteers.length,
      topVolunteers,
    },
  });
}
