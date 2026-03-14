import { createClient } from "@supabase/supabase-js";
import type { InventoryPayload } from "@/types/inventory";

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

export async function saveInventory(payload: InventoryPayload): Promise<boolean> {
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
