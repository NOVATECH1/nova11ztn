const baseUrl = process.env.VERITAS_API_URL ?? "https://verifyapi.leulzenebe.pro";

export async function veritasRequest<T>(path: string, init: RequestInit = {}) {
  const key = process.env.VERITAS_API_KEY;
  if (!key) throw new Error("VERITAS_API_KEY is required");
  const headers = new Headers(init.headers);
  headers.set("x-api-key", key);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) throw new Error(body?.error ?? body?.message ?? `Veritas request failed: ${response.status}`);
  return body as T;
}
