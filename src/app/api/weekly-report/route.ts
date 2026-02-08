import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildReportHtml,
  buildInventoryCsv,
} from "@/lib/email/weekly-report-template";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Date range
  const url = new URL(request.url);
  const endDate = url.searchParams.get("end") || new Date().toISOString().split("T")[0];
  const startDate =
    url.searchParams.get("start") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // 1. Transfers by branch
  const { data: transfers } = await supabase
    .from("transactions")
    .select("to_location_id, qty, locations!transactions_to_location_id_fkey(name)")
    .eq("transaction_type", "TRANSFER")
    .gte("created_at", startDate)
    .lte("created_at", `${endDate}T23:59:59`);

  const branchMap = new Map<string, { location_name: string; total_qty: number; transaction_count: number }>();
  for (const t of transfers ?? []) {
    const locName = (t.locations as unknown as { name: string })?.name ?? "Unknown";
    const existing = branchMap.get(t.to_location_id!) ?? {
      location_name: locName,
      total_qty: 0,
      transaction_count: 0,
    };
    existing.total_qty += t.qty;
    existing.transaction_count += 1;
    branchMap.set(t.to_location_id!, existing);
  }
  const transfersByBranch = Array.from(branchMap.values()).sort(
    (a, b) => b.total_qty - a.total_qty
  );

  // 2. Top 10 moved items
  const { data: allTx } = await supabase
    .from("transactions")
    .select("item_id, qty, items(name, sku)")
    .gte("created_at", startDate)
    .lte("created_at", `${endDate}T23:59:59`);

  const itemQtyMap = new Map<string, { item_name: string; sku: string; total_qty: number }>();
  for (const t of allTx ?? []) {
    const itemData = t.items as unknown as { name: string; sku: string };
    const existing = itemQtyMap.get(t.item_id) ?? {
      item_name: itemData?.name ?? "Unknown",
      sku: itemData?.sku ?? "",
      total_qty: 0,
    };
    existing.total_qty += t.qty;
    itemQtyMap.set(t.item_id, existing);
  }
  const topItems = Array.from(itemQtyMap.values())
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 10);

  // 3. Low stock (warehouse)
  const { data: warehouseLoc } = await supabase
    .from("locations")
    .select("id")
    .eq("type", "warehouse")
    .single();

  const { data: inventoryData } = await supabase
    .from("inventory_levels")
    .select("*")
    .eq("location_id", warehouseLoc?.id ?? "");

  const lowStock = (inventoryData ?? [])
    .filter((i) => i.on_hand <= i.reorder_point)
    .map((i) => ({
      item_name: i.item_name,
      sku: i.sku,
      unit: i.unit,
      on_hand: i.on_hand,
      reorder_point: i.reorder_point,
    }))
    .sort((a, b) => a.on_hand - b.on_hand);

  // 4. Full inventory snapshot (warehouse only, for CSV)
  const csvData = (inventoryData ?? []).map((i) => ({
    sku: i.sku,
    item_name: i.item_name,
    unit: i.unit,
    on_hand: i.on_hand,
    reorder_point: i.reorder_point,
    target_stock: i.target_stock,
  }));

  // Build email
  const html = buildReportHtml({
    startDate,
    endDate,
    transfersByBranch,
    topItems,
    lowStock,
  });
  const csv = buildInventoryCsv(csvData);

  // Send email
  const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL;
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "REPORT_RECIPIENT_EMAIL not configured" },
      { status: 500 }
    );
  }
  const recipients = recipientEmail.split(",").map((e) => e.trim()).filter(Boolean);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

  const { error: emailError } = await resend.emails.send({
    from: "Tutti Stock <onboarding@resend.dev>",
    to: recipients,
    subject: `Weekly Inventory Report (${startDate} to ${endDate})`,
    html,
    attachments: [
      {
        filename: `inventory-${endDate}.csv`,
        content: Buffer.from(csv).toString("base64"),
        contentType: "text/csv",
      },
    ],
  });

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    summary: {
      transfersByBranch: transfersByBranch.length,
      topItems: topItems.length,
      lowStockItems: lowStock.length,
      totalInventoryRows: csvData.length,
    },
  });
}
