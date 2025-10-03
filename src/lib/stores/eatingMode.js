import { writable } from 'svelte/store';

// Global eating mode store: 'home' or 'out'
export const eatingMode = writable('home');

// Helper functions
export function setEatingMode(mode) {
  eatingMode.set(mode);
}

export function toggleEatingMode() {
  eatingMode.update(current => current === 'home' ? 'out' : 'home');
}


