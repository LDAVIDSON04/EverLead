# Email Deliverability Guide for Soradin

This guide explains how to prevent Soradin emails from landing in spam/junk folders and ensure they reach recipients' inboxes.

## Current Setup

- **Email Service:** Resend API
- **Default From Address:** `notifications@soradin.com`
- **From Name:** Soradin

## Critical Steps for Email Deliverability

### 1. Verify Your Domain with Resend (MOST IMPORTANT)

**Why:** Verifying your domain (`soradin.com`) with Resend enables SPF, DKIM, and DMARC authentication, which are essential for inbox delivery.

**Steps:**

1. **Log into Resend Dashboard:**
   - Go to https://resend.com/dashboard
   - Navigate to **Domains** section

2. **Add Your Domain:**
   - Click "Add Domain"
   - Enter `soradin.com`
   - Resend will generate DNS records you need to add

3. **Add DNS Records to Your Domain:**
   
   Resend will provide you with records like:
   - **SPF Record** (TXT record)
     - Example: `v=spf1 include:resend.com ~all`
   
   - **DKIM Records** (3 TXT records)
     - Example: `resend._domainkey.soradin.com`
   
   - **DMARC Record** (TXT record)
     - Example: `_dmarc.soradin.com` with value `v=DMARC1; p=none;`

4. **Verify in Your DNS Provider:**
   - Log into your domain registrar (where you bought soradin.com)
   - Go to DNS management
   - Add the TXT records provided by Resend
   - Wait for DNS propagation (5 minutes to 24 hours)

5. **Verify Domain in Resend:**
   - Once DNS records are added, click "Verify" in Resend dashboard
   - Resend will check that all records are correctly configured

### 2. Update Environment Variable

Once your domain is verified, update the `RESEND_FROM_EMAIL` environment variable:

**In Vercel/your hosting platform:**
```env
RESEND_FROM_EMAIL=Soradin <notifications@soradin.com>
```

Make sure you're using the verified domain (`@soradin.com`), not a generic email.

### 3. Email Content Best Practices (Already Implemented)

✅ **Good practices you're already following:**
- Clear, honest subject lines (e.g., "Appointment Confirmed - [Date]")
- Professional HTML email templates
- No spam trigger words in subject lines
- Clear sender name ("Soradin")

⚠️ **Things to avoid:**
- All caps in subject lines
- Excessive exclamation marks
- Words like "FREE", "ACT NOW", "LIMITED TIME"
- Misleading subject lines

### 4. Monitor Email Deliverability

**Resend Dashboard:**
- Check delivery rates in Resend dashboard
- Monitor bounce rates
- Watch for spam complaints

**Email Service Provider Tools:**
- Use tools like [Mail-tester.com](https://www.mail-tester.com) to test your emails
- Send a test email and check spam score (aim for 10/10)

### 5. Warm Up Your Domain (For High Volume)

If you're sending many emails:
- Start with low volume (50-100 emails/day)
- Gradually increase over 2-4 weeks
- This builds sender reputation

### 6. Additional Recommendations

**Unsubscribe Links:**
- Ensure all transactional emails include unsubscribe links (if applicable)
- For appointment emails, unsubscribe may not be necessary, but include "Contact us" links

**Reply-To Address:**
- Consider adding a `reply-to` address like `support@soradin.com`
- This helps with engagement (replies improve sender reputation)

**List Hygiene:**
- Only send to valid email addresses
- Handle bounces properly (Resend does this automatically)
- Remove invalid addresses from your database

## Quick Checklist

- [ ] Domain `soradin.com` verified in Resend
- [ ] SPF record added to DNS
- [ ] DKIM records (3 TXT records) added to DNS
- [ ] DMARC record added to DNS
- [ ] Domain verified in Resend dashboard (shows green checkmark)
- [ ] `RESEND_FROM_EMAIL` environment variable uses `@soradin.com` domain
- [ ] Test email sent and checked with mail-tester.com (score 8+/10)
- [ ] Monitor Resend dashboard for delivery rates

## Testing Your Setup

1. **Send a test email:**
   ```bash
   # Use Resend's test email feature or send from your app
   ```

2. **Check with Mail Tester:**
   - Go to https://www.mail-tester.com
   - Get the test email address
   - Send a test email from your Soradin app
   - Check your spam score (should be 8-10/10)

3. **Verify SPF/DKIM/DMARC:**
   - Use tools like:
     - https://mxtoolbox.com/spf.aspx
     - https://mxtoolbox.com/dkim.aspx
     - https://mxtoolbox.com/dmarc.aspx

## Common Issues

**Emails still going to spam after setup:**
1. DNS records not fully propagated (wait 24 hours)
2. Domain not fully verified in Resend
3. Using unverified domain or generic email
4. Poor sender reputation (needs time to build)

**High bounce rates:**
1. Invalid email addresses in database
2. Email list not cleaned regularly
3. Sending to old/inactive addresses

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend Domain Setup:** https://resend.com/docs/dashboard/domains/introduction
- **Resend Support:** support@resend.com

## Next Steps

1. **Immediate:** Verify `soradin.com` domain with Resend and add DNS records
2. **Short-term:** Monitor delivery rates and spam scores for 1-2 weeks
3. **Long-term:** Maintain clean email lists and good sender practices

