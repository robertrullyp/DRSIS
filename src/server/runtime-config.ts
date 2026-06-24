export type RuntimeConfigCheck = {
  ok: boolean;
  code: string;
  message: string;
};

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPostgresUrl(value: string | undefined) {
  if (!hasValue(value)) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

export function validateRuntimeConfig(): RuntimeConfigCheck[] {
  const checks: RuntimeConfigCheck[] = [
    {
      ok: isPostgresUrl(process.env.DATABASE_URL),
      code: "DATABASE_URL_POSTGRESQL",
      message: "DATABASE_URL must be a postgresql:// or postgres:// URL.",
    },
    {
      ok: hasValue(process.env.NEXTAUTH_SECRET),
      code: "NEXTAUTH_SECRET_PRESENT",
      message: "NEXTAUTH_SECRET must be set.",
    },
    {
      ok: hasValue(process.env.NEXTAUTH_URL),
      code: "NEXTAUTH_URL_PRESENT",
      message: "NEXTAUTH_URL must be set.",
    },
  ];

  return checks;
}
