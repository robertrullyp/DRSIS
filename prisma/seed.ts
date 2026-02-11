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
    // CMS
    "cms.read",
    "cms.write",
    "cms.publish",
    "cms.admin",
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

  const [adminRole, teacherRole, , staffRole, employeeRole, financeRole, librarianRole, parentRole, guardianRole, operatorRole, editorRole] = await Promise.all([
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
      where: { name: "employee" },
      update: {},
      create: {
        name: "employee",
        displayName: "Employee",
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
    prisma.role.upsert({
      where: { name: "parent" },
      update: {},
      create: {
        name: "parent",
        displayName: "Parent",
      },
    }),
    prisma.role.upsert({
      where: { name: "guardian" },
      update: {},
      create: {
        name: "guardian",
        displayName: "Guardian",
      },
    }),
    prisma.role.upsert({
      where: { name: "operator" },
      update: {},
      create: {
        name: "operator",
        displayName: "Operator",
      },
    }),
    prisma.role.upsert({
      where: { name: "editor" },
      update: {},
      create: {
        name: "editor",
        displayName: "Editor",
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
      data: rp(employeeRole.id, ["attendance.staff.manage", "analytics.read"]),
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
    prisma.rolePermission.createMany({
      data: rp(parentRole.id, ["analytics.read"]),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(guardianRole.id, ["analytics.read"]),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(operatorRole.id, ["analytics.read", "cms.read", "cms.write"]),
      skipDuplicates: true,
    }),
    prisma.rolePermission.createMany({
      data: rp(editorRole.id, ["analytics.read", "cms.read", "cms.write", "cms.publish"]),
      skipDuplicates: true,
    }),
  ]);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@sis.local";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123"; // TODO: change in prod
  const passwordHash = await bcrypt.hash(adminPass, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "System Admin",
      passwordHash: passwordHash,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      name: "System Admin",
      passwordHash: passwordHash,
      roleId: adminRole.id,
    },
  });

  const [mainMenu, footerMenu, profilePage, privacyPage] = await Promise.all([
    prisma.cmsMenu.upsert({
      where: { name: "main" },
      update: {},
      create: {
        name: "main",
        description: "Main public navigation",
      },
    }),
    prisma.cmsMenu.upsert({
      where: { name: "footer" },
      update: {},
      create: {
        name: "footer",
        description: "Footer navigation",
      },
    }),
    prisma.cmsPage.upsert({
      where: { slug: "profil-sekolah" },
      update: {
        title: "Profil Sekolah",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        title: "Profil Sekolah",
        slug: "profil-sekolah",
        excerpt: "Profil singkat sekolah.",
        content: "Halaman profil sekolah.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdBy: adminUser.id,
        publishedBy: adminUser.id,
      },
    }),
    prisma.cmsPage.upsert({
      where: { slug: "kebijakan-privasi" },
      update: {
        title: "Kebijakan Privasi",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        title: "Kebijakan Privasi",
        slug: "kebijakan-privasi",
        excerpt: "Kebijakan penggunaan data.",
        content: "Kebijakan privasi portal sekolah.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdBy: adminUser.id,
        publishedBy: adminUser.id,
      },
    }),
  ]);

  const [mainCount, footerCount] = await Promise.all([
    prisma.cmsMenuItem.count({ where: { menuId: mainMenu.id } }),
    prisma.cmsMenuItem.count({ where: { menuId: footerMenu.id } }),
  ]);

  await prisma.cmsPost.upsert({
    where: { slug: "selamat-datang-di-portal-publik" },
    update: {
      title: "Selamat Datang di Portal Publik Sekolah",
      excerpt: "Portal publik kini mendukung publikasi berita dan artikel.",
      content:
        "Portal publik sekolah telah aktif. Gunakan modul CMS untuk mengelola berita, artikel, dan halaman statis.",
      type: "NEWS",
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: adminUser.id,
      updatedBy: adminUser.id,
    },
    create: {
      title: "Selamat Datang di Portal Publik Sekolah",
      slug: "selamat-datang-di-portal-publik",
      excerpt: "Portal publik kini mendukung publikasi berita dan artikel.",
      content:
        "Portal publik sekolah telah aktif. Gunakan modul CMS untuk mengelola berita, artikel, dan halaman statis.",
      type: "NEWS",
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
      publishedBy: adminUser.id,
      authorId: adminUser.id,
    },
  });

  await prisma.cmsEvent.upsert({
    where: { slug: "open-house-sekolah" },
    update: {
      title: "Open House Sekolah",
      description: "Kegiatan kunjungan dan presentasi program sekolah untuk calon siswa dan orang tua.",
      location: "Aula Utama",
      startAt: new Date("2026-03-15T08:00:00.000Z"),
      endAt: new Date("2026-03-15T11:00:00.000Z"),
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedBy: adminUser.id,
      publishedBy: adminUser.id,
    },
    create: {
      title: "Open House Sekolah",
      slug: "open-house-sekolah",
      description: "Kegiatan kunjungan dan presentasi program sekolah untuk calon siswa dan orang tua.",
      location: "Aula Utama",
      startAt: new Date("2026-03-15T08:00:00.000Z"),
      endAt: new Date("2026-03-15T11:00:00.000Z"),
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
      publishedBy: adminUser.id,
    },
  });

  if (mainCount === 0) {
    await prisma.cmsMenuItem.createMany({
      data: [
        { menuId: mainMenu.id, label: "Beranda", type: "INTERNAL", href: "/", order: 1, isActive: true },
        { menuId: mainMenu.id, label: "Profil Sekolah", type: "PAGE", pageId: profilePage.id, order: 2, isActive: true },
        { menuId: mainMenu.id, label: "Berita", type: "INTERNAL", href: "/berita", order: 3, isActive: true },
        { menuId: mainMenu.id, label: "Agenda", type: "INTERNAL", href: "/agenda", order: 4, isActive: true },
        { menuId: mainMenu.id, label: "Galeri", type: "INTERNAL", href: "/galeri", order: 5, isActive: true },
        { menuId: mainMenu.id, label: "Kontak", type: "INTERNAL", href: "/kontak", order: 6, isActive: true },
        { menuId: mainMenu.id, label: "PPDB", type: "INTERNAL", href: "/ppdb/announcement", order: 7, isActive: true },
      ],
    });
  }

  const agendaMenuItem = await prisma.cmsMenuItem.findFirst({
    where: { menuId: mainMenu.id, href: "/agenda", parentId: null },
    select: { id: true },
  });

  if (!agendaMenuItem) {
    const nextOrder = await prisma.cmsMenuItem.count({ where: { menuId: mainMenu.id, parentId: null } });
    await prisma.cmsMenuItem.create({
      data: {
        menuId: mainMenu.id,
        label: "Agenda",
        type: "INTERNAL",
        href: "/agenda",
        order: nextOrder + 1,
        isActive: true,
      },
    });
  }

  const contactMenuItem = await prisma.cmsMenuItem.findFirst({
    where: { menuId: mainMenu.id, href: "/kontak", parentId: null },
    select: { id: true },
  });

  if (!contactMenuItem) {
    const nextOrder = await prisma.cmsMenuItem.count({ where: { menuId: mainMenu.id, parentId: null } });
    await prisma.cmsMenuItem.create({
      data: {
        menuId: mainMenu.id,
        label: "Kontak",
        type: "INTERNAL",
        href: "/kontak",
        order: nextOrder + 1,
        isActive: true,
      },
    });
  }

  if (footerCount === 0) {
    await prisma.cmsMenuItem.createMany({
      data: [
        { menuId: footerMenu.id, label: "Profil Sekolah", type: "PAGE", pageId: profilePage.id, order: 1, isActive: true },
        { menuId: footerMenu.id, label: "Kebijakan Privasi", type: "PAGE", pageId: privacyPage.id, order: 2, isActive: true },
      ],
    });
  }

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
