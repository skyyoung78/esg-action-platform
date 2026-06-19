"use client";

import { useEffect } from "react";
import type { EsgCategory } from "@/lib/esg-news-filter";

type NewsClickTrackerProps = {
  newsId: string;
  title?: string;
  category?: EsgCategory;
};

export default function NewsClickTracker({ newsId, title, category }: NewsClickTrackerProps) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/news/${encodeURIComponent(newsId)}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "detail", title, category }),
      signal: controller.signal,
    }).catch(() => {
      // 통계 수집 실패는 사용자 경험에 영향 없음
    });

    return () => controller.abort();
  }, [newsId, title, category]);

  return null;
}
