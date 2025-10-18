<script>
  import { modalStore, closeModal, MODAL_TYPES } from '$lib/stores/modal.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { signOut } from '$lib/auth.js';
  import { Menu, X, Home, ChefHat, ShoppingCart, Settings, TableCellsSplit, Info } from 'lucide-svelte';

  // Navigation links
  const links = [
    { href: '/', label: 'Meals/Plans', icon: Home },
    { href: '/pantry', label: 'Pantry', icon: TableCellsSplit },
    { href: '/shopping', label: 'Shopping Lists', icon: ShoppingCart },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/about', label: 'About', icon: Info }
  ];

  function handleLinkClick(href) {
    closeModal();
    goto(href);
  }

  async function handleLogout() {
    closeModal();
    await signOut();
  }
</script>

{#if $modalStore.isOpen && $modalStore.type === MODAL_TYPES.MOBILE_MENU}
  <!-- Invisible backdrop for clicking outside to close -->
  <div 
    class="fixed inset-0 z-[9998]" 
    on:click={closeModal}
    role="button"
    tabindex="0"
  ></div>
  
  <!-- Menu -->
  <div class="fixed top-12 right-4 z-[9999]">
    <ul class="menu menu-sm p-3 shadow-lg bg-base-100 border border-primary/30 rounded-box w-56">
      {#each links as link}
        <li>
          <a 
            href={link.href} 
            class={$page.url.pathname === link.href ? 'text-primary font-semibold bg-primary/10' : 'text-primary'}
            on:click={() => handleLinkClick(link.href)}
          >
            <svelte:component this={link.icon} class="h-4 w-4" />
            {link.label}
          </a>
        </li>
      {/each}
      <li>
        <a 
          href="/logout" 
          class="text-primary"
          on:click={handleLogout}
        >
          <X class="h-4 w-4" />
          Logout
        </a>
      </li>
    </ul>
  </div>
{/if}
