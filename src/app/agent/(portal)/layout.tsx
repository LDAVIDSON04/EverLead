// src/app/agent/(portal)/layout.tsx
import { AgentTopBar } from "@/components/AgentTopBar";

export default function AgentPortalLayout({
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

