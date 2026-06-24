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

export function getDapodikConnectorStatus() {
  const mode = getDapodikSyncMode();
  const enabled = isDapodikSyncEnabled();
  const hasOfficialConfig = Boolean(
    process.env.DAPODIK_BASE_URL &&
      process.env.DAPODIK_CLIENT_ID &&
      process.env.DAPODIK_CLIENT_SECRET,
  );

  return {
    enabled,
    mode,
    maxAttempts: getDapodikSyncMaxAttempts(),
    realConnectorReady: mode === "real" && hasOfficialConfig,
    hasOfficialConfig,
    message:
      mode === "mock"
        ? "Mock connector aktif; tidak ada external call."
        : mode === "real" && hasOfficialConfig
          ? "Konfigurasi official tersedia; implementasi client real tetap harus memakai akses resmi."
          : mode === "real"
            ? "Mode real dipilih, tetapi konfigurasi official belum lengkap."
            : "Dapodik sync disabled.",
  };
}
