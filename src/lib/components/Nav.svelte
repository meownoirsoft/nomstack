<script>
  import Search from './Search.svelte';
  import { Cake, Sun, Sparkles, ChefHat, Filter, ShoppingCart, Store, Settings, TableCellsSplit } from 'lucide-svelte';
  import { signOut } from '$lib/auth.js';
  import { eatingMode } from '$lib/stores/eatingMode.js';
  
  export let page;

  const links = [
    { href: '/', icon: Cake, label: 'All' },
    { href: '/lunch', icon: Sun, label: 'Lunch' },
    { href: '/dinner', icon: Sparkles, label: 'Dinner' },
    { href: '/categories', icon: Filter, label: 'Meal Categories' },
    { href: '/recipes', icon: ChefHat, label: 'Recipes' },
    { href: '/pantry', icon: TableCellsSplit, label: 'Pantry' },
    { href: '/shopping', icon: ShoppingCart, label: 'Shopping Lists' },
    { href: '/stores', icon: Store, label: 'Stores' },
    { href: '/settings', icon: Settings, label: 'Settings' }
  ];
  
  async function logout() {
    await signOut();
  }
</script>
{#if !['/login','/print'].includes(page)}
  {#if $eatingMode === 'out'}
    <!-- Restaurant Mode: No search here, handled in RestaurantList -->
    <nav class="w-full">
      <!-- Search moved to RestaurantList component -->
    </nav>
  {:else}
    <!-- Meal Mode: Search + Navigation -->
    <nav class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <Search />
      </div>
      <div class="hidden sm:flex items-center gap-2">
        {#each links as link}
          <a
            href={link.href}
            class={`btn btn-sm btn-ghost text-primary ${page === link.href ? 'btn-active bg-primary/10' : ''}`}
          >
            {link.label}
          </a>
        {/each}
        <button type="button" class="btn btn-sm btn-ghost text-error" on:click={logout}>
          Logout
        </button>
      </div>
    </nav>
  {/if}
{/if}

