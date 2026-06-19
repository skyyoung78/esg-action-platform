"use client";

import type { EsgCategory } from "@/lib/esg-news-filter";

type NewsOutlinkButtonProps = {
  newsId: string;
  href: string;
  title?: string;
  category?: EsgCategory;
  className?: string;
  children: React.ReactNode;
};

export default function NewsOutlinkButton({
  newsId,
  href,
  title,
  category,
  className,
  children,
}: NewsOutlinkButtonProps) {
  async function handleClick() {
    try {
      await fetch(`/api/news/${encodeURIComponent(newsId)}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "outlink", title, category }),
      });
    } catch {
      // 통계 수집 실패는 링크 이동을 막지 않음
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
