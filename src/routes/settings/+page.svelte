<script>
  import { onMount } from 'svelte';
  import { settings, updateSetting } from '$lib/stores/settings.js';
  import { currentTheme, availableThemes, updateTheme } from '$lib/stores/theme.js';
  import { user } from '$lib/stores/auth.js';
  import { subscriptionStatus, userTier, TIER_TYPES, loadSubscriptionStatus } from '$lib/stores/userTier.js';
  import { Settings, Filter, Store, Tag, Palette, User, LogOut, Crown, Star, ExternalLink } from 'lucide-svelte';
  import { notifySuccess } from '$lib/stores/notifications.js';
  import { goto } from '$app/navigation';

  // Track if we've loaded subscription on this page view
  let hasLoadedSubscription = false;
  
  // Load subscription status on mount
  onMount(async () => {
    // Check if returning from billing portal
    const returningFromPortal = sessionStorage.getItem('returning-from-billing-portal');
    
    if (returningFromPortal) {
      sessionStorage.removeItem('returning-from-billing-portal');
      console.log('Returned from billing portal, polling for updates...');
      pollingForUpdates = true;
      
      // Poll for updates up to 30 times (60 seconds)
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Polling attempt ${attempts}/30`);
        await loadSubscriptionStatus();
        
        if (attempts >= 30) {
          clearInterval(pollInterval);
          pollingForUpdates = false;
          console.log('Stopped polling');
        }
      }, 2000);
    } else if (!hasLoadedSubscription) {
      // Normal page load - load subscription once
      await loadSubscriptionStatus();
      hasLoadedSubscription = true;
      console.log('Subscription status loaded:', $subscriptionStatus);
    }
  });

  // Recipe toggle removed - recipes are always enabled


  async function logout() {
    try {
      const { signOut } = await import('$lib/auth.js');
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // Test function to toggle between Free and Plus tiers for development
  function toggleTier() {
    if ($userTier === TIER_TYPES.FREE) {
      // Switch to Plus
      userTier.set(TIER_TYPES.PLUS);
      subscriptionStatus.set({
        tier: TIER_TYPES.PLUS,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripeCustomerId: 'cus_test_manual',
        stripeSubscriptionId: 'sub_test_manual'
      });
      notifySuccess('Switched to Plus tier (test mode)');
    } else {
      // Switch to Free
      userTier.set(TIER_TYPES.FREE);
      subscriptionStatus.set({
        tier: TIER_TYPES.FREE,
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
      notifySuccess('Switched to Free tier (test mode)');
    }
  }

  let loadingBillingPortal = false;
  let pollingForUpdates = false;
  
  async function openBillingPortal() {
    if (loadingBillingPortal) return;
    
    loadingBillingPortal = true;
    try {
      console.log('Opening billing portal...');
      const { apiRequest } = await import('$lib/api.js');
      const response = await apiRequest('/api/stripe/billing-portal', {
        method: 'POST'
      });
      
      console.log('Billing portal response:', response);
      
      if (response.url) {
        // Store flag so we know to poll when returning
        sessionStorage.setItem('returning-from-billing-portal', 'true');
        window.location.href = response.url;
      } else if (response.redirectToUpgrade) {
        notifySuccess('Manual subscription detected. For billing management, please upgrade to a real subscription.');
        goto('/upgrade');
      } else {
        throw new Error(response.error || 'No URL returned from billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      notifySuccess('Failed to open billing portal. Please try again.');
      loadingBillingPortal = false;
    }
  }



</script>

<svelte:head>
  <title>Settings - nomStack</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <!-- Header -->
  <div class="mt-4 mb-6">
  </div>

  <!-- Account Card -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <User class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Account</h2>
      </div>
      
      <div class="flex items-center justify-between">
        <div>
          <p class="text-primary/70 text-sm">Signed in as</p>
          <p class="text-primary font-medium">{$user?.email || 'Loading...'}</p>
        </div>
        <button
          class="btn btn-outline btn-sm text-primary border-primary hover:bg-primary hover:text-white"
          on:click={logout}
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  </div>

  <!-- Subscription Status Card -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        {#if $userTier === TIER_TYPES.PLUS}
          <Crown class="h-6 w-6 text-primary" />
        {:else}
          <Star class="h-6 w-6 text-primary" />
        {/if}
        <h2 class="text-xl font-bold text-primary">Subscription</h2>
        {#if pollingForUpdates}
          <span class="loading loading-spinner loading-sm text-primary ml-auto"></span>
          <span class="text-sm text-primary/70">Checking for updates...</span>
        {/if}
      </div>
      
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="text-primary/70 text-sm">Current Plan</p>
          <p class="text-primary font-medium">
            {#if $userTier === TIER_TYPES.PLUS}
              nomStack Plus
            {:else}
              Free Plan
            {/if}
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          {#if $userTier === TIER_TYPES.FREE}
            <button
              class="btn btn-primary btn-sm w-full sm:w-auto"
              on:click={() => goto('/upgrade')}
            >
              <Crown class="h-4 w-4" />
              Upgrade to Plus
            </button>
          {:else}
            {#if $subscriptionStatus?.stripeCustomerId && !$subscriptionStatus.stripeCustomerId.startsWith('cus_manual_') && !$subscriptionStatus.stripeCustomerId.startsWith('cus_test_')}
              <button
                class="btn btn-outline btn-sm w-full sm:w-auto"
                on:click={openBillingPortal}
                disabled={loadingBillingPortal}
              >
                {#if loadingBillingPortal}
                  <span class="loading loading-spinner loading-xs"></span>
                  Loading...
                {:else}
                  <ExternalLink class="h-4 w-4" />
                  Manage Subscription
                {/if}
              </button>
            {/if}
            <button
              class="btn btn-outline btn-sm w-full sm:w-auto"
              on:click={toggleTier}
            >
              {#if $userTier === TIER_TYPES.FREE}
                <Crown class="h-4 w-4" />
                Test: Switch to Plus
              {:else}
                <Star class="h-4 w-4" />
                Test: Switch to Free
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Meal Categories Management -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Tag class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Meal Categories</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Categories help you group similar types of food together and make meal planning easier.
      </p>

      <a href="/categories" class="btn btn-primary">
        <Tag class="h-4 w-4" />
        Manage Categories
      </a>
    </div>
  </div>

  <!-- Meal Filter Settings -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6 {$userTier === TIER_TYPES.FREE ? 'opacity-60' : ''}">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Filter class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Meal Filters</h2>
        {#if $userTier === TIER_TYPES.FREE}
          <span class="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">Plus Only</span>
        {/if}
      </div>
      
      <p class="text-primary/70 mb-6">
        {#if $userTier === TIER_TYPES.FREE}
          Free users get standard meal filters (All, Breakfast, Lunch, Dinner, Snack, Dessert, Side). Upgrade to Plus to customize which filters matter to you.
        {:else}
          Meal filters appear at the top of the meals list page. You can select which filters matter to you.
        {/if}
      </p>

      {#if $userTier === TIER_TYPES.FREE}
        <button 
          class="btn btn-primary opacity-50 cursor-not-allowed"
          disabled
          title="Upgrade to Plus to customize meal filters"
        >
          <Filter class="h-4 w-4" />
          Edit Filters
        </button>
      {:else}
        <a href="/settings/meal-filters" class="btn btn-primary">
          <Filter class="h-4 w-4" />
          Edit Filters
        </a>
      {/if}
    </div>
  </div>

  <!-- Stores Management -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Store class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Grocery Stores</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Configure your preferred grocery stores to shop for specific items at specific stores.
      </p>

      <a href="/stores" class="btn btn-primary">
        <Store class="h-4 w-4" />
        Manage Stores
      </a>
    </div>
  </div>

  <!-- Theme Color Picker -->
  <div class="card bg-white shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Palette class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">App Theme</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Choose your preferred color theme for the app. This will change the primary color used throughout the interface.
      </p>

      <div class="grid grid-cols-4 gap-3">
        {#each availableThemes as theme}
          <button
            class="flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-105 {$currentTheme === theme.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}"
            on:click={() => {
              updateTheme(theme.value);
              notifySuccess(`Theme changed to ${theme.name}`);
            }}
            title={theme.name}
          >
            <div 
              class="w-8 h-8 rounded-full border-white shadow-sm"
              style="background-color: {theme.color}"
            ></div>
            <span class="text-xs font-medium text-primary/70">{theme.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>


</div>
