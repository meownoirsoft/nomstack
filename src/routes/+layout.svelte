<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Notifications from '$lib/components/Notifications.svelte';
  import GlobalModal from '$lib/components/GlobalModal.svelte';
  import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
  import OnboardingModal from '$lib/components/OnboardingModal.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  import { eatingMode } from '$lib/stores/eatingMode.js';
  import { initializeOfflineSystem } from '$lib/offline/index.js';
  import { updateTheme } from '$lib/stores/theme.js';
  export let data;
  export let error;
  let currentPage;
  let offlineInitialized = false;

  // Track current page for header
  $: currentPage = $page?.url?.pathname || '/';
  
  // Determine page title based on current page
  $: pageTitle = (() => {
    switch (currentPage) {
      case '/': return $eatingMode === 'home' ? 'Meals' : '';
      case '/pantry': return 'Pantry';
      case '/settings': return 'Settings';
      case '/categories': return 'Categories';
      case '/stores': return 'Stores';
      case '/shopping': return 'Shopping';
      case '/updates': return 'Updates';
      case '/about': return 'About';
      case '/meal-plan-print': return 'Meal Plan';
      default: return '';
    }
  })();

  // Handle authentication redirects
  $: if (!$loading) {
    if (!$user && !data.isAuthPage) {
      goto('/login');
    } else if ($user && data.isAuthPage) {
      goto('/');
    }
  }

  // Handle onboarding completion
  function handleOnboardingComplete() {
    console.log('Onboarding completed successfully');
    // Could show a success notification here
  }

  function handleOnboardingSkip() {
    console.log('Onboarding skipped by user');
    // Could show a message about manual setup
  }


  // Initialize theme on mount
  onMount(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('nomstack-theme') || 'purple';
    updateTheme(savedTheme);
  });

  // Initialize offline system when user is authenticated
  $: if ($user && !offlineInitialized) {
    initializeOfflineSystem().then(() => {
      offlineInitialized = true;
    }).catch((error) => {
      console.error('Failed to initialize offline system:', error);
      // Don't block the app if offline system fails
      offlineInitialized = true;
    });
  }
</script>
<svelte:head>
  <title>{data.title}</title>
</svelte:head>
{#if $loading}
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--app-background, #ffffff);">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-primary/70">Loading...</p>
    </div>
  </div>
{:else}
  <div class="h-screen flex flex-col" style="background-color: var(--app-background, #ffffff); isolation: auto !important;">
    <Header page={currentPage} {pageTitle} />
    <main class="flex-1 overflow-hidden">
      <div class="max-w-5xl mx-auto w-full px-2 sm:px-6 lg:px-8 py-0 h-full overflow-y-auto">
        {#if error}
          <h1 class="text-2xl font-semibold text-error">Error: {error.message}</h1>
        {:else}
          <slot />
        {/if}
      </div>
    </main>
    <Footer />
    <Notifications />
  </div>
  
  <!-- Global Modal System -->
  <GlobalModal />
  
  <!-- Offline Indicator -->
  <OfflineIndicator />
  
  <!-- Onboarding Modal for New Users -->
  <OnboardingModal on:complete={handleOnboardingComplete} on:skip={handleOnboardingSkip} />
{/if}
