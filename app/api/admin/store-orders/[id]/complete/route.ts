import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const order = await prisma.storeOrder.update({ where: { id }, data: { status: "COMPLETED", fulfillmentAt: new Date(), manualFulfillment: true } });
    await prisma.auditLog.create({ data: { actorId: admin.id, action: "STORE_ORDER_MANUALLY_COMPLETED", targetType: "StoreOrder", targetId: id } });
    return NextResponse.json({ ok: true, order });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to complete" }, { status: 400 }); }
}
