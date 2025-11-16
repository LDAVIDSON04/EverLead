// src/types/leads.ts

export interface Lead {
  id: string;
  created_at: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  suggested_price_cents: number | null;
  buy_now_price_cents: number | null;
  // Auction fields
  auction_enabled: boolean;
  auction_ends_at: string | null;
  buy_now_price: number | null; // In dollars, not cents
  current_bid_amount: number | null; // In dollars, not cents
  current_bid_agent_id: string | null;
  assigned_agent_id: string | null;
}

export interface LeadBid {
  id: string;
  lead_id: string;
  agent_id: string;
  amount: number; // In dollars, not cents
  created_at: string;
}

