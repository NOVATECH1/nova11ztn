import { NextResponse } from "next/server";
import { ensureAppUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createDiditSession } from "@/lib/didit";

export async function POST(req: Request) {
  try {
    const user = await ensureAppUser();
    const session = await createDiditSession(user.id, `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/profile`);
    await prisma.kycVerification.create({ data: { userId: user.id, externalId: session.session_id, workflowId: process.env.DIDIT_WORKFLOW_ID } });
    await prisma.user.update({ where: { id: user.id }, data: { kycStatus: "IN_REVIEW" } });
    return NextResponse.json({ ok: true, ...session });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Didit unavailable" }, { status: 503 });
  }
}
