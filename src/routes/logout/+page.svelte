<script>
    import { goto } from '$app/navigation';
</script>

<div class="w-full max-w-xs items-center justify-center flex flex-col">
    <h1 class="text-xl font-bold text-center">Logout</h1>
    <p class="text-center">You have been logged out.</p>
    <p class="text-center">Click to login again.</p>
    <button class="btn btn-primary text-white text-lg my-2" on:click={() => goto('/login')}>Login</button>
</div>