// PWA registration and management
export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    // Register service worker
    this.registerServiceWorker();
    
    // Handle install prompt
    this.handleInstallPrompt();
    
    // Handle online/offline status
    this.handleOnlineStatus();
    
    // Check if already installed
    this.checkInstallStatus();
  }

  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    
    // In development, only register if PWA dev options are enabled
    if (this.isDevelopment()) {
      console.log('Service Worker registration in development mode');
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            this.showUpdateNotification();
          }
        });
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  handleInstallPrompt() {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  handleOnlineStatus() {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.addEventListener('online', () => {
      console.log('App is online');
      this.isOnline = true;
      this.hideOfflineIndicator();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
      this.showOfflineIndicator();
    });
  }

  checkInstallStatus() {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('App is running as PWA');
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  showInstallButton() {
    if (typeof document === 'undefined') {
      return;
    }
    
    // Create install button if it doesn't exist
    let installButton = document.getElementById('pwa-install-button');
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.className = 'btn btn-primary btn-sm fixed bottom-4 right-4 z-50 shadow-lg';
      installButton.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        Install App
      `;
      
      installButton.addEventListener('click', () => this.installApp());
      document.body.appendChild(installButton);
    }
    
    installButton.style.display = 'block';
  }

  hideInstallButton() {
    if (typeof document === 'undefined') {
      return;
    }
    
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  showOfflineIndicator() {
    if (typeof document === 'undefined') {
      return;
    }
    
    let offlineIndicator = document.getElementById('pwa-offline-indicator');
    if (!offlineIndicator) {
      offlineIndicator = document.createElement('div');
      offlineIndicator.id = 'pwa-offline-indicator';
      offlineIndicator.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-warning text-warning-content px-4 py-2 rounded-lg shadow-lg';
      offlineIndicator.innerHTML = `
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"></path>
          </svg>
          You're offline
        </div>
      `;
      document.body.appendChild(offlineIndicator);
    }
    
    offlineIndicator.style.display = 'block';
  }

  hideOfflineIndicator() {
    if (typeof document === 'undefined') {
      return;
    }
    
    const offlineIndicator = document.getElementById('pwa-offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = 'none';
    }
  }

  showUpdateNotification() {
    if (typeof document === 'undefined') {
      return;
    }
    
    // Create update notification
    const updateNotification = document.createElement('div');
    updateNotification.className = 'fixed top-4 right-4 z-50 bg-info text-info-content px-4 py-2 rounded-lg shadow-lg';
    updateNotification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="mr-4">New version available!</span>
        <button class="btn btn-sm btn-outline" onclick="window.location.reload()">
          Update
        </button>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (updateNotification.parentNode) {
        updateNotification.parentNode.removeChild(updateNotification);
      }
    }, 10000);
  }

  // Utility methods
  isDevelopment() {
    return typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.DEV;
  }

  isPWA() {
    return this.isInstalled;
  }

  isOnline() {
    return this.isOnline;
  }
}

// Initialize PWA manager
export const pwaManager = new PWAManager();
