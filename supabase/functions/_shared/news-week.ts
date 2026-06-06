const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const NEWS_WEEK_RETENTION = 12;

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

export function getWeekStartKey(dateInput: string | Date = new Date()): string {
  const { year, month, day, weekday } = toKstParts(dateInput);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(year, month, day + mondayOffset));

  return monday.toISOString().slice(0, 10);
}

export function getOldestRetainedWeekStart(now: Date = new Date()): string {
  const current = getWeekStartKey(now);
  const cursor = new Date(`${current}T00:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() - 7 * (NEWS_WEEK_RETENTION - 1));
  return cursor.toISOString().slice(0, 10);
}
