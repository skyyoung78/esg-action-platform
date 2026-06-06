const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const NEWS_WEEK_RETENTION = 12;

export type NewsWeekGroup<T> = {
  weekStart: string;
  label: string;
  isCurrentWeek: boolean;
  items: T[];
};

function toKstParts(dateInput: string | Date): { year: number; month: number; day: number; weekday: number } {
  const date = new Date(dateInput);
  const kst = new Date(date.getTime() + KST_OFFSET_MS);

  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth(),
    day: kst.getUTCDate(),
    weekday: kst.getUTCDay(),
  };
}

/** KST 기준 해당 주 월요일 (YYYY-MM-DD) */
export function getWeekStartKey(dateInput: string | Date = new Date()): string {
  const { year, month, day, weekday } = toKstParts(dateInput);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(year, month, day + mondayOffset));

  return monday.toISOString().slice(0, 10);
}

export function getWeekEndKey(weekStartKey: string): string {
  const start = new Date(`${weekStartKey}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().slice(0, 10);
}

function formatShortDate(weekStartKey: string): string {
  const date = new Date(`${weekStartKey}T00:00:00.000Z`);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function formatWeekLabel(weekStartKey: string, now: Date = new Date()): string {
  const currentWeek = getWeekStartKey(now);
  const endKey = getWeekEndKey(weekStartKey);
  const range = `${formatShortDate(weekStartKey)} ~ ${formatShortDate(endKey)}`;

  if (weekStartKey === currentWeek) {
    return `이번 주 (${range})`;
  }

  const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (weekStartKey === getWeekStartKey(lastWeekDate)) {
    return `지난주 (${range})`;
  }

  return range;
}

export function getRecentWeekStartKeys(count = NEWS_WEEK_RETENTION, now: Date = new Date()): string[] {
  const keys: string[] = [];
  const current = getWeekStartKey(now);
  const cursor = new Date(`${current}T00:00:00.000Z`);

  for (let i = 0; i < count; i += 1) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  return keys;
}

export function getOldestRetainedWeekStart(now: Date = new Date()): string {
  const keys = getRecentWeekStartKeys(NEWS_WEEK_RETENTION, now);
  return keys[keys.length - 1] ?? getWeekStartKey(now);
}

export function groupByWeek<T>(
  items: T[],
  getPublishedAt: (item: T) => string,
  now: Date = new Date(),
): NewsWeekGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const weekStart = getWeekStartKey(getPublishedAt(item));
    const bucket = buckets.get(weekStart) ?? [];
    bucket.push(item);
    buckets.set(weekStart, bucket);
  }

  const currentWeek = getWeekStartKey(now);

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekStart, weekItems]) => ({
      weekStart,
      label: formatWeekLabel(weekStart, now),
      isCurrentWeek: weekStart === currentWeek,
      items: weekItems,
    }));
}
