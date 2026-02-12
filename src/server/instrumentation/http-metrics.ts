import type { IncomingMessage, ServerResponse } from "node:http";
import http from "node:http";
import https from "node:https";
import { logger } from "@/lib/logger";
import { recordHttpRequest } from "@/server/metrics";

function getHeaderValue(headers: IncomingMessage["headers"], name: string) {
  const v = headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}

function setHeaderValue(headers: IncomingMessage["headers"], name: string, value: string) {
  // Node's IncomingMessage headers object is mutable (best-effort).
  // We keep this tiny and defensive because different runtimes may treat it differently.
  try {
    (headers as Record<string, string>)[name.toLowerCase()] = value;
  } catch {
    // ignore
  }
}

function safeParseUrlPathname(url: string | undefined): string {
  if (!url) return "/";
  try {
    return new URL(url, "http://localhost").pathname || "/";
  } catch {
    return "/";
  }
}

function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

type InstrumentDeps = {
  makeRequestId: () => string;
};

const kInstrumented = Symbol.for("sis.http.instrumented");

function instrumentRequest(req: IncomingMessage, res: ServerResponse, deps: InstrumentDeps) {
  if ((res as any)[kInstrumented]) return;
  (res as any)[kInstrumented] = true;

  const start = nowMs();
  const existingReqId = getHeaderValue(req.headers, "x-request-id");
  const reqId = existingReqId || deps.makeRequestId();

  if (!existingReqId) setHeaderValue(req.headers, "x-request-id", reqId);
  if (!res.headersSent) res.setHeader("x-request-id", reqId);

  res.once("finish", () => {
    const durationMs = nowMs() - start;
    const pathname = safeParseUrlPathname(req.url);
    const method = String(req.method || "GET").toUpperCase();
    const statusCode = res.statusCode || 0;

    recordHttpRequest({ method, pathname, statusCode, durationMs });

    // Keep logs low-cardinality: only log /api and only warn/error on errors.
    const isApi = pathname.startsWith("/api/");
    const isError = statusCode >= 400;
    const base = { reqId, method, pathname, statusCode, durationMs: Math.round(durationMs) };
    if (isApi && isError && statusCode >= 500) logger.error(base, "http.request");
    else if (isApi && isError) logger.warn(base, "http.request");
    else if (isApi) logger.info(base, "http.request");
    else logger.debug(base, "http.request");
  });
}

function patchServerEmit(ServerCtor: any, deps: InstrumentDeps) {
  const proto = ServerCtor?.prototype;
  if (!proto || typeof proto.emit !== "function") return;

  const originalEmit = proto.emit;
  proto.emit = function patchedEmit(this: any, event: string, ...args: any[]) {
    if (event === "request" && args.length >= 2) {
      const req = args[0] as IncomingMessage;
      const res = args[1] as ServerResponse;
      if (req && res) instrumentRequest(req, res, deps);
    }
    return originalEmit.call(this, event, ...args);
  };
}

export function registerHttpMetricsInstrumentation() {
  const g = globalThis as unknown as { __sisHttpInstrumented?: boolean };
  if (g.__sisHttpInstrumented) return;
  g.__sisHttpInstrumented = true;

  const deps = {
    makeRequestId: () => {
      const uuid = (globalThis as any)?.crypto?.randomUUID?.();
      if (typeof uuid === "string" && uuid.length > 0) return uuid;
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    },
  };

  patchServerEmit((http as any).Server, deps);
  patchServerEmit((https as any).Server, deps);
}

