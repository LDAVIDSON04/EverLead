#!/bin/bash
# Script to set up all missing webhooks on production (soradin.com)

echo "🔍 Step 1: Checking current webhook status on soradin.com..."
echo ""

# Check status
STATUS=$(curl -s https://soradin.com/api/integrations/setup-webhooks)
echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"
echo ""

# Extract missing webhooks count (basic parsing)
MISSING=$(echo "$STATUS" | grep -o '"missingWebhooks":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$MISSING" = "0" ] || [ -z "$MISSING" ]; then
    echo "✅ All webhooks are already set up (or couldn't parse response)!"
    echo "If you see an authentication page, you need to provide a Vercel bypass token."
    exit 0
fi

echo "🚀 Step 2: Setting up $MISSING missing webhook(s)..."
echo ""

# Set up webhooks
RESULT=$(curl -s -X POST https://soradin.com/api/integrations/setup-webhooks)
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

echo "🔍 Step 3: Verifying setup..."
echo ""

# Verify
FINAL_STATUS=$(curl -s https://soradin.com/api/integrations/setup-webhooks)
echo "$FINAL_STATUS" | python3 -m json.tool 2>/dev/null || echo "$FINAL_STATUS"

