import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare Workers cannot share one database connection between requests,
// so each request gets its own client. All other files keep using `prisma` as before.
function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is missing");
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

const perRequest = new WeakMap<object, PrismaClient>();
let shared: PrismaClient | undefined;

function currentClient(): PrismaClient {
  try {
    const key = getCloudflareContext().ctx as unknown as object;
    let client = perRequest.get(key);
    if (!client) {
      client = makeClient();
      perRequest.set(key, client);
    }
    return client;
  } catch {
    // No Cloudflare request (for example during local build): use one shared client.
    return (shared ??= makeClient());
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = currentClient() as unknown as Record<string | symbol, unknown>;
    const value = client[property];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
