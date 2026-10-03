import { NextResponse } from "next/server";
import { veritasRequest } from "@/lib/veritas";
import { requireAdmin } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body?.reference) return NextResponse.json({ success: false, error: "reference is required" }, { status: 400 });
    const data = await veritasRequest("/verify", { method: "POST", body: JSON.stringify(body) });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Verification failed" }, { status: 401 });
  }
}
