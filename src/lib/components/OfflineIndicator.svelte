<script>
  import { onMount, onDestroy } from 'svelte';
  import { getSyncStatus, forceSync } from '$lib/offline/index.js';
  import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-svelte';

  let syncStatus = {
    isOnline: navigator.onLine,
    pendingSyncCount: 0,
    failedSyncCount: 0,
    lastSyncTime: 0
  };
  let isVisible = false;
  let isSyncing = false;
  let statusInterval = null;

  onMount(async () => {
    await updateSyncStatus();
    
    // Update status every 5 seconds
    statusInterval = setInterval(updateSyncStatus, 5000);
    
    // Listen for online/offline events
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
  });

  onDestroy(() => {
    if (statusInterval) {
      clearInterval(statusInterval);
    }
    window.removeEventListener('online', updateSyncStatus);
    window.removeEventListener('offline', updateSyncStatus);
  });

  async function updateSyncStatus() {
    try {
      syncStatus = await getSyncStatus();
      
      // Show indicator if there are pending/failed syncs or if offline
      isVisible = !syncStatus.isOnline || 
                  syncStatus.pendingSyncCount > 0 || 
                  syncStatus.failedSyncCount > 0;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      // Hide indicator if offline system is not available
      isVisible = false;
    }
  }

  async function handleForceSync() {
    if (isSyncing) return;
    
    isSyncing = true;
    try {
      await forceSync();
      await updateSyncStatus();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      isSyncing = false;
    }
  }

  function formatLastSync() {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
</script>

{#if isVisible}
  <div class="fixed top-4 right-4 z-50 bg-base-100 shadow-lg rounded-lg border p-3 max-w-sm">
    <div class="flex items-center gap-2 mb-2">
      {#if !syncStatus.isOnline}
        <WifiOff class="h-4 w-4 text-error" />
        <span class="text-sm font-medium text-error">Offline</span>
      {:else if syncStatus.failedSyncCount > 0}
        <AlertCircle class="h-4 w-4 text-warning" />
        <span class="text-sm font-medium text-warning">Sync Failed</span>
      {:else if syncStatus.pendingSyncCount > 0}
        <RefreshCw class="h-4 w-4 text-info" />
        <span class="text-sm font-medium text-info">Syncing</span>
      {:else}
        <Wifi class="h-4 w-4 text-success" />
        <span class="text-sm font-medium text-success">Online</span>
      {/if}
    </div>

    <div class="text-xs text-gray-600 space-y-1">
      <div>Last sync: {formatLastSync()}</div>
      
      {#if syncStatus.pendingSyncCount > 0}
        <div class="text-info">{syncStatus.pendingSyncCount} pending</div>
      {/if}
      
      {#if syncStatus.failedSyncCount > 0}
        <div class="text-warning">{syncStatus.failedSyncCount} failed</div>
      {/if}
    </div>

    {#if syncStatus.isOnline && (syncStatus.pendingSyncCount > 0 || syncStatus.failedSyncCount > 0)}
      <button 
        class="btn btn-xs btn-primary mt-2 w-full"
        on:click={handleForceSync}
        disabled={isSyncing}
      >
        {#if isSyncing}
          <RefreshCw class="h-3 w-3 animate-spin" />
        {:else}
          <RefreshCw class="h-3 w-3" />
        {/if}
        Sync Now
      </button>
    {/if}
  </div>
{/if}
