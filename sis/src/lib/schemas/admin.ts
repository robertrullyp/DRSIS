import { z } from "zod";

export const rolePermissionsUpdateSchema = z.object({
  permissionIds: z.array(z.string()).default([]),
});

