import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsInboxExportQuerySchema } from "@/server/cms/dto/contact.dto";
import { listCmsInboxMessagesForExport } from "@/server/cms/inbox.service";

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  const query = cmsInboxExportQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const rows = await listCmsInboxMessagesForExport(query.data);
  const header = [
    "id",
    "name",
    "email",
    "phone",
    "subject",
    "message",
    "isRead",
    "isResolved",
    "createdAt",
    "updatedAt",
    "ip",
    "userAgent",
    "referer",
    "source",
  ];

  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.name,
        row.email,
        row.phone,
        row.subject,
        row.message,
        row.isRead,
        row.isResolved,
        row.createdAt.toISOString(),
        row.updatedAt.toISOString(),
        row.meta?.ip || "",
        row.meta?.userAgent || "",
        row.meta?.referer || "",
        row.meta?.source || "",
      ]
        .map((value) => escapeCsvCell(value))
        .join(",")
    );
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `cms-inbox-${dateStamp}.csv`;
  const csv = `\uFEFF${lines.join("\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
