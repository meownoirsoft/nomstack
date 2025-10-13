<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth.js';
  import { setupNewUserSeedData, userHasSeedData, getSeedDataStats } from '$lib/seedData.js';

  let isLoading = false;
  let result = null;
  let error = null;
  let stats = null;

  onMount(async () => {
    if ($user) {
      await loadStats();
    }
  });

  async function loadStats() {
    if (!$user) return;
    
    try {
      stats = await getSeedDataStats($user.id);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function setupSeedData() {
    if (!$user) return;
    
    isLoading = true;
    error = null;
    result = null;

    try {
      result = await setupNewUserSeedData($user.id);
      await loadStats(); // Refresh stats
    } catch (err) {
      console.error('Error setting up seed data:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function checkHasData() {
    if (!$user) return;
    
    try {
      const hasData = await userHasSeedData($user.id);
      alert(`User has seed data: ${hasData}`);
    } catch (err) {
      console.error('Error checking data:', err);
      alert(`Error: ${err.message}`);
    }
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Seed Data Test Page</h1>
  
  {#if !$user}
    <div class="alert alert-warning">
      <span>Please log in to test seed data setup</span>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Current Stats -->
      {#if stats}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Current Data Stats</h2>
            <div class="stats stats-horizontal shadow">
              <div class="stat">
                <div class="stat-title">Categories</div>
                <div class="stat-value text-primary">{stats.categories}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Meals</div>
                <div class="stat-value text-secondary">{stats.meals}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Meal Plans</div>
                <div class="stat-value text-accent">{stats.mealPlans}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Has Data</div>
                <div class="stat-value text-info">{stats.hasData ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Actions</h2>
          <div class="flex gap-4">
            <button 
              class="btn btn-primary"
              on:click={setupSeedData}
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="loading loading-spinner loading-sm"></span>
                Setting up...
              {:else}
                Setup Seed Data
              {/if}
            </button>
            
            <button 
              class="btn btn-outline"
              on:click={checkHasData}
            >
              Check Has Data
            </button>
            
            <button 
              class="btn btn-outline"
              on:click={loadStats}
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      <!-- Results -->
      {#if result}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Setup Result</h2>
            <div class="alert {result.success ? 'alert-success' : 'alert-error'}">
              <span>{result.success ? 'Success!' : 'Failed'}</span>
            </div>
            
            {#if result.success}
              <div class="stats stats-vertical shadow">
                <div class="stat">
                  <div class="stat-title">Sources Created</div>
                  <div class="stat-value text-primary">{result.sources?.length || 0}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Categories Created</div>
                  <div class="stat-value text-secondary">{result.categories?.length || 0}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Meals Created</div>
                  <div class="stat-value text-accent">{result.meals?.length || 0}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Meal Filters Created</div>
                  <div class="stat-value text-info">{result.mealFilters?.length || 0}</div>
                </div>
              </div>
            {/if}
            
            {#if result.errors && result.errors.length > 0}
              <div class="alert alert-warning">
                <div class="font-bold">Errors:</div>
                <ul class="list-disc list-inside">
                  {#each result.errors as error}
                    <li>{error}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      {#if error}
        <div class="alert alert-error">
          <span>Error: {error}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
