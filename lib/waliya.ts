const baseUrl = process.env.WALIYA_API_URL ?? "https://waliyatopup.com/api";

type TokenResponse = { status: string; bearer_token?: string; message?: string };

export async function getWaliyaToken() {
  const publicKey = process.env.WALIYA_PUBLIC_KEY;
  const secretKey = process.env.WALIYA_SECRET_KEY;
  if (!publicKey || !secretKey) throw new Error("Missing Waliya server credentials");
  const res = await fetch(`${baseUrl}/generate/authorization-token`, {
    method: "POST",
    headers: { PublicKey: publicKey, SecretKey: secretKey },
    cache: "no-store",
  });
  const body = (await res.json()) as TokenResponse;
  if (!res.ok || body.status !== "success" || !body.bearer_token) throw new Error(body.message ?? "Waliya token generation failed");
  return body.bearer_token;
}

export async function waliyaRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getWaliyaToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", token);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status === "failed") throw new Error(body?.message ?? body?.errors ?? `Waliya request failed: ${res.status}`);
  return body as T;
}

export function extractMessage<T = any>(body: any): T {
  return (body?.message ?? body?.data ?? body) as T;
}

export function toEtb(providerPrice: number, currency: string) {
  const c = currency.toUpperCase();
  if (c === "ETB" || c === "BIRR") return providerPrice;
  const rate = Number(process.env.WALIYA_USD_ETB_RATE);
  if (!rate || !Number.isFinite(rate)) throw new Error("WALIYA_USD_ETB_RATE is required for non-ETB Waliya prices");
  return providerPrice * rate;
}

export async function getTopUps() {
  const body = await waliyaRequest<any>("/top-up/list?status=1");
  const rows = Array.isArray(body?.message?.data) ? body.message.data : Array.isArray(body?.data) ? body.data : Array.isArray(body?.message) ? body.message : [];
  return rows;
}

export async function getTopUpDetails(slug: string) {
  return waliyaRequest<any>(`/top-up/details?slug=${encodeURIComponent(slug)}`);
}

export async function makeTopUpOrder(input: { topUpId: number; serviceId: number; playerId: string; zoneName?: string }) {
  const form = new FormData();
  form.append("topUpId", String(input.topUpId));
  form.append("serviceId", String(input.serviceId));
  form.append("Player_Id", input.playerId);
  if (input.zoneName) form.append("Zone_Name", input.zoneName);
  return waliyaRequest<any>("/top-up/make-order", { method: "POST", body: form });
}

export async function getTopUpOrders() {
  return waliyaRequest<any>("/get-topup/orders");
}
