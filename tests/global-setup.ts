import { execSync } from 'node:child_process';

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  execSync(cmd, {
    stdio: 'inherit',
    env: env ?? process.env,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withConnectTimeout(url: string) {
  if (!url) return url;
  if (/connect_timeout=/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=5`;
}

async function ensureDb() {
  const selected = withConnectTimeout(
    process.env.E2E_DATABASE_URL ||
      process.env.DATABASE_URL ||
      'mysql://sis:sis@127.0.0.1:3306/sis'
  );

  let ready = false;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      run('npx prisma db push --skip-generate --accept-data-loss', { ...process.env, DATABASE_URL: selected });
      ready = true;
      break;
    } catch {
      if (attempt < 20) {
        await sleep(2000);
      }
    }
  }

  if (!ready) {
    throw new Error(
      `[global-setup] Could not connect to E2E MariaDB (${selected}). ` +
        'Set E2E_DATABASE_URL (or DATABASE_URL) to a reachable MySQL/MariaDB instance.'
    );
  }

  // Generate Prisma client and seed using the selected connection.
  run('npx prisma generate', { ...process.env, DATABASE_URL: selected });
  run('npm run db:seed', { ...process.env, DATABASE_URL: selected });
}

export default async function globalSetup() {
  await ensureDb();
}
