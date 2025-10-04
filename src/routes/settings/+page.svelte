<script>
  import { onMount } from 'svelte';
  import { settings, updateSetting, toggleRecipes, resetSettings } from '$lib/stores/settings.js';
  import { ChefHat, Settings, RotateCcw, Check } from 'lucide-svelte';
  import { notifySuccess } from '$lib/stores/notifications.js';

  let showResetConfirm = false;

  function handleToggleRecipes() {
    const wasEnabled = $settings.recipesEnabled;
    toggleRecipes();
    notifySuccess(wasEnabled ? 'Recipes disabled!' : 'Recipes enabled!');
  }

  function handleReset() {
    resetSettings();
    notifySuccess('Settings reset to defaults');
    showResetConfirm = false;
  }
</script>

<svelte:head>
  <title>Settings - nomStack</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
  </div>

  <!-- Recipe Settings -->
  <div class="card bg-base-100 shadow-lg border border-purple-300 mb-6">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <ChefHat class="h-6 w-6 text-primary" />
        <h2 class="text-xl font-bold text-primary">Recipe Features</h2>
      </div>
      
      <p class="text-gray-600 mb-6">
        Add ingredients and cooking instructions to your meals. Perfect for when you want to actually cook the meals you've planned!
      </p>

      <!-- Master Toggle -->
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input 
            type="checkbox" 
            class="toggle toggle-primary toggle-lg" 
            checked={$settings.recipesEnabled}
            on:change={handleToggleRecipes}
          />
          <div>
            <div class="text-lg font-semibold">
              {#if $settings.recipesEnabled}
                <span class="text-primary">Recipes Enabled</span>
              {:else}
                <span class="text-gray-500">Recipes Disabled</span>
              {/if}
            </div>
            <div class="text-sm text-gray-600">
              {#if $settings.recipesEnabled}
                You can add recipes to your meals
              {:else}
                Meals will work as simple lists
              {/if}
            </div>
          </div>
        </label>
      </div>

      <!-- Recipe Sub-settings (only show when enabled) -->
      {#if $settings.recipesEnabled}
        <div class="divider my-4"></div>
        
        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                type="checkbox" 
                class="toggle toggle-sm" 
                bind:checked={$settings.showPrepTime}
                on:change={() => updateSetting('showPrepTime', $settings.showPrepTime)}
              />
              <div>
                <div class="font-medium">Show Prep Time</div>
                <div class="text-sm text-gray-600">Display cooking time in recipe view</div>
              </div>
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                type="checkbox" 
                class="toggle toggle-sm" 
                bind:checked={$settings.showServings}
                on:change={() => updateSetting('showServings', $settings.showServings)}
              />
              <div>
                <div class="font-medium">Show Servings</div>
                <div class="text-sm text-gray-600">Display serving size in recipe view</div>
              </div>
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- App Info -->
  <div class="card bg-base-100 shadow-lg border border-purple-300 mb-6">
    <div class="card-body">
      <h2 class="text-xl font-bold text-primary mb-4">About nomStack</h2>
      <div class="space-y-3 text-gray-600">
        <p>nomStack is designed with ADHD and neurodivergent users in mind.</p>
        <p>Keep it simple, or add complexity when you need it.</p>
        <p>Everything is optional - use what works for you!</p>
      </div>
    </div>
  </div>

  <!-- Reset Settings -->
  <div class="card bg-base-100 shadow-lg border border-purple-300">
    <div class="card-body">
      <h2 class="text-xl font-bold text-primary mb-4">Reset Settings</h2>
      <p class="text-gray-600 mb-4">Reset all settings back to their defaults.</p>
      
      <button 
        class="btn btn-outline btn-error"
        on:click={() => showResetConfirm = true}
      >
        <RotateCcw class="h-4 w-4" />
        Reset All Settings
      </button>
    </div>
  </div>

  <!-- Reset Confirmation Modal -->
  {#if showResetConfirm}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div class="bg-base-100 rounded-lg p-6 max-w-sm w-full">
        <h4 class="text-lg font-bold mb-4">Reset Settings?</h4>
        <p class="text-gray-600 mb-6">This will reset all settings to their default values. This action cannot be undone.</p>
        <div class="flex gap-3">
          <button 
            class="btn btn-ghost flex-1"
            on:click={() => showResetConfirm = false}
          >
            Cancel
          </button>
          <button 
            class="btn btn-error flex-1"
            on:click={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
