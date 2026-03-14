import { NextResponse } from "next/server";
import { getInventoryByDate, getPreviousInventory, saveInventory } from "@/lib/db";
import type { InventoryPayload } from "@/types/inventory";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayDate();

  const current = await getInventoryByDate(date);
  const previous = await getPreviousInventory(date);

  if (!current && !previous) {
    return NextResponse.json({
      date,
      rows: [],
      updatedAt: new Date().toISOString(),
      previousDateRows: []
    });
  }

  return NextResponse.json({
    date: current?.date ?? date,
    rows: current?.rows ?? [],
    updatedAt: current?.updatedAt ?? new Date().toISOString(),
    previousDateRows: previous?.rows ?? []
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as InventoryPayload;

  if (!body?.date || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const saved = await saveInventory({
    date: body.date,
    rows: body.rows,
    updatedAt: body.updatedAt ?? new Date().toISOString()
  });

  if (!saved) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
