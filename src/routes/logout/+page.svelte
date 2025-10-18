<script>
    import { signOut } from '$lib/auth.js';
    import { onMount } from 'svelte';
    
    onMount(async () => {
      await signOut();
    });
</script>

<div class="min-h-screen flex items-center justify-center" style="background-color: var(--app-background, #ffffff);">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <h1 class="text-2xl font-bold text-primary mb-4">Logging out...</h1>
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="text-gray-600 mt-4">You will be redirected to the login page shortly.</p>
    </div>
  </div>
</div>