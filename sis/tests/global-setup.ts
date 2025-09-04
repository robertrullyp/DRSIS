import { execSync } from 'node:child_process';

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  execSync(cmd, {
    stdio: 'inherit',
    env: env ?? process.env,
  });
}

async function ensureDb() {
  // Try multiple candidate DATABASE_URL values using local MariaDB defaults.
  const candidates = [
    process.env.DATABASE_URL, // respect current env if set by user
    'mysql://sis:sis@localhost:3306/sis',
    'mysql://root@localhost:3306/sis',
    'mysql://root:root@localhost:3306/sis',
  ].filter(Boolean) as string[];

  let selected: string | null = null;
  for (const url of candidates) {
    try {
      run('npx prisma db push --skip-generate', { ...process.env, DATABASE_URL: url });
      selected = url;
      break;
    } catch (e) {
      // try next candidate
    }
  }

  if (!selected) {
    console.warn('[global-setup] Could not connect to local MariaDB with tested credentials. Proceeding without DB.');
    return;
  }

  // Generate Prisma client and seed using the selected connection.
  run('npx prisma generate', { ...process.env, DATABASE_URL: selected });
  try {
    run('npm run db:seed', { ...process.env, DATABASE_URL: selected });
  } catch (e) {
    console.warn('[global-setup] Seeding failed; continuing.');
  }
}

export default async function globalSetup() {
  try {
    await ensureDb();
  } catch (e) {
    console.warn('[global-setup] DB preparation failed:', e);
  }
}

