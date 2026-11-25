import { execSync } from 'child_process';

export default async function () {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://abaya:abaya@localhost:5432/abaya_os_test?schema=public';
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore', cwd: __dirname + '/..' });
}
