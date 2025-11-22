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
  auction_start_at: string | null;
  auction_ends_at: string | null;
  auction_status: 'pending' | 'open' | 'expired' | 'sold_auction' | 'sold_buy_now' | null;
  auction_timezone: string | null;
  starting_bid: number | null;
  min_increment: number | null;
  buy_now_price: number | null; // In dollars, not cents
  current_bid_amount: number | null; // In dollars, not cents
  current_bid_agent_id: string | null;
  winning_agent_id: string | null;
  assigned_agent_id: string | null;
  notification_sent_at: string | null;
}

export interface LeadBid {
  id: string;
  lead_id: string;
  agent_id: string;
  amount: number; // In dollars, not cents
  created_at: string;
}


