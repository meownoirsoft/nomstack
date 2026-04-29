<script>
  let email = '';
  let isLoading = false;
  let message = '';
  let isError = false;

  async function submit() {
    if (!email.trim()) {
      message = 'Please enter your email.';
      isError = true;
      return;
    }
    isLoading = true;
    message = '';
    try {
      const res = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        message = 'If that email is registered, a reset link is on its way. Check your inbox (and spam).';
        isError = false;
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

<div class="min-h-screen flex items-center justify-center" style="background-color: var(--app-background, #ffffff);">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl font-bold text-center justify-center mb-4">Reset Password</h2>
      <p class="text-sm text-primary/70 mb-4 text-center">
        Enter the email on your account and we'll send a reset link.
      </p>

      {#if message}
        <div class="alert {isError ? 'alert-error' : 'alert-success'} mb-4">
          <span>{message}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={submit} class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold text-lg text-primary">Email:</span>
          </label>
          <input
            type="email"
            class="input input-bordered w-full text-primary focus:outline-none focus:ring-0"
            bind:value={email}
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" class="btn btn-primary w-full text-white text-lg" disabled={isLoading}>
          {#if isLoading}
            <span class="loading loading-spinner loading-sm"></span>
            Sending…
          {:else}
            Send reset link
          {/if}
        </button>
      </form>

      <div class="text-center mt-4">
        <a href="/login" class="text-sm text-primary/70 hover:underline">Back to login</a>
      </div>
    </div>
  </div>
</div>
