// ESSAI story 10.1 : point d'entrée Worker personnalisé. fetch délégué à Astro, scheduled porté ici.
import { handle } from '@astrojs/cloudflare/handler';

export default {
  fetch: handle,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS essai_cron (at TEXT, cron TEXT)').run();
    await env.DB.prepare('INSERT INTO essai_cron (at, cron) VALUES (?, ?)')
      .bind(new Date(controller.scheduledTime).toISOString(), controller.cron)
      .run();
    console.log(JSON.stringify({ evt: 'scheduled', cron: controller.cron }));
  },
} satisfies ExportedHandler<Env>;
