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
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-black'
  };
</script>

{#if items.length}
  <div class="fixed top-4 right-4 left-4 sm:left-auto sm:w-72 z-[120] flex flex-col gap-3 max-w-full">
    {#each items as item (item.id)}
      <div class={`shadow-lg rounded-lg px-4 py-3 transition-opacity duration-200 ${typeClasses[item.type] || typeClasses.info}`}>
        <div class="flex items-center gap-3">
          <span class="flex-1 text-sm font-medium leading-snug">{item.message}</span>
          <button type="button" class="btn btn-ghost btn-sm text-current hover:bg-black/10 p-1 flex-shrink-0" on:click={() => dismissNotification(item.id)}>
            <span class="text-base font-bold">✕</span>
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}
