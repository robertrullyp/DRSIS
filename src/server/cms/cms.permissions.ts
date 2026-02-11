import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export type CmsAction = "read" | "write" | "publish" | "admin";

export type CmsAuthContext = {
  userId: string;
  roles: string[];
  permissions: string[];
};

const cmsReadPermissions = ["cms.read", "cms.write", "cms.publish", "cms.admin"];
const cmsWritePermissions = ["cms.write", "cms.publish", "cms.admin"];
const cmsPublishPermissions = ["cms.publish", "cms.admin"];
const cmsAdminPermissions = ["cms.admin"];

function canDoCmsAction(roles: string[], permissions: string[], action: CmsAction) {
  if (roles.includes("admin")) return true;

  if (action === "read") {
    return permissions.some((permission) => cmsReadPermissions.includes(permission));
  }

  if (action === "write") {
    return permissions.some((permission) => cmsWritePermissions.includes(permission));
  }

  if (action === "publish") {
    return permissions.some((permission) => cmsPublishPermissions.includes(permission));
  }

  return permissions.some((permission) => cmsAdminPermissions.includes(permission));
}

export async function authorizeCmsRequest(req: NextRequest, action: CmsAction) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roles = ((token as { roles?: string[] } | null)?.roles ?? []) as string[];
  const permissions = ((token as { permissions?: string[] } | null)?.permissions ?? []) as string[];

  if (!canDoCmsAction(roles, permissions, action)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    context: {
      userId,
      roles,
      permissions,
    } satisfies CmsAuthContext,
  };
}
