<script>
	let username = '';
	let password = '';
	let errorMessage = '';
	let successMessage = '';
	let showPassword = false;
	import { Eye, EyeSlash } from 'svelte-heros-v2';

	async function register() {
		const usr = document.querySelector('.usr').value;
		const pwd = document.querySelector('.pwd').value;
		const response = await fetch('/api/register', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: usr, password: pwd })
		});

		if (response.ok) {
			successMessage = 'Account created. Redirecting...';
			await new Promise((resolve) => setTimeout(resolve, 500));
			window.location.href = '/';
		} else {
			const err = await response.json();
			errorMessage = err.error ?? 'Registration failed';
			setTimeout(() => {
				errorMessage = '';
			}, 4000);
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
	<input
		type="text"
		class="usr input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0"
		placeholder="choose a username..."
		bind:value={username}
	/><br />
	<small class="font-bold text-lg text-primary m-0 pb-0">Password (8+ characters):</small>
	<span class="flex justify-end">
		<input
			type={showPassword ? 'text' : 'password'}
			class="pwd flex-1 input input-bordered w-full text-primary px-2 my-2 focus:outline-none focus:ring-0"
			placeholder="choose a password..."
			bind:value={password}
		/><br />
		<button
			class="btn btn-ghost text-right py-0 flex-1"
			style="position: absolute; margin-right: -10px; z-index: 999"
			on:click={() => (showPassword = !showPassword)}
		>
			{#if showPassword}
				<Eye class="text-primary mt-5" />
			{:else}
				<EyeSlash class="text-primary mt-5" />
			{/if}
		</button>
	</span>
	<button class="btn btn-block btn-primary text-white text-lg my-2" on:click={register}>Register</button>
	<p class="text-sm text-center mt-2">
		<a href="/login" class="link link-primary">Back to login</a>
	</p>
</div>
