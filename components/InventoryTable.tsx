"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { InventoryPayload, InventoryRow } from "@/types/inventory";

const STORAGE_KEY = "inventory-data-v1";
const RESET_KEY = "inventory-reset-v1";

const DEFAULT_PRODUCTS = [
  {
    name: "Mì Chinnoo không gia vị túi kiếng, 75gram/gói, 14 gói/ túi, 12 túi/thùng, thùng",
    code: "HMYX0004",
    unit: "Gói",
  },
  {
    name: "Mì Chinnoo không gia vị, 75 gram/gói, 14 gói/ túi, 12 túi/thùng, thùng",
    code: "HMYX0003",
    unit: "Gói",
  },
  { name: "Bò Mỹ, 500gram/khay, kg", code: "NTHI0004", unit: "Kg" },
  { name: "Tôm thẻ size 48-52 con/Kg cấp đông block", code: "NHSA0025", unit: "Kg" },
  { name: "Mực nút baby, 40-60con/kg, kg", code: "NHSA0013", unit: "Kg" },
  { name: "Cá viên hành tiêu (1Kg/Gói) (180-200 viên/gói)", code: "NVIE0012", unit: "Kg" },
  { name: "Đùi gà tỏi cấp đông", code: "NTHI0027", unit: "Kg" },
  { name: "Ba chi heo 500gr/khay", code: "NTHI0026", unit: "Kg" },
  { name: "Xúc xích Royal (500gr/gói)", code: "NVIE0022", unit: "Gói" },
  { name: "Đùi gà Fillet ướp (25 phần/khay) (CK)", code: "NVIE0022", unit: "Phần" },
  { name: "Bánh xếp Hàn Quốc Thịt & Bắp Cải (1505gr/gói)", code: "NKHA0017", unit: "Gói" },
  { name: "Trứng gà, 10 trứng/vỉ, hột", code: "NVIE0001", unit: "Gói" },
  { name: "Viên Takoyaki Sasin, 24 viên/gói, gói", code: "THMA0001", unit: "Gói" },
  { name: "Phô mai viên Sasin, 20 viên/gói, gói", code: "THMA0003", unit: "Gói" },
  { name: "Phô mai Que Sasin, 30 cây/gói, gói", code: "THMA0002", unit: "Gói" },
  { name: "Kim bap chiên (12cm/cây - 5 cây/gói) (700-800gr/gói)", code: "NKHA0044", unit: "Gói" },
  { name: "Sụn gà bắp chiên giòn, 10 phần/gói", code: "TTHI0007", unit: "Phần" },
  { name: "Trứng ngâm tương (CK)", code: "TVIE0003", unit: "Cái" },
  { name: "Gà viên(24 viên/ khay)", code: "TTHI0009", unit: "Gói" },
  { name: "Viên thanh cua phô mai, 24 viên/gói", code: "THMA0007", unit: "Gói" },
  { name: "Khoai tây chiên 1kg/bịch", code: "", unit: "Bịch" },
  { name: "Công thức gia vị kim chi (all in one), 3.5kg/gói, gói", code: "TGVI0006", unit: "Gói" },
  { name: "Công thức nước dùng Soyum (All in one) (2.4Kg/Gói)", code: "TGVI0026", unit: "Gói" },
  { name: "Công thức nước dùng Sincay (All in one) (1.3Kg/Gói)", code: "TGVI0027", unit: "Gói" },
  { name: "Trứng ngâm tương (CK)", code: "TVIE0003", unit: "Cái" },
  { name: "Xiên bánh cá hầm (8 phần/khay)", code: "THMA0006", unit: "Phần" },
  { name: "Xốt kem cam (15 phần/khay)", code: "TGVI0019", unit: "Phần" },
  { name: "Xốt kem trắng (15 phần/khay)", code: "TGVI0021", unit: "Phần" },
  { name: "Xốt tương đen (10 phần/khay)", code: "TGVI0022", unit: "Phần" },
  { name: "Coca lon, 320ml/lon, 24 lon/thùng, lon", code: "HNGK0005", unit: "Lon" },
  { name: "Sprite lon, 320ml/lon, 24 lon/thùng, lon", code: "HNGK0006", unit: "Lon" },
  { name: "Sting lon, 24 lon/thùng, 320ml/lon, lon", code: "HNGK0001", unit: "Lon" },
  { name: "Dasani, 500ml/chai, 24 chai/thùng, chai", code: "HNGK0023", unit: "Lon" },
  { name: "Khăn lạnh Sasin", code: "HKLA0001", unit: "cái" },
  { name: "Nấm Kim châm", code: "NRAU0001", unit: "kg" },
  { name: "súp lơ", code: "NRAU0017", unit: "Kg" },
  { name: "Bắp cải Tím, kg", code: "NRAU0025", unit: "kg" },
  { name: "Tương ớt Sasin 230gr", code: "TGVI0046", unit: "chai" },
  { name: "Xốt chấm Hàn Quốc 250gr", code: "TGVI0047", unit: "chai" },
  { name: "Muối ớt xanh 270gr", code: "TGVI0048", unit: "chai" },
  { name: "Nước dùng Sinpho cô đặc( 51gr/gói, 30 gói/bịch)", code: "TGVI0078", unit: "Gói" },
  { name: "Ớt đỏ BTP 1kg/bịch", code: "", unit: "Bịch" },
] as const;

type RowState = {
  id: string;
  product: string;
  productCode: string;
  unit: string;
  opening: string;
  importQty: string;
  exportQty: string;
  destroyed: string;
  ending: string;
  plannedSold: string;
};

type ImportPreviewItem = {
  productCode: string;
  rkRaw: string;
  status: "Hợp lệ" | "Không tồn tại" | "RK không hợp lệ";
  normalizedValue: string | null;
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

function normalizeCode(value: string) {
  return value.trim();
}

function shortenProductName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}...`;
}

function formatDateLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayDate() {
  return formatDateLocal(new Date());
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateLocal(date);
}

function displayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isWithinRange(dateStr: string, min: string, max: string) {
  return dateStr >= min && dateStr <= max;
}

function hydrateRows(rows: InventoryRow[], previousRows?: InventoryRow[]) {
  const previousMap = new Map<string, InventoryRow>();
  (previousRows ?? []).forEach((row) => previousMap.set(row.product, row));

  const currentMap = new Map<string, InventoryRow>();
  (rows ?? []).forEach((row) => currentMap.set(row.product, row));

  return DEFAULT_PRODUCTS.map((product, idx) => ({
    id: `${product.code || "no-code"}-${idx + 1}`,
    product: product.name,
    productCode: currentMap.get(product.name)?.productCode ?? product.code,
    unit: product.unit,
    opening: formatDisplay(currentMap.get(product.name)?.opening ?? previousMap.get(product.name)?.ending ?? 0),
    importQty: formatDisplay(currentMap.get(product.name)?.importQty ?? 0),
    exportQty: formatDisplay(currentMap.get(product.name)?.exportQty ?? 0),
    destroyed: formatDisplay(currentMap.get(product.name)?.destroyed ?? 0),
    ending: formatDisplay(currentMap.get(product.name)?.ending ?? 0),
    plannedSold: formatDisplay(currentMap.get(product.name)?.plannedSold ?? 0),
  }));
}

function mapToPayload(date: string, rows: RowState[]): InventoryPayload {
  return {
    date,
    updatedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      product: row.product,
      productCode: row.productCode,
      opening: parseValue(row.opening),
      importQty: parseValue(row.importQty),
      exportQty: parseValue(row.exportQty),
      destroyed: parseValue(row.destroyed),
      ending: parseValue(row.ending),
      plannedSold: parseValue(row.plannedSold),
    })),
  };
}

function applyCarryForwardRowState(rows: RowState[], previousRows?: InventoryRow[]) {
  const previousMap = new Map<string, InventoryRow>();
  (previousRows ?? []).forEach((row) => previousMap.set(row.product, row));

  return rows.map((row) => ({
    ...row,
    opening: formatDisplay(previousMap.get(row.product)?.ending ?? 0),
  }));
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
  const [exportingExcel, setExportingExcel] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState("0");
  const [calcTarget, setCalcTarget] = useState<{
    index: number;
    key: keyof RowState;
  } | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const minDate = addDays(todayDate(), -6);
  const maxDate = addDays(todayDate(), 1);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setSaveError(null);

      if (typeof window !== "undefined" && !localStorage.getItem(RESET_KEY)) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_KEY)) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(RESET_KEY, "1");
        if (active) {
          setDate(todayDate());
          setRows(hydrateRows([]));
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/inventory?date=${date}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as InventoryPayload;
        if (!active) return;

        setRows(hydrateRows(data.rows, data.previousDateRows));
        setLoading(false);
        return;
      } catch {
        // fallback to localStorage
      }

      const localKey = `${STORAGE_KEY}-${date}`;
      const prevKey = `${STORAGE_KEY}-${addDays(date, -1)}`;
      const local = typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
      const previousLocal = typeof window !== "undefined" ? localStorage.getItem(prevKey) : null;
      if (local) {
        const parsed = JSON.parse(local) as InventoryPayload;
        if (active) {
          const previousRows = previousLocal ? (JSON.parse(previousLocal) as InventoryPayload).rows : [];
          setRows(hydrateRows(parsed.rows ?? [], previousRows));
          setLoading(false);
        }
        return;
      }

      if (active) {
        const previousRows = previousLocal ? (JSON.parse(previousLocal) as InventoryPayload).rows : [];
        setRows(hydrateRows([], previousRows));
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [date]);

  useEffect(() => {
    if (rows.length === 0) return;
    saveLocalCarryForward(date, rows);
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
          body: JSON.stringify(payload),
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
      const actualSold = parseValue(row.opening) + parseValue(row.importQty) - parseValue(row.exportQty) - parseValue(row.destroyed) - parseValue(row.ending);

      const difference = actualSold - parseValue(row.plannedSold);
      return {
        actualSold,
        difference,
      };
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows.map((row, index) => ({ row, index }));
    return rows.map((row, index) => ({ row, index })).filter(({ row }) => row.product.toLowerCase().includes(term) || row.productCode.toLowerCase().includes(term));
  }, [rows, searchTerm]);

  function getLocalPayload(targetDate: string) {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(`${STORAGE_KEY}-${targetDate}`);
    return raw ? (JSON.parse(raw) as InventoryPayload) : null;
  }

  function saveLocalCarryForward(targetDate: string, currentRows: RowState[]) {
    if (typeof window === "undefined") return;

    const previousPayload = getLocalPayload(addDays(targetDate, -1));
    const normalizedCurrent = mapToPayload(targetDate, applyCarryForwardRowState(currentRows, previousPayload?.rows));

    localStorage.setItem(`${STORAGE_KEY}-${targetDate}`, JSON.stringify(normalizedCurrent));

    let carryRows = normalizedCurrent.rows;

    for (let nextDate = addDays(targetDate, 1); nextDate <= maxDate; nextDate = addDays(nextDate, 1)) {
      const nextPayload = getLocalPayload(nextDate);
      if (!nextPayload) continue;

      const nextRowState = nextPayload.rows.map((row) => ({
        id: row.id,
        product: row.product,
        productCode: row.productCode ?? "",
        unit: DEFAULT_PRODUCTS.find((product) => product.name === row.product)?.unit ?? "",
        opening: formatDisplay(row.opening),
        importQty: formatDisplay(row.importQty),
        exportQty: formatDisplay(row.exportQty),
        destroyed: formatDisplay(row.destroyed),
        ending: formatDisplay(row.ending),
        plannedSold: formatDisplay(row.plannedSold),
      }));
      const normalizedNext = mapToPayload(nextDate, applyCarryForwardRowState(nextRowState, carryRows));

      localStorage.setItem(`${STORAGE_KEY}-${nextDate}`, JSON.stringify(normalizedNext));
      carryRows = normalizedNext.rows;
    }
  }

  function updateRow(index: number, key: keyof RowState, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  async function handleExcelImport(file: File) {
    setImportingExcel(true);
    setSaveError(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setSaveError("File Excel không có sheet dữ liệu.");
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      }) as Record<string, unknown>[];

      const systemCodes = new Set(rows.map((row) => normalizeCode(row.productCode)).filter(Boolean));

      const preview = jsonRows
        .map((row: Record<string, unknown>) => {
          const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));
          const productCode = normalizeCode(String(normalizedRow["product_code"] ?? ""));
          const rkRaw = String(normalizedRow["rk"] ?? "").trim();
          const rkNumber = Number(rkRaw);

          if (!productCode || !systemCodes.has(productCode)) {
            return {
              productCode,
              rkRaw,
              status: "Không tồn tại" as const,
              normalizedValue: null,
            };
          }

          if (rkRaw === "" || !Number.isFinite(rkNumber)) {
            return {
              productCode,
              rkRaw,
              status: "RK không hợp lệ" as const,
              normalizedValue: null,
            };
          }

          return {
            productCode,
            rkRaw,
            status: "Hợp lệ" as const,
            normalizedValue: formatDisplay(rkNumber),
          };
        })
        .filter((item: ImportPreviewItem) => item.productCode || item.rkRaw);

      setImportFileName(file.name);
      setImportPreview(preview);
      setImportModalOpen(true);
    } catch {
      setSaveError("Không đọc được file Excel. Kiểm tra lại định dạng.");
    } finally {
      setImportingExcel(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function confirmExcelImport() {
    const rkMap = new Map(importPreview.filter((item) => item.status === "Hợp lệ" && item.normalizedValue !== null).map((item) => [item.productCode, item.normalizedValue as string]));

    if (rkMap.size === 0) {
      setImportModalOpen(false);
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        const matched = rkMap.get(normalizeCode(row.productCode));
        if (!matched) return row;
        return {
          ...row,
          plannedSold: matched,
        };
      }),
    );

    setImportModalOpen(false);
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
    const value = formatDisplay(result);
    const { index, key } = calcTarget;
    const product = rows[index]?.product;

    const nextRows = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    setRows(nextRows);

    if (product && (key === "ending" || key === "opening")) {
      syncAdjacentDates(nextRows, product, key, value);
    }
    setCalcOpen(false);
  }

  function syncAdjacentDates(currentRows: RowState[], product: string, key: "ending" | "opening", value: string) {
    if (typeof window === "undefined") return;

    if (key === "ending") {
      const nextDate = addDays(date, 1);
      if (isWithinRange(nextDate, minDate, maxDate)) {
        const nextKey = `${STORAGE_KEY}-${nextDate}`;
        const existing = localStorage.getItem(nextKey);
        const previousRows = mapToPayload(date, currentRows).rows;
        const baseRows = existing ? hydrateRows((JSON.parse(existing) as InventoryPayload).rows ?? [], previousRows) : hydrateRows([], previousRows);
        const updatedRows = baseRows.map((row) => (row.product === product ? { ...row, opening: value } : row));
        const payload = mapToPayload(nextDate, updatedRows);
        localStorage.setItem(nextKey, JSON.stringify(payload));
        void fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    }

    if (key === "opening") {
      const prevDate = addDays(date, -1);
      if (isWithinRange(prevDate, minDate, maxDate)) {
        const prevKey = `${STORAGE_KEY}-${prevDate}`;
        const existing = localStorage.getItem(prevKey);
        const baseRows = existing ? hydrateRows((JSON.parse(existing) as InventoryPayload).rows ?? []) : hydrateRows([]);
        const updatedRows = baseRows.map((row) => (row.product === product ? { ...row, ending: value } : row));
        const payload = mapToPayload(prevDate, updatedRows);
        localStorage.setItem(prevKey, JSON.stringify(payload));
        void fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    }
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
        plannedSold: "0",
      })),
    );
  }

  async function exportAsImage() {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const node = tableRef.current;
      const width = node.scrollWidth;
      const height = node.scrollHeight;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fff7ed",
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
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

  async function exportAsExcel() {
    setExportingExcel(true);
    setSaveError(null);

    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Ton hang cuoi ngay", {
        views: [{ state: "frozen", ySplit: 3 }],
      });

      const headers = ["STT", "Tên vật tư", "ĐVT", "Tồn đầu", "Nhập", "Xuất", "Hủy", "Tồn cuối", "Số bán thực tế", "RK", "Chênh lệch"];

      worksheet.mergeCells("A1:K1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "TỒN HÀNG CUỐI NGÀY";
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A2:A3");
      worksheet.mergeCells("B2:B3");
      worksheet.mergeCells("C2:C3");
      worksheet.getCell("A2").value = "STT";
      worksheet.getCell("B2").value = "Tên vật tư";
      worksheet.getCell("C2").value = "ĐVT";
      ["A2", "B2", "C2"].forEach((address) => {
        const cell = worksheet.getCell(address);
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });

      worksheet.mergeCells("D2:K2");
      const dateCell = worksheet.getCell("D2");
      dateCell.value = "Ngày..................";
      dateCell.font = { bold: true };
      dateCell.alignment = { horizontal: "center", vertical: "middle" };
      for (let col = 4; col <= 11; col += 1) {
        worksheet.getRow(2).getCell(col).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }

      const headerRow = worksheet.getRow(3);
      headers.forEach((header, index) => {
        if (index < 3) {
          return;
        }
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });

      rows.forEach((row, index) => {
        const opening = parseValue(row.opening);
        const importQty = parseValue(row.importQty);
        const exportQty = parseValue(row.exportQty);
        const destroyed = parseValue(row.destroyed);
        const ending = parseValue(row.ending);
        const plannedSold = parseValue(row.plannedSold);
        const actualSold = opening + importQty - exportQty - destroyed - ending;
        const difference = actualSold - plannedSold;

        worksheet.addRow([
          index + 1,
          row.product,
          row.unit,
          opening,
          importQty,
          exportQty,
          destroyed,
          ending,
          actualSold,
          plannedSold,
          difference,
        ]);
      });

      const tableStartRow = 3;
      const tableEndRow = rows.length + 3;
      const firstPageLastRow = Math.min(tableEndRow, 25);

      worksheet.columns = [{ width: 8 }, { width: 48 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 16 }];

      for (let rowNumber = 4; rowNumber <= tableEndRow; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

        for (let col = 4; col <= 11; col += 1) {
          row.getCell(col).numFmt = '[=0]0;#,##0.000';
          row.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
        }
      }

      for (let rowNumber = tableStartRow; rowNumber <= tableEndRow; rowNumber += 1) {
        for (let col = 1; col <= 11; col += 1) {
          const cell = worksheet.getRow(rowNumber).getCell(col);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      }

      const footerTopRow = tableEndRow + 2;
      const footerBottomRow = tableEndRow + 4;

      worksheet.mergeCells(`A${footerTopRow}:C${footerTopRow}`);
      worksheet.mergeCells(`D${footerTopRow}:K${footerTopRow}`);
      worksheet.mergeCells(`A${footerBottomRow}:C${footerBottomRow}`);
      worksheet.mergeCells(`D${footerBottomRow}:K${footerBottomRow}`);

      worksheet.getCell(`A${footerTopRow}`).value = "NV check";
      worksheet.getCell(`A${footerBottomRow}`).value = "BQL check";

      [`A${footerTopRow}`, `D${footerTopRow}`, `A${footerBottomRow}`, `D${footerBottomRow}`].forEach((address) => {
        const cell = worksheet.getCell(address);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
      });

      const footerRows = [footerTopRow, footerBottomRow];
      footerRows.forEach((rowNumber) => {
        for (let col = 1; col <= 11; col += 1) {
          worksheet.getRow(rowNumber).getCell(col).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
        worksheet.getRow(rowNumber + 1).height = 10;
      });

      worksheet.getRow(1).height = 24;
      worksheet.getRow(2).height = 20;
      worksheet.getRow(3).height = 22;
      if (tableEndRow > 25) {
        worksheet.getRow(firstPageLastRow).addPageBreak();
      }
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.4,
          bottom: 0.4,
          header: 0.2,
          footer: 0.2,
        },
      };
      worksheet.pageSetup.printTitlesRow = "1:3";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ton-hang-cuoi-ngay-${date}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setSaveError("Không thể xuất Excel. Hãy thử lại.");
    } finally {
      setExportingExcel(false);
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-orange-200 bg-white p-4 text-sm text-slate-600">Đang tải tồn kho…</div>;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-orange-200 bg-white px-2 py-1 text-xs"
              type="button"
              onClick={() =>
                setDate((prev) => {
                  const next = addDays(prev || todayDate(), -1);
                  return isWithinRange(next, minDate, maxDate) ? next : prev;
                })
              }>
              ←
            </button>
            <div className="relative">
              <input
                className="h-10 w-36 rounded-md border border-orange-200 px-3 text-base outline-none focus:ring-2 focus:ring-orange-300"
                type="text"
                readOnly
                value={displayDate(date)}
                onClick={() => dateInputRef.current?.showPicker?.()}
              />
              <input
                ref={dateInputRef}
                className="absolute inset-0 h-10 w-36 opacity-0"
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  const next = e.target.value;
                  setDate(isWithinRange(next, minDate, maxDate) ? next : date);
                }}
              />
            </div>
            <button
              className="rounded-md border border-orange-200 bg-white px-2 py-1 text-xs"
              type="button"
              onClick={() =>
                setDate((prev) => {
                  const next = addDays(prev || todayDate(), 1);
                  return isWithinRange(next, minDate, maxDate) ? next : prev;
                })
              }>
              →
            </button>
          </div>
          <div className="relative">
            <input
              className="h-10 w-60 rounded-md border border-orange-200 px-3 pr-9 text-base outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Tìm sản phẩm hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" type="button" onClick={() => setSearchTerm("")}>
                ×
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={importInputRef}
            className="hidden"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleExcelImport(file);
              }
            }}
          />
          <button className="rounded-md border border-orange-300 bg-white px-3 py-1 text-xs text-orange-700" type="button" onClick={() => importInputRef.current?.click()} disabled={importingExcel}>
            {importingExcel ? "Đang đọc file..." : "Import Excel"}
          </button>
          <button className="rounded-md border border-emerald-300 bg-emerald-500 px-3 py-1 text-xs text-white" type="button" onClick={() => void exportAsExcel()} disabled={exportingExcel}>
            {exportingExcel ? "Đang xuất Excel..." : "Xuất Excel"}
          </button>
          <button className="rounded-md border border-orange-300 bg-orange-500 px-3 py-1 text-xs text-white" type="button" onClick={exportAsImage} disabled={exporting}>
            {exporting ? "Đang xuất ảnh..." : "Xuất ảnh"}
          </button>
          <span>
            {saving ? "Đang lưu…" : saved ? "Đã lưu" : ""}
            {saveError ? ` ${saveError}` : ""}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-orange-200 bg-white">
        <table ref={tableRef} className="min-w-[1100px] w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-30 bg-orangeStrong text-white">
            <tr>
              <th className="sticky left-0 top-0 z-50 w-14 bg-orangeStrong px-3 py-2 text-left">STT</th>
              <th className="sticky left-14 top-0 z-40 bg-orangeStrong px-3 py-2 text-left">Tên vật tư</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">Đvt</th>
              <th className="sticky top-0 z-30 bg-orangeMid px-3 py-2 text-left">T. CUỐI</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">SB THỰC TẾ</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">RK</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">CHÊNH LỆCH</th>
              <th className="sticky top-0 z-30 bg-orangeMid px-3 py-2 text-left">TĐ</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">Nhập đ/c</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">Xuất Đ/C</th>
              <th className="sticky top-0 z-30 px-3 py-2 text-left">HỦY</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ row, index }) => (
              <tr key={`${row.id}-${index}`} className="border-t border-orange-100">
                <td className="sticky left-0 z-20 bg-orange-50 px-3 py-2 text-center font-medium">{index + 1}</td>
                <td className="sticky left-14 z-10 bg-orange-50 px-3 py-2 font-medium" title={`${row.product}${row.productCode ? ` - ${row.productCode}` : ""}`}>
                  <div className="sm:hidden">
                    <div>{shortenProductName(row.product, 10)}</div>
                    <div className="text-[10px] font-normal text-slate-500">{row.productCode || "N/A"}</div>
                  </div>
                  <div className="hidden sm:block">
                    <div>{row.product}</div>
                    <div className="text-xs font-normal text-slate-500">Mã: {row.productCode || "Không có mã"}</div>
                  </div>
                </td>
                <td className="px-3 py-2">{row.unit}</td>
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
              <button className="text-sm text-slate-500" type="button" onClick={() => setCalcOpen(false)}>
                Đóng
              </button>
            </div>
            <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-right text-lg font-semibold text-slate-800">{calcExpr}</div>
            <div className="grid grid-cols-4 gap-2 text-base">
              {["7", "8", "9", "/"].map((v) => (
                <button key={v} className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc(v)}>
                  {v}
                </button>
              ))}
              {["4", "5", "6", "*"].map((v) => (
                <button key={v} className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc(v)}>
                  {v}
                </button>
              ))}
              {["1", "2", "3", "-"].map((v) => (
                <button key={v} className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc(v)}>
                  {v}
                </button>
              ))}
              <button className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc("0")}>
                0
              </button>
              <button className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc(".")}>
                .
              </button>
              <button className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={backspaceCalc}>
                Xóa
              </button>
              <button className="rounded-lg border border-orange-200 bg-white py-3" type="button" onClick={() => appendCalc("+")}>
                +
              </button>
              <button className="col-span-2 rounded-lg border border-orange-300 bg-orange-100 py-3" type="button" onClick={clearCalc}>
                C
              </button>
              <button className="col-span-2 rounded-lg border border-orange-500 bg-orange-500 py-3 text-white" type="button" onClick={applyCalc}>
                =
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">Preview Import Excel</div>
                <div className="text-xs text-slate-500">{importFileName}</div>
              </div>
              <button className="text-sm text-slate-500" type="button" onClick={() => setImportModalOpen(false)}>
                Đóng
              </button>
            </div>

            <div className="overflow-auto px-4 py-3">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-orange-100 text-slate-700">
                    <th className="px-3 py-2 text-left">product_code</th>
                    <th className="px-3 py-2 text-left">rk (excel)</th>
                    <th className="px-3 py-2 text-left">trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.length === 0 && (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        Không có dữ liệu hợp lệ để preview.
                      </td>
                    </tr>
                  )}
                  {importPreview.map((item, index) => (
                    <tr key={`${item.productCode || "empty"}-${index}`} className="border-t border-orange-50">
                      <td className="px-3 py-2">{item.productCode || "(trống)"}</td>
                      <td className="px-3 py-2">{item.rkRaw || "(trống)"}</td>
                      <td className="px-3 py-2">
                        <span className={item.status === "Hợp lệ" ? "rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700" : "rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-700"}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-orange-100 px-4 py-3">
              <button className="rounded-md border border-orange-200 bg-white px-3 py-2 text-sm text-slate-700" type="button" onClick={() => setImportModalOpen(false)}>
                Hủy
              </button>
              <button className="rounded-md border border-orange-500 bg-orange-500 px-3 py-2 text-sm text-white" type="button" onClick={confirmExcelImport}>
                Xác nhận import
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button className="rounded-md border border-orange-300 bg-orange-100 px-3 py-1 text-xs text-orange-700" type="button" onClick={clearAllNumbers}>
          Xóa dữ liệu số
        </button>
      </div>

      <div className="pt-2 text-center text-xs text-slate-500">Bản quyền © Huỳnh Trần Tiến Khải</div>
    </section>
  );
}
