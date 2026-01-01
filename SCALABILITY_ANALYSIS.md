# Soradin Scalability Analysis

## Current State Assessment

### ✅ Good Practices Found

1. **Database Indexes**: Comprehensive indexing on:
   - Foreign keys (agent_id, lead_id, appointment_id, etc.)
   - Frequently queried columns (status, created_at, dates)
   - Composite indexes for common query patterns
   - GIN indexes for JSON/array columns (metadata, notification_cities)

2. **Parallel Queries**: Dashboard uses `Promise.all()` for parallel queries
3. **RLS (Row Level Security)**: Properly implemented for data isolation
4. **Connection Pooling**: Using Supabase which handles connection pooling

### ⚠️ Critical Scalability Issues

#### 1. **Agent Notification System** (CRITICAL)
**File**: `src/lib/notifyAgentsForLead.ts`
**Problem**: 
- Fetches ALL approved agents from database
- Loops through ALL agents in JavaScript to check distance
- O(n) complexity - will be very slow with 1000+ agents
- Distance calculations done client-side instead of database-side

**Impact**: With 1000 agents, every new lead triggers:
- 1 database query fetching all agents
- 1000+ distance calculations in JavaScript
- 1000+ email sends (if all are in range)

**Recommendation**:
```sql
-- Add PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry columns
ALTER TABLE profiles ADD COLUMN agent_location GEOGRAPHY(POINT, 4326);
ALTER TABLE leads ADD COLUMN lead_location GEOGRAPHY(POINT, 4326);

-- Create spatial indexes
CREATE INDEX idx_profiles_agent_location ON profiles USING GIST (agent_location);
CREATE INDEX idx_leads_lead_location ON leads USING GIST (lead_location);

-- Use database-side distance queries
SELECT id, email 
FROM profiles 
WHERE role = 'agent' 
  AND approval_status = 'approved'
  AND agent_province = $1
  AND ST_DWithin(
    agent_location::geography, 
    ST_MakePoint($2, $3)::geography, 
    search_radius_km * 1000
  );
```

#### 2. **Available Leads Page** (HIGH PRIORITY)
**File**: `src/app/agent/(portal)/leads/available/page.tsx`
**Problem**:
- Fetches ALL unsold leads: `.select(...).is("assigned_agent_id", null)`
- Filters by province in JavaScript after fetching
- No pagination
- No limit on results

**Impact**: With 10,000+ leads, this will:
- Load all leads into memory
- Slow page load significantly
- Cause performance issues

**Recommendation**:
```typescript
// Add pagination and database-side filtering
const { data: leadsData, error: leadsError } = await supabaseClient
  .from("leads")
  .select("...", { count: 'exact' })
  .is("assigned_agent_id", null)
  .eq("province", agentProvince) // Filter in database
  .order("created_at", { ascending: false })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

#### 3. **Admin Stats Endpoint** (MEDIUM PRIORITY)
**File**: `src/app/api/admin/stats/route.ts`
**Problem**: 
- Comment says: "you don't have that many yet; this is fine for MVP"
- Fetches ALL leads without pagination
- Processes all leads in memory

**Impact**: Will become slow with thousands of leads

**Recommendation**: Add pagination or use database aggregations

#### 4. **Missing Database Indexes** (MEDIUM PRIORITY)
**Missing indexes on**:
- `profiles.agent_province` - Frequently filtered
- `leads.province` - Frequently filtered  
- `leads.city` - Frequently filtered
- `leads.assigned_agent_id` - Should have index (might exist, verify)
- `appointments.agent_id` - Should have index (might exist, verify)

**Recommendation**:
```sql
CREATE INDEX IF NOT EXISTS idx_profiles_agent_province 
  ON profiles(agent_province) 
  WHERE agent_province IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_province 
  ON leads(province) 
  WHERE province IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_city 
  ON leads(city) 
  WHERE city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent_id 
  ON leads(assigned_agent_id) 
  WHERE assigned_agent_id IS NOT NULL;
```

#### 5. **No Rate Limiting** (MEDIUM PRIORITY)
**Problem**: No rate limiting on API endpoints
**Impact**: Vulnerable to abuse, could overwhelm system

**Recommendation**: Implement rate limiting (e.g., using Upstash Redis or Vercel Edge Config)

#### 6. **Email Queue Processing** (LOW PRIORITY)
**File**: `src/lib/emailQueue.ts` (if exists)
**Check**: Is there a background job processing emails?
**Impact**: If emails are sent synchronously, this will block requests

**Recommendation**: Use a proper job queue (e.g., Inngest, Trigger.dev, or Supabase Edge Functions)

## Recommendations by Priority

### Immediate (Before 100+ Agents)
1. ✅ Add database indexes for province/city filtering
2. ✅ Add pagination to available leads page
3. ✅ Filter leads by province in database, not JavaScript

### Short-term (Before 500+ Agents)
1. ✅ Implement PostGIS for geospatial queries in notifications
2. ✅ Add pagination to admin stats
3. ✅ Implement rate limiting on API endpoints
4. ✅ Add database-side filtering for all list queries

### Medium-term (Before 1000+ Agents)
1. ✅ Implement caching layer (Redis) for frequently accessed data
2. ✅ Add database query monitoring (Supabase Dashboard or pg_stat_statements)
3. ✅ Implement proper background job processing for emails
4. ✅ Add database connection pool monitoring
5. ✅ Consider read replicas for heavy read operations

### Long-term (1000+ Agents)
1. ✅ Database sharding by region/province
2. ✅ CDN for static assets
3. ✅ Implement database query result caching
4. ✅ Consider microservices for notification system

## Testing Recommendations

1. **Load Testing**: Use k6 or Artillery to simulate:
   - 1000 agents viewing available leads simultaneously
   - 100 leads created per minute
   - Agent notification processing under load

2. **Database Performance**: Monitor:
   - Slow query log
   - Index usage statistics
   - Connection pool utilization
   - Query execution times

3. **Application Monitoring**: Add:
   - Response time tracking
   - Error rate monitoring
   - Database query time logging
   - Memory usage monitoring

## Estimated Capacity

**Current State (No Changes)**:
- ⚠️ Can handle: ~100 agents, ~1,000 leads
- ⚠️ Will struggle: 500+ agents, 5,000+ leads
- ❌ Will fail: 1000+ agents, 10,000+ leads

**After Immediate Fixes**:
- ✅ Can handle: ~500 agents, ~10,000 leads
- ⚠️ Will struggle: 1000+ agents, 50,000+ leads

**After Short-term Fixes**:
- ✅ Can handle: ~2000 agents, ~100,000 leads
- ⚠️ Will need optimization: 5000+ agents, 500,000+ leads

## Next Steps

1. Review this analysis with your team
2. Prioritize fixes based on expected growth
3. Implement immediate fixes first
4. Set up monitoring before scaling
5. Plan capacity increases proactively

