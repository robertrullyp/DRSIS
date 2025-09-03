import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    // Master Data
    "master.read",
    "master.write",
    // Attendance
    "attendance.student.manage",
    "attendance.staff.manage",
    // Assessment & Report
    "assessment.manage",
    "report.review",
    "report.approve",
    // PPDB
    "ppdb.manage",
    // Finance
    "finance.manage",
    "finance.view",
    // Savings
    "savings.manage",
    // Library
    "library.manage",
    // Assets
    "asset.manage",
    // Extracurricular
    "extra.manage",
    // Counseling
    "counsel.manage",
    // Exams
    "exam.manage",
    // Notifications
    "notify.wa.send",
    // Analytics
    "analytics.read",
  ];

  const permRecords = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { name: p },
        update: {},
        create: { name: p, description: p },
      })
    )
  );

  const allPerms = permRecords.map((p) => ({ id: p.id }));

  const [adminRole, teacherRole, studentRole, staffRole, financeRole, librarianRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: {
        name: "admin",
        displayName: "Administrator",
        
      },
    }),
    prisma.role.upsert({
      where: { name: "teacher" },
      update: {},
      create: {
        name: "teacher",
        displayName: "Teacher",
        
      },
    }),
    prisma.role.upsert({
      where: { name: "student" },
      update: {},
      create: {
        name: "student",
        displayName: "Student",
        
      },
    }),
    prisma.role.upsert({
      where: { name: "staff" },
      update: {},
      create: {
        name: "staff",
        displayName: "Staff",
        
      },
    }),
    prisma.role.upsert({
      where: { name: "finance" },
      update: {},
      create: {
        name: "finance",
        displayName: "Finance",
        
      },
    }),
    prisma.role.upsert({
      where: { name: "librarian" },
      update: {},
      create: {
        name: "librarian",
        displayName: "Librarian",
        
      },
    }),
  ]);

  // Map Role -> Permissions into RolePermission join
  const permsByName = new Map(permRecords.map((p) => [p.name, p.id] as const));
  function rp(roleId: string, names: string[]) {
    return names
      .map((n) => permsByName.get(n))
      .filter((v): v is string => Boolean(v))
      .map((pid) => ({ roleId, permissionId: pid }));
  }
  await Promise.all([
    prisma.rolePermission.createMany({
      data: rp(adminRole.id, permissions),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(
        teacherRole.id,
        [
          "master.read",
          "attendance.student.manage",
          "assessment.manage",
          "report.review",
          "analytics.read",
        ]
      ),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(staffRole.id, ["attendance.staff.manage", "analytics.read"]),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(financeRole.id, ["finance.manage", "analytics.read"]),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(librarianRole.id, ["library.manage", "analytics.read"]),
      skipDuplicates: true,
    }),
  ]);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@sis.local";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123"; // TODO: change in prod
  const passwordHash = await bcrypt.hash(adminPass, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "System Admin",
      passwordHash: passwordHash,
      roleId: adminRole.id,
    },
  });

  console.log("Seed complete. Admin credentials:");
  console.log({ email: adminUser.email, password: adminPass });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


