import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";
import { getTopUpDetails, getTopUps, toEtb, extractMessage } from "@/lib/waliya";

function instagramFollowerPrice(qty: number) {
  if (!Number.isInteger(qty) || qty < 100 || qty > 5000 || qty % 100 !== 0) throw new Error("Followers quantity must be a multiple of 100, from 100 to 5,000");
  const discount = Math.min(Math.floor(qty / 100) * 0.01, 0.5);
  return Math.round(qty * 0.89 * (1 - discount) * 100) / 100;
}
function instagramLikesPrice(qty: number) {
  if (!Number.isInteger(qty) || qty < 100 || qty > 10000 || qty % 100 !== 0) throw new Error("Likes quantity must be a multiple of 100, from 100 to 10,000");
  const discount = Math.min(Math.floor(qty / 100) * 0.01, 0.5);
  return Math.round(qty * 0.44 * (1 - discount) * 100) / 100;
}

export async function GET() {
  try {
    const user = await ensureAppUser();
    const orders = await prisma.storeOrder.findMany({ where: { buyerId: user.id }, include: { payment: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Authentication required" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const kind = String(body?.kind ?? "");
    let buyerId: string | null = null;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try { buyerId = (await ensureAppUser()).id; } catch {}
    }

    let amount = 0;
    let target = "";
    let quantity: number | null = null;
    let providerProductId: number | null = null;
    let providerServiceId: number | null = null;
    let providerPayload: Record<string, unknown> | undefined;
    let status: "PENDING" = "PENDING";

    if (kind === "INSTAGRAM_FOLLOWERS") {
      target = String(body?.target ?? "").trim();
      quantity = Number(body?.quantity);
      if (!/^@?[A-Za-z0-9._]{1,30}$/.test(target) && !/^https?:\/\/([^/]+\.)?instagram\.com\/[^\s]+$/i.test(target)) throw new Error("Enter a valid Instagram username or link");
      amount = instagramFollowerPrice(quantity);
    } else if (kind === "INSTAGRAM_LIKES") {
      target = String(body?.target ?? "").trim();
      quantity = Number(body?.quantity);
      if (!/^https?:\/\/([^/]+\.)?instagram\.com\/(p|reel)\/[^\s]+$/i.test(target)) throw new Error("Enter a valid Instagram post or reel link");
      amount = instagramLikesPrice(quantity);
    } else if (kind === "FREE_FIRE") {
      const uid = String(body?.uid ?? "").trim();
      const zoneName = String(body?.zoneName ?? "").trim();
      const topUpId = Number(body?.topUpId);
      const serviceId = Number(body?.serviceId);
      if (!/^\d{4,20}$/.test(uid)) throw new Error("Enter a valid Free Fire UID");
      if (!Number.isInteger(topUpId) || !Number.isInteger(serviceId)) throw new Error("Choose a valid Waliya service");
      const tops = await getTopUps();
      const top = tops.find((x: any) => Number(x?.id) === topUpId);
      if (!top) throw new Error("Waliya service is no longer active");
      const details = extractMessage<any>(await getTopUpDetails(String(top.slug)));
      const services = Array.isArray(details?.active_services) ? details.active_services : Array.isArray(details?.services) ? details.services : [];
      const service = services.find((s: any) => Number(s?.id ?? s?.service_id) === serviceId);
      if (!service) throw new Error("Waliya service is no longer available");
      const providerPrice = Number(service?.price ?? service?.selling_price ?? service?.amount ?? service?.service_price);
      if (!Number.isFinite(providerPrice)) throw new Error("Waliya did not return a usable price");
      const currency = String(service?.currency ?? details?.currency ?? top?.currency ?? "ETB");
      amount = Math.round((toEtb(providerPrice, currency) + 5) * 100) / 100;
      target = uid;
      providerProductId = topUpId;
      providerServiceId = serviceId;
      providerPayload = { uid, zoneName, topUpSlug: String(top.slug ?? ""), serviceName: String(service?.name ?? service?.title ?? "") };
    } else {
      throw new Error("Unsupported store order");
    }

    const order = await prisma.storeOrder.create({
      data: { buyerId, kind: kind as any, status: status as any, amount, target, quantity, providerProductId, providerServiceId, providerPayload, manualFulfillment: kind !== "FREE_FIRE" },
      select: { id: true, kind: true, status: true, amount: true, target: true, quantity: true, checkoutToken: true },
    });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Store order failed" }, { status: 400 });
  }
}
