// src/lib/leads.ts

export type Lead = {
  id: string;
  assigned_agent_id: string | null;
  status: string | null;
  [key: string]: any;
};

/**
 * Determines if an agent owns a lead.
 * An agent owns a lead if assigned_agent_id matches their ID.
 */
export function agentOwnsLead(lead: Lead, currentAgentId: string): boolean {
  return lead.assigned_agent_id === currentAgentId;
}

