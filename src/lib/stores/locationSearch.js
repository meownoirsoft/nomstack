import { writable } from 'svelte/store';

// Store for location search parameters
export const locationSearchParams = writable({
  query: '',
  location: null,
  useCustomLocation: false,
  customLocation: ''
});

// Helper functions
export function setLocationSearch(params) {
  locationSearchParams.set(params);
}

export function clearLocationSearch() {
  locationSearchParams.set({
    query: '',
    location: null,
    useCustomLocation: false,
    customLocation: ''
  });
}
