function parseBool(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export type DapodikSyncMode = "disabled" | "mock" | "real";

export function getDapodikSyncMode(): DapodikSyncMode {
  const raw = (process.env.DAPODIK_SYNC_MODE || "").toLowerCase();
  if (raw === "mock") return "mock";
  if (raw === "real") return "real";
  return "disabled";
}

export function isDapodikSyncEnabled() {
  return parseBool(process.env.DAPODIK_SYNC_ENABLED) && getDapodikSyncMode() !== "disabled";
}

export function getDapodikSyncMaxAttempts() {
  const raw = Number(process.env.DAPODIK_SYNC_MAX_ATTEMPTS || "5");
  if (!Number.isFinite(raw)) return 5;
  return Math.max(1, Math.trunc(raw));
}

