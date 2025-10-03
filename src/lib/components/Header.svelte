<script>
    import Nav from '$lib/components/Nav.svelte';
    import { Layers, Store, Home } from 'lucide-svelte';
    import { eatingMode, toggleEatingMode } from '$lib/stores/eatingMode.js';
    
    export let page;

    function capitalize(input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }
    // Updated button text
</script>
<header class="bg-base-100/80 backdrop-blur border-b border-primary/10">
  <div class="max-w-5xl mx-auto flex flex-col gap-3 px-4 sm:px-6 lg:px-8 py-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="flex items-center gap-2 text-xl font-semibold text-primary">
          <Layers class="h-6 w-6" />
          <span class="tracking-tight">nomStack {capitalize(page.replace('/',''))}</span>
        </h1>
      </div>
      <div class="flex items-center gap-2">
        {#if !['/categories','/login','/print'].includes(page)}
          <button
            class="btn btn-sm btn-ghost text-primary border border-primary/20 hover:bg-primary/10"
            on:click={toggleEatingMode}
          >
            {#if $eatingMode === 'home'}
              <Store class="h-4 w-4" />
              <span>Eat Out</span>
            {:else}
              <Home class="h-4 w-4" />
              <span>Eat at Home</span>
            {/if}
          </button>
        {/if}
      </div>
    </div>
    <Nav {page} />
  </div>
</header>
