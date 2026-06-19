import type { EsgCategory } from "@/lib/esg-news-filter";
import { ESG_CATEGORY_LABEL } from "@/lib/esg-news-filter";
import type { NewsClickLog } from "@/lib/local-news-clicks";

export type NewsCategoryClickStat = {
  category: EsgCategory;
  label: string;
  count: number;
  percent: number;
};

export type TopNewsClickItem = {
  newsId: string;
  title: string;
  category: EsgCategory;
  count: number;
  detailCount: number;
  outlinkCount: number;
};

export type NewsClickStats = {
  totalClicks: number;
  detailClicks: number;
  outlinkClicks: number;
  categoryStats: NewsCategoryClickStat[];
  topArticles: TopNewsClickItem[];
};

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];

export function buildNewsClickStats(logs: NewsClickLog[]): NewsClickStats {
  const totalClicks = logs.length;
  const detailClicks = logs.filter((log) => log.click_type === "detail").length;
  const outlinkClicks = logs.filter((log) => log.click_type === "outlink").length;

  const categoryCounts: Record<EsgCategory, number> = { E: 0, S: 0, G: 0 };
  for (const log of logs) {
    if (log.esg_category === "E" || log.esg_category === "S" || log.esg_category === "G") {
      categoryCounts[log.esg_category] += 1;
    }
  }

  const categoryStats = CATEGORY_ORDER.map((category) => ({
    category,
    label: ESG_CATEGORY_LABEL[category],
    count: categoryCounts[category],
    percent: totalClicks > 0 ? Math.round((categoryCounts[category] / totalClicks) * 100) : 0,
  }));

  const articleMap = new Map<string, TopNewsClickItem>();
  for (const log of logs) {
    const existing = articleMap.get(log.news_id);
    if (!existing) {
      articleMap.set(log.news_id, {
        newsId: log.news_id,
        title: log.title,
        category: log.esg_category,
        count: 1,
        detailCount: log.click_type === "detail" ? 1 : 0,
        outlinkCount: log.click_type === "outlink" ? 1 : 0,
      });
      continue;
    }

    existing.count += 1;
    if (log.click_type === "detail") existing.detailCount += 1;
    if (log.click_type === "outlink") existing.outlinkCount += 1;
    if (log.title && log.title.length > existing.title.length) {
      existing.title = log.title;
    }
  }

  const topArticles = [...articleMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    totalClicks,
    detailClicks,
    outlinkClicks,
    categoryStats,
    topArticles,
  };
}
