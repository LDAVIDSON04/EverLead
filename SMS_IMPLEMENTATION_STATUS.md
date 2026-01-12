# SMS Notification Implementation Status

## ✅ Completed

1. **SMS Library Created** (`src/lib/sms.ts`)
   - Twilio integration with proper authentication
   - Timezone-aware date/time formatting (uses province timezone)
   - Functions for all SMS types:
     - `sendConsumerBookingSMS` - Booking confirmation to consumers
     - `sendConsumerCancellationSMS` - Cancellation confirmation to consumers  
     - `sendAgentNewAppointmentSMS` - New appointment notification to agents
     - `sendAgentCancellationSMS` - Cancellation notification to agents

2. **Consumer Booking SMS Integrated**
   - Added to `src/app/api/appointments/create/route.ts`
   - Sends SMS when appointment is created
   - Includes date, time (window or specific time), arrival reminder
   - Uses consumer's province for correct timezone

## ⏳ Remaining Tasks

3. **Consumer Cancellation SMS** - Need to integrate into cancellation endpoint
4. **Agent SMS Notifications** - Need to check notification preferences and send SMS
5. **Notification Settings UI** - Add SMS toggles to agent settings page
6. **Environment Variables** - Need to add to Vercel (use values provided separately):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

## SMS Message Formats

### Consumer Booking Confirmation
```
Soradin: Your appointment [with AgentName] is confirmed for [Date] at [Time]. Please arrive 10 minutes early. Reply STOP to opt out.
```

### Consumer Cancellation
```
Soradin: Your appointment for [Date] has been cancelled. To reschedule, visit soradin.com or contact your agent. Reply STOP to opt out.
```

### Agent New Appointment
```
Soradin: New appointment booked with [ConsumerName] on [Date] at [Time]. Check your agent portal for details.
```

### Agent Cancellation
```
Soradin: Appointment with [ConsumerName] on [Date] has been cancelled. Check your agent portal for details.
```

## Timezone Handling

- **Consumer SMS**: Uses consumer's province to determine timezone (e.g., BC → PST, AB → MST)
- **Agent SMS**: Uses agent's timezone from metadata (or province fallback)
- All dates/times formatted correctly for the recipient's timezone
- Specific times show as "2:00 PM - 3:00 PM" format
- Time windows show as "Morning", "Afternoon", "Evening"
