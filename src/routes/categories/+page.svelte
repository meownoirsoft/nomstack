<script>
    import CategoryList from '../../lib/components/CategoryList.svelte';
    import { api } from '$lib/api.js';
    import { onMount } from 'svelte';

    export let data;

    let cats = [];
    let loading = true;
    let error = null;
    const page = 'all';

    onMount(async () => {
      try {
        loading = true;
        cats = await api.getCategories();
      } catch (err) {
        console.error('Error loading categories:', err);
        error = err.message;
      } finally {
        loading = false;
      }
    });
  </script>
  
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="mt-4 text-gray-600">Loading categories...</p>
      </div>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <span>Error loading categories: {error}</span>
    </div>
  {:else}
    <CategoryList {cats} {page} />
  {/if}