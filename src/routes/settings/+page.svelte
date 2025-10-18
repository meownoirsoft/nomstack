<script>
  import { onMount } from 'svelte';
  import { settings, updateSetting } from '$lib/stores/settings.js';
  import { currentTheme, availableThemes, updateTheme } from '$lib/stores/theme.js';
  import { Settings, Filter, Store, Tag, Palette } from 'lucide-svelte';
  import { notifySuccess } from '$lib/stores/notifications.js';

  // Recipe toggle removed - recipes are always enabled
</script>

<svelte:head>
  <title>Settings - nomStack</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-2 mt-4 mb-6">
    <Settings class="h-6 w-6 text-primary" />
    <h1 class="text-2xl font-bold text-primary">Settings</h1>
  </div>

  <!-- Theme Color Picker -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Palette class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">App Theme</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Choose your preferred color theme for the app. This will change the primary color used throughout the interface.
      </p>

      <div class="grid grid-cols-4 gap-3">
        {#each availableThemes as theme}
          <button
            class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 {$currentTheme === theme.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}"
            on:click={() => {
              updateTheme(theme.value);
              notifySuccess(`Theme changed to ${theme.name}`);
            }}
            title={theme.name}
          >
            <div 
              class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              style="background-color: {theme.color}"
            ></div>
            <span class="text-xs font-medium text-primary/70">{theme.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Meal Categories Management -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Tag class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Meal Categories</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Organize your meals by creating custom categories. Categories help you group similar types of food together and make meal planning easier.
      </p>

      <a href="/categories" class="btn btn-primary">
        <Tag class="h-4 w-4" />
        Manage Categories
      </a>
    </div>
  </div>

  <!-- Meal Filter Settings -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Filter class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Meal Filters</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Configure category filters that appear at the top of the meals list page. You can reorder them and select which categories to include.
      </p>

      <a href="/settings/meal-filters" class="btn btn-primary">
        <Filter class="h-4 w-4" />
        Configure Meal Filters
      </a>
    </div>
  </div>

  <!-- Stores Management -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Store class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Grocery Stores</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Create and manage your preferred grocery stores to organize ingredients by location. This helps you plan efficient shopping trips.
      </p>

      <a href="/stores" class="btn btn-primary">
        <Store class="h-4 w-4" />
        Manage Stores
      </a>
    </div>
  </div>

  <!-- App Info -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <h2 class="text-xl font-bold text-primary mb-4">About nomStack</h2>
      <div class="space-y-3 text-primary/70">
        <p>We didn't see any existing meal planning tools that fit our needs so we built nomStack. We wanted it to be simple, flexible, and focused on what matters most: planning and enjoying your meals without all the work it takes normally.</p>
        <p>We care about your needs, and we're committed to continuously improving nomStack based on your feedback. If you have any thoughts or issues, please let us know by email: <a href="mailto:support@nomstack.com">support@nomstack.com</a></p>
        <p class="text-sm text-gray-400">Version 1.0.0</p>
      </div>
    </div>
  </div>

</div>
