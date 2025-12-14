// src/app/admin/layout.tsx
// This layout is for routes outside the (portal) folder
// Routes in (portal) use their own layout
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

