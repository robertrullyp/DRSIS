import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export type ApiAuthContext = {
  userId: string;
  roles: string[];
  permissions: string[];
};

export type ApiAuthResult =
  | { ok: true; context: ApiAuthContext }
  | { ok: false; response: NextResponse };

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function hasAnyPermission(
  context: Pick<ApiAuthContext, "roles" | "permissions">,
  requiredPermissions: string[],
) {
  if (context.roles.includes("admin")) return true;
  return requiredPermissions.some((permission) => context.permissions.includes(permission));
}

export async function requireApiPermission(
  req: NextRequest,
  requiredPermissions: string | string[],
): Promise<ApiAuthResult> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const context: ApiAuthContext = {
    userId,
    roles: asStringArray((token as { roles?: unknown } | null)?.roles),
    permissions: asStringArray((token as { permissions?: unknown } | null)?.permissions),
  };
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  if (!hasAnyPermission(context, permissions)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, context };
}

export async function requireApiUser(req: NextRequest): Promise<ApiAuthResult> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return {
    ok: true,
    context: {
      userId,
      roles: asStringArray((token as { roles?: unknown } | null)?.roles),
      permissions: asStringArray((token as { permissions?: unknown } | null)?.permissions),
    },
  };
}
