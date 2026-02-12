export async function register() {
  // Next.js executes instrumentation in both nodejs and edge runtimes.
  // Keep this file Edge-safe: only load Node instrumentation when on nodejs.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerHttpMetricsInstrumentation } = await import("./src/server/instrumentation/http-metrics");
    registerHttpMetricsInstrumentation();
  }
}

