<script>
    import Search from './Search.svelte';
    import { Bars3, Cake, Sun, Sparkles, Funnel, Printer, NoSymbol } from 'svelte-heros-v2';
    let menuOpen = false;
    export let page;

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    async function logout() {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    }
</script>
{#if !['/login','/print'].includes(page)}
<nav class="navbar bg-secondary my-0 py-0 m-h-8 pb-0">
    <Search />
    <!-- Mobile Menu Icon -->
    <div class="dropdown dropdown-end">
        <button tabindex="0" class="btn btn-ghost mr-0 pr-0" on:click={toggleMenu}>
            <Bars3 class="text-primary" />
        </button>
        {#if menuOpen}
            <button class="mt-10 p-0" style="position: absolute; z-index: 999;" on:click={() => (menuOpen = false)}>
                <ul class="menu menu-compact dropdown-content mt-3 p-2 ml-2 shadow bg-base-100 rounded-box w-52">
                    <li><a href="/" class="text-primary"><Cake /> All</a></li>
                    <li><a href="/lunch" class="text-primary"><Sun /> Lunch</a></li>
                    <li><a href="/dinner" class="text-primary"><Sparkles /> Dinner</a></li>
                    <li><a href="/categories" class="text-primary"><Funnel /> Categories</a></li>
                    <li><a href="/print" class="text-primary"><Printer /> Print</a></li>
                    <li><a href="/logout" class="text-primary" on:click={logout}><NoSymbol /> Logout</a></li>
                </ul>
            </button>
        {/if}
    </div>
</nav>
{/if}