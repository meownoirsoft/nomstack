<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Notifications from '$lib/components/Notifications.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  export let data;
  export let error;
  let currentPage;

  $: {
    const { url, route } = $page;
    handleUrlChange(url);
  }

  // Handle authentication redirects
  $: if (!$loading) {
    if (!$user && !data.isAuthPage) {
      goto('/login');
    } else if ($user && data.isAuthPage) {
      goto('/');
    }
  }

  function handleUrlChange(url) {
    currentPage = url.pathname;
  }
</script>
<svelte:head>
  <title>{data.title}</title>
</svelte:head>
{#if $loading}
  <div class="min-h-screen bg-secondary flex items-center justify-center">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-secondary flex flex-col">
    <Header page={currentPage} />
    <main class="flex-1 w-full">
      <div class="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2">
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
{/if}
