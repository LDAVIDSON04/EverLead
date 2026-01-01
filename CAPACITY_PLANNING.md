# Soradin Capacity Planning & Daily Load Estimation

## Current System Capacity (After Optimizations)

### Database Size Limits (Cumulative)
- **Total Leads in Database**: 50,000 - 100,000 leads
- **Total Agents**: 1,000 - 2,000 agents
- **Total Appointments**: 500,000+ appointments

These are the maximum totals the system can efficiently query with current optimizations.

---

## Daily Capacity Estimates

### Conservative Estimate (Safe Operations)
- **New Leads/Day**: 500 - 1,000 leads
- **Active Agents/Day**: 200 - 500 agents
- **Database Queries/Day**: 10,000 - 25,000 queries
- **Peak Concurrent Users**: 20 - 50 agents simultaneously
- **New Appointments/Day**: 200 - 500 appointments

### Moderate Estimate (Normal Growth)
- **New Leads/Day**: 1,000 - 2,000 leads
- **Active Agents/Day**: 500 - 1,000 agents
- **Database Queries/Day**: 25,000 - 50,000 queries
- **Peak Concurrent Users**: 50 - 100 agents simultaneously
- **New Appointments/Day**: 500 - 1,000 appointments

### High Estimate (Peak Load - Approaching Limits)
- **New Leads/Day**: 2,000 - 5,000 leads
- **Active Agents/Day**: 1,000 - 1,500 agents
- **Database Queries/Day**: 50,000 - 100,000 queries
- **Peak Concurrent Users**: 100 - 200 agents simultaneously
- **New Appointments/Day**: 1,000 - 2,000 appointments

---

## Breaking Down Daily Operations

### Lead Creation Flow
1. **Family submits questionnaire** → Creates 1 lead
2. **System geocodes location** → 1 API call
3. **System queries agents by province** → 1 database query (with province index = fast)
4. **System filters agents by distance/city** → Processes ~50-200 agents (in-memory)
5. **System sends notification emails** → 10-50 emails per lead (depending on agent density)

**Capacity per lead**: ~0.1-0.5 seconds processing time
**Daily capacity**: 2,000-5,000 leads/day (conservative: 1,000/day)

### Agent Viewing Available Leads
1. **Agent opens "Available Leads" page** → 1 database query (paginated, province-filtered)
2. **Loads 50 leads at a time** → Fast query (< 100ms with indexes)
3. **Agent scrolls/loads more** → Additional paginated queries

**Queries per agent session**: 2-5 queries
**Peak concurrent sessions**: 50-100 agents
**Daily queries from this feature**: 5,000-15,000 queries/day

### Agent Viewing Schedule
1. **Agent opens Schedule page** → 1-2 queries (appointments + external events)
2. **Queries filtered by agent_id** → Fast with index
3. **Loads week view** → Single query

**Queries per agent session**: 2-3 queries
**Daily queries from this feature**: 2,000-5,000 queries/day

### Agent Dashboard
1. **Agent opens Dashboard** → 10 parallel queries (stats)
2. **All queries use indexes** → Fast execution
3. **Parallel execution** → Total time ~200-500ms

**Queries per agent session**: 10 queries
**Daily queries from this feature**: 3,000-8,000 queries/day

---

## Monthly Growth Scenarios

### Scenario 1: Steady Growth (Small Business)
- **Month 1**: 500 leads/month, 50 agents
- **Month 3**: 1,000 leads/month, 100 agents
- **Month 6**: 2,000 leads/month, 200 agents
- **Month 12**: 3,000 leads/month, 400 agents
- **System Status**: ✅ Well within capacity

### Scenario 2: Rapid Growth (Growing Business)
- **Month 1**: 1,000 leads/month, 100 agents
- **Month 3**: 3,000 leads/month, 250 agents
- **Month 6**: 6,000 leads/month, 500 agents
- **Month 12**: 12,000 leads/month, 1,000 agents
- **System Status**: ✅ Current capacity, ⚠️ Monitor at 6 months

### Scenario 3: Aggressive Growth (High Growth Startup)
- **Month 1**: 2,000 leads/month, 200 agents
- **Month 3**: 6,000 leads/month, 500 agents
- **Month 6**: 15,000 leads/month, 1,200 agents
- **Month 12**: 30,000 leads/month, 2,000 agents
- **System Status**: ⚠️ Will need optimization by month 6-9

---

## Performance Metrics to Monitor

### Database Performance
- **Query Response Time**: Should be < 200ms for most queries
- **Slow Query Log**: Watch for queries > 1 second
- **Connection Pool Usage**: Monitor Supabase connection limits
- **Index Usage**: Ensure indexes are being used (Supabase dashboard)

### Application Performance
- **API Response Time**: Should be < 500ms for most endpoints
- **Page Load Time**: Should be < 2 seconds
- **Error Rate**: Should be < 1%

### Daily Metrics to Track
- **New Leads Created**: Track daily volume
- **Active Agents**: Unique agents using system per day
- **Peak Concurrent Users**: Maximum simultaneous users
- **Database Queries**: Total queries per day
- **Notification Emails Sent**: Emails per lead created

---

## When to Scale Further

### Immediate Action Needed If:
- ❌ Daily leads exceed 5,000/day
- ❌ Concurrent users exceed 200 simultaneously
- ❌ Database queries exceed 100,000/day
- ❌ Query response times exceed 500ms regularly
- ❌ Error rate exceeds 5%

### Planning Needed If:
- ⚠️ Daily leads exceed 3,000/day
- ⚠️ Concurrent users exceed 150 simultaneously
- ⚠️ Database queries exceed 75,000/day
- ⚠️ Query response times exceed 300ms regularly

### Next Optimization Steps (When Needed):
1. **PostGIS Implementation** (for geospatial queries in notifications)
2. **Redis Caching Layer** (cache frequently accessed data)
3. **Background Job Queue** (process emails asynchronously)
4. **Database Read Replicas** (distribute read load)
5. **API Rate Limiting** (prevent abuse)
6. **CDN for Static Assets** (faster page loads)

---

## Recommended Daily Limits (Conservative)

For safe, reliable operations without performance issues:

- **New Leads/Day**: 1,000 leads (can burst to 2,000)
- **Active Agents/Day**: 500 agents
- **Peak Concurrent Users**: 75 agents
- **Database Queries/Day**: 30,000 queries
- **New Appointments/Day**: 500 appointments

---

## Cost Considerations

### Supabase Pricing Tiers
- **Free Tier**: 500 MB database, 2 GB bandwidth
- **Pro Tier**: 8 GB database, 250 GB bandwidth
- **Team Tier**: 32 GB database, 500 GB bandwidth

### Estimated Monthly Costs by Usage

**Small Business (500 leads/month, 100 agents)**:
- Supabase: Free/Pro ($25/month)
- Vercel: Hobby (Free)
- Email (Resend): ~$0-20/month
- **Total: ~$25-45/month**

**Growing Business (2,000 leads/month, 400 agents)**:
- Supabase: Pro ($25/month)
- Vercel: Pro ($20/month)
- Email (Resend): ~$50-100/month
- **Total: ~$95-145/month**

**High Growth (5,000 leads/month, 1,000 agents)**:
- Supabase: Team ($599/month) or Pro with additional storage
- Vercel: Pro ($20/month)
- Email (Resend): ~$150-300/month
- **Total: ~$770-920/month**

---

## Action Items

1. **Set up monitoring** (use Supabase dashboard + Vercel analytics)
2. **Track daily metrics** (leads, queries, users)
3. **Set up alerts** for performance degradation
4. **Review monthly** and adjust capacity estimates
5. **Plan optimization timeline** based on growth projections

---

## Questions to Answer for Your Business

1. **Expected leads per month in Year 1?**
   - Conservative: 1,000-3,000/month → Current capacity ✅
   - Moderate: 5,000-10,000/month → Monitor closely ⚠️
   - Aggressive: 15,000+/month → Plan optimizations now 🚨

2. **Expected agents in Year 1?**
   - < 500 agents → Current capacity ✅
   - 500-1,000 agents → Monitor closely ⚠️
   - 1,000+ agents → Plan optimizations 🚨

3. **Peak usage patterns?**
   - Steady throughout day → Better for capacity planning
   - Morning/evening spikes → Need higher peak capacity
   - Weekend vs weekday differences → Plan accordingly

---

## Summary

**Current System Can Handle:**
- ✅ 1,000-2,000 new leads per day
- ✅ 500-1,000 active agents per day
- ✅ 50-100 concurrent users
- ✅ 30,000-50,000 database queries per day

**Safe Daily Operating Limits:**
- 🟢 1,000 new leads/day
- 🟢 500 active agents/day
- 🟢 75 concurrent users
- 🟢 30,000 queries/day

**When to Scale:**
- 🟡 Monitor closely: 2,000+ leads/day or 750+ active agents/day
- 🔴 Need optimization: 5,000+ leads/day or 1,500+ active agents/day

