const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const NEWS_ROLLING_DAYS = 7;

/** 기업별 분석 탭: 최근 N년 뉴스 수집·분석 기간 */
export const COMPANY_NEWS_ANALYSIS_YEARS = 2;
export const COMPANY_NEWS_ANALYSIS_DAYS = COMPANY_NEWS_ANALYSIS_YEARS * 365;

export type NewsWindow = {
  days: number;
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  label: string;
  key: string;
};

function toKstDateLabel(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}.${kst.getUTCMonth() + 1}.${kst.getUTCDate()}`;
}

export function getNewsWindow(days = NEWS_ROLLING_DAYS, now: Date = new Date()): NewsWindow {
  const end = now;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    days,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: `최근 ${days}일 (${toKstDateLabel(start)} ~ ${toKstDateLabel(end)})`,
    key: `rolling-${days}-${toKstDateLabel(end)}`,
  };
}

export function isWithinNewsWindow(
  dateInput: string | Date,
  window: NewsWindow,
): boolean {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;
  return date >= window.start && date <= window.end;
}
