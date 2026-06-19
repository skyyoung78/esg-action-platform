"use client";

type VolunteerApplyButtonProps = {
  volunteerId: string;
  targetUrl: string;
  label: string;
};

export default function VolunteerApplyButton({ volunteerId, targetUrl, label }: VolunteerApplyButtonProps) {
  async function handleClick() {
    try {
      await fetch(`/api/volunteers/${encodeURIComponent(volunteerId)}/click`, { method: "POST" });
    } catch {
      // 클릭 로그 실패는 신청 이동을 막지 않음
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-block mt-4 rounded-md bg-[#085041] text-white px-3 py-2 text-sm hover:bg-[#064535] transition-colors"
    >
      {label}
    </button>
  );
}
