import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const user = await ensureAppUser();
    const body = await req.json().catch(() => null) as { name?: string; bio?: string } | null;
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : user.name, bio: typeof body?.bio === "string" ? body.bio.trim() : user.bio } });
    return NextResponse.json({ ok: true, user: { id: updated.id, name: updated.name, bio: updated.bio } });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save profile" }, { status: 401 }); }
}
