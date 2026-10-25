const parts = (d: Date, tz: string) => {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value])) as Record<string, string>;
};
export const todayInTz = (tz: string, d = new Date()) => { const p = parts(d, tz); return `${p.year}-${p.month}-${p.day}`; };
export const hhmmInTz = (tz: string, d = new Date()) => { const p = parts(d, tz); return `${p.hour}:${p.minute}`; };
const offset = (d: Date, tz: string) => { const p = parts(d, tz); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(d.getTime() / 1000) * 1000; };
/** "2026-10-19T18:00" in restaurant tz -> UTC ISO */
export function zonedToUtcISO(local: string, tz: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const g = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const d = new Date(g - offset(new Date(g), tz));
  return isNaN(d.getTime()) ? null : d.toISOString();
}
export function utcToLocalInput(iso: string | null, tz: string) {
  if (!iso) return "";
  const p = parts(new Date(iso), tz);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export const validTz = (tz: string) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } };
