# Email Sending Configuration

## Resend Rate Limits by Plan

### Free Tier
- **Rate Limit**: ~2 requests/second
- **Configuration**:
  ```env
  RESEND_BATCH_SIZE=2
  RESEND_BATCH_DELAY_MS=500
  ```

### Pro Tier
- **Rate Limit**: ~10-20 requests/second
- **Configuration**:
  ```env
  RESEND_BATCH_SIZE=10
  RESEND_BATCH_DELAY_MS=100
  ```

### Enterprise Tier
- **Rate Limit**: 50+ requests/second
- **Configuration**:
  ```env
  RESEND_BATCH_SIZE=25
  RESEND_BATCH_DELAY_MS=50
  ```

## Why Not Send All At Once?

Even with higher rate limits, you **shouldn't** send all emails instantly because:

1. **Email Deliverability**: Sending thousands of emails instantly looks like spam
2. **ISP Protection**: Gmail, Outlook, etc. will throttle/block sudden spikes
3. **Domain Reputation**: Your sender reputation can be damaged
4. **Best Practices**: Gradual sending maintains better deliverability rates

## Queue Threshold

The system automatically queues emails when there are more than a certain number of agents:

```env
EMAIL_QUEUE_THRESHOLD=50  # Default: queue if more than 50 agents
```

This ensures:
- Small batches (≤50): Sent immediately
- Large batches (>50): Queued and processed in background

## Upgrading Your Resend Plan

If you upgrade to Resend Pro or Enterprise:

1. Update your `.env` file with the new batch size and delay
2. Update `RESEND_BATCH_SIZE` and `RESEND_BATCH_DELAY_MS` in Vercel
3. The system will automatically use the new limits

## Monitoring

Check your email queue status:
```sql
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;
```

## Alternative: Use Resend Batch API

If Resend offers a batch API in the future, we can update the code to use it for even better performance.

