<script>
  import notifications, { dismissNotification } from '$lib/stores/notifications.js';
  import { onDestroy } from 'svelte';

  let items = [];
  const unsubscribe = notifications.subscribe((value) => {
    items = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  const typeClasses = {
    success: 'bg-success text-success-content',
    error: 'bg-error text-error-content',
    info: 'bg-info text-info-content',
    warning: 'bg-warning text-warning-content'
  };
</script>

{#if items.length}
  <div class="fixed top-4 right-4 z-[120] flex flex-col gap-3 w-72 max-w-full">
    {#each items as item (item.id)}
      <div class={`shadow-lg rounded-lg px-4 py-3 transition-opacity duration-200 ${typeClasses[item.type] || typeClasses.info}`}>
        <div class="flex items-start gap-3">
          <span class="flex-1 text-sm font-medium leading-snug">{item.message}</span>
          <button type="button" class="btn btn-ghost btn-xs text-current" on:click={() => dismissNotification(item.id)}>✕</button>
        </div>
      </div>
    {/each}
  </div>
{/if}
