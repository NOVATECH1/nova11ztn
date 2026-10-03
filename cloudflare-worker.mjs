// Cloudflare entry file. It runs the website AND the hourly timer.
// `.open-next/worker.js` is created by `npm run deploy` / `npm run preview`.
import openNextWorker from "./.open-next/worker.js";

export default {
  fetch: openNextWorker.fetch,

  // Hourly timer: calls the auto-complete route with CRON_SECRET.
  async scheduled(_controller, env, ctx) {
    if (!env.CRON_SECRET) {
      console.error("CRON_SECRET is missing. Auto-complete cron skipped.");
      return;
    }
    const request = new Request("https://ztn.internal/api/cron/auto-complete", {
      method: "GET",
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const response = await openNextWorker.fetch(request, env, ctx);
    if (!response.ok) console.error("Auto-complete cron failed with status", response.status);
  },
};
