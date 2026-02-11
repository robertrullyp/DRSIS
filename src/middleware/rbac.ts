import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";

type Rule = {
  matcher: RegExp;
  anyRole?: string[];
  allPermissions?: string[];
  anyPermissions?: string[];
};

// Basic RBAC rules – extend as needed
export const rules: Rule[] = [
  { matcher: /^\/api\/admin\b/, anyRole: ["admin"] },
  {
    matcher: /^\/api\/finance\b/,
    anyRole: ["admin", "finance"],
    anyPermissions: ["finance.manage"],
  },
  {
    matcher: /^\/api\/master\b/,
    anyRole: ["admin"],
    anyPermissions: ["master.manage"],
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
];

export function checkAccess(
  req: NextRequest,
  token: (JWT & { roles?: string[]; permissions?: string[] }) | null
) {
  const path = req.nextUrl.pathname;
  // Public endpoints
  if (
    path.startsWith("/api/health") ||
    path.startsWith("/api/public") ||
    path.startsWith("/api/auth")
  )
    return true;
  // Public pages (PPDB apply)
  if (path === "/" || path.startsWith("/ppdb/apply") || path.startsWith("/ppdb/announcement") || path.startsWith("/ppdb/status")) return true;

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
    if (rule.anyRole && rule.anyRole.some((r) => roles.includes(r))) return true;
    if (rule.allPermissions && rule.allPermissions.every((p) => perms.includes(p))) return true;
    if (rule.anyPermissions && rule.anyPermissions.some((p) => perms.includes(p))) return true;
    return false;
  }

  // Default: authenticated access
  return true;
}
