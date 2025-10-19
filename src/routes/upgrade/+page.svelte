<script>
  import { onMount } from 'svelte';
  import { subscriptionStatus, TIER_TYPES, TIER_LIMITS } from '$lib/stores/userTier.js';
  import { user } from '$lib/stores/auth.js';
  import { Crown, Check, ArrowLeft, Star, Zap, Shield, Heart, Camera } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  // Page title for header
  $: pageTitle = 'Upgrade';

  let loading = false;
  let error = null;

  // Pricing plans
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      tier: TIER_TYPES.FREE,
      description: 'Perfect for getting started',
      features: [
        'Up to 50 recipes',
        'Basic meal planning',
        'Shopping lists',
        'Pantry tracking',
        'Basic themes',
        'Manual recipe entry'
      ],
      limitations: [
        'Limited to 3 meal plans',
        'Limited to 5 stores',
        'No photo import',
        'No advanced filters',
        'No data export'
      ],
      popular: false
    },
    {
      name: 'Plus',
      price: '$4.99',
      period: 'month',
      tier: TIER_TYPES.PLUS,
      description: 'For families and power users',
      features: [
        'Unlimited recipes',
        'Unlimited meal plans',
        'Unlimited stores',
        'Photo recipe import',
        'Advanced meal filters',
        'All theme colors',
        'Data export',
        'Priority support'
      ],
      limitations: [],
      popular: true
    }
  ];

  async function handleUpgrade() {
    if (!$user) {
      goto('/login');
      return;
    }

    loading = true;
    error = null;

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_plus_monthly', // This would be your actual Stripe price ID
          successUrl: `${window.location.origin}/upgrade/success`,
          cancelUrl: `${window.location.origin}/upgrade`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      error = err.message || 'Failed to start upgrade process. Please try again.';
    } finally {
      loading = false;
    }
  }

  function getCurrentPlan() {
    let currentStatus;
    subscriptionStatus.subscribe(status => {
      currentStatus = status;
    })();
    return currentStatus?.tier || TIER_TYPES.FREE;
  }
</script>

<svelte:head>
  <title>Upgrade - nomStack</title>
</svelte:head>

<main class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- Header -->
  <div class="text-center mb-12">
    <div class="flex items-center justify-center gap-3 mb-4">
      <Crown class="h-8 w-8 text-primary" />
      <h1 class="text-3xl font-bold text-primary">Upgrade to nomStack Plus</h1>
    </div>
    <p class="text-primary/70 text-lg max-w-2xl mx-auto">
      Unlock unlimited recipes, advanced features, and everything you need for effortless meal planning.
    </p>
  </div>

  <!-- Current Plan Indicator -->
  {#if getCurrentPlan() === TIER_TYPES.PLUS}
    <div class="alert alert-success mb-8">
      <Star class="h-5 w-5" />
      <div>
        <h3 class="font-bold">You're already a Plus subscriber!</h3>
        <p>Enjoy all the premium features nomStack has to offer.</p>
      </div>
    </div>
  {/if}

  <!-- Pricing Cards -->
  <div class="grid md:grid-cols-2 gap-8 mb-12">
    {#each plans as plan}
      <div class="card bg-white shadow-lg border border-primary/20 relative {plan.popular ? 'ring-2 ring-primary' : ''}">
        {#if plan.popular}
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
        {/if}
        
        <div class="card-body p-8">
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
            <div class="text-4xl font-bold text-primary mb-1">
              {plan.price}
              {#if plan.period !== 'forever'}
                <span class="text-lg font-normal text-primary/60">/{plan.period}</span>
              {/if}
            </div>
            <p class="text-primary/70">{plan.description}</p>
          </div>

          <!-- Features -->
          <div class="space-y-3 mb-8">
            {#each plan.features as feature}
              <div class="flex items-center gap-3">
                <Check class="h-5 w-5 text-green-500 flex-shrink-0" />
                <span class="text-primary/80">{feature}</span>
              </div>
            {/each}
            
            {#each plan.limitations as limitation}
              <div class="flex items-center gap-3 opacity-60">
                <div class="h-5 w-5 flex-shrink-0"></div>
                <span class="text-primary/60 text-sm">{limitation}</span>
              </div>
            {/each}
          </div>

          <!-- Action Button -->
          {#if plan.tier === getCurrentPlan()}
            <button class="btn btn-outline btn-primary w-full" disabled>
              <Check class="h-4 w-4" />
              Current Plan
            </button>
          {:else if plan.tier === TIER_TYPES.PLUS}
            <button 
              class="btn btn-primary w-full"
              on:click={handleUpgrade}
              disabled={loading}
            >
              {#if loading}
                <span class="loading loading-spinner loading-sm"></span>
                Processing...
              {:else}
                <Crown class="h-4 w-4" />
                Upgrade to Plus
              {/if}
            </button>
          {:else}
            <button class="btn btn-ghost w-full" disabled>
              Free Plan
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Photo Import Showcase -->
  <div class="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-8 mb-8">
    <div class="text-center mb-6">
      <div class="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <Camera class="h-10 w-10 text-primary" />
      </div>
      <h2 class="text-2xl font-bold text-primary mb-2">Photo Recipe Import</h2>
      <p class="text-primary/70 text-lg">
        The most powerful feature in nomStack Plus
      </p>
    </div>
    
    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h3 class="text-xl font-semibold text-primary mb-4">How it works:</h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
            <p class="text-primary/80">Take a photo of any recipe from a cookbook, magazine, or handwritten card</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
            <p class="text-primary/80">Our AI instantly extracts ingredients, instructions, and cooking times</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
            <p class="text-primary/80">Your recipe is automatically added to your meal plan and shopping list</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="text-center">
          <div class="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Camera class="h-12 w-12 text-gray-400" />
          </div>
          <p class="text-primary/60 text-sm italic">
            "Save hours of typing - just snap and go!"
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Benefits Section -->
  <div class="bg-white rounded-lg shadow-lg border border-primary/20 p-8 mb-8">
    <h2 class="text-2xl font-bold text-primary text-center mb-8">Why Upgrade to Plus?</h2>
    
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Zap class="h-8 w-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-primary mb-2">Unlimited Everything</h3>
        <p class="text-primary/70 text-sm">
          No more limits on recipes, meal plans, or stores. Plan as many meals as you want.
        </p>
      </div>
      
      <div class="text-center">
        <div class="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Shield class="h-8 w-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-primary mb-2">Advanced Features</h3>
        <p class="text-primary/70 text-sm">
          Access advanced meal filters, data export, and priority support.
        </p>
      </div>
      
      <div class="text-center">
        <div class="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Heart class="h-8 w-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-primary mb-2">Support Development</h3>
        <p class="text-primary/70 text-sm">
          Help us continue improving nomStack with new features and updates.
        </p>
      </div>
    </div>
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="alert alert-error mb-8">
      <span>{error}</span>
    </div>
  {/if}

  <!-- Back Button -->
  <div class="text-center">
    <button class="btn btn-ghost" on:click={() => goto('/')}>
      <ArrowLeft class="h-4 w-4" />
      Back to nomStack
    </button>
  </div>
</main>
