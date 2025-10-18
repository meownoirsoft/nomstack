<script>
    import CategoryList from '../../lib/components/CategoryList.svelte';
    import { api } from '$lib/api.js';
    import { onMount } from 'svelte';
    import { user, loading as authLoading } from '$lib/stores/auth.js';

    // Data prop is available but not used in this component
    // export let data;

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
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="mt-4 text-primary/70">Loading categories...</p>
      </div>
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-red-900 mb-2">Error Loading Categories</h3>
        <p class="text-red-700">{error}</p>
      </div>
    </div>
  {:else}
    <CategoryList {cats} {page} />
  {/if}