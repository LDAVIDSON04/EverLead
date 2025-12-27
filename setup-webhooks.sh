#!/bin/bash
# Script to set up all missing webhooks for Google and Microsoft calendar connections

echo "🔍 Step 1: Checking current webhook status..."
echo ""

# Check status
STATUS=$(curl -s http://localhost:3000/api/integrations/setup-webhooks)
echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"
echo ""

# Extract missing webhooks count
MISSING=$(echo "$STATUS" | grep -o '"missingWebhooks":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$MISSING" = "0" ]; then
    echo "✅ All webhooks are already set up!"
    exit 0
fi

echo "🚀 Step 2: Setting up $MISSING missing webhook(s)..."
echo ""

# Set up webhooks
RESULT=$(curl -s -X POST http://localhost:3000/api/integrations/setup-webhooks)
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

echo "🔍 Step 3: Verifying setup..."
echo ""

# Verify
FINAL_STATUS=$(curl -s http://localhost:3000/api/integrations/setup-webhooks)
echo "$FINAL_STATUS" | python3 -m json.tool 2>/dev/null || echo "$FINAL_STATUS"

