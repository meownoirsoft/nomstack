<script>
    let username = '';
    let password = '';
    let errorMessage = '';
  
    async function login() {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      if (response.ok) {
        // Redirect to the home page after successful login
        window.location.href = '/';
      } else {
        const error = await response.json();
        errorMessage = error.error;
      }
    }
  </script>

  {#if errorMessage}
    <span class="text-error font-bold">{errorMessage}</span>
  {/if}
  <form on:submit|preventDefault={login} class="w-full max-w-xs">
    <small class="font-bold text-lg text-primary m-0 pb-0">Username:</small>
    <input type="text" class="input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0" placeholder="type username..." bind:value={username} /><br />
    <small class="font-bold text-lg text-primary m-0 pb-0">Password:</small>
    <input type="password" class="input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0" placeholder="type password..." bind:value={password} /><br />
    <button class="btn btn-block btn-primary text-white text-lg my-2" type="submit">Login</button>
  </form>
  