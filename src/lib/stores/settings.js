import { writable } from 'svelte/store';

// Default settings for ADHD-friendly experience
const defaultSettings = {
  recipesEnabled: true,   // Always enabled - required for shopping lists
  showPrepTime: true,     // Show prep time in recipe display
  showServings: true,     // Show servings in recipe display
  mobileOptimized: true   // Mobile-first design
};

// Load settings from localStorage or use defaults
function loadSettings() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nomstack-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to parse saved settings, using defaults');
      }
    }
  }
  return defaultSettings;
}

// Create the settings store
export const settings = writable(loadSettings());

// Save settings to localStorage whenever they change
if (typeof window !== 'undefined') {
  settings.subscribe((value) => {
    localStorage.setItem('nomstack-settings', JSON.stringify(value));
  });
}

// Helper functions
export function updateSetting(key, value) {
  settings.update(current => ({
    ...current,
    [key]: value
  }));
}

// Recipe toggle removed - recipes are always enabled for shopping lists to work

export function resetSettings() {
  settings.set(defaultSettings);
}
