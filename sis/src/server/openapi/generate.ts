import { writeFileSync, mkdirSync } from "fs";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { academicYearCreateSchema, gradeCreateSchema, semesterCreateSchema, classroomCreateSchema, subjectCreateSchema, curriculumCreateSchema } from "@/lib/schemas/master";

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

registry.registerPath({
  method: "get",
  path: "/api/master/grades",
  description: "List grades",
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: z.object({ items: z.array(z.object({ id: z.string(), name: z.string() })) }) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/master/grades",
  description: "Create grade",
  request: { body: { content: { "application/json": { schema: gradeCreateSchema } } } },
  responses: { 201: { description: "Created" } },
});

registry.registerPath({
  method: "get",
  path: "/api/master/academic-years",
  description: "List academic years",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(
              z.object({ id: z.string(), name: z.string(), startDate: z.string(), endDate: z.string(), isActive: z.boolean() })
            ),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/master/academic-years",
  description: "Create academic year",
  request: { body: { content: { "application/json": { schema: academicYearCreateSchema } } } },
  responses: { 201: { description: "Created" } },
});

registry.registerPath({
  method: "get",
  path: "/api/master/semesters",
  description: "List semesters",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), number: z.number().optional(), academicYearId: z.string() })) }),
        },
      },
    },
  },
});
registry.registerPath({ method: "post", path: "/api/master/semesters", description: "Create semester", request: { body: { content: { "application/json": { schema: semesterCreateSchema } } } }, responses: { 201: { description: "Created" } } });

registry.registerPath({
  method: "get",
  path: "/api/master/classrooms",
  description: "List classrooms",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ items: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })) }),
        },
      },
    },
  },
});
registry.registerPath({ method: "post", path: "/api/master/classrooms", description: "Create classroom", request: { body: { content: { "application/json": { schema: classroomCreateSchema } } } }, responses: { 201: { description: "Created" } } });

registry.registerPath({
  method: "get",
  path: "/api/master/subjects",
  description: "List subjects",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": { schema: z.object({ items: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })) }) },
      },
    },
  },
});
registry.registerPath({ method: "post", path: "/api/master/subjects", description: "Create subject", request: { body: { content: { "application/json": { schema: subjectCreateSchema } } } }, responses: { 201: { description: "Created" } } });

registry.registerPath({
  method: "get",
  path: "/api/master/curricula",
  description: "List curricula",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": { schema: z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), year: z.number().optional(), notes: z.string().optional() })) }) },
      },
    },
  },
});
registry.registerPath({ method: "post", path: "/api/master/curricula", description: "Create curriculum", request: { body: { content: { "application/json": { schema: curriculumCreateSchema } } } }, responses: { 201: { description: "Created" } } });

const generator = new OpenApiGeneratorV3(registry.definitions);
const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: { title: "SIS API", version: "0.1.0" },
});

mkdirSync("openapi", { recursive: true });
writeFileSync("openapi/openapi.json", JSON.stringify(doc, null, 2));
console.log("OpenAPI written to openapi/openapi.json");
