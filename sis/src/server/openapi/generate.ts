import { writeFileSync, mkdirSync } from "fs";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Example registry – extend by importing route schemas when available
const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/api/health",
  description: "Healthcheck",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ ok: z.boolean(), ts: z.string() }),
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: { title: "SIS API", version: "0.1.0" },
});

mkdirSync("openapi", { recursive: true });
writeFileSync("openapi/openapi.json", JSON.stringify(doc, null, 2));
console.log("OpenAPI written to openapi/openapi.json");
