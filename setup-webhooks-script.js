// Run this in your browser console when on your site
// It will set up all missing webhooks for Google and Microsoft

async function setupAllWebhooks() {
  try {
    console.log('🔍 Checking webhook status...');
    
    // First, check current status
    const statusResponse = await fetch('/api/integrations/setup-webhooks');
    const status = await statusResponse.json();
    
    console.log('📊 Current Status:', {
      total: status.total,
      withWebhooks: status.withWebhooks,
      missingWebhooks: status.missingWebhooks,
      expiredWebhooks: status.expiredWebhooks
    });
    
    if (status.missingWebhooks === 0 && status.expiredWebhooks === 0) {
      console.log('✅ All webhooks are already set up!');
      return;
    }
    
    console.log('🚀 Setting up missing webhooks...');
    
    // Set up missing webhooks
    const setupResponse = await fetch('/api/integrations/setup-webhooks', {
      method: 'POST'
    });
    const result = await setupResponse.json();
    
    console.log('✅ Setup Complete!', {
      setup: result.setup,
      failed: result.failed,
      total: result.total,
      errors: result.errors
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('❌ Errors:', result.errors);
    }
    
    // Verify the setup
    console.log('🔍 Verifying setup...');
    const verifyResponse = await fetch('/api/integrations/setup-webhooks');
    const verify = await verifyResponse.json();
    
    console.log('📊 Final Status:', {
      total: verify.total,
      withWebhooks: verify.withWebhooks,
      missingWebhooks: verify.missingWebhooks,
      expiredWebhooks: verify.expiredWebhooks
    });
    
    if (verify.missingWebhooks === 0) {
      console.log('🎉 Success! All webhooks are now set up!');
    } else {
      console.warn('⚠️ Some webhooks still need setup. Check errors above.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
setupAllWebhooks();

