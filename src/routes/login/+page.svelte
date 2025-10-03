<script>
    import { signIn } from '$lib/auth.js';
    import { goto } from '$app/navigation';
    import { Eye, EyeSlash } from 'svelte-heros-v2';
    
    let email = '';
    let password = '';
    let errorMessage = '';
    let successMessage = '';
    let showPassword = false;
    let isLoading = false;
    
    async function login() {
      const emailValue = email.trim();
      const passwordValue = password;
      
      if (!emailValue || !passwordValue) {
        errorMessage = 'Please enter both email and password.';
        setTimeout(() => {
          errorMessage = '';
        }, 3000);
        return;
      }

      isLoading = true;
      errorMessage = '';
      successMessage = '';

      try {
        await signIn(emailValue, passwordValue);
        successMessage = 'Login successful. Redirecting...';
        await new Promise((resolve) => setTimeout(resolve, 500));
        goto('/');
      } catch (error) {
        console.error('Login error:', error);
        errorMessage = error.message || 'Login failed. Please try again.';
        setTimeout(() => {
          errorMessage = '';
        }, 3000);
      } finally {
        isLoading = false;
      }
    }

    function goToSignup() {
      goto('/signup');
    }
  </script>

<div class="min-h-screen bg-secondary flex items-center justify-center">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl font-bold text-center mb-6">Welcome to nomStack</h2>
      
      {#if errorMessage}
        <div class="alert alert-error mb-4">
          <span>{errorMessage}</span>
        </div>
      {/if}
      
      {#if successMessage}
        <div class="alert alert-success mb-4">
          <span>{successMessage}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={login} class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold text-lg text-primary">Email:</span>
          </label>
          <input 
            type="email" 
            class="input input-bordered w-full text-primary focus:outline-none focus:ring-0" 
            placeholder="Enter your email..." 
            bind:value={email}
            required
            disabled={isLoading}
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold text-lg text-primary">Password:</span>
          </label>
          <div class="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              class="input input-bordered w-full text-primary pr-12 focus:outline-none focus:ring-0" 
              placeholder="Enter your password..." 
              bind:value={password}
              required
              disabled={isLoading}
            />
            <button 
              type="button" 
              class="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm p-1" 
              on:click={() => showPassword = !showPassword}
              disabled={isLoading}
            >
              {#if showPassword}
                <Eye class="h-4 w-4 text-primary" />
              {:else}
                <EyeSlash class="h-4 w-4 text-primary" />
              {/if}
            </button>
          </div>
        </div>

        <div class="form-control mt-6">
          <button 
            type="submit" 
            class="btn btn-primary text-white text-lg w-full"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm"></span>
              Signing in...
            {:else}
              Sign In
            {/if}
          </button>
        </div>
      </form>

      <div class="divider">OR</div>

      <div class="text-center">
        <p class="text-sm text-gray-600 mb-2">Don't have an account?</p>
        <button 
          type="button" 
          class="btn btn-outline btn-primary w-full"
          on:click={goToSignup}
          disabled={isLoading}
        >
          Create Account
        </button>
      </div>
    </div>
  </div>
</div>
