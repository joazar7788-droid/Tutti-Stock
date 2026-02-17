/** Get the most recent Sunday (or today if it is Sunday) */
export function getRecentSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Check if today is Sunday (0) or Monday (1) */
export function isCountDay(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 1;
}

/** Format date as ISO date string (YYYY-MM-DD) */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}
