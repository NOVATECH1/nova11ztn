import { NextResponse } from "next/server";
import { createUploadUrl } from "@/lib/r2";
import { requireClerkUser } from "@/lib/authz";
import crypto from "node:crypto";

const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  try {
    const clerkId = await requireClerkUser();
    const body = await req.json().catch(() => null) as { contentType?: string; size?: number } | null;
    const contentType = String(body?.contentType ?? "");
    const size = Number(body?.size ?? 0);
    if (!allowed[contentType]) return NextResponse.json({ ok: false, error: "Only JPG, PNG and WEBP are allowed." }, { status: 400 });
    if (!Number.isInteger(size) || size <= 0 || size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Maximum image size is 10 MB." }, { status: 400 });
    const key = `users/${clerkId}/uploads/${crypto.randomUUID()}.${allowed[contentType]}`;
    const url = await createUploadUrl(key, contentType, size);
    return NextResponse.json({ ok: true, key, url, expiresIn: 300 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Upload unavailable" }, { status: 401 });
  }
}
