// Waliya (waliyatopup.com) - Free Fire top-up supplier.
// No webhook: we must poll get-topup/orders to learn the real result.
// No order id is returned from make-order, so we match by time + player id.

const BASE_URL = process.env.WALIYA_API_URL || 'https://waliyatopup.com/api';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const publicKey = process.env.WALIYA_PUBLIC_KEY;
  const secretKey = process.env.WALIYA_SECRET_KEY;
  if (!publicKey || !secretKey) throw new Error('WALIYA_NOT_CONFIGURED');
  const res = await fetch(`${BASE_URL}/generate/authorization-token`, {
    method: 'POST',
    headers: { PublicKey: publicKey, SecretKey: secretKey, 'content-type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.bearer_token) throw new Error(data?.message || 'WALIYA_AUTH_FAILED');
  // Cache for 50 minutes; refetch a token before it can expire mid-request.
  cachedToken = { token: data.bearer_token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.bearer_token;
}

async function waliya<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `WALIYA_${res.status}`);
  return data;
}

export async function listTopUps() {
  return waliya('top-up/list');
}

export async function getTopUpServices(topUpId: string) {
  return waliya(`topup/services?top_up_id=${encodeURIComponent(topUpId)}`);
}

/** Reads the current ETB price for one package. Throws if the currency is not ETB. */
export async function getPackagePrice(topUpId: string, serviceId: string): Promise<number> {
  const services = await getTopUpServices(topUpId);
  const list = Array.isArray(services?.data) ? services.data : services?.services || [];
  const service = list.find((s: any) => String(s.id ?? s.service_id) === String(serviceId));
  if (!service) throw new Error('WALIYA_PACKAGE_NOT_FOUND');
  const currency = String(service.currency || service.currency_code || 'ETB').toUpperCase();
  if (currency !== 'ETB') throw new Error(`WALIYA_UNEXPECTED_CURRENCY_${currency}`);
  const price = Number(service.price ?? service.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error('WALIYA_INVALID_PRICE');
  return price;
}

/** ZTN sell price = Waliya price + 5 birr flat, rounded up to the nearest birr. */
export function ztnSellPrice(waliyaPriceEtb: number): number {
  return Math.ceil(waliyaPriceEtb) + 5;
}

export async function placeOrder(input: { topUpId: string; serviceId: string; playerId: string; zoneName?: string }) {
  const order_information: Record<string, string> = { Player_Id: input.playerId };
  if (input.zoneName) order_information.Zone_Name = input.zoneName;
  return waliya('top-up/make-order', {
    method: 'POST',
    body: JSON.stringify({ topUpId: input.topUpId, serviceId: input.serviceId, order_information }),
  });
}

/** Waliya gives no order id, so we poll and match by player id + a time window around when we placed the order. */
export async function findOrderStatus(playerId: string, placedAfter: Date) {
  const res = await waliya(`get-topup/orders`);
  const list = Array.isArray(res?.data) ? res.data : res?.orders || [];
  const match = list.find((o: any) => {
    const pid = String(o.order_information?.Player_Id ?? o.player_id ?? '');
    const createdAt = new Date(o.created_at ?? o.createdAt ?? 0);
    return pid === playerId && createdAt >= new Date(placedAfter.getTime() - 5 * 60 * 1000);
  });
  if (!match) return { found: false as const };
  // 0 initiate, 1 completed, 2 refund, 3 stock_short
  const status = Number(match.status);
  const label = status === 1 ? 'COMPLETED' : status === 2 ? 'REFUNDED' : status === 3 ? 'OUT_OF_STOCK' : 'PENDING';
  return { found: true as const, status: label, raw: match };
}
