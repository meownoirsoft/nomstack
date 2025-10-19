<script>
    import { onMount } from 'svelte';
    import Nav from '$lib/components/Nav.svelte';
    import { eatingMode, toggleEatingMode } from '$lib/stores/eatingMode.js';
    import { openModal, MODAL_TYPES } from '$lib/stores/modal.js';
    import { currentTheme } from '$lib/stores/theme.js';
    import { browser } from '$app/environment';
    
    export let page;
    export let pageTitle = '';
    export let pageIcon = null;
    
    // Dynamically import icons to reduce SSR load
    let LayersIcon, StoreIcon, HomeIcon, MenuIcon;
    
    // Theme to logo mapping
    const themeToLogo = {
        'purple': 'grape',
        'blue': 'berry', 
        'green': 'apple',
        'red': 'cherry',
        'orange': 'tangerine',
        'pink': 'grapefruit',
        'indigo': 'blackberry',
        'cyan': 'acai',
        'dark': 'grape' // Fallback to grape for dark theme
    };
    
    // Reactive statement to get current logo path
    $: logoPath = `/logo/nomstack-logo-${themeToLogo[$currentTheme] || 'grape'}.webp`;
    
    onMount(async () => {
        if (browser) {
            const { Layers, Store, Home, Menu } = await import('lucide-svelte');
            LayersIcon = Layers;
            StoreIcon = Store;
            HomeIcon = Home;
            MenuIcon = Menu;
        }
    });

    function toggleMenu() {
        openModal(MODAL_TYPES.MOBILE_MENU);
    }

    function capitalize(input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }
    // Updated button text
</script>

<style>
  /* Show/hide elements for print vs screen */
  .print-only {
    display: none !important;
  }
  
  .screen-only {
    display: block !important;
  }
  
  @media print {
    .print-only {
      display: block !important;
    }
    
    .screen-only {
      display: none !important;
    }
  }
</style>
<header class="bg-white border-b border-primary/10">
  <div class="max-w-5xl mx-auto flex flex-col gap-1 px-4 sm:px-6 lg:px-8 py-3">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 screen-only">
        <h1 class="flex items-center gap-2 text-xl font-semibold text-primary">
          <img 
            src={logoPath} 
            alt="nomStack logo" 
            class="h-6 w-6 object-contain"
            loading="eager"
          />
          <span class="tracking-tight">nomStack</span>
          {#if pageTitle}
            <span class="text-primary/60 font-normal">• {pageTitle}</span>
          {/if}
        </h1>
      </div>
      <!-- Print-only title -->
      <div class="flex items-center gap-3 print-only">
        <h1 class="flex items-center gap-2 text-xl font-semibold text-primary">
          <img 
            src={logoPath} 
            alt="nomStack logo" 
            class="h-6 w-6 object-contain"
            loading="eager"
          />
          <span class="tracking-tight">nomStack</span>
          {#if pageTitle}
            <span class="text-primary/60 font-normal">• {pageTitle}</span>
          {/if}
        </h1>
      </div>
      <div class="flex items-center gap-2 screen-only">
        {#if page === '/'}
          <button
            class="btn btn-sm btn-ghost text-primary border border-primary/20 hover:bg-primary/10"
            on:click={toggleEatingMode}
          >
            {#if $eatingMode === 'home'}
              {#if StoreIcon}
                <svelte:component this={StoreIcon} class="h-4 w-4 text-primary" />
              {/if}
              <span class="text-primary">Eat Out</span>
            {:else}
              {#if HomeIcon}
                <svelte:component this={HomeIcon} class="h-4 w-4 text-primary" />
              {/if}
              <span class="text-primary">Eat at Home</span>
            {/if}
          </button>
        {/if}
        
        <!-- Hamburger Menu - Always visible on all screens -->
        <button 
          class="btn btn-ghost btn-sm text-primary -mr-2" 
          on:click={toggleMenu} 
          aria-label="Open mobile menu"
        >
          {#if MenuIcon}
            <svelte:component this={MenuIcon} class="h-6 w-6 text-primary" />
          {:else}
            <div class="h-6 w-6 flex items-center justify-center">
              <div class="w-4 h-3 flex flex-col justify-between">
                <div class="w-full h-0.5 bg-current"></div>
                <div class="w-full h-0.5 bg-current"></div>
                <div class="w-full h-0.5 bg-current"></div>
              </div>
            </div>
          {/if}
        </button>
      </div>
    </div>
    <Nav {page} class="screen-only" />
  </div>
</header>
