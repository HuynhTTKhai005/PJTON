export type InventoryRow = {
  id: string;
  product: string;
  opening: number;
  importQty: number;
  exportQty: number;
  destroyed: number;
  ending: number;
  plannedSold: number;
};

export type InventoryPayload = {
  date: string; // YYYY-MM-DD
  rows: InventoryRow[];
  updatedAt: string;
  previousDateRows?: InventoryRow[];
};
