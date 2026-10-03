import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getTopUpOrders } from "@/lib/waliya";

function isComplete(value: unknown) {
  const s = String(value ?? "").trim().toLowerCase();
  return s === "1" || s === "complete" || s === "completed" || s === "success" || s === "successful";
}

function containsText(value: unknown, needle: string) {
  return JSON.stringify(value ?? "").includes(needle);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await prisma.storeOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (order.kind !== "FREE_FIRE") return NextResponse.json({ ok: true, status: order.status, providerStatus: null });

    const body = await getTopUpOrders();
    const rows = Array.isArray(body?.message?.data) ? body.message.data : Array.isArray(body?.data) ? body.data : [];
    const payload = (order.providerPayload ?? {}) as Record<string, unknown>;
    const target = String(payload.uid ?? order.target);
    const serviceName = String(payload.serviceName ?? "");

    let hit = order.providerRef ? rows.find((row: any) => String(row?.utr ?? "") === order.providerRef) : null;
    if (!hit) {
      // Waliya's documented top-up order response may omit the UTR from make-order.
      // Match only a recent order carrying the same UID and, when available, service name.
      const candidates = rows.filter((row: any) => containsText(row?.informations, target));
      hit = candidates.find((row: any) => !serviceName || containsText(row?.order_details, serviceName)) ?? candidates[0] ?? null;
    }

    if (!hit) return NextResponse.json({ ok: true, status: order.status, providerStatus: "Not found yet" });

    const providerStatus = String(hit?.status ?? "Unknown");
    const providerRef = hit?.utr ? String(hit.utr) : order.providerRef ?? null;
    if (providerRef && providerRef !== order.providerRef) {
      await prisma.storeOrder.update({ where: { id }, data: { providerRef } });
    }
    if (isComplete(providerStatus) && order.status !== "COMPLETED") {
      await prisma.storeOrder.update({ where: { id }, data: { status: "COMPLETED", fulfillmentAt: new Date() } });
    }
    return NextResponse.json({ ok: true, status: isComplete(providerStatus) ? "COMPLETED" : order.status, providerStatus, providerRef });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Status check failed" }, { status: 502 });
  }
}
