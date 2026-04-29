<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let status = 'pending'; // 'pending' | 'success' | 'error'
  let errorMessage = '';

  onMount(async () => {
    const token = $page.params.token;
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        status = 'success';
        setTimeout(() => goto('/'), 2000);
      } else {
        status = 'error';
        errorMessage = data?.error || 'Verification failed';
      }
    } catch (err) {
      status = 'error';
      errorMessage = err.message || 'Verification failed';
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center" style="background-color: var(--app-background, #ffffff);">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <h2 class="card-title text-2xl font-bold text-center justify-center mb-4">Verify Email</h2>

      {#if status === 'pending'}
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-primary/70">Confirming your email…</p>
      {:else if status === 'success'}
        <div class="alert alert-success">
          <span>Email verified! Redirecting…</span>
        </div>
      {:else}
        <div class="alert alert-error">
          <span>{errorMessage}</span>
        </div>
        <a href="/" class="btn btn-primary mt-4">Back to app</a>
      {/if}
    </div>
  </div>
</div>
