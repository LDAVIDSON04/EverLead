// src/app/agent/layout.tsx
import { AgentTopBar } from "@/components/AgentTopBar";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <AgentTopBar />
      {children}
    </main>
  );
}

