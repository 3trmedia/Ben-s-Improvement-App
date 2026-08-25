import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Receives POSTs from a Health Connect bridge app (e.g. "Health Connect
// Webhook" on Android) running on Ben's phone, forwarding RingConn + Galaxy
// Watch (Samsung Health) data that's already synced into Android's Health
// Connect. Payload shape isn't fixed yet — this stores whatever arrives in
// `raw` and best-efforts a few common fields, since the exact JSON the bridge
// app sends hasn't been confirmed against a real payload yet.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret");
  if (secret !== process.env.HEALTH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const records = Array.isArray(body) ? body : [body];
  const rows = records.map((r) => {
    const rec = r as Record<string, unknown>;
    return {
      source: (rec.source as string) ?? (rec.dataOrigin as string) ?? (rec.app as string) ?? "unknown",
      metric: (rec.type as string) ?? (rec.metric as string) ?? (rec.recordType as string) ?? "unknown",
      value: typeof rec.value === "number" ? rec.value : (typeof rec.count === "number" ? rec.count : null),
      unit: (rec.unit as string) ?? null,
      recorded_at: (rec.timestamp as string) ?? (rec.startTime as string) ?? (rec.time as string) ?? new Date().toISOString(),
      raw: rec,
    };
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("health_metrics").insert(rows);
  if (error) {
    console.error("health-webhook insert failed", error);
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length });
}
