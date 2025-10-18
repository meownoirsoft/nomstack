<script>
  import { Check, Apple } from 'lucide-svelte';
  
  export let checked = false;
  export let onToggle = () => {};
  export let size = 'md'; // sm, md, lg
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  function handleClick() {
    onToggle();
  }
</script>

<button
  type="button"
  class="food-checkbox {sizeClasses[size]} rounded-md border-2 transition-all duration-200 flex items-center justify-center {checked ? 'bg-primary border-primary' : 'bg-transparent border-primary/40 hover:border-primary'}"
  on:click={handleClick}
  role="checkbox"
  aria-checked={checked}
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {#if checked}
    <Check class="{iconSizes[size]} text-white" />
  {:else}
    <Apple class="{iconSizes[size]} text-primary/60" />
  {/if}
</button>

<style>
  .food-checkbox {
    cursor: pointer;
    outline: none;
  }
  
  .food-checkbox:focus {
    box-shadow: 0 0 0 2px var(--primary-20);
  }
  
  .food-checkbox:hover {
    transform: scale(1.05);
  }
</style>