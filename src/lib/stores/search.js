import { writable } from 'svelte/store';

// Global search term store
export const searchTerm = writable('');

// Helper function to update search term
export function setSearchTerm(term) {
  searchTerm.set(term);
}

// Helper function to clear search
export function clearSearch() {
  searchTerm.set('');
}
