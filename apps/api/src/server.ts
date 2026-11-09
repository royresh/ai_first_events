import { createDb } from '@aifirst/db';
import { buildApp } from './app';
import { loadConfig } from './config';
import { createMailer } from './services/mailer';

export async function startServer(): Promise<void> {
  const config = loadConfig();
  const { db, close } = createDb(config.DATABASE_URL);
  const mailer = createMailer({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    from: config.MAIL_FROM,
  });
  const app = buildApp({ db, mailer }, { logger: { level: config.LOG_LEVEL } });

  const shutdown = async () => {
    await app.close();
    mailer.close();
    await close();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  await app.listen({ port: config.API_PORT, host: config.API_HOST });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
