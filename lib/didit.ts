import crypto from 'node:crypto';

const base = process.env.DIDIT_API_URL || 'https://verification.didit.me';

export async function createDiditSession(vendorData: string) {
  const apiKey = process.env.DIDIT_API_KEY;
  const workflowId = process.env.DIDIT_WORKFLOW_ID;
  if (!apiKey || !workflowId) throw new Error('DIDIT_NOT_CONFIGURED');
  const response = await fetch(`${base}/v3/session/`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ workflow_id: workflowId, vendor_data: vendorData }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`DIDIT_CREATE_${response.status}:${JSON.stringify(data)}`);
  return data as { session_id?: string; url?: string; [key: string]: unknown };
}

function sortKeys(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((o, k) => { o[k] = sortKeys(value[k]); return o; }, {} as Record<string, unknown>);
  return value;
}

function shortenFloats(value: any): any {
  if (Array.isArray(value)) return value.map(shortenFloats);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shortenFloats(v)]));
  if (typeof value === 'number' && !Number.isInteger(value) && value % 1 === 0) return Math.trunc(value);
  return value;
}

export function verifyDiditSignature(rawBody: string, signature: string | null, timestamp: string | null) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false;
  let parsed: any;
  try { parsed = JSON.parse(rawBody); } catch { return false; }
  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));
  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(signature.trim(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
