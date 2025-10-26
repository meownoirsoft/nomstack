<script>
  import { onMount } from 'svelte';
  import { subscriptionStatus, TIER_TYPES } from '$lib/stores/userTier.js';
  import { user } from '$lib/stores/auth.js';
  import { Crown, CreditCard, Calendar, AlertTriangle, Download, ExternalLink } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let loading = false;
  let error = null;
  let subscription = null;
  let showCancelConfirm = false;

  onMount(async () => {
    await loadSubscriptionData();
  });

  async function loadSubscriptionData() {
    if (!$user) return;
    
    try {
      const response = await fetch('/api/stripe/status');
      if (response.ok) {
        subscription = await response.json();
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      error = 'Failed to load subscription data';
    }
  }

  async function openBillingPortal() {
    loading = true;
    error = null;
    
    try {
      console.log('Opening billing portal...');
      const { apiRequest } = await import('$lib/api.js');
      const response = await apiRequest('/api/stripe/billing-portal', {
        method: 'POST'
      });
      
      console.log('Billing portal response:', response);
      
      if (response.url) {
        window.location.href = response.url;
      } else if (response.redirectToUpgrade) {
        error = 'Manual subscription detected. For billing management, please upgrade to a real subscription.';
        // Redirect to upgrade page
        setTimeout(() => {
          window.location.href = '/upgrade';
        }, 2000);
      } else {
        throw new Error(response.error || 'No URL returned from billing portal');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      error = 'Failed to open billing portal. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Stripe handles all subscription management through their portal
  // No need for custom cancellation logic

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'trialing': return 'text-blue-600';
      case 'past_due': return 'text-yellow-600';
      case 'canceled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
</script>

<svelte:head>
  <title>Subscription Management - nomStack</title>
</svelte:head>

<main class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- Header -->
  <div class="text-center mb-8">
    <div class="flex items-center justify-center gap-3 mb-4">
      <Crown class="h-8 w-8 text-primary" />
      <h1 class="text-3xl font-bold text-primary">Subscription Management</h1>
    </div>
    <p class="text-primary/70 text-lg">
      Manage your nomStack Plus subscription and billing
    </p>
  </div>

  <!-- Current Subscription Status -->
  {#if subscription && subscription.isActive}
    <div class="bg-white rounded-lg shadow-lg border border-primary/20 p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-primary">Current Subscription</h2>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-600">Active</span>
        </div>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-primary mb-2">Plan Details</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Plan:</span>
              <span class="font-medium">nomStack Plus</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="font-medium {getStatusColor(subscription.status)} capitalize">
                {subscription.status}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Next billing:</span>
              <span class="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold text-primary mb-2">Billing Information</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Customer ID:</span>
              <span class="font-medium font-mono text-xs">{subscription.stripeCustomerId?.substring(0, 12)}...</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Subscription ID:</span>
              <span class="font-medium font-mono text-xs">{subscription.stripeSubscriptionId?.substring(0, 12)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Management Actions -->
    <div class="bg-white rounded-lg shadow-lg border border-primary/20 p-6 mb-8">
      <h2 class="text-xl font-bold text-primary mb-4">Manage Subscription</h2>
      
      <div class="text-center">
        <p class="text-gray-600 mb-4">
          Use Stripe's secure portal to manage your subscription, update payment methods, and view billing history.
        </p>
        <button 
          class="btn btn-primary flex items-center gap-2 mx-auto"
          on:click={openBillingPortal}
          disabled={loading}
        >
          <ExternalLink class="h-4 w-4" />
          {loading ? 'Opening...' : 'Manage Subscription'}
        </button>
      </div>
    </div>

    <!-- Data Export -->
    <div class="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
      <h2 class="text-lg font-semibold text-blue-800 mb-2">Export Your Data</h2>
      <p class="text-blue-700 text-sm mb-4">
        Download all your recipes, meal plans, and data before cancelling your subscription.
      </p>
      <button class="btn btn-outline btn-primary flex items-center gap-2">
        <Download class="h-4 w-4" />
        Export All Data
      </button>
    </div>

  {:else if subscription && !subscription.isActive}
    <!-- Expired/Cancelled Subscription -->
    <div class="bg-yellow-50 rounded-lg border border-yellow-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <AlertTriangle class="h-6 w-6 text-yellow-600" />
        <h2 class="text-lg font-semibold text-yellow-800">Subscription Inactive</h2>
      </div>
      <p class="text-yellow-700 mb-4">
        Your subscription is no longer active. You've been downgraded to the free plan.
      </p>
      <button 
        class="btn btn-primary"
        on:click={() => goto('/upgrade')}
      >
        <Crown class="h-4 w-4" />
        Upgrade to Plus
      </button>
    </div>

  {:else}
    <!-- No Subscription -->
    <div class="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-800 mb-2">No Active Subscription</h2>
      <p class="text-gray-600 mb-4">
        You're currently on the free plan. Upgrade to Plus for unlimited recipes and premium features.
      </p>
      <button 
        class="btn btn-primary"
        on:click={() => goto('/upgrade')}
      >
        <Crown class="h-4 w-4" />
        Upgrade to Plus
      </button>
    </div>
  {/if}

  <!-- Error Message -->
  {#if error}
    <div class="alert alert-error mb-8">
      <span>{error}</span>
    </div>
  {/if}

</main>
