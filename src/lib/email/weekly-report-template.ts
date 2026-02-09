import { formatQty } from "@/lib/unit-utils";

type TransferByBranch = {
  location_name: string;
  total_qty: number;
  transaction_count: number;
};

type TopItem = {
  item_name: string;
  sku: string;
  total_qty: number;
};

type LowStockItem = {
  item_name: string;
  sku: string;
  base_unit: "boxes" | "pcs";
  pcs_per_box: number;
  on_hand: number;
  reorder_point: number;
};

export function buildReportHtml({
  startDate,
  endDate,
  transfersByBranch,
  topItems,
  lowStock,
}: {
  startDate: string;
  endDate: string;
  transfersByBranch: TransferByBranch[];
  topItems: TopItem[];
  lowStock: LowStockItem[];
}) {
  const lowStockSection =
    lowStock.length > 0
      ? `
    <h2 style="color: #dc2626; margin-top: 24px;">Low Stock Alerts</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr style="background: #fef2f2;">
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #fee2e2;">Item</th>
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #fee2e2;">SKU</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #fee2e2;">On Hand</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #fee2e2;">Reorder At</th>
      </tr>
      ${lowStock
        .map(
          (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${item.item_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${item.sku}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #dc2626; font-weight: bold;">${formatQty(item.on_hand, item.base_unit, item.pcs_per_box)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatQty(item.reorder_point, item.base_unit, item.pcs_per_box)}</td>
      </tr>`
        )
        .join("")}
    </table>`
      : `<p style="color: #16a34a; margin-top: 24px;">All stock levels are above reorder points.</p>`;

  const transfersSection =
    transfersByBranch.length > 0
      ? `
    <h2 style="margin-top: 24px;">Transfers by Branch</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr style="background: #f9fafb;">
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb;">Branch</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #e5e7eb;">Items Sent</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #e5e7eb;">Total Qty</th>
      </tr>
      ${transfersByBranch
        .map(
          (b) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${b.location_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right;">${b.transaction_count}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${b.total_qty}</td>
      </tr>`
        )
        .join("")}
    </table>`
      : `<p style="color: #6b7280; margin-top: 24px;">No transfers this period.</p>`;

  const topItemsSection =
    topItems.length > 0
      ? `
    <h2 style="margin-top: 24px;">Top 10 Most Moved Items</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr style="background: #f9fafb;">
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb;">Item</th>
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb;">SKU</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #e5e7eb;">Total Qty</th>
      </tr>
      ${topItems
        .map(
          (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${item.item_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${item.sku}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${item.total_qty}</td>
      </tr>`
        )
        .join("")}
    </table>`
      : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: #ec4899; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Tutti Stock — Weekly Report</h1>
        <p style="margin: 4px 0 0; opacity: 0.9;">${startDate} to ${endDate}</p>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        ${lowStockSection}
        ${transfersSection}
        ${topItemsSection}
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          Full warehouse inventory is attached as a CSV file.
        </p>
      </div>
    </div>
  `;
}

export function buildInventoryCsv(
  inventory: Array<{
    sku: string;
    item_name: string;
    base_unit: string;
    pcs_per_box: number;
    on_hand: number;
    reorder_point: number;
    target_stock: number;
  }>
) {
  const header = "SKU,Item Name,Base Unit,Pcs/Box,On Hand,Reorder Point,Target Stock";
  const rows = inventory.map(
    (i) =>
      `"${i.sku}","${i.item_name}","${i.base_unit}",${i.pcs_per_box},${i.on_hand},${i.reorder_point},${i.target_stock}`
  );
  return [header, ...rows].join("\n");
}
