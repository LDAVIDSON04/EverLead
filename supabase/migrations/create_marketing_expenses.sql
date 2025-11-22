-- Create marketing_expenses table for ROI tracking
create table if not exists public.marketing_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  expense_date date not null,
  amount numeric(10,2) not null,
  description text,
  channel text
);

-- Enable RLS (for now, allow all - admin-only access is handled at application level)
alter table public.marketing_expenses enable row level security;

-- Allow service role to do everything (for API routes using supabaseAdmin)
create policy "Service role can manage expenses"
  on public.marketing_expenses
  for all
  using (true)
  with check (true);


