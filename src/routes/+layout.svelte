<script>
  import { page } from '$app/stores';
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  export let data;
  export let error; // Captures errors from the load function
  let currentPage;

  $: {
    const { url, route } = $page;
    handleUrlChange(url);
  }

  function handleUrlChange(url) {
    currentPage = url.pathname;
  }
</script>
<svelte:head>
  <title>{data.title}</title>
</svelte:head>
<div class="w-full page bg-secondary flex flex-col h-screen">
    <Header page={currentPage} />
    <div class="content pl-4 flex-grow">
      {#if error}
        <h1>Error: {error.message}</h1>
      {:else}
        <slot />
      {/if}
    </div>
    <Footer />
</div>

