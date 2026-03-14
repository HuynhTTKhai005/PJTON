import InventoryTable from "@/components/InventoryTable";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-orange-600">Kiểm kê tồn kho hằng ngày</h1>
        <p className="text-sm text-slate-600">
          Nhập số liệu hôm nay. Các chỉ số sẽ tự tính ngay lập tức.
        </p>
      </header>
      <InventoryTable />
    </main>
  );
}
