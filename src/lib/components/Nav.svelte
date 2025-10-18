<script>
  import { Cake, Sun, Sparkles, ChefHat, Filter, ShoppingCart, Store, Settings, TableCellsSplit } from 'lucide-svelte';
  import { signOut } from '$lib/auth.js';
  import { eatingMode } from '$lib/stores/eatingMode.js';
  
  export let page;

  const links = [
    { href: '/', icon: Cake, label: 'All' },
    { href: '/lunch', icon: Sun, label: 'Lunch' },
    { href: '/dinner', icon: Sparkles, label: 'Dinner' },
    { href: '/categories', icon: Filter, label: 'Meal Categories' },
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
    <!-- Restaurant Mode: No navigation here, handled in mobile menu -->
    <nav class="w-full">
      <!-- Navigation moved to mobile menu only -->
    </nav>
  {:else}
    <!-- Meal Mode: No navigation here, handled in mobile menu -->
    <nav class="w-full">
      <!-- Navigation moved to mobile menu only -->
    </nav>
  {/if}
{/if}

