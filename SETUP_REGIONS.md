# Setting Up Region-Based Appointment Filtering

## Step 1: Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/add_home_region_to_profiles.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

This adds the `home_region` column to your `profiles` table.

## Step 2: Set Agent Regions in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Select the **profiles** table
4. Find your test agent(s) in the list
5. Click on the row to edit it
6. In the `home_region` column, type: `okanagan`
7. Click **Save** (or press Enter)

**Repeat for each test agent** - set their `home_region` to `okanagan`.

### Quick SQL Alternative

If you prefer SQL, you can also run:

```sql
-- Set all agents to Okanagan (adjust WHERE clause as needed)
UPDATE profiles
SET home_region = 'okanagan'
WHERE role = 'agent';
```

Or set specific agents:

```sql
-- Set specific agent by email
UPDATE profiles
SET home_region = 'okanagan'
WHERE id = (SELECT id FROM auth.users WHERE email = 'agent@example.com');
```

## Step 3: Test the Region Filtering

1. **Create a new lead** through your questionnaire form
   - Use a city in the Okanagan (Kelowna, Kamloops, Penticton, Osoyoos, Oliver, Vernon, or Salmon Arm)
   - The lead will automatically get `region = 'okanagan'`

2. **Book an appointment** for that lead
   - The appointment will be created with `status = 'pending'`

3. **Log in as an Okanagan agent** (one with `home_region = 'okanagan'`)
   - Go to `/agent/appointments`
   - You should see the appointment in "Available Appointments"

4. **Log in as a non-Okanagan agent** (one with `home_region = NULL` or different region)
   - Go to `/agent/appointments`
   - You should NOT see the appointment (or see a message about no region set)

## Okanagan Cities

The following cities are automatically mapped to the `okanagan` region:
- Kelowna
- Kamloops
- Penticton
- Osoyoos
- Oliver
- Vernon
- Salmon Arm

## Adding More Regions Later

When you're ready to expand, you can:

1. Add more city lists in `src/app/api/leads/create/route.ts`
2. Set `home_region` for agents in those regions
3. The filtering will work automatically!

Example for Vancouver:

```typescript
const vancouverCities = ['vancouver', 'burnaby', 'richmond', 'surrey'];
if (vancouverCities.includes(city)) {
  region = 'vancouver';
}
```

