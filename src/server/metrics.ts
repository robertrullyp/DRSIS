export type HttpStatusGroup = "1xx" | "2xx" | "3xx" | "4xx" | "5xx" | "other";

export type HttpRouteStats = {
  count: number;
  errorCount: number; // >=400
  serverErrorCount: number; // >=500
  totalMs: number;
  maxMs: number;
  buckets: number[];
  statusGroups: Record<HttpStatusGroup, number>;
};

export type HttpMetricsSnapshot = {
  since: string;
  updatedAt: string;
  durationBucketsMs: number[];
  totals: HttpRouteStats;
  routes: Record<string, HttpRouteStats>;
};

type HttpMetricsStore = HttpMetricsSnapshot;

const DURATION_BUCKETS_MS = [25, 50, 100, 200, 500, 1000, 2000, 5000] as const;

const STATUS_GROUPS: HttpStatusGroup[] = ["1xx", "2xx", "3xx", "4xx", "5xx", "other"];

function emptyStatusGroups(): Record<HttpStatusGroup, number> {
  return STATUS_GROUPS.reduce((acc, g) => {
    acc[g] = 0;
    return acc;
  }, {} as Record<HttpStatusGroup, number>);
}

function emptyStats(): HttpRouteStats {
  return {
    count: 0,
    errorCount: 0,
    serverErrorCount: 0,
    totalMs: 0,
    maxMs: 0,
    buckets: new Array(DURATION_BUCKETS_MS.length + 1).fill(0),
    statusGroups: emptyStatusGroups(),
  };
}

function getStatusGroup(statusCode: number): HttpStatusGroup {
  const group = Math.floor(statusCode / 100);
  if (group >= 1 && group <= 5) return `${group}xx` as HttpStatusGroup;
  return "other";
}

function bucketIndex(durationMs: number): number {
  for (let i = 0; i < DURATION_BUCKETS_MS.length; i++) {
    if (durationMs <= DURATION_BUCKETS_MS[i]) return i;
  }
  return DURATION_BUCKETS_MS.length;
}

function groupPath(pathname: string): string {
  const path = pathname || "/";
  if (!path.startsWith("/")) return "/";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (parts[0] !== "api") return "page";
  // Reduce cardinality: group by primary module prefix.
  if (parts[1] === "admin") {
    return parts.length >= 3 ? `/api/admin/${parts[2]}` : "/api/admin";
  }
  if (parts[1] === "public") {
    return parts.length >= 3 ? `/api/public/${parts[2]}` : "/api/public";
  }
  return parts.length >= 2 ? `/api/${parts[1]}` : "/api";
}

function getStore(): HttpMetricsStore {
  const g = globalThis as unknown as { __sisHttpMetrics?: HttpMetricsStore };
  if (!g.__sisHttpMetrics) {
    const now = new Date().toISOString();
    g.__sisHttpMetrics = {
      since: now,
      updatedAt: now,
      durationBucketsMs: [...DURATION_BUCKETS_MS],
      totals: emptyStats(),
      routes: {},
    };
  }
  return g.__sisHttpMetrics;
}

export function recordHttpRequest(input: {
  method: string;
  pathname: string;
  statusCode: number;
  durationMs: number;
}) {
  const store = getStore();
  const key = `${(input.method || "GET").toUpperCase()} ${groupPath(input.pathname)}`;
  const statusGroup = getStatusGroup(input.statusCode);
  const idx = bucketIndex(input.durationMs);
  const isError = input.statusCode >= 400;
  const isServerError = input.statusCode >= 500;

  const update = (stats: HttpRouteStats) => {
    stats.count += 1;
    if (isError) stats.errorCount += 1;
    if (isServerError) stats.serverErrorCount += 1;
    stats.totalMs += input.durationMs;
    stats.maxMs = Math.max(stats.maxMs, input.durationMs);
    stats.buckets[idx] += 1;
    stats.statusGroups[statusGroup] += 1;
  };

  update(store.totals);
  if (!store.routes[key]) store.routes[key] = emptyStats();
  update(store.routes[key]);
  store.updatedAt = new Date().toISOString();
}

export function getHttpMetricsSnapshot(): HttpMetricsSnapshot {
  const store = getStore();
  return store;
}

export function resetHttpMetrics() {
  const g = globalThis as unknown as { __sisHttpMetrics?: HttpMetricsStore };
  delete g.__sisHttpMetrics;
}

