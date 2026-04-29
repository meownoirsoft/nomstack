<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let password = '';
  let confirmPassword = '';
  let isLoading = false;
  let message = '';
  let isError = false;

  async function submit() {
    message = '';
    if (password.length < 8) {
      message = 'Password must be at least 8 characters.';
      isError = true;
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      message = 'Password must include at least one letter and one number.';
      isError = true;
      return;
    }
    if (password !== confirmPassword) {
      message = 'Passwords do not match.';
      isError = true;
      return;
    }

    isLoading = true;
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token: $page.params.token, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        message = 'Password updated. Redirecting to login…';
        isError = false;
        setTimeout(() => goto('/login'), 1500);
      } else {
        message = data?.error || 'Something went wrong. Try again.';
        isError = true;
      }
    } catch (err) {
      message = err.message || 'Something went wrong. Try again.';
      isError = true;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="h-full min-h-0 flex items-center justify-center" style="background-color: var(--app-background, #ffffff);">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl font-bold text-center justify-center mb-4">Set new password</h2>

      {#if message}
        <div class="alert {isError ? 'alert-error' : 'alert-success'} mb-4">
          <span>{message}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={submit} class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold text-lg text-primary">New password:</span>
          </label>
          <input
            type="password"
            class="input input-bordered w-full text-primary focus:outline-none focus:ring-0"
            bind:value={password}
            required
            disabled={isLoading}
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold text-lg text-primary">Confirm password:</span>
          </label>
          <input
            type="password"
            class="input input-bordered w-full text-primary focus:outline-none focus:ring-0"
            bind:value={confirmPassword}
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" class="btn btn-primary w-full text-white text-lg" disabled={isLoading}>
          {#if isLoading}
            <span class="loading loading-spinner loading-sm"></span>
            Saving…
          {:else}
            Update password
          {/if}
        </button>
      </form>

      <div class="text-center mt-4">
        <a href="/login" class="text-sm text-primary/70 hover:underline">Back to login</a>
      </div>
    </div>
  </div>
</div>
