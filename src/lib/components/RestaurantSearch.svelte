<script>
  import { createEventDispatcher } from 'svelte';
  import { MagnifyingGlass, MapPin, Star, Phone, ComputerDesktop, Clock } from 'svelte-heros-v2';
  import { searchRestaurants, getPlaceDetails } from '$lib/helpers/googlePlaces.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';

  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let searchResults = [];
  let loading = false;
  let showResults = false;
  let selectedRestaurant = null;
  let customLocation = '';
  let currentLocation = null;
  let locationStatus = 'unknown'; // 'unknown', 'granted', 'denied', 'error'
  let useCustomLocation = false;

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
      notifyError('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve) => {
      locationStatus = 'unknown';
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          locationStatus = 'granted';
          useCustomLocation = false;
          notifySuccess('Location found! Searching near you.');
          resolve(currentLocation);
        },
        (error) => {
          console.warn('Could not get location:', error);
          locationStatus = 'denied';
          currentLocation = null;
          notifyError('Location access denied. You can search by city or address instead.');
          resolve(null);
        }
      );
    });
  }

  // Retry location permission
  async function retryLocation() {
    await getCurrentLocation();
  }

  // Toggle between custom location and GPS
  function toggleLocationMode() {
    useCustomLocation = !useCustomLocation;
    if (!useCustomLocation) {
      customLocation = '';
      getCurrentLocation();
    }
  }

  const handleSearch = debounce(async (query) => {
    if (!query || query.trim().length < 2) {
      searchResults = [];
      showResults = false;
      return;
    }

    try {
      loading = true;
      
      // Determine location to use
      if (useCustomLocation && customLocation.trim()) {
        // Use custom location string
        searchResults = await searchRestaurants(query, null, customLocation);
      } else if (currentLocation) {
        // Use GPS coordinates
        searchResults = await searchRestaurants(query, currentLocation);
      } else {
        // Fallback to default location (handled in the API)
        searchResults = await searchRestaurants(query);
      }
      
      showResults = true;
    } catch (error) {
      console.error('Search error:', error);
      notifyError('Failed to search restaurants. Please try again.');
      searchResults = [];
      showResults = false;
    } finally {
      loading = false;
    }
  }, 500);

  function updateSearch(event) {
    searchQuery = event.target.value;
    handleSearch(searchQuery);
  }

  async function selectRestaurant(restaurant) {
    try {
      loading = true;
      // Get detailed information about the selected restaurant
      const details = await getPlaceDetails(restaurant.google_place_id);
      selectedRestaurant = details;
      showResults = false;
      searchQuery = '';
    } catch (error) {
      console.error('Error getting restaurant details:', error);
      notifyError('Failed to get restaurant details. Please try again.');
    } finally {
      loading = false;
    }
  }

  function addRestaurant() {
    if (selectedRestaurant) {
      dispatch('add', selectedRestaurant);
      selectedRestaurant = null;
      searchQuery = '';
    }
  }

  function cancelSelection() {
    selectedRestaurant = null;
    searchQuery = '';
    showResults = false;
  }

  function clearSearch() {
    searchQuery = '';
    searchResults = [];
    showResults = false;
    selectedRestaurant = null;
  }

  // Initialize location on component mount
  import { onMount } from 'svelte';
  onMount(() => {
    getCurrentLocation();
  });
</script>

<div class="restaurant-search">
  {#if !selectedRestaurant}
    <!-- Location Management -->
    <div class="mb-4 space-y-3">
      <!-- Location Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <MapPin class="h-4 w-4 text-primary" />
          <span class="text-sm font-medium">
            {#if locationStatus === 'granted'}
              Searching near your location
            {:else if locationStatus === 'denied'}
              Location denied - using default area
            {:else if locationStatus === 'error'}
              Location not available
            {:else}
              Getting your location...
            {/if}
          </span>
        </div>
        
        {#if locationStatus === 'denied' || locationStatus === 'error'}
          <button
            type="button"
            class="btn btn-sm btn-outline"
            on:click={retryLocation}
          >
            Retry Location
          </button>
        {/if}
      </div>

      <!-- Location Toggle -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm {useCustomLocation ? 'btn-ghost' : 'btn-primary'}"
          on:click={toggleLocationMode}
        >
          <MapPin class="h-4 w-4" />
          Use My Location
        </button>
        <button
          type="button"
          class="btn btn-sm {useCustomLocation ? 'btn-primary' : 'btn-ghost'}"
          on:click={toggleLocationMode}
        >
          <ComputerDesktop class="h-4 w-4" />
          Enter Location
        </button>
      </div>

      <!-- Custom Location Input -->
      {#if useCustomLocation}
        <div class="form-control">
          <label class="label">
            <span class="label-text">City or Address</span>
          </label>
          <input
            type="text"
            placeholder="e.g., San Francisco, CA or 123 Main St, New York"
            class="input input-bordered"
            bind:value={customLocation}
          />
        </div>
      {/if}
    </div>

    <!-- Search Input -->
    <div class="form-control w-full relative">
      <div class="relative">
        <MagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
        <input
          type="text"
          placeholder="Search for restaurants..."
          class="input input-bordered w-full pl-9 pr-10"
          bind:value={searchQuery}
          on:input={updateSearch}
        />
        {#if searchQuery}
          <button
            type="button"
            class="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2"
            on:click={clearSearch}
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Search Results -->
      {#if showResults && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {#each searchResults as restaurant (restaurant.google_place_id)}
            <button
              class="w-full text-left p-3 hover:bg-base-200 border-b border-base-200 last:border-b-0"
              on:click={() => selectRestaurant(restaurant)}
            >
              <div class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm truncate">{restaurant.name}</h4>
                  <p class="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin class="h-3 w-3 flex-shrink-0" />
                    <span class="truncate">{restaurant.address}</span>
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    {#if restaurant.rating}
                      <div class="flex items-center gap-1">
                        <Star class="h-3 w-3 text-yellow-500 fill-current" />
                        <span class="text-xs">{restaurant.rating}</span>
                      </div>
                    {/if}
                    {#if restaurant.price_level}
                      <span class="text-xs text-gray-600">{restaurant.price_level}</span>
                    {/if}
                    {#if restaurant.cuisine}
                      <span class="text-xs text-gray-600">{restaurant.cuisine}</span>
                    {/if}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      {#if showResults && searchResults.length === 0 && !loading}
        <div class="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-200 rounded-lg shadow-lg p-3">
          <p class="text-sm text-gray-600">No restaurants found. Try a different search term.</p>
        </div>
      {/if}
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-4">
        <div class="loading loading-spinner loading-sm text-primary"></div>
        <span class="ml-2 text-sm text-gray-600">Searching restaurants...</span>
      </div>
    {/if}
  {:else}
    <!-- Selected Restaurant Details -->
    <div class="bg-base-100 border border-base-200 rounded-lg p-4">
      <div class="flex items-start justify-between mb-3">
        <h3 class="font-semibold text-lg">{selectedRestaurant.name}</h3>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          on:click={cancelSelection}
        >
          ✕
        </button>
      </div>

      <div class="space-y-2 text-sm">
        {#if selectedRestaurant.address}
          <div class="flex items-start gap-2">
            <MapPin class="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span class="text-gray-700">{selectedRestaurant.address}</span>
          </div>
        {/if}

        {#if selectedRestaurant.phone}
          <div class="flex items-center gap-2">
            <Phone class="h-4 w-4 text-gray-500" />
            <span class="text-gray-700">{selectedRestaurant.phone}</span>
          </div>
        {/if}

        {#if selectedRestaurant.website}
          <div class="flex items-center gap-2">
            <ComputerDesktop class="h-4 w-4 text-gray-500" />
            <a 
              href={selectedRestaurant.website} 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              Visit Website
            </a>
          </div>
        {/if}

        <div class="flex items-center gap-4">
          {#if selectedRestaurant.rating}
            <div class="flex items-center gap-1">
              <Star class="h-4 w-4 text-yellow-500 fill-current" />
              <span class="text-gray-700">{selectedRestaurant.rating}</span>
            </div>
          {/if}

          {#if selectedRestaurant.price_level}
            <span class="text-gray-700">{selectedRestaurant.price_level}</span>
          {/if}

          {#if selectedRestaurant.cuisine}
            <span class="text-gray-700">{selectedRestaurant.cuisine}</span>
          {/if}
        </div>

        {#if selectedRestaurant.opening_hours && selectedRestaurant.opening_hours.length > 0}
          <div class="flex items-start gap-2">
            <Clock class="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div class="text-gray-700">
              {#each selectedRestaurant.opening_hours.slice(0, 3) as hours}
                <div class="text-xs">{hours}</div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="flex gap-2 mt-4">
        <button
          type="button"
          class="btn btn-primary btn-sm flex-1"
          on:click={addRestaurant}
        >
          Add to My Restaurants
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          on:click={cancelSelection}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>
