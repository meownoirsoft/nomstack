<script>
  import { onMount } from 'svelte';
  import { subscriptionStatus, userTier, TIER_TYPES } from '$lib/stores/userTier.js';
  import { user } from '$lib/stores/auth.js';
  import { Crown, CheckCircle, ArrowRight, Star, AlertTriangle, RefreshCw } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { notifySuccess, notifyError } from '$lib/stores/notifications.js';

  // Page title for header
  $: pageTitle = 'Welcome to Plus!';

  let subscriptionData = null;
  let isLoading = false;
  let showManualFix = false;
  let debugInfo = null;

  onMount(async () => {
    // Reload subscription status to reflect the new subscription
    console.log('Loading subscription status after payment...');
    await loadSubscriptionStatus();
    
    // Always show manual fix option initially, then hide if subscription is active
    showManualFix = true;
    
    // Check if subscription is active after a delay
    setTimeout(() => {
      if (subscriptionData && subscriptionData.isActive) {
        showManualFix = false;
      }
    }, 3000);
  });

  async function loadSubscriptionStatus() {
    try {
      const { loadSubscriptionStatus } = await import('$lib/stores/userTier.js');
      await loadSubscriptionStatus();
      
      // Get the current subscription data
      subscriptionData = $subscriptionStatus;
      console.log('Subscription status loaded:', subscriptionData);
      
      if (subscriptionData && subscriptionData.isActive) {
        userTier.set(TIER_TYPES.PLUS);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  }

  async function processPayment() {
    if (!$user) return;
    
    isLoading = true;
    
    try {
      // Get the session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (!sessionId) {
        throw new Error('No session ID found in URL');
      }

      console.log('Processing payment with session ID:', sessionId);
      
      const { apiRequest } = await import('$lib/api.js');
      const response = await apiRequest('/api/stripe/process-payment', {
        method: 'POST',
        body: { sessionId }
      });

      if (response && response.success) {
        notifySuccess('Payment processed successfully! Your Plus subscription is now active.');
        
        // Refresh the page to load the subscription status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response?.error || 'Failed to process payment');
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      notifyError('Failed to process payment: ' + error.message);
    } finally {
      isLoading = false;
    }
  }

  async function debugSubscription() {
    try {
      const { apiRequest } = await import('$lib/api.js');
      const response = await apiRequest('/api/debug-subscription', {
        method: 'GET'
      });
      
      debugInfo = response;
      console.log('Debug info:', debugInfo);
    } catch (error) {
      console.error('Error getting debug info:', error);
    }
  }
</script>

<svelte:head>
  <title>Welcome to nomStack Plus! - nomStack</title>
</svelte:head>

<main class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="text-center">
    <!-- Success Icon -->
    <div class="mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
        <CheckCircle class="h-12 w-12 text-green-600" />
      </div>
      <h1 class="text-3xl font-bold text-primary mb-2">Welcome to nomStack Plus!</h1>
      <p class="text-primary/70 text-lg">
        Your subscription is now active. Enjoy unlimited recipes and premium features!
      </p>
    </div>

    <!-- What's New -->
    <div class="bg-white rounded-lg shadow-lg border border-primary/20 p-8 mb-8">
      <div class="flex items-center gap-3 mb-6">
        <Crown class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">What's Now Available</h2>
      </div>
      
      <div class="grid gap-4 text-left">
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">Unlimited recipes (no more 50-recipe limit!)</span>
        </div>
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">Unlimited meal plans and stores</span>
        </div>
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">All theme colors and customization</span>
        </div>
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">Advanced meal filters</span>
        </div>
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">Data export functionality</span>
        </div>
        <div class="flex items-center gap-3">
          <Star class="h-5 w-5 text-primary flex-shrink-0" />
          <span class="text-primary/80">Priority support</span>
        </div>
      </div>
    </div>

    <!-- Manual Activation Section -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <Crown class="h-6 w-6 text-blue-600" />
        <h3 class="text-lg font-semibold text-blue-800">Activate Your Plus Subscription</h3>
      </div>
      <p class="text-blue-700 mb-4">
        If your subscription isn't showing as active yet, click the button below to manually activate it. 
        This ensures you get immediate access to all Plus features.
      </p>
      <div class="flex gap-3">
        <button 
          class="btn btn-primary"
          on:click={processPayment}
          disabled={isLoading}
        >
          {#if isLoading}
            <RefreshCw class="h-4 w-4 animate-spin" />
            Processing...
          {:else}
            <Crown class="h-4 w-4" />
            Process My Payment
          {/if}
        </button>
        <button 
          class="btn btn-outline"
          on:click={debugSubscription}
        >
          Debug Subscription
        </button>
      </div>
    </div>

    <!-- Debug Info -->
    {#if debugInfo}
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <h4 class="font-semibold mb-2">Debug Information:</h4>
        <pre class="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    {/if}

    <!-- Next Steps -->
    <div class="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold text-white mb-4">Ready to get started?</h3>
      <p class="text-white/90 mb-6">
        Now that you have Plus access, you can add unlimited recipes and take advantage of all premium features.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          class="btn btn-primary"
          on:click={() => goto('/')}
        >
          <ArrowRight class="h-4 w-4" />
          Start Planning Meals
        </button>
        <button 
          class="btn bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-colors"
          style="color: white !important;"
          on:click={() => goto('/settings')}
        >
          Explore Settings
        </button>
      </div>
    </div>

    <!-- Support -->
    <div class="text-center">
      <p class="text-primary/60 text-sm mb-2">
        Questions about your subscription? 
      </p>
      <a 
        href="mailto:support@nomstack.com" 
        class="text-primary hover:text-primary/80 text-sm font-medium"
      >
        Contact Support
      </a>
    </div>
  </div>
</main>
