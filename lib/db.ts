import { createClient } from "@supabase/supabase-js";
import type { InventoryPayload, InventoryRow } from "@/types/inventory";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

export async function getInventoryByDate(date: string): Promise<InventoryPayload | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("inventory_days")
    .select("date, rows, updated_at")
    .eq("date", date)
    .maybeSingle();

  if (error || !data) return null;

  return {
    date: data.date,
    rows: data.rows ?? [],
    updatedAt: data.updated_at ?? new Date().toISOString()
  };
}

export async function getPreviousInventory(date: string): Promise<InventoryPayload | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("inventory_days")
    .select("date, rows, updated_at")
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    date: data.date,
    rows: data.rows ?? [],
    updatedAt: data.updated_at ?? new Date().toISOString()
  };
}

async function getFutureInventories(date: string): Promise<InventoryPayload[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("inventory_days")
    .select("date, rows, updated_at")
    .gt("date", date)
    .order("date", { ascending: true });

  if (error || !data) return [];

  return data.map((item) => ({
    date: item.date,
    rows: item.rows ?? [],
    updatedAt: item.updated_at ?? new Date().toISOString()
  }));
}

function applyCarryForward(rows: InventoryRow[], previousRows?: InventoryRow[]): InventoryRow[] {
  const previousMap = new Map<string, InventoryRow>();
  (previousRows ?? []).forEach((row) => previousMap.set(row.product, row));

  return rows.map((row) => ({
    ...row,
    opening: previousMap.get(row.product)?.ending ?? 0
  }));
}

async function saveInventoryRecord(payload: InventoryPayload): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client.from("inventory_days").upsert(
    {
      date: payload.date,
      rows: payload.rows,
      updated_at: payload.updatedAt
    },
    { onConflict: "date" }
  );

  return !error;
}

export async function saveInventory(payload: InventoryPayload): Promise<boolean> {
  const previous = await getPreviousInventory(payload.date);
  const normalizedCurrent: InventoryPayload = {
    ...payload,
    rows: applyCarryForward(payload.rows, previous?.rows),
    updatedAt: new Date().toISOString()
  };

  const savedCurrent = await saveInventoryRecord(normalizedCurrent);
  if (!savedCurrent) return false;

  const futureInventories = await getFutureInventories(payload.date);
  let carryRows = normalizedCurrent.rows;

  for (const futureInventory of futureInventories) {
    const normalizedFutureRows = applyCarryForward(futureInventory.rows, carryRows);
    const unchanged =
      JSON.stringify(normalizedFutureRows) === JSON.stringify(futureInventory.rows);

    carryRows = normalizedFutureRows;

    if (unchanged) continue;

    const savedFuture = await saveInventoryRecord({
      ...futureInventory,
      rows: normalizedFutureRows,
      updatedAt: new Date().toISOString()
    });

    if (!savedFuture) return false;
  }

  return true;
}
