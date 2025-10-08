<script>
    import Nav from '$lib/components/Nav.svelte';
    import { Layers, Store, Home, Menu } from 'lucide-svelte';
    import { eatingMode, toggleEatingMode } from '$lib/stores/eatingMode.js';
    import { openModal, MODAL_TYPES } from '$lib/stores/modal.js';
    
    export let page;

    function toggleMenu() {
        openModal(MODAL_TYPES.MOBILE_MENU);
    }

    function capitalize(input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }
    // Updated button text
</script>
<header class="bg-base-100/80 backdrop-blur border-b border-primary/10">
  <div class="max-w-5xl mx-auto flex flex-col gap-1 px-4 sm:px-6 lg:px-8 py-2">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="flex items-center gap-2 text-xl font-semibold text-primary">
          <Layers class="h-6 w-6" />
          <span class="tracking-tight">nomStack</span>
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
        
        <!-- Hamburger Menu - Always visible on all screens -->
        <button 
          class="btn btn-ghost btn-sm text-primary -mr-2" 
          on:click={toggleMenu} 
          aria-label="Open mobile menu"
        >
          <Menu class="h-6 w-6" />
        </button>
      </div>
    </div>
    <Nav {page} />
  </div>
</header>
