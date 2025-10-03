<script>
  import Search from './Search.svelte';
  import { Menu, Cake, Sun, Sparkles, Filter, Printer, X } from 'lucide-svelte';
  import { signOut } from '$lib/auth.js';
  import { eatingMode } from '$lib/stores/eatingMode.js';
  
  export let page;
  let menuOpen = false;

  const links = [
    { href: '/', icon: Cake, label: 'All' },
    { href: '/lunch', icon: Sun, label: 'Lunch' },
    { href: '/dinner', icon: Sparkles, label: 'Dinner' },
    { href: '/categories', icon: Filter, label: 'Categories' },
    { href: '/print', icon: Printer, label: 'Print' }
  ];

  function toggleMenu() {
    menuOpen = !menuOpen;
  }
  
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
      
      <!-- Mobile Hamburger Menu (Meals only) -->
      <div class="sm:hidden flex items-center">
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-ghost" on:click={toggleMenu} aria-expanded={menuOpen} aria-controls="mobile-nav-menu">
            <Menu class="text-primary" />
          </button>
          {#if menuOpen}
            <button class="fixed inset-0 z-40" on:click={() => (menuOpen = false)} aria-label="Close menu"></button>
            <ul id="mobile-nav-menu" class="menu menu-sm dropdown-content z-50 mt-2 p-3 shadow bg-base-100 rounded-box w-56">
              {#each links as link}
                <li>
                  <a href={link.href} class={page === link.href ? 'active text-primary font-semibold' : 'text-primary'}>
                    <link.icon class="h-4 w-4" />
                    {link.label}
                  </a>
                </li>
              {/each}
              <li>
                <a href="/logout" class="text-error" on:click={logout}><X class="h-4 w-4" />Logout</a>
              </li>
            </ul>
          {/if}
        </div>
      </div>
    </nav>
  {/if}
{/if}
