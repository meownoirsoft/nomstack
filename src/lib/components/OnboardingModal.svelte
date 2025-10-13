<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { handleNewUserSetup, checkUserOnboarding } from '$lib/auth.js';
  import { user } from '$lib/stores/auth.js';
  import { CheckCircle, Loader, AlertCircle, Sparkles } from 'lucide-svelte';
  import WelcomeMessage from './WelcomeMessage.svelte';

  const dispatch = createEventDispatcher();

  let isOpen = false;
  let isLoading = false;
  let setupResult = null;
  let error = null;
  let currentStep = 0;
  let progress = 0;
  let showWelcome = false;

  const steps = [
    { title: 'Setting up your account...', description: 'Creating your personal sources and categories' },
    { title: 'Adding sample meals...', description: 'Populating your meal library with delicious options' },
    { title: 'Creating meal filters...', description: 'Organizing your meals for easy browsing' },
    { title: 'Setting up your first meal plan...', description: 'Getting you started with meal planning' },
    { title: 'Almost done...', description: 'Finalizing your account setup' }
  ];

  // Check if user needs onboarding when component mounts
  onMount(async () => {
    if ($user) {
      const onboarding = await checkUserOnboarding($user.id);
      if (onboarding.needsOnboarding) {
        isOpen = true;
        startOnboarding();
      }
    }
  });

  async function startOnboarding() {
    if (!$user) return;
    
    isLoading = true;
    error = null;
    currentStep = 0;
    progress = 0;

    try {
      // Simulate progress through steps
      const stepInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          progress = (currentStep / steps.length) * 100;
        }
      }, 800);

      // Perform the actual setup
      setupResult = await handleNewUserSetup($user.id);
      
      clearInterval(stepInterval);
      currentStep = steps.length - 1;
      progress = 100;

      if (setupResult.success) {
        // Show success for a moment, then show welcome message
        setTimeout(() => {
          isOpen = false;
          showWelcome = true;
        }, 2000);
      } else {
        error = setupResult.message;
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      error = err.message || 'Something went wrong during setup';
    } finally {
      isLoading = false;
    }
  }

  function closeModal() {
    isOpen = false;
    dispatch('complete');
  }

  function handleWelcomeDismiss() {
    showWelcome = false;
    dispatch('complete');
  }

  function skipOnboarding() {
    isOpen = false;
    dispatch('skip');
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="text-center">
        <!-- Header -->
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <Sparkles class="w-8 h-8 text-primary" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to NomStack!</h2>
          <p class="text-gray-600">Let's set up your meal planning account with some helpful starter data.</p>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style="width: {progress}%"
            ></div>
          </div>
          <p class="text-sm text-gray-500">{Math.round(progress)}% complete</p>
        </div>

        <!-- Current Step -->
        {#if isLoading}
          <div class="mb-6">
            <div class="flex items-center justify-center mb-3">
              <Loader class="w-6 h-6 text-primary animate-spin mr-2" />
              <h3 class="text-lg font-semibold text-gray-900">{steps[currentStep]?.title}</h3>
            </div>
            <p class="text-gray-600">{steps[currentStep]?.description}</p>
          </div>
        {/if}

        <!-- Success State -->
        {#if setupResult?.success}
          <div class="mb-6">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Setup Complete!</h3>
            <p class="text-gray-600">{setupResult.message}</p>
          </div>
        {/if}

        <!-- Error State -->
        {#if error}
          <div class="mb-6">
            <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Setup Issue</h3>
            <p class="text-gray-600 mb-4">{error}</p>
            <p class="text-sm text-gray-500">Don't worry, you can still use the app and add your own data!</p>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex flex-col space-y-3">
          {#if isLoading}
            <button 
              class="btn btn-outline btn-sm"
              on:click={skipOnboarding}
              disabled
            >
              Skip Setup
            </button>
          {:else if setupResult?.success}
            <button 
              class="btn btn-primary"
              on:click={closeModal}
            >
              Get Started!
            </button>
          {:else if error}
            <button 
              class="btn btn-primary"
              on:click={closeModal}
            >
              Continue Anyway
            </button>
            <button 
              class="btn btn-outline btn-sm"
              on:click={startOnboarding}
            >
              Try Again
            </button>
          {:else}
            <button 
              class="btn btn-primary"
              on:click={startOnboarding}
            >
              Start Setup
            </button>
            <button 
              class="btn btn-outline btn-sm"
              on:click={skipOnboarding}
            >
              Skip Setup
            </button>
          {/if}
        </div>

        <!-- What's Included -->
        {#if !isLoading && !setupResult && !error}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">What you'll get:</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li class="flex items-center">
                <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                6 recipe sources (Instagram, Pinterest, etc.)
              </li>
              <li class="flex items-center">
                <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                10 meal categories (Breakfast, Lunch, Dinner, etc.)
              </li>
              <li class="flex items-center">
                <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                10 sample meals to get you started
              </li>
              <li class="flex items-center">
                <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                Meal filters for easy organization
              </li>
              <li class="flex items-center">
                <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                Your first meal plan
              </li>
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Welcome Message -->
{#if showWelcome}
  <WelcomeMessage on:dismiss={handleWelcomeDismiss} />
{/if}

<style>
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
