import { NextResponse } from "next/server";
import { extractMessage, getTopUps, toEtb } from "@/lib/waliya";

export async function GET() {
  try {
    const raw = await getTopUps();
    const rows = raw.filter((x: any) => String(x?.name ?? "").toLowerCase().includes("free fire") || String(x?.slug ?? "").toLowerCase().includes("free-fire"));
    const catalog = rows.map((x: any) => {
      const services = Array.isArray(x?.services) ? x.services : Array.isArray(x?.active_services) ? x.active_services : [];
      return {
        id: Number(x.id),
        slug: String(x.slug ?? ""),
        name: String(x.name ?? "Free Fire"),
        region: x.region ?? null,
        image: x.image ?? null,
        services: services.map((s: any) => {
          const price = Number(s?.price ?? s?.selling_price ?? s?.amount ?? s?.service_price);
          const currency = String(s?.currency ?? x?.currency ?? "ETB");
          return { id: Number(s?.id ?? s?.service_id), name: String(s?.name ?? s?.title ?? `Service ${s?.id ?? ""}`), providerPrice: price, currency, etbPrice: Number.isFinite(price) ? Math.round(toEtb(price, currency) * 100) / 100 : null };
        }).filter((s: any) => Number.isInteger(s.id) && s.id > 0 && s.etbPrice != null),
      };
    });
    return NextResponse.json({ ok: true, catalog });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Waliya catalog unavailable" }, { status: 503 });
  }
}
