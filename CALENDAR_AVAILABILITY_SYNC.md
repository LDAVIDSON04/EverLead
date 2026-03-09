# Calendar & availability sync (Google, Calendly, Soradin)

Soradin is designed to work with **any** agent who uses Google Calendar (and optionally Calendly) so availability stays in sync everywhere.

## How it’s supposed to work

1. **Soradin**  
   - The agent sets their **weekly schedule** in Soradin (e.g. Mon–Fri 9–5 per location).  
   - That defines **when they’re willing to be booked**.

2. **Google Calendar**  
   - We only treat **“Show as: Busy”** events as blocking.  
   - Events marked **“Show as: Free”** are **not** synced into Soradin, so they **do not** block slots.  
   - So: **real meetings** = Busy → block; **availability windows / placeholders** = Free → don’t block.

3. **Calendly (if used)**  
   - Calendly reads Google to know when the agent is busy.  
   - When someone books via Calendly, it creates a **busy** event on Google → we sync it → we block that time in Soradin too.  
   - So Soradin and Calendly stay aligned: both use Google as the source of “busy”.

## What agents should do (works for everyone)

- For any calendar event that means **“I’m available in this window”** (e.g. “Office hours”, “Home”, “Available”, or blocks created by Calendly for availability):  
  In **Google Calendar**, set that event to **“Show as: Free”**.  
- Keep **real** meetings and appointments as **“Show as: Busy”** (default).

Then:

- Soradin only blocks when Google says “busy”.  
- Calendly only blocks when Google says “busy”.  
- No per-person logic in code; behaviour is the same for every agent.

## Optional: custom “don’t block” titles per agent

If an agent can’t or doesn’t want to change events to “Show as: Free” in Google, they can configure titles that Soradin should **not** use to block slots.

In the agent’s **profile** `metadata`, set:

```json
{
  "calendar": {
    "nonBlockingEventTitles": ["Home", "Tax Collection Day", "Dixon Davis/Derek Ford Studios"]
  }
}
```

- Only that agent’s availability is affected.  
- No hardcoded names in app code; each agent (or admin) can add their own list.

## Summary

- **Universal rule:** We only sync and block on **busy** (opaque) events from Google. **Free** (transparent) events never block.  
- **Recommendation:** Mark availability-style events as “Show as: Free” in Google so Google + Calendly + Soradin all agree.  
- **Override:** Use `metadata.calendar.nonBlockingEventTitles` per agent when needed.
