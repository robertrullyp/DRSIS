import { writeFileSync, mkdirSync } from "fs";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  academicYearCreateSchema,
  gradeCreateSchema,
  semesterCreateSchema,
  classroomCreateSchema,
  subjectCreateSchema,
  curriculumCreateSchema,
  teacherCreateSchema,
  studentCreateSchema,
  enrollmentCreateSchema,
  scheduleCreateSchema,
} from "@/lib/schemas/master";
import { assessmentCreateSchema } from "@/lib/schemas/assessment";
import { libItemCreateSchema, libMemberCreateSchema, libLoanCreateSchema, libSettingsUpdateSchema } from "@/lib/schemas/library";
import { assetCategoryCreateSchema, assetCreateSchema, assetLoanCreateSchema, assetMaintenanceCreateSchema } from "@/lib/schemas/assets";
import { extraCreateSchema, extraMemberCreateSchema, extraEventCreateSchema, extraAttendanceBulkSchema } from "@/lib/schemas/extras";
import { feeRuleCreateSchema, invoiceCreateSchema, paymentCreateSchema } from "@/lib/schemas/finance";
import { savingsAccountCreateSchema, savingsTxnCreateSchema } from "@/lib/schemas/savings";

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

// Teachers
registry.registerPath({ method: "get", path: "/api/master/teachers", description: "List teachers", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/master/teachers", description: "Create teacher (creates user)", request: { body: { content: { "application/json": { schema: teacherCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Students
registry.registerPath({ method: "get", path: "/api/master/students", description: "List students", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/master/students", description: "Create student (creates user)", request: { body: { content: { "application/json": { schema: studentCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Enrollments
registry.registerPath({ method: "get", path: "/api/master/enrollments", description: "List enrollments", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/master/enrollments", description: "Create enrollment", request: { body: { content: { "application/json": { schema: enrollmentCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Schedules
registry.registerPath({ method: "get", path: "/api/master/schedules", description: "List schedules", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/master/schedules", description: "Create schedule", request: { body: { content: { "application/json": { schema: scheduleCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Assessments
registry.registerPath({ method: "get", path: "/api/assessments", description: "List assessments", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/assessments", description: "Create assessment", request: { body: { content: { "application/json": { schema: assessmentCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Report cards
registry.registerPath({ method: "get", path: "/api/report-cards", description: "List report cards", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/report-cards", description: "Generate report cards", responses: { 200: { description: "Generated" } } });

// Admin: users & roles
registry.registerPath({ method: "get", path: "/api/admin/users", description: "List users", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "patch", path: "/api/admin/users/{id}", description: "Update user role/status", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/admin/roles", description: "List roles (with permissions)", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/admin/permissions", description: "List permissions", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "put", path: "/api/admin/roles/{id}/permissions", description: "Replace role permissions", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });

// PPDB
registry.registerPath({ method: "get", path: "/api/ppdb/applications", description: "List PPDB applications", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/ppdb/applications", description: "Create PPDB application", responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "patch", path: "/api/ppdb/applications/{id}", description: "Update PPDB application", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "delete", path: "/api/ppdb/applications/{id}", description: "Delete PPDB application", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/ppdb/applications/{id}/verify", description: "Verify application", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/ppdb/applications/{id}/decide", description: "Accept/Reject (optional auto-enroll)", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/ppdb/applications/{id}", description: "Get PPDB application detail", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });

// Public endpoints
registry.registerPath({ method: "get", path: "/api/public/grades", description: "Public grade options", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/public/storage/presign", description: "Public presign (ppdb/* only)", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/storage/presign-get", description: "Presign GET for object (auth required)", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/public/ppdb/apply", description: "Public submit PPDB application", responses: { 201: { description: "Created" } } });

// Library
registry.registerPath({ method: "get", path: "/api/library/items", description: "List library items", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/library/items", description: "Create library item", request: { body: { content: { "application/json": { schema: libItemCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/library/members", description: "List library members", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/library/members", description: "Create library member", request: { body: { content: { "application/json": { schema: libMemberCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/library/loans", description: "List loans", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/library/loans", description: "Create loan", request: { body: { content: { "application/json": { schema: libLoanCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "post", path: "/api/library/loans/{id}/return", description: "Return loan", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/library/settings", description: "Get library settings", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "patch", path: "/api/library/settings", description: "Update library settings", request: { body: { content: { "application/json": { schema: libSettingsUpdateSchema } } } }, responses: { 200: { description: "OK" } } });

// Assets
registry.registerPath({ method: "get", path: "/api/assets/categories", description: "List asset categories", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/assets/categories", description: "Create asset category", request: { body: { content: { "application/json": { schema: assetCategoryCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/assets", description: "List assets", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/assets", description: "Create asset", request: { body: { content: { "application/json": { schema: assetCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/assets/loans", description: "List asset loans", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/assets/loans", description: "Create asset loan", request: { body: { content: { "application/json": { schema: assetLoanCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "post", path: "/api/assets/loans/{id}/return", description: "Return asset loan", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/assets/maintenances", description: "List asset maintenance records", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/assets/maintenances", description: "Create asset maintenance record", request: { body: { content: { "application/json": { schema: assetMaintenanceCreateSchema } } } }, responses: { 201: { description: "Created" } } });

// Extras
registry.registerPath({ method: "get", path: "/api/extras", description: "List extracurriculars", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/extras", description: "Create extracurricular", request: { body: { content: { "application/json": { schema: extraCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/extras/{id}/members", description: "List members", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/extras/{id}/members", description: "Add member", request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: extraMemberCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "delete", path: "/api/extras/members/{id}", description: "Remove member", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/extras/{id}/attendance", description: "Get attendance for date", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/extras/{id}/attendance", description: "Save attendance", request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: extraAttendanceBulkSchema } } } }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/extras/{id}/events", description: "List events", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/extras/{id}/events", description: "Create event", request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: extraEventCreateSchema } } } }, responses: { 201: { description: "Created" } } });

const generator = new OpenApiGeneratorV3(registry.definitions);
const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: { title: "SIS API", version: "0.1.0" },
});

mkdirSync("openapi", { recursive: true });
writeFileSync("openapi/openapi.json", JSON.stringify(doc, null, 2));
console.log("OpenAPI written to openapi/openapi.json");
registry.registerPath({ method: "get", path: "/api/library/items/{id}/barcodes", description: "List barcodes for item", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/library/items/{id}/barcodes", description: "Add barcode for item", request: { params: z.object({ id: z.string() }) }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "delete", path: "/api/library/barcodes/{id}", description: "Delete barcode by id", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/library/loans/borrow-by-barcode", description: "Borrow by barcode", responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "post", path: "/api/library/loans/return-by-barcode", description: "Return by barcode", responses: { 200: { description: "OK" } } });

// Finance
registry.registerPath({ method: "get", path: "/api/finance/fee-rules", description: "List fee rules", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/finance/fee-rules", description: "Create fee rule", request: { body: { content: { "application/json": { schema: feeRuleCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/finance/invoices", description: "List invoices", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/finance/invoices", description: "Create invoice", request: { body: { content: { "application/json": { schema: invoiceCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/finance/invoices/{id}/payments", description: "List payments", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/finance/invoices/{id}/payments", description: "Create payment", request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: paymentCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/finance/invoices/{id}/receipt", description: "Generate receipt PDF", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/finance/invoices/bulk", description: "Bulk generate invoices", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/finance/reports/summary", description: "Finance summary", responses: { 200: { description: "OK" } } });

// Savings
registry.registerPath({ method: "get", path: "/api/savings/accounts", description: "List savings accounts", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/savings/accounts", description: "Create savings account", request: { body: { content: { "application/json": { schema: savingsAccountCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/savings/transactions", description: "List savings transactions", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/savings/transactions", description: "Create savings transaction", request: { body: { content: { "application/json": { schema: savingsTxnCreateSchema } } } }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/savings/transactions/export", description: "Export savings transactions CSV", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/savings/accounts/{id}/book", description: "Savings passbook PDF", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });

// HR additions
registry.registerPath({ method: "patch", path: "/api/hr/attendance/{id}", description: "Update staff attendance (approve/correct)", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/hr/timesheets", description: "Get timesheet summary", responses: { 200: { description: "OK" } } });

// PPDB public additions
registry.registerPath({ method: "get", path: "/api/public/ppdb/status", description: "Public check status", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/public/ppdb/announcement", description: "Public accepted announcement", responses: { 200: { description: "OK" } } });

// Assets reports
registry.registerPath({ method: "get", path: "/api/assets/reports/depreciation", description: "Monthly asset depreciation report", responses: { 200: { description: "OK" } } });

// Counseling
registry.registerPath({ method: "get", path: "/api/counseling/tickets", description: "List counseling tickets", responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/counseling/tickets", description: "Create counseling ticket", responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/counseling/tickets/{id}", description: "Get ticket detail", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "patch", path: "/api/counseling/tickets/{id}", description: "Update ticket", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "get", path: "/api/counseling/tickets/{id}/sessions", description: "List sessions", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/counseling/tickets/{id}/sessions", description: "Create session", request: { params: z.object({ id: z.string() }) }, responses: { 201: { description: "Created" } } });
registry.registerPath({ method: "get", path: "/api/counseling/tickets/{id}/referrals", description: "List referrals", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "OK" } } });
registry.registerPath({ method: "post", path: "/api/counseling/tickets/{id}/referrals", description: "Create referral", request: { params: z.object({ id: z.string() }) }, responses: { 201: { description: "Created" } } });

// Regenerate OpenAPI to include the additional endpoints
const generator2 = new OpenApiGeneratorV3(registry.definitions);
const doc2 = generator2.generateDocument({
  openapi: "3.0.0",
  info: { title: "SIS API", version: "0.1.0" },
});
writeFileSync("openapi/openapi.json", JSON.stringify(doc2, null, 2));
console.log("OpenAPI updated with additional endpoints");
