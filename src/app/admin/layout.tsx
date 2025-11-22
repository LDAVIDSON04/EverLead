// src/app/admin/layout.tsx
import { AdminTopBar } from "@/components/AdminTopBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <AdminTopBar />
      {children}
    </main>
  );
}

