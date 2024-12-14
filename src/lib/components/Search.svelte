<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import {XMark} from 'svelte-heros-v2';
    let searchTerm = '';
    let debouncedTerm = '';

    onMount(() => {
        toggleClearButton()
    });

    function toggleClearButton() {
        const searchIcon = document.querySelector('.search-icon');
        if(searchTerm.length > 0){
            const searchBoxWidth = document.querySelector('.input').offsetWidth;
            const searchIconOffset = searchBoxWidth - 40 + 'px';
            searchIcon.style.marginLeft = searchIconOffset;
            searchIcon.classList.remove('hidden');
        } else {
            searchIcon.classList.add('hidden');
        }
    }

    // Reactive subscription to the current query parameters
    $: searchTerm = $page.url.searchParams.get('search') || '';

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
        };
    }

    const handleInput = debounce((value) => {
        debouncedTerm = value; // Update the debounced value
        toggleClearButton();
        performSearch();
    }, 1000);

    function updateSearch() {
        if(searchTerm.length > 3){
            handleInput(searchTerm); // Pass the current searchTerm to the debounced function
        }
        if(searchTerm.length === 0){
            clearSearch();
        }
    }

    function performSearch() {
        // Update the URL with the search query parameter
        window.location.href = window.location.pathname+`?search=${encodeURIComponent(searchTerm)}`;
    }

    function clearSearch() {
        // Clear the search term and update the URL
        searchTerm = '';
        window.location.href = window.location.pathname
        toggleClearButton();
    }
</script>

<!-- Search Bar -->
<div class="form-control md:block w-full mr-2">
    <input
    type="text"
    placeholder="Search by category..."
    class="input input-sm input-bordered border-primary pl-2 pr-0 py-0 text-sm w-full max-w-xs focus:outline-none focus:ring-0"
    bind:value={searchTerm}
    on:input={updateSearch}
    />
    <button 
        class="btn btn-ghost btn-xs p-0 m-0 search-icon hidden text-primary" 
        style="position: relative; margin-top: -28px;" 
        on:click={clearSearch}>
        <XMark />
    </button>
</div>