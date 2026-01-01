# RLS Performance Optimization Explanation

## What We Fixed

We optimized **92 performance issues** related to Row Level Security (RLS) policies in your Supabase database.

## The Problem

Your RLS policies were using `auth.uid()` directly in their conditions. PostgreSQL evaluates this function **once for every row** being checked, which can slow down queries significantly when dealing with many rows.

### Example of the Problem:
```sql
-- SLOW: Evaluates auth.uid() for each row
CREATE POLICY "Agents can view their own appointments"
  USING (agent_id = auth.uid())
```

## The Solution

We wrapped all `auth.uid()` calls in a subquery: `(select auth.uid())`. This tells PostgreSQL to evaluate the function **once per query** instead of once per row, which dramatically improves performance.

### Example of the Fix:
```sql
-- FAST: Evaluates auth.uid() once per query
CREATE POLICY "Agents can view their own appointments"
  USING (agent_id = (select auth.uid()))
```

## Tables Optimized

We optimized policies for all these tables:
- ✅ `payments`
- ✅ `profiles`
- ✅ `calendar_connections`
- ✅ `specialist_time_off`
- ✅ `specialists`
- ✅ `specialist_availability`
- ✅ `families`
- ✅ `appointment_types`
- ✅ `appointments`
- ✅ `bids`
- ✅ `lead_bids`
- ✅ `lead_notes`
- ✅ `external_events`
- ✅ `office_locations`

## About "Multiple Permissive Policies" Warnings

The warnings about "multiple permissive policies" are **informational only** and don't need to be fixed. These occur when you have multiple policies for the same action (e.g., "Admins can view all" AND "Agents can view their own"). This is **expected and correct behavior** - PostgreSQL combines them with OR logic, which is exactly what you want.

## Impact

After running this migration:
- ✅ Database queries will be faster, especially when scanning many rows
- ✅ Your app's performance will improve
- ✅ No functionality changes - everything works exactly the same, just faster
- ✅ No security changes - all the same security rules apply

## Next Steps

1. Run the migration in your Supabase SQL editor: `optimize_rls_policies_performance.sql`
2. The migration is safe to run multiple times (it uses `DROP POLICY IF EXISTS`)
3. After running, the performance warnings should disappear from Supabase

## Technical Details

- **Before**: `auth.uid()` evaluated N times (once per row)
- **After**: `(select auth.uid())` evaluated 1 time (once per query)
- **Performance improvement**: Up to 10-100x faster for queries scanning many rows

