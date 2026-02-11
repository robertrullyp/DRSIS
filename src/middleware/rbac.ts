import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";

type Rule = {
  matcher: RegExp;
  anyRole?: string[];
  allPermissions?: string[];
  anyPermissions?: string[];
  allowAuthenticated?: boolean;
};

// Basic RBAC rules – extend as needed
export const rules: Rule[] = [
  {
    matcher: /^\/api\/admin\/cms\b/,
    anyRole: ["admin", "operator", "editor"],
    anyPermissions: ["cms.read", "cms.write", "cms.publish", "cms.admin"],
  },
  { matcher: /^\/api\/admin\b/, anyRole: ["admin"] },
  {
    matcher: /^\/api\/school\b/,
    anyRole: ["admin"],
    anyPermissions: ["master.write"],
  },
  {
    matcher: /^\/api\/finance\b/,
    anyRole: ["admin", "finance"],
    anyPermissions: ["finance.manage"],
  },
  {
    matcher: /^\/api\/master\b/,
    anyRole: ["admin"],
    anyPermissions: ["master.write"],
  },
  {
    matcher: /^\/api\/library\b/,
    anyRole: ["admin", "librarian"],
    anyPermissions: ["library.manage"],
  },
  {
    matcher: /^\/api\/ppdb\b/,
    anyRole: ["admin"],
    anyPermissions: ["ppdb.manage"],
  },
  {
    matcher: /^\/api\/assets\b/,
    anyRole: ["admin"],
    anyPermissions: ["asset.manage"],
  },
  {
    matcher: /^\/api\/extras\b/,
    anyRole: ["admin"],
    anyPermissions: ["extra.manage"],
  },
  {
    matcher: /^\/api\/savings\b/,
    anyRole: ["admin", "finance"],
    anyPermissions: ["savings.manage"],
  },
  {
    matcher: /^\/api\/counseling\b/,
    anyRole: ["admin"],
    anyPermissions: ["counsel.manage"],
  },
  {
    matcher: /^\/api\/assessments\b/,
    anyRole: ["admin", "teacher"],
    anyPermissions: ["assessment.manage"],
  },
  {
    matcher: /^\/api\/report-cards\b/,
    anyRole: ["admin"],
    anyPermissions: ["report.review", "report.approve"],
  },
  {
    matcher: /^\/api\/hr\b/,
    anyRole: ["admin"],
  },
  {
    matcher: /^\/api\/attendance\b/,
    anyRole: ["admin", "teacher"],
    anyPermissions: ["attendance.student.manage"],
  },
  {
    matcher: /^\/api\/portal\b/,
    anyRole: [
      "admin",
      "teacher",
      "student",
      "parent",
      "guardian",
      "staff",
      "employee",
      "finance",
      "librarian",
    ],
  },
  {
    matcher: /^\/api\/storage\b/,
    anyRole: ["admin", "teacher", "staff", "employee", "finance", "librarian"],
  },
];

const sensitiveApiPrefixes = [
  "/api/admin",
  "/api/school",
  "/api/finance",
  "/api/master",
  "/api/library",
  "/api/ppdb",
  "/api/assets",
  "/api/extras",
  "/api/savings",
  "/api/counseling",
  "/api/assessments",
  "/api/report-cards",
  "/api/hr",
  "/api/attendance",
  "/api/portal",
  "/api/storage",
];

function isUnderPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function checkAccess(
  req: NextRequest,
  token: (JWT & { roles?: string[]; permissions?: string[] }) | null
) {
  const path = req.nextUrl.pathname;
  const cronSecret = process.env.CRON_SECRET;

  // Allow scheduler calls for cron tick when secret header is valid.
  if (
    path === "/api/admin/cron/tick" &&
    cronSecret &&
    req.headers.get("x-cron-key") === cronSecret
  ) {
    return true;
  }

  // Public endpoints
  if (
    path.startsWith("/api/health") ||
    path.startsWith("/api/public") ||
    path.startsWith("/api/auth")
  )
    return true;
  // Public pages (PPDB apply)
  if (
    path === "/" ||
    path === "/berita" ||
    path.startsWith("/berita/") ||
    path === "/agenda" ||
    path.startsWith("/agenda/") ||
    path === "/galeri" ||
    path.startsWith("/galeri/") ||
    path === "/kontak" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/manifest.webmanifest" ||
    path.startsWith("/p/") ||
    path.startsWith("/ppdb/apply") ||
    path.startsWith("/ppdb/announcement") ||
    path.startsWith("/ppdb/status")
  )
    return true;

  // Auth pages & static assets
  if (
    path.startsWith("/sign-in") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/images")
  )
    return true;

  // Require authenticated user
  if (!token?.sub) return false;

  const roles: string[] = token?.roles ?? [];
  const perms: string[] = token?.permissions ?? [];

  for (const rule of rules) {
    if (!rule.matcher.test(path)) continue;
    if (rule.allowAuthenticated) return true;
    if (rule.anyRole && rule.anyRole.some((r) => roles.includes(r))) return true;
    if (rule.allPermissions && rule.allPermissions.every((p) => perms.includes(p))) return true;
    if (rule.anyPermissions && rule.anyPermissions.some((p) => perms.includes(p))) return true;
    return false;
  }

  if (path.startsWith("/api") && sensitiveApiPrefixes.some((prefix) => isUnderPrefix(path, prefix))) {
    return false;
  }

  // Default: authenticated access
  return true;
}
