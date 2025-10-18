<script>
    import { Search, MapPin, Monitor, X } from 'lucide-svelte';
    import { searchTerm as globalSearchTerm, setSearchTerm, clearSearch as clearSearchStore } from '$lib/stores/search.js';
    import { restaurantSearchTerm, setRestaurantSearchTerm, clearRestaurantSearchTerm } from '$lib/stores/restaurantSearch.js';
    import { eatingMode } from '$lib/stores/eatingMode.js';
    import { setLocationSearch, clearLocationSearch } from '$lib/stores/locationSearch.js';

    let searchTerm = '';
    let customLocation = '';
    let currentLocation = null;
    let locationStatus = 'unknown'; // 'unknown', 'granted', 'denied', 'error'
    let useCustomLocation = false;

    // Load saved location from localStorage
    function loadSavedLocation() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nomstack-custom-location');
            if (saved) {
                customLocation = saved;
                useCustomLocation = true;
            }
        }
    }

    // Save location to localStorage
    function saveLocation(location) {
        if (typeof window !== 'undefined') {
            if (location && location.trim()) {
                localStorage.setItem('nomstack-custom-location', location);
            } else {
                localStorage.removeItem('nomstack-custom-location');
            }
        }
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }


    // Get user's current location
    async function getCurrentLocation() {
        if (!navigator.geolocation) {
            locationStatus = 'error';
            return null;
        }

        return new Promise((resolve) => {
            locationStatus = 'requesting';
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    locationStatus = 'granted';
                    useCustomLocation = false;
                    
                    // Update the location search store
                    setLocationSearch({
                        query: searchTerm,
                        location: currentLocation,
                        useCustomLocation: false,
                        customLocation: ''
                    });
                    
                    resolve(currentLocation);
                },
                (error) => {
                    console.warn('Could not get location:', error);
                    if (error.code === 1) {
                        locationStatus = 'denied';
                    } else {
                        locationStatus = 'error';
                    }
                    currentLocation = null;
                    // Don't show error toast - just silently fail
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // Retry location permission
    async function retryLocation() {
        try {
            await getCurrentLocation();
        } catch (err) {
            console.warn('Retry location failed:', err);
            // Don't show error toast for retry attempts
        }
    }

    // Toggle between custom location and GPS
    function toggleLocationMode() {
        useCustomLocation = !useCustomLocation;
        if (!useCustomLocation) {
            customLocation = '';
            getCurrentLocation();
        }
    }

    const handleInput = debounce((value) => {
        if ($eatingMode === 'out') {
            // In restaurant mode, update restaurant search store and location search store
            setRestaurantSearchTerm(value);
            setLocationSearch({
                query: value, // Keep this for backward compatibility
                location: useCustomLocation ? customLocation : currentLocation,
                useCustomLocation,
                customLocation
            });
        } else {
            // In meal mode, use normal search
            setSearchTerm(value);
        }
    }, 300);

    function updateSearch(event) {
        searchTerm = event.target.value;
        handleInput(searchTerm);
    }

    function clearSearch() {
        searchTerm = '';
        if ($eatingMode === 'out') {
            // Only clear the restaurant search term, preserve location
            clearRestaurantSearchTerm();
        } else {
            clearSearchStore();
        }
    }

    // Initialize location on component mount when in restaurant mode
    import { onMount } from 'svelte';
    onMount(async () => {
        if ($eatingMode === 'out') {
            // Load saved location first
            loadSavedLocation();
            
            // If no saved location, try to get location permission
            if (!customLocation) {
                await getCurrentLocation();
            } else {
                // If we loaded a saved location, trigger search
                handleInput(searchTerm);
            }
        }
    });

    // Reactive statement to handle custom location changes
    $: if (customLocation && useCustomLocation && $eatingMode === 'out') {
        handleInput(searchTerm);
    }

    // Reactive statement to trigger search when custom location changes
    $: if (customLocation && $eatingMode === 'out') {
        useCustomLocation = true;
        handleInput(searchTerm);
    }
</script>

<!-- Search Bar -->
<div class="form-control w-full relative">
    {#if $eatingMode === 'out'}
        <!-- Restaurant Mode: Location Search -->
        <div class="space-y-3">
            <!-- Location Status -->
            {#if locationStatus === 'granted' || locationStatus === 'requesting'}
                <div class="text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        {#if locationStatus === 'requesting'}
                            <div class="loading loading-spinner loading-sm text-primary"></div>
                        {:else}
                            <MapPin class="h-4 w-4 text-primary" />
                        {/if}
                        <span class="text-sm font-medium text-primary/70">
                            {#if locationStatus === 'granted'}
                                Searching near your location
                            {:else if locationStatus === 'requesting'}
                                Requesting location permission...
                            {/if}
                        </span>
                    </div>
                </div>
            {/if}

            <!-- Location Options -->
            {#if locationStatus === 'granted'}
                <!-- Show location search when permission is granted -->
                <div class="text-center">
                    <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        on:click={() => {
                            useCustomLocation = false;
                            customLocation = '';
                            getCurrentLocation();
                        }}
                    >
                        <MapPin class="h-4 w-4" />
                        Use My Location
                    </button>
                </div>
            {/if}


            <!-- Custom Location Input (only when location is denied/error) -->
            {#if locationStatus !== 'granted' && locationStatus !== 'requesting'}
                <div class="form-control mt-2">
                    <div class="relative">
                        <input
                            type="text"
                            placeholder="Enter city or zip code"
                            class="input input-bordered w-full pr-20"
                            style="padding-top: 4px; padding-bottom: 4px;"
                            bind:value={customLocation}
                            on:input={() => {
                                // Set custom location mode
                                useCustomLocation = true;
                                // Save location to localStorage
                                saveLocation(customLocation);
                                // Trigger search with current search term
                                handleInput(searchTerm);
                            }}
                        />
                        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {#if customLocation && customLocation.trim()}
                                <!-- Success indicator -->
                                <div class="text-green-500" title="Location set successfully">
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                            {/if}
                            {#if customLocation && customLocation.trim()}
                                <!-- Clear button -->
                                <button
                                    type="button"
                                    class="text-primary/40 hover:text-primary/60 p-1"
                                    on:click={() => {
                                        customLocation = '';
                                        useCustomLocation = false;
                                        saveLocation('');
                                        handleInput(searchTerm);
                                    }}
                                    title="Clear location"
                                >
                                    <X class="h-5 w-5" />
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Restaurant Search Input -->
            <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                <input
                    type="text"
                    placeholder="Search restaurants..."
                    class="input input-bordered w-full pl-10 pr-10"
                    style="padding-top: 4px; padding-bottom: 4px;"
                    value={searchTerm}
                    on:input={updateSearch}
                    aria-label="Search restaurants"
                />
                {#if searchTerm.length > 0}
                    <button 
                        type="button"
                        class="btn btn-ghost btn-sm p-0 text-primary absolute right-2 top-1/2 -translate-y-1/2"
                        on:click={clearSearch}>
                        <X class="h-4 w-4" />
                    </button>
                {/if}
            </div>
        </div>
    {:else}
        <!-- Meal Mode: Normal Search -->
        <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <input
                type="text"
                placeholder="Search meals, categories, notes..."
                class="input input-sm input-bordered border-primary/40 pl-9 pr-6 py-0 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={searchTerm}
                on:input={updateSearch}
                aria-label="Search meals by name, category, or notes"
            />
            {#if searchTerm.length > 0}
                <button 
                    type="button"
                    class="btn btn-ghost btn-xs p-0 text-primary absolute right-1.5 top-1/2 -translate-y-1/2"
                    on:click={clearSearch}>
                    <X class="h-5 w-5" />
                </button>
            {/if}
        </div>
    {/if}
</div>
