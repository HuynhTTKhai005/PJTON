"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { InventoryPayload, InventoryRow } from "@/types/inventory";

const STORAGE_KEY = "inventory-data-v1";
const RESET_KEY = "inventory-reset-v1";

const DEFAULT_PRODUCTS = [
  "Mì ko kiếng",
  "Mì kiếng",
  "Bò Mỹ",
  "Tôm",
  "Mực ống",
  "Cá viên",
  "Đùi gà tỏi",
  "Heo",
  "XX",
  "gà fillet",
  "mandu",
  "Trứng gà",
  "Tako",
  "pmv",
  "pmq",
  "kimbap",
  "Sụn",
  "Trứng ngâm",
  "Gà viên",
  "Vtc",
  "Ktc",
  "CT KC",
  "CT Sy",
  "CT SC",
  "Trứng ngâm",
  "Xiên",
  "cam",
  "trắng",
  "đen",
  "Coca",
  "Sprite",
  "Sting",
  "Dasani",
  "Khăn",
  "KC",
  "Súp lơ",
  "BCT",
  "Tương Ớt",
  "chấm bò",
  "MOX",
  "Sin",
  "Ớt độ"
];

type RowState = {
  id: string;
  product: string;
  opening: string;
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

function formatDisplay(value: number) {
  if (!Number.isFinite(value) || value === 0) return "0";
  return Number(value).toFixed(3);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function hydrateRows(rows: InventoryRow[], previousRows?: InventoryRow[]) {
  const previousMap = new Map<string, InventoryRow>();
  (previousRows ?? []).forEach((row) => previousMap.set(row.product, row));

  const currentMap = new Map<string, InventoryRow>();
  (rows ?? []).forEach((row) => currentMap.set(row.product, row));

  return DEFAULT_PRODUCTS.map((product, idx) => ({
    id: `${product.toLowerCase().replace(/\s+/g, "-")}-${idx + 1}`,
    product,
    opening: formatDisplay(
      currentMap.get(product)?.opening ?? previousMap.get(product)?.ending ?? 0
    ),
    importQty: formatDisplay(currentMap.get(product)?.importQty ?? 0),
    exportQty: formatDisplay(currentMap.get(product)?.exportQty ?? 0),
    destroyed: formatDisplay(currentMap.get(product)?.destroyed ?? 0),
    ending: formatDisplay(currentMap.get(product)?.ending ?? 0),
    plannedSold: formatDisplay(currentMap.get(product)?.plannedSold ?? 0)
  }));
}

function mapToPayload(date: string, rows: RowState[]): InventoryPayload {
  return {
    date,
    updatedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      product: row.product,
      opening: parseValue(row.opening),
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
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState("0");
  const [calcTarget, setCalcTarget] = useState<{
    index: number;
    key: keyof RowState;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setSaveError(null);

      if (typeof window !== "undefined" && !localStorage.getItem(RESET_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(RESET_KEY, "1");
        if (active) {
          setDate(todayDate());
          setRows(hydrateRows([]));
          setLoading(false);
        }
        return;
      }

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
        parseValue(row.opening) +
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

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows.map((row, index) => ({ row, index }));
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.product.toLowerCase().includes(term));
  }, [rows, searchTerm]);

  function updateRow(index: number, key: keyof RowState, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function openCalculator(index: number, key: keyof RowState) {
    const current = rows[index]?.[key] ?? "0";
    setCalcTarget({ index, key });
    setCalcExpr(current === "" ? "0" : current);
    setCalcOpen(true);
  }

  function safeEvalExpression(expr: string) {
    const cleaned = expr.replace(/[^0-9+\-*/(). ]/g, "");
    if (!cleaned || !/^[0-9+\-*/(). ]+$/.test(cleaned)) return null;
    try {
      const result = Function(`"use strict"; return (${cleaned})`)();
      return Number.isFinite(result) ? Number(result) : null;
    } catch {
      return null;
    }
  }

  function appendCalc(value: string) {
    setCalcExpr((prev) => {
      if (prev === "0" && /[0-9]/.test(value)) return value;
      return `${prev}${value}`;
    });
  }

  function clearCalc() {
    setCalcExpr("0");
  }

  function backspaceCalc() {
    setCalcExpr((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  }

  function applyCalc() {
    if (!calcTarget) return;
    const result = safeEvalExpression(calcExpr);
    if (result === null) return;
    updateRow(calcTarget.index, calcTarget.key, formatDisplay(result));
    setCalcOpen(false);
  }

  function clearAllNumbers() {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        opening: "0",
        importQty: "0",
        exportQty: "0",
        destroyed: "0",
        ending: "0",
        plannedSold: "0"
      }))
    );
  }

  async function exportAsImage() {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(tableRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fff7ed"
      });
      const link = document.createElement("a");
      link.download = `ton-kho-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setSaveError("Không thể xuất ảnh. Hãy thử lại.");
    } finally {
      setExporting(false);
    }
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
      <div className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>Ngày: {date}</span>
          <input
            className="h-10 w-60 rounded-md border border-orange-200 px-3 text-base outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Tìm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-md border border-orange-300 bg-orange-500 px-3 py-1 text-xs text-white"
            type="button"
            onClick={exportAsImage}
            disabled={exporting}
          >
            {exporting ? "Đang xuất ảnh..." : "Xuất ảnh"}
          </button>
          <button
            className="rounded-md border border-orange-300 bg-orange-100 px-3 py-1 text-xs text-orange-700"
            type="button"
            onClick={clearAllNumbers}
          >
            Xóa dữ liệu số
          </button>
          <span>
            {saving ? "Đang lưu…" : saved ? "Đã lưu" : ""}
            {saveError ? ` ${saveError}` : ""}
          </span>
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto rounded-lg border border-orange-200 bg-white">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead className="bg-orangeStrong text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-orangeStrong px-3 py-2 text-left">Sản phẩm</th>
              <th className="bg-orangeMid px-3 py-2 text-left">Tồn cuối ngày (5)</th>
              <th className="px-3 py-2 text-left">Bán thực tế (6)</th>
              <th className="px-3 py-2 text-left">RK (7)</th>
              <th className="px-3 py-2 text-left">Chênh lệch (8)</th>
              <th className="bg-orangeMid px-3 py-2 text-left">Tồn đầu ngày (1)</th>
              <th className="px-3 py-2 text-left">Nhập (2)</th>
              <th className="px-3 py-2 text-left">Xuất (3)</th>
              <th className="px-3 py-2 text-left">Hủy (4)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ row, index }) => (
              <tr key={`${row.id}-${index}`} className="border-t border-orange-100">
                <td className="sticky left-0 z-10 bg-orange-50 px-3 py-2 font-medium">
                  {row.product}
                </td>
                <td className="bg-orangeLight px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.ending}
                    onClick={() => openCalculator(index, "ending")}
                  />
                </td>
                <td className="px-3 py-2">{toFixed3(computed[index]?.actualSold ?? 0)}</td>
                <td className="px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.plannedSold}
                    onClick={() => openCalculator(index, "plannedSold")}
                  />
                </td>
                <td className="px-3 py-2">{toFixed3(computed[index]?.difference ?? 0)}</td>
                <td className="bg-orangeLight px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.opening}
                    onClick={() => openCalculator(index, "opening")}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.importQty}
                    onClick={() => openCalculator(index, "importQty")}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.exportQty}
                    onClick={() => openCalculator(index, "exportQty")}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="h-11 w-28 rounded-md border border-orange-200 px-2 text-base outline-none focus:ring-2 focus:ring-orange-300"
                    readOnly
                    placeholder="0"
                    value={row.destroyed}
                    onClick={() => openCalculator(index, "destroyed")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {calcOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">Máy tính</div>
              <button
                className="text-sm text-slate-500"
                type="button"
                onClick={() => setCalcOpen(false)}
              >
                Đóng
              </button>
            </div>
            <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-right text-lg font-semibold text-slate-800">
              {calcExpr}
            </div>
            <div className="grid grid-cols-4 gap-2 text-base">
              {["7", "8", "9", "/"].map((v) => (
                <button
                  key={v}
                  className="rounded-lg border border-orange-200 bg-white py-3"
                  type="button"
                  onClick={() => appendCalc(v)}
                >
                  {v}
                </button>
              ))}
              {["4", "5", "6", "*"].map((v) => (
                <button
                  key={v}
                  className="rounded-lg border border-orange-200 bg-white py-3"
                  type="button"
                  onClick={() => appendCalc(v)}
                >
                  {v}
                </button>
              ))}
              {["1", "2", "3", "-"].map((v) => (
                <button
                  key={v}
                  className="rounded-lg border border-orange-200 bg-white py-3"
                  type="button"
                  onClick={() => appendCalc(v)}
                >
                  {v}
                </button>
              ))}
              <button
                className="rounded-lg border border-orange-200 bg-white py-3"
                type="button"
                onClick={() => appendCalc("0")}
              >
                0
              </button>
              <button
                className="rounded-lg border border-orange-200 bg-white py-3"
                type="button"
                onClick={() => appendCalc(".")}
              >
                .
              </button>
              <button
                className="rounded-lg border border-orange-200 bg-white py-3"
                type="button"
                onClick={backspaceCalc}
              >
                Xóa
              </button>
              <button
                className="rounded-lg border border-orange-200 bg-white py-3"
                type="button"
                onClick={() => appendCalc("+")}
              >
                +
              </button>
              <button
                className="col-span-2 rounded-lg border border-orange-300 bg-orange-100 py-3"
                type="button"
                onClick={clearCalc}
              >
                C
              </button>
              <button
                className="col-span-2 rounded-lg border border-orange-500 bg-orange-500 py-3 text-white"
                type="button"
                onClick={applyCalc}
              >
                =
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 text-center text-xs text-slate-500">
        Bản quyền © Huỳnh Trần Tiến Khải
      </div>
    </section>
  );
}
