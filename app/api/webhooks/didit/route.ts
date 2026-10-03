import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verify(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
function pick(obj: any, paths: string[]) { for (const path of paths) { const value = path.split(".").reduce((a: any, k) => a?.[k], obj); if (value != null) return value; } return undefined; }

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 503 });
  const signature = req.headers.get("x-signature-v2") ?? "";
  if (!verify(raw, signature, secret)) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  const payload = JSON.parse(raw);
  const sessionId = String(pick(payload, ["session_id", "sessionId", "data.session_id", "data.sessionId"]) ?? "");
  const status = String(pick(payload, ["status", "decision", "data.status"]) ?? "").toLowerCase();
  const vendorData = String(pick(payload, ["vendor_data", "vendorData", "data.vendor_data"]) ?? "");
  const kyc = sessionId ? await prisma.kycVerification.findFirst({ where: { externalId: sessionId } }) : vendorData ? await prisma.kycVerification.findFirst({ where: { userId: vendorData }, orderBy: { createdAt: "desc" } }) : null;
  if (!kyc) return NextResponse.json({ ok: true, received: true });
  const verified = ["approved", "verified", "completed", "success"].includes(status);
  const rejected = ["rejected", "failed", "declined", "expired"].includes(status);
  const next = verified ? "VERIFIED" : rejected ? "REJECTED" : "IN_REVIEW";
  await prisma.$transaction([
    prisma.kycVerification.update({ where: { id: kyc.id }, data: { status: next as any, decision: status || null, rawMetadata: payload } }),
    prisma.user.update({ where: { id: kyc.userId }, data: { kycStatus: next as any } }),
  ]);
  return NextResponse.json({ ok: true });
}
