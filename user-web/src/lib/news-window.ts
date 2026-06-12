const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** @deprecated 누적 저장 전 7일 롤링 기간. 트렌드 보조 문구 등에만 사용 */
export const NEWS_ROLLING_DAYS = 7;

/** ESG 뉴스 누적 저장 시작일 (KST) */
export const NEWS_ACCUMULATION_START_KEY = "2026-06-01";

/** 페이지 접속 시 신규 기사 수집·저장 배치 크기 */
export const NEWS_INGEST_BATCH_SIZE = 12;

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

/** KST 2026-06-01 00:00:00 */
export function getNewsAccumulationStart(): Date {
  return new Date(`${NEWS_ACCUMULATION_START_KEY}T00:00:00+09:00`);
}

/** 2026.6.1 이후 ~ 접속 시점까지 누적 구간 */
export function getAccumulationNewsWindow(now: Date = new Date()): NewsWindow {
  const start = getNewsAccumulationStart();
  const end = now;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

  return {
    days,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: `2026.6.1 이후 누적 (${toKstDateLabel(start)} ~ ${toKstDateLabel(end)})`,
    key: `accumulation-${NEWS_ACCUMULATION_START_KEY}`,
  };
}

export function isWithinAccumulationWindow(dateInput: string | Date, now: Date = new Date()): boolean {
  return isWithinNewsWindow(dateInput, getAccumulationNewsWindow(now));
}
