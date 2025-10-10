<script>
    import CategoryList from '../../lib/components/CategoryList.svelte';
    import { api } from '$lib/api.js';
    import { onMount } from 'svelte';
    import { user, loading as authLoading } from '$lib/stores/auth.js';

    export let data;

    let cats = [];
    let loading = true;
    let error = null;
    const page = 'all';

    onMount(async () => {
      // Wait for authentication to complete before loading data
      const unsubscribe = user.subscribe(async (currentUser) => {
        if (currentUser === null && !$authLoading) {
          // User is not authenticated and loading is complete
          console.log('User not authenticated, skipping data load');
          return;
        }
        
        if (currentUser && !$authLoading) {
          // User is authenticated and loading is complete, load data
          console.log('User authenticated, loading categories');
          try {
            loading = true;
            cats = await api.getCategories();
          } catch (err) {
            console.error('Error loading categories:', err);
            error = err.message;
          } finally {
            loading = false;
          }
        }
      });

      // Cleanup subscription on component destroy
      return () => {
        unsubscribe();
      };
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