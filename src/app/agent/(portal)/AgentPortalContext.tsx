"use client";

import { createContext, useContext, ReactNode } from "react";

export type AgentPortalAuth = {
  userId: string | null;
  accessToken: string | null;
};

const AgentPortalContext = createContext<AgentPortalAuth>({
  userId: null,
  accessToken: null,
});

export function AgentPortalProvider({
  value,
  children,
}: {
  value: AgentPortalAuth;
  children: ReactNode;
}) {
  return (
    <AgentPortalContext.Provider value={value}>
      {children}
    </AgentPortalContext.Provider>
  );
}

export function useAgentPortalAuth() {
  return useContext(AgentPortalContext);
}
