// Development service worker
// This is a minimal service worker for development mode

console.log('Service Worker: Development mode SW loaded');

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker: Install event triggered');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activate event triggered');
  event.waitUntil(self.clients.claim());
});

// Fetch event - just pass through in development
self.addEventListener('fetch', function(event) {
  // In development, just pass through all requests without caching
  event.respondWith(fetch(event.request));
});