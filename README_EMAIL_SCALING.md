# Email Scaling Guide - How to Send Millions of Emails Fast

## The Problem
With the default 2 req/sec limit, sending 100,000 emails takes ~7 hours. That's way too slow!

## The Solution: Multiple Strategies

### 1. **Upgrade Resend Plan** (Easiest)
Resend has much higher limits on paid plans:
- **Pro**: 10-20 req/sec = 100,000 emails in ~1-2 hours
- **Enterprise**: 50+ req/sec = 100,000 emails in ~30 minutes

**Configuration:**
```env
RESEND_BATCH_SIZE=25
RESEND_BATCH_DELAY_MS=50
MAX_CONCURRENT_EMAIL_BATCHES=10
```

### 2. **Use Concurrent Batch Processing** (Already Implemented)
The system now processes multiple batches concurrently:
- Default: 5 batches at once
- Can increase to 10-20 for faster processing
- Each batch sends emails concurrently

**Configuration:**
```env
MAX_CONCURRENT_EMAIL_BATCHES=10  # Process 10 batches simultaneously
RESEND_BATCH_SIZE=25              # 25 emails per batch
RESEND_BATCH_DELAY_MS=50          # 50ms delay = 20 req/sec per batch
```

**Result:** 10 batches × 25 emails = 250 emails processed concurrently
- With 20 req/sec per batch = 200 req/sec total
- 100,000 emails in ~8-10 minutes! 🚀

### 3. **Use Multiple Queue Workers** (Advanced)
Run multiple instances of the queue processor:
- Deploy multiple Vercel Cron jobs
- Or use a dedicated worker service
- Each worker processes the queue independently

### 4. **Switch to Enterprise Email Service** (For Millions)
For truly massive scale (millions of emails), consider:

**AWS SES:**
- 50,000 emails/day free tier
- Can request higher limits
- ~$0.10 per 1,000 emails
- Can send millions per hour

**SendGrid:**
- 100 emails/day free
- Pro: 50,000+ emails/day
- Bulk sending API
- Dedicated IPs available

**Mailgun:**
- 5,000 emails/month free
- Pay-as-you-go pricing
- High throughput

### 5. **Use Batch/Bulk APIs**
Many services offer batch APIs that accept thousands of emails in one request:
- Resend: Check if they have a batch API
- SendGrid: Bulk API
- AWS SES: SendBulkTemplatedEmail

## Recommended Configuration for Scale

### Small Scale (< 1,000 agents)
```env
RESEND_BATCH_SIZE=10
RESEND_BATCH_DELAY_MS=100
MAX_CONCURRENT_EMAIL_BATCHES=5
EMAIL_QUEUE_THRESHOLD=50
```

### Medium Scale (1,000 - 10,000 agents)
```env
RESEND_BATCH_SIZE=25
RESEND_BATCH_DELAY_MS=50
MAX_CONCURRENT_EMAIL_BATCHES=10
EMAIL_QUEUE_THRESHOLD=100
```

### Large Scale (10,000+ agents)
```env
RESEND_BATCH_SIZE=50
RESEND_BATCH_DELAY_MS=20
MAX_CONCURRENT_EMAIL_BATCHES=20
EMAIL_QUEUE_THRESHOLD=200
```

Or switch to AWS SES/SendGrid for dedicated infrastructure.

## How Big Companies Do It

1. **Dedicated Infrastructure**: Own email servers or dedicated IPs
2. **Multiple Workers**: Hundreds of workers processing queues
3. **Batch APIs**: Send thousands of emails per API call
4. **CDN/Distribution**: Distribute load across regions
5. **Gradual Ramp-up**: Start slow, increase gradually to build reputation

## Current Implementation

The system now supports:
- ✅ Concurrent batch processing (5-20 batches at once)
- ✅ Configurable rate limits
- ✅ Automatic queue processing
- ✅ Scales to hundreds of thousands

**With proper configuration, 100,000 emails can be sent in ~10 minutes instead of 7 hours!**

