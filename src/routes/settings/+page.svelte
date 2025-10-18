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
  <div class="mt-4 mb-6">
  </div>

  <!-- Meal Categories Management -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <Tag class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Meal Categories</h2>
      </div>
      
      <p class="text-primary/70 mb-6">
        Categories help you group similar types of food together and make meal planning easier.
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
        Meal filters appear at the top of the meals list page. You can select which filters matter to you.
      </p>

      <a href="/settings/meal-filters" class="btn btn-primary">
        <Filter class="h-4 w-4" />
        Edit Filters
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
        Configure your preferred grocery stores to shop for specific items at specific stores.
      </p>

      <a href="/stores" class="btn btn-primary">
        <Store class="h-4 w-4" />
        Manage Stores
      </a>
    </div>
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
            class="flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-105 {$currentTheme === theme.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}"
            on:click={() => {
              updateTheme(theme.value);
              notifySuccess(`Theme changed to ${theme.name}`);
            }}
            title={theme.name}
          >
            <div 
              class="w-8 h-8 rounded-full border-white shadow-sm"
              style="background-color: {theme.color}"
            ></div>
            <span class="text-xs font-medium text-primary/70">{theme.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>


</div>
