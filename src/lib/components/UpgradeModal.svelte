<script>
  import { createEventDispatcher } from 'svelte';
  import { Crown, X, Star, Zap, Check, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let triggerSource = ''; // The source that triggered the modal

  // Contextual messages based on trigger source
  const messages = {
    'meal-limit': {
      title: "You've built an amazing meal collection!",
      subtitle: "You've reached the 50-meal limit on the free plan.",
      description: "You've created a great list of meals, but you're out of space on the free plan. Here's why the Plus plan is worth it for you:",
      benefits: [
        "Unlimited meals and recipes",
        "Photo recipe import - just snap and go!",
        "Advanced meal planning features",
        "Priority support"
      ],
      cta: "Start your free trial and keep building your meal collection"
    },
    'photo-import': {
      title: "Never type another recipe ever again!",
      subtitle: "Plus includes unlimited recipe photo imports.",
      description: "Save hours of typing with a photo of any recipe. nomStack Plus instantly extracts recipe details for you (edit if you want).",
      benefits: [
        "Works with website photos, PDFs, Docs, cookbooks, handwriting, index cards, etc.",
        "Extracts ingredients, instructions, notes, servings, and cooking/prep times",
        "Automatically adds to your meal plan and shopping list (including ingredients)",

      ],
      cta: "Try photo import free for 14 days"
    },
    'meal-plan-limit': {
      title: "We got a meal planning pro over here. Look out!",
      subtitle: "We thought 3 meal plans would be enough. Nope!",
      description: "You've created killer meal plans, but you're out of space. We recommend our shiny action-packed Plus plan!",
      benefits: [
        "Unlimited meal plans with full history",
        "Organize by week, month, or special events",
        "Templates for effortless planning"
      ],
      cta: "Try Plus free for 14 days"
    },
    'store-limit': {
      title: "Save yourself time and frustration at the store!",
      subtitle: "You've reached the store limit on the free plan.",
      description: "If you shop at multiple stores, you'll need more slots to create lists for each one. nomStack Plus has you covered there.",
      benefits: [
        "Each store gets its own shopping list you can instantly edit on the go",
        "Move items to other stores as needed, if they were out of something or on sale elsewhere",
        "Add one-off items the kids JUST remembered while you're at the store"
      ],
      cta: "Try Plus free for 14 days"
    },
    'advanced-features': {
      title: "Unlock advanced features!",
      subtitle: "This feature is available with nomStack Plus.",
      description: "Get access to powerful features that make meal planning even easier and more organized.",
      benefits: [
        "Advanced meal filters and organization",
        "Data export and backup",
        "All theme colors and customization",
        "Priority support"
      ],
      cta: "Try Plus free for 14 days"
    },
    'default': {
      title: "Upgrade to nomStack Plus!",
      subtitle: "Unlock unlimited possibilities.",
      description: "Get unlimited recipes, advanced features, and priority support to take your meal planning to the next level.",
      benefits: [
        "Unlimited meals and recipes",
        "Photo recipe import",
        "Advanced features and filters",
        "Priority support"
      ],
      cta: "Try Plus free for 14 days"
    }
  };

  $: currentMessage = messages[triggerSource] || messages.default;

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function startFreeTrial() {
    // Redirect to upgrade page
    goto('/upgrade');
    closeModal();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="upgrade-modal-title"
  >
    <!-- Modal Content -->
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-full">
            <Crown class="h-6 w-6 text-primary" />
          </div>
          <h2 id="upgrade-modal-title" class="text-xl font-bold text-primary">
            {currentMessage.title}
          </h2>
        </div>
        <button
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          on:click={closeModal}
          aria-label="Close modal"
        >
          <X class="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Subtitle -->
        <p class="text-primary/70 text-sm mb-4">
          {currentMessage.subtitle}
        </p>

        <!-- Description -->
        <p class="text-primary/80 mb-6">
          {currentMessage.description}
        </p>

        <!-- Benefits -->
        <div class="space-y-3 mb-8">
          {#each currentMessage.benefits as benefit}
            <div class="flex items-start gap-3">
              <div class="p-1 bg-green-100 rounded-full flex-shrink-0 mt-0.5">
                <Check class="h-4 w-4 text-green-600" />
              </div>
              <span class="text-primary/80 text-sm">{benefit}</span>
            </div>
          {/each}
        </div>

        <!-- Free Trial Highlight -->
        <div class="bg-white rounded-lg p-4 mb-6 border border-primary/20">
          <div class="flex items-center gap-2 mb-2">
            <Star class="h-5 w-5 text-primary" />
            <span class="font-semibold text-primary">14-Day Free Trial</span>
          </div>
          <p class="text-primary/70 text-sm">
            Try nomStack Plus free for 14 days. Cancel anytime, no questions asked.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3">
          <button
            class="btn btn-primary w-full text-white"
            on:click={startFreeTrial}
          >
            <Crown class="h-4 w-4" />
            {currentMessage.cta}
            <ArrowRight class="h-4 w-4" />
          </button>
          
          <button
            class="btn btn-ghost w-full text-primary/70 hover:text-primary"
            on:click={closeModal}
          >
            Maybe later
          </button>
        </div>

        <!-- Pricing Info -->
        <div class="text-center mt-4 pt-4 border-t border-gray-200">
          <p class="text-xs text-primary/80">
            After free trial: $4.99/month • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure modal appears above everything */
  :global(.upgrade-modal) {
    z-index: 9999;
  }
</style>
