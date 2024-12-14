<script>
    let username = '';
    let password = '';
    let errorMessage = '';
    let successMessage = '';
    import { goto } from '$app/navigation';
    async function login() {
      const usr = document.querySelector('.usr').value;
      const pwd = document.querySelector('.pwd').value;
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, password: pwd })
      });
  
      if (response.ok) {
        // Redirect to the home page after successful login
        successMessage = 'Login successful. Redirecting...';
        await new Promise((resolve) => setTimeout(resolve, 500)); // Add a short delay
        goto(`${window.location.origin}/`);
      } else {
        const error = await response.json();
        errorMessage = error.error;
        setTimeout(() => {
          errorMessage = '';
        }, 3000);
      }
    }
  </script>

  {#if errorMessage}
    <span class="text-error font-bold">{errorMessage}</span>
  {/if}
  {#if successMessage}
    <span class="text-success font-bold">{successMessage}</span>
  {/if}
  <div class="w-full max-w-xs">
    <small class="font-bold text-lg text-primary m-0 pb-0">Username:</small>
    <input type="text" class="usr input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0" placeholder="type username..." bind:value={username} /><br />
    <small class="font-bold text-lg text-primary m-0 pb-0">Password:</small>
    <input type="password" class="pwd input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0" placeholder="type password..." bind:value={password} /><br />
    <button class="btn btn-block btn-primary text-white text-lg my-2" on:click={login}>Login</button>
  </div>