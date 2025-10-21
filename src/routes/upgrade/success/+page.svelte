<script>
  import { onMount } from 'svelte';
  import { subscriptionStatus } from '$lib/stores/userTier.js';
  import { Crown, CheckCircle, ArrowRight, Star } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  // Page title for header
  $: pageTitle = 'Welcome to Plus!';

  onMount(async () => {
    // Clear any test tier to ensure real subscription status is loaded
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('nomstack-test-tier');
    }
    
    // Reload subscription status to reflect the new subscription
    await import('$lib/stores/userTier.js').then(({ loadSubscriptionStatus, userTier, TIER_TYPES }) => {
      console.log('Loading subscription status after payment...');
      loadSubscriptionStatus().then(() => {
        console.log('Subscription status loaded, setting user tier to plus');
        userTier.set(TIER_TYPES.PLUS);
      });
    });
  });
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
