export function getHrToleranceMinutes() {
  const n = Number(process.env.HR_TOLERANCE_MINUTES ?? "10");
  return Number.isFinite(n) && n >= 0 ? n : 10;
}

export function parseHHMM(s?: string | null) {
  if (!s) return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return { h, min };
}

export function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60_000);
}

export function computeStatusForCheckIn(shiftStartHHmm: string | null | undefined, checkInAt: Date): "PRESENT" | "LATE" {
  const tol = getHrToleranceMinutes();
  const p = parseHHMM(shiftStartHHmm ?? undefined);
  if (!p) return "PRESENT";
  const start = new Date(checkInAt);
  start.setHours(p.h, p.min, 0, 0);
  const latest = addMinutes(start, tol);
  return checkInAt > latest ? "LATE" : "PRESENT";
}

export function getCoreStartHHMM() {
  return process.env.HR_CORE_START ?? null;
}

export function getCoreEndHHMM() {
  return process.env.HR_CORE_END ?? null;
}

export function computeCoreHoursMet(
  shiftStartHHmm: string | null | undefined,
  shiftEndHHmm: string | null | undefined,
  checkInAt?: Date | null,
  checkOutAt?: Date | null
) {
  // Determine core window from shift if provided, fallback to env HR_CORE_START/HR_CORE_END
  const coreStartStr = shiftStartHHmm ?? getCoreStartHHMM();
  const coreEndStr = shiftEndHHmm ?? getCoreEndHHMM();
  const startP = parseHHMM(coreStartStr ?? undefined);
  const endP = parseHHMM(coreEndStr ?? undefined);
  if (!startP || !endP || !checkInAt || !checkOutAt) return false;
  const coreStart = new Date(checkInAt);
  coreStart.setHours(startP.h, startP.min, 0, 0);
  const coreEnd = new Date(checkInAt);
  coreEnd.setHours(endP.h, endP.min, 0, 0);
  // user must be checked in not after core start + tolerance, and checked out not before core end
  const tol = getHrToleranceMinutes();
  const latestAllowedIn = addMinutes(coreStart, tol);
  return checkInAt <= latestAllowedIn && checkOutAt >= coreEnd;
}

