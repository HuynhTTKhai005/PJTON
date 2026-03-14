"use client";

import { useEffect, useMemo, useState } from "react";
import type { InventoryPayload, InventoryRow } from "@/types/inventory";

const STORAGE_KEY = "inventory-data-v1";

const DEFAULT_PRODUCTS = [
  "Đậu hộp",
  "Mì gói",
  "Nước khoáng",
  "Dầu ăn",
  "Gạo 5kg",
  "Đường 1kg"
];

type RowState = {
  id: string;
  product: string;
  opening: number;
  importQty: string;
  exportQty: string;
  destroyed: string;
  ending: string;
  plannedSold: string;
};

function toFixed3(value: number) {
  return Number(value || 0).toFixed(3);
}

function parseValue(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function hydrateRows(rows: InventoryRow[], previousRows?: InventoryRow[]) {
  const previousMap = new Map<string, InventoryRow>();
  (previousRows ?? []).forEach((row) => previousMap.set(row.product, row));

  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      product: row.product,
      opening: row.opening ?? previousMap.get(row.product)?.ending ?? 0,
      importQty: toFixed3(row.importQty),
      exportQty: toFixed3(row.exportQty),
      destroyed: toFixed3(row.destroyed),
      ending: toFixed3(row.ending),
      plannedSold: toFixed3(row.plannedSold)
    }));
  }

  return DEFAULT_PRODUCTS.map((product) => ({
    id: product.toLowerCase().replace(/\s+/g, "-"),
    product,
    opening: previousMap.get(product)?.ending ?? 0,
    importQty: "0.000",
    exportQty: "0.000",
    destroyed: "0.000",
    ending: "0.000",
    plannedSold: "0.000"
  }));
}

function mapToPayload(date: string, rows: RowState[]): InventoryPayload {
  return {
    date,
    updatedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      product: row.product,
      opening: row.opening,
      importQty: parseValue(row.importQty),
      exportQty: parseValue(row.exportQty),
      destroyed: parseValue(row.destroyed),
      ending: parseValue(row.ending),
      plannedSold: parseValue(row.plannedSold)
    }))
  };
}

export default function InventoryTable() {
  const [date, setDate] = useState(todayDate());
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setSaveError(null);

      try {
        const res = await fetch(`/api/inventory?date=${todayDate()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as InventoryPayload;
        if (!active) return;

        setDate(data.date);
        setRows(hydrateRows(data.rows, data.previousDateRows));
        setLoading(false);
        return;
      } catch {
        // fallback to localStorage
      }

      const local = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (local) {
        const parsed = JSON.parse(local) as InventoryPayload;
        if (active) {
          setDate(parsed.date ?? todayDate());
          setRows(hydrateRows(parsed.rows ?? []));
          setLoading(false);
        }
        return;
      }

      if (active) {
        setRows(hydrateRows([]));
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (rows.length === 0) return;
    const payload = mapToPayload(date, rows);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [rows, date]);

  useEffect(() => {
    if (rows.length === 0) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const payload = mapToPayload(date, rows);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Save failed");
        setSaved(true);
      } catch (err) {
        setSaveError("Chế độ offline – đã lưu cục bộ");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [rows, date]);

  const computed = useMemo(() => {
    return rows.map((row) => {
      const actualSold =
        row.opening +
        parseValue(row.importQty) -
        parseValue(row.exportQty) -
        parseValue(row.destroyed) -
        parseValue(row.ending);

      const difference = actualSold - parseValue(row.plannedSold);
      return {
        actualSold,
        difference
      };
    });
  }, [rows]);

  function updateRow(index: number, key: keyof RowState, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function formatOnBlur(index: number, key: keyof RowState) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const raw = row[key] as string;
        return { ...row, [key]: toFixed3(parseValue(raw)) } as RowState;
      })
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-orange-200 bg-white p-4 text-sm text-slate-600">
        Đang tải tồn kho…
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Ngày: {date}</span>
        <span>
          {saving ? "Đang lưu…" : saved ? "Đã lưu" : ""}
          {saveError ? ` ${saveError}` : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-orange-200 bg-white">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead className="bg-orangeStrong text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-orangeStrong px-3 py-2 text-left">Sản phẩm</th>
              <th className="bg-orangeMid px-3 py-2 text-left">Tồn đầu ngày (1)</th>
              <th className="px-3 py-2 text-left">Nhập (2)</th>
              <th className="px-3 py-2 text-left">Xuất (3)</th>
              <th className="px-3 py-2 text-left">Hủy (4)</th>
              <th className="bg-orangeMid px-3 py-2 text-left">Tồn cuối ngày (5)</th>
              <th className="px-3 py-2 text-left">Bán thực tế (6)</th>
              <th className="px-3 py-2 text-left">Bán kế hoạch (7)</th>
              <th className="px-3 py-2 text-left">Chênh lệch (8)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-orange-100">
                <td className="sticky left-0 z-10 bg-orange-50 px-3 py-2 font-medium">
                  {row.product}
                </td>
                <td className="bg-orangeLight px-3 py-2">{toFixed3(row.opening)}</td>
                {(["importQty", "exportQty", "destroyed", "ending"] as const).map((key) => (
                  <td
                    key={key}
                    className={key === "ending" ? "bg-orangeLight px-3 py-2" : "px-3 py-2"}
                  >
                    <input
                      className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                      inputMode="decimal"
                      type="number"
                      step="0.001"
                      value={row[key]}
                      onChange={(e) => updateRow(index, key, e.target.value)}
                      onBlur={() => formatOnBlur(index, key)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2">{toFixed3(computed[index]?.actualSold ?? 0)}</td>
                <td className="px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    inputMode="decimal"
                    type="number"
                    step="0.001"
                    value={row.plannedSold}
                    onChange={(e) => updateRow(index, "plannedSold", e.target.value)}
                    onBlur={() => formatOnBlur(index, "plannedSold")}
                  />
                </td>
                <td className="px-3 py-2">{toFixed3(computed[index]?.difference ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Số sẽ tự định dạng 3 chữ số thập phân khi rời khỏi ô nhập.
      </p>
    </section>
  );
}
