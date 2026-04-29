<script>
  import { Star, MapPin, Phone, Edit, Trash2, Plus, Search, X, Map, Clock, ChevronDown, ChevronUp, Info } from 'lucide-svelte';
  import { locationSearchParams, setLocationSearch } from '$lib/stores/locationSearch.js';
  import { restaurantSearchTerm, setRestaurantSearchTerm, clearRestaurantSearchTerm } from '$lib/stores/restaurantSearch.js';
  import { searchRestaurants, getPlaceDetails } from '$lib/helpers/googlePlaces.js';
  import SearchComponent from './Search.svelte';
  import RestaurantForm from './RestaurantForm.svelte';

  export let restaurants = [];
  export let loading = true;
  export let error = null;
  export let showAddModal = false;
  export let editingRestaurant = null;
  export let searchResults = [];
  export let expandedHours = new Set();
  export let expandedDetails = new Set();
  export let searchLoading = false;
  export let selectedRestaurant = null;
  // Functions
  export let addRestaurant = () => {};
  export let updateRestaurant = () => {};
  export let deleteRestaurant = () => {};
  export let selectRestaurant = () => {};
  export let addSelectedRestaurant = () => {};
  export let cancelSelection = () => {};
  export let performSearch = () => {};

  // Reactive search when restaurant search term changes
  $: if ($restaurantSearchTerm && $restaurantSearchTerm.trim().length >= 2) {
    performSearch();
  } else {
    searchResults = [];
    selectedRestaurant = null;
  }
</script>

<div class="flex flex-col h-full">
  <!-- Fixed Header Section -->
  <div class="flex-shrink-0">
    <!-- Search Component -->
    <div class="mb-6">
      <SearchComponent />
    </div>
    
    <!-- Search Results -->
    {#if $restaurantSearchTerm && $restaurantSearchTerm.trim().length >= 2}
    <div class="mb-6">
      <div class="bg-base-100 border border-primary/20 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">Search Results</h3>
          <button
            type="button"
            class="text-primary/40 hover:text-primary/60 p-1"
            on:click={() => {
              // Clear only the restaurant search term, preserve location
              clearRestaurantSearchTerm();
            }}
            title="Clear search"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        
        {#if searchLoading}
          <div class="flex items-center justify-center py-4">
            <div class="loading loading-spinner loading-md text-primary"></div>
            <span class="ml-2">Searching restaurants...</span>
          </div>
        {:else if selectedRestaurant}
          <!-- Selected Restaurant Details -->
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <h4 class="text-lg font-semibold text-primary mb-2">{selectedRestaurant.name}</h4>
            <div class="space-y-2 text-sm">
              {#if selectedRestaurant.address}
                <p class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-primary" />
                  {selectedRestaurant.address}
                </p>
              {/if}
              {#if selectedRestaurant.phone}
                <p class="flex items-center gap-2">
                  <Phone class="h-4 w-4 text-primary" />
                  {selectedRestaurant.phone}
                </p>
              {/if}
              {#if selectedRestaurant.rating}
                <p class="flex items-center gap-2">
                  <Star class="h-4 w-4 text-yellow-500 fill-current" />
                  {selectedRestaurant.rating}/5
                </p>
              {/if}
              {#if selectedRestaurant.website}
                <p class="text-primary">
                  <a href={selectedRestaurant.website} target="_blank" rel="noopener noreferrer" class="hover:underline">
                    Visit Website
                  </a>
                </p>
              {/if}
            </div>
            <div class="flex gap-2 mt-4">
              <button class="btn btn-primary btn-sm" on:click={addSelectedRestaurant}>
                Add to My Restaurants
              </button>
              <button class="btn btn-ghost btn-sm" on:click={cancelSelection}>
                Cancel
              </button>
            </div>
          </div>
        {:else if searchResults.length > 0}
          <!-- Search Results List -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            {#each searchResults as restaurant (restaurant.google_place_id)}
              <button
                class="w-full text-left p-3 hover:bg-base-200 border border-primary/20 rounded-lg"
                on:click={() => selectRestaurant(restaurant)}
              >
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm truncate">{restaurant.name}</h4>
                    <p class="text-xs text-primary/70 mt-1 flex items-center gap-1">
                      <MapPin class="h-3 w-3 flex-shrink-0 text-primary/70" />
                      <span class="truncate">{restaurant.address}</span>
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      {#if restaurant.rating}
                        <div class="flex items-center gap-1">
                          <Star class="h-4 w-4 text-yellow-500 fill-current" />
                          <span class="text-xs text-primary/70">{restaurant.rating}</span>
                        </div>
                      {/if}
                      {#if restaurant.price_level}
                        <span class="text-xs text-primary/70">{restaurant.price_level}</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <p class="text-primary/70 text-center py-4">No restaurants found. Try a different search term.</p>
        {/if}
      </div>
    </div>
    {/if}

    <!-- Info Message -->
    <p class="text-center text-sm text-primary/70 -mt-2 mb-2">
      Restaurants will be randomly picked in the Decider
    </p>
  </div>
  
  <!-- Scrollable Content Area -->
  <div class="flex-1 overflow-y-auto pb-6">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="loading loading-spinner loading-lg text-primary"></div>
          <p class="mt-4 text-primary/70">Loading restaurants...</p>
        </div>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <span>Error loading restaurants: {error}</span>
      </div>
    {:else if restaurants.length === 0}
      <div class="text-center py-8">
        <p class="text-primary/70 mb-4">No restaurants added yet.</p>
        <button 
          class="btn btn-primary"
          on:click={() => showAddModal = true}
        >
          <Plus class="h-4 w-4" />
          Manually Add
        </button>
      </div>
    {:else}
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {#each restaurants as restaurant (restaurant.id)}
        <div class="card bg-base-100 shadow-md border border-primary/20">
          <div class="card-body p-3">
            {#if editingRestaurant && editingRestaurant.id === restaurant.id}
              <!-- Edit Mode -->
              <div class="space-y-3">
                <input 
                  type="text" 
                  class="input input-sm w-full border-primary focus:border-primary" 
                  bind:value={editingRestaurant.name}
                  placeholder="Restaurant name"
                />
                <input 
                  type="text" 
                  class="input input-sm w-full border-primary focus:border-primary" 
                  bind:value={editingRestaurant.cuisine}
                  placeholder="Cuisine type"
                />
                <input 
                  type="text" 
                  class="input input-sm w-full border-primary focus:border-primary" 
                  bind:value={editingRestaurant.address}
                  placeholder="Address"
                />
                <input 
                  type="text" 
                  class="input input-sm w-full border-primary focus:border-primary" 
                  bind:value={editingRestaurant.phone}
                  placeholder="Phone number"
                />
                <textarea 
                  class="textarea textarea-sm w-full border-primary focus:border-primary" 
                  bind:value={editingRestaurant.notes}
                  placeholder="Notes"
                  rows="2"
                ></textarea>
                <div class="flex gap-2">
                  <button 
                    class="btn btn-primary btn-sm flex-1"
                    on:click={() => updateRestaurant(editingRestaurant)}
                  >
                    Save
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm"
                    on:click={() => editingRestaurant = null}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {:else}
              <!-- View Mode -->
              <div class="space-y-2">
                <div class="flex items-start justify-between">
                  <h3 class="font-semibold text-sm leading-tight flex-1 pr-2 text-primary">{restaurant.name}</h3>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    {#if restaurant.rating}
                      <div class="flex items-center gap-1">
                        <Star class="h-4 w-4 text-yellow-500 fill-current" />
                        <span class="text-xs text-primary/70">{restaurant.rating}</span>
                      </div>
                    {/if}
                    {#if restaurant.price_level}
                      <span class="text-xs text-primary/70 ml-1">{restaurant.price_level}</span>
                    {/if}
                  </div>
                </div>

                {#if restaurant.cuisine && restaurant.cuisine !== 'Restaurant'}
                  <p class="text-xs text-primary/70">{restaurant.cuisine}</p>
                {/if}

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(restaurant.name + ' ' + restaurant.address)}" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
                    >
                      <Map class="h-4 w-4 text-primary" />
                      <span class="hidden sm:inline">Map</span>
                    </a>
                    <button 
                      class="btn btn-ghost btn-xs p-1"
                      on:click={() => editingRestaurant = {...restaurant}}
                      title="Edit restaurant"
                    >
                      <Edit class="h-4 w-4 text-primary" />
                    </button>
                    <button 
                      class="btn btn-ghost btn-xs p-1 text-error hover:bg-error/10"
                      on:click={() => deleteRestaurant(restaurant.id)}
                      title="Delete restaurant"
                    >
                      <Trash2 class="h-4 w-4 text-error" />
                    </button>
                  </div>
                </div>

                <!-- Hours Accordion -->
                {#if restaurant.hours && restaurant.hours.length > 0}
                  <div class="border-t border-gray-300 pt-2">
                    <button
                      class="flex items-center justify-between w-full text-left text-xs text-primary/70 hover:text-primary/90"
                      on:click={() => {
                        const newExpanded = new Set(expandedHours);
                        if (newExpanded.has(restaurant.id)) {
                          newExpanded.delete(restaurant.id);
                        } else {
                          newExpanded.add(restaurant.id);
                        }
                        expandedHours = newExpanded;
                      }}
                    >
                      <span>Hours: {restaurant.hours.find(h => h.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))?.hours || 'Check hours'}</span>
                      {#if expandedHours.has(restaurant.id)}
                        <ChevronUp class="h-4 w-4 text-primary/70" />
                      {:else}
                        <ChevronDown class="h-4 w-4 text-primary/70" />
                      {/if}
                    </button>
                    {#if expandedHours.has(restaurant.id)}
                      <div class="mt-2 text-xs text-primary/70 space-y-1">
                        {#each restaurant.hours as hour}
                          <div class="flex justify-between">
                            <span class="font-medium">{hour.day}</span>
                            <span>{hour.hours}</span>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Details Accordion -->
                {#if restaurant.address || restaurant.phone}
                  <div class="border-t border-gray-300 pt-2">
                    <button
                      class="flex items-center justify-between w-full text-left text-xs text-primary/70 hover:text-primary/90"
                      on:click={() => {
                        const newExpanded = new Set(expandedDetails);
                        if (newExpanded.has(restaurant.id)) {
                          newExpanded.delete(restaurant.id);
                        } else {
                          newExpanded.add(restaurant.id);
                        }
                        expandedDetails = newExpanded;
                      }}
                    >
                      <span class="truncate">{restaurant.address?.split(',')[0] || 'Details'}</span>
                      {#if expandedDetails.has(restaurant.id)}
                        <ChevronUp class="h-4 w-4 text-primary/70" />
                      {:else}
                        <ChevronDown class="h-4 w-4 text-primary/70" />
                      {/if}
                    </button>
                    {#if expandedDetails.has(restaurant.id)}
                      <div class="mt-2 text-xs text-primary/70 space-y-1">
                        {#if restaurant.address}
                          <div class="flex items-start gap-1">
                            <MapPin class="h-4 w-4 mt-0.5 flex-shrink-0 text-primary/70" />
                            <span class="text-xs">{restaurant.address.split(',').slice(1).join(',').trim()}</span>
                          </div>
                        {/if}
                        {#if restaurant.phone}
                          <div class="flex items-center gap-1">
                            <Phone class="h-4 w-4 text-primary/70" />
                            <span class="text-xs">{restaurant.phone}</span>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if restaurant.notes}
                  <p class="text-sm text-primary/70 mt-2">{restaurant.notes}</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Add Restaurant Modal -->
{#if showAddModal}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-24 sm:mt-28 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-primary/20 px-6 py-6">
      <div class="flex items-center h-8 m-0">
        <h3 class="flex-1 font-bold text-lg mt-0 text-primary">Add Restaurant</h3>
        <button 
          class="btn btn-ghost btn-sm"
          on:click={() => showAddModal = false}
        >
          ✕
        </button>
      </div>
      
      <RestaurantForm 
        on:save={(e) => addRestaurant(e.detail)}
        on:cancel={() => showAddModal = false}
      />
    </div>
  </div>
{/if}
