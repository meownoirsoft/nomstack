<script>
  import { user } from '$lib/stores/auth.js';
  import { requestEmailVerification } from '$lib/auth.js';

  let isLoading = false;
  let message = '';
  let isError = false;

  async function resend() {
    isLoading = true;
    message = '';
    try {
      const data = await requestEmailVerification();
      message = data?.alreadyVerified
        ? 'Email is already verified. Refresh the page to update.'
        : 'Verification email sent. Check your inbox.';
      isError = false;
    } catch (err) {
      message = err.message || 'Could not send verification email.';
      isError = true;
    } finally {
      isLoading = false;
    }
  }
</script>

{#if $user && $user.email_verified === false}
  <div class="rounded-lg border border-warning/50 bg-warning/10 p-4 mb-4 shadow-sm">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div class="min-w-0">
        <span class="font-semibold">Verify your email.</span>
        <span class="text-sm opacity-80">
          We sent a link to <span class="font-mono">{$user.email}</span>. Click it to confirm.
        </span>
        {#if message}
          <p class="text-sm mt-1 {isError ? 'text-error' : 'text-success'}">{message}</p>
        {/if}
      </div>
      <button
        class="btn btn-sm btn-outline shrink-0"
        on:click={resend}
        disabled={isLoading}
      >
        {#if isLoading}
          <span class="loading loading-spinner loading-xs"></span>
          Sending…
        {:else}
          Resend email
        {/if}
      </button>
    </div>
  </div>
{/if}
