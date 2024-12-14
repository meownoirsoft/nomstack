<script>
    import Nav from '$lib/components/Nav.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { Plus, RectangleStack } from 'svelte-heros-v2';
    export let page;
    let showModal = false;
    function openModal() {
        showModal = true; // Set the modal to open
    }

    function handleModalClose() {
        showModal = false; // Reset the state when the modal closes
    }

    function capitalize(input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }
</script>
<div class="mx-auto w-full">
    <div class="flex items-center justify-between p-2 pr-0">
        <h1 class="flex ml-2 text-lg font-bold text-primary"><RectangleStack class="flex-1 mt-1" />&nbsp;<span class="pb-1">nomStack {capitalize(page.replace('/',''))}</span></h1>
        {#if !['/categories','/login'].includes(page)}
            <button class="btn btn-sm btn-ghost text-primary text-lg" on:click={() => (showModal = true)}>
                <Plus style="margin-right: -10px" />Meal
            </button>
        {/if}
        
      </div>
    <div class="flex justify-between items-center px-2 py-0 m-0 m-h-8">
        <Nav {page} />
    </div>
    <Modal {showModal} on:close={handleModalClose} {page} />
</div>