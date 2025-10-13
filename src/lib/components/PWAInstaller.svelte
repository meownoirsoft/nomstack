<script>
  import { onMount } from 'svelte';
  import { pwaManager } from '$lib/pwa.js';

  let showInstallButton = false;
  let isOnline = true;
  let deferredPrompt = null;

  onMount(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Skip PWA features in development
    if (import.meta.env.DEV) {
      return;
    }

    // Check if app can be installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      // Already installed
      return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton = true;
    });

    // Listen for online/offline status
    const updateOnlineStatus = () => {
      isOnline = navigator.onLine;
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      }
    };
  });

  async function installApp() {
    if (typeof window === 'undefined' || !deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        showInstallButton = false;
      } else {
        console.log('User dismissed the install prompt');
      }
      
      deferredPrompt = null;
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  }
</script>

<!-- Install Button -->
{#if showInstallButton}
  <div class="fixed bottom-4 right-4 z-50">
    <button 
      on:click={installApp}
      class="btn btn-primary btn-sm shadow-lg hover:shadow-xl transition-shadow"
      title="Install NomStack as an app"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      Install App
    </button>
  </div>
{/if}

<!-- Offline Indicator -->
{#if !isOnline}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
    <div class="bg-warning text-warning-content px-4 py-2 rounded-lg shadow-lg flex items-center">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"></path>
      </svg>
      You're offline - some features may be limited
    </div>
  </div>
{/if}

<style>
  /* Ensure the components are above other content */
  .fixed {
    position: fixed;
  }
  
  .z-50 {
    z-index: 50;
  }
</style>
