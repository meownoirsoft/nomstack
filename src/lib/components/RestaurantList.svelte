<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { Star, MapPin, Phone, Edit, Trash2, Plus, Search, X, Map, Clock, ChevronDown, ChevronUp, Info } from 'lucide-svelte';
  import { locationSearchParams, setLocationSearch } from '$lib/stores/locationSearch.js';
  import { restaurantSearchTerm, setRestaurantSearchTerm, clearRestaurantSearchTerm } from '$lib/stores/restaurantSearch.js';
  import { searchRestaurants, getPlaceDetails } from '$lib/helpers/googlePlaces.js';
  import RestaurantForm from './RestaurantForm.svelte';
  import SearchComponent from './Search.svelte';

  let restaurants = [];
  let loading = true;
  let error = null;
  let showAddModal = false;
  let editingRestaurant = null;
  let searchResults = [];
  let expandedHours = new Set(); // Track which restaurant hours are expanded
  let expandedDetails = new Set(); // Track which restaurant details are expanded
  let searchLoading = false;
  let selectedRestaurant = null;
  let showSearchResults = false;
     let activeTab = 'decider'; // 'decider' or 'my-noms'
     let randomRestaurant = null;
     let isDeciding = false;

  onMount(async () => {
    await loadRestaurants();
  });

  // Reactive search when restaurant search term changes (only on My Noms tab)
  $: if (activeTab === 'my-noms' && $restaurantSearchTerm && $restaurantSearchTerm.trim().length >= 2) {
    performSearch();
  } else if (activeTab !== 'my-noms') {
    searchResults = [];
    selectedRestaurant = null;
  }

  async function performSearch() {
    try {
      searchLoading = true;
      const { location, useCustomLocation, customLocation } = $locationSearchParams;
      const query = $restaurantSearchTerm;
      
      if (useCustomLocation && customLocation.trim()) {
        searchResults = await searchRestaurants(query, null, customLocation);
      } else if (location) {
        searchResults = await searchRestaurants(query, location);
      } else {
        searchResults = await searchRestaurants(query);
      }
    } catch (err) {
      console.error('Search error:', err);
      notifyError('Failed to search restaurants. Please try again.');
      searchResults = [];
    } finally {
      searchLoading = false;
    }
  }

  async function selectRestaurant(restaurant) {
    try {
      searchLoading = true;
      const details = await getPlaceDetails(restaurant.google_place_id);
      selectedRestaurant = details;
    } catch (err) {
      console.error('Error getting restaurant details:', err);
      notifyError('Failed to get restaurant details. Please try again.');
    } finally {
      searchLoading = false;
    }
  }

  async function addSelectedRestaurant() {
    if (selectedRestaurant) {
      try {
        await addRestaurant(selectedRestaurant);
        selectedRestaurant = null;
        // Clear only the restaurant search term, preserve location
        clearRestaurantSearchTerm();
      } catch (err) {
        console.error('Error adding selected restaurant:', err);
        notifyError('Failed to add restaurant to your list');
      }
    }
  }

  function cancelSelection() {
    selectedRestaurant = null;
  }

  async function loadRestaurants() {
    try {
      loading = true;
      error = null;
      restaurants = await api.getRestaurants();
    } catch (err) {
      console.error('Error loading restaurants:', err);
      error = err.message || 'Unable to load restaurants';
      notifyError(error);
    } finally {
      loading = false;
    }
  }

  async function addRestaurant(restaurant) {
    try {
      const result = await api.addRestaurant(restaurant);
      if (result.success) {
        restaurants = [...restaurants, result.restaurant];
        notifySuccess('Restaurant added successfully!');
        showAddModal = false;
      } else {
        throw new Error(result.error || 'Failed to add restaurant');
      }
    } catch (err) {
      console.error('Error adding restaurant:', err);
      notifyError(err.message || 'Unable to add restaurant');
    }
  }

  async function updateRestaurant(restaurant) {
    try {
      const result = await api.updateRestaurant(restaurant);
      if (result.success) {
        restaurants = restaurants.map(r => r.id === restaurant.id ? result.restaurant : r);
        notifySuccess('Restaurant updated successfully!');
        editingRestaurant = null;
      } else {
        throw new Error(result.error || 'Failed to update restaurant');
      }
    } catch (err) {
      console.error('Error updating restaurant:', err);
      notifyError(err.message || 'Unable to update restaurant');
    }
  }

  async function deleteRestaurant(id) {
    if (!confirm('Are you sure you want to delete this restaurant?')) {
      return;
    }

    try {
      const result = await api.deleteRestaurant(id);
      if (result.success) {
        restaurants = restaurants.filter(r => r.id !== id);
        notifySuccess('Restaurant deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete restaurant');
      }
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      notifyError(err.message || 'Unable to delete restaurant');
    }
  }

  function startEdit(restaurant) {
    editingRestaurant = { ...restaurant };
  }

  function cancelEdit() {
    editingRestaurant = null;
  }

  function toggleHours(restaurantId) {
    if (expandedHours.has(restaurantId)) {
      expandedHours.delete(restaurantId);
    } else {
      expandedHours.add(restaurantId);
    }
    expandedHours = expandedHours; // Trigger reactivity
  }

  function toggleDetails(restaurantId) {
    if (expandedDetails.has(restaurantId)) {
      expandedDetails.delete(restaurantId);
    } else {
      expandedDetails.add(restaurantId);
    }
    expandedDetails = expandedDetails; // Trigger reactivity
  }

  function getTodayHours(openingHours) {
    if (!openingHours || openingHours.length === 0) return null;
    
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
    // Find today's hours
    const todayHours = openingHours.find(hours => 
      hours.toLowerCase().includes(todayName.toLowerCase())
    );
    
    if (!todayHours) return null;
    
    // Extract time information
    const timeMatch = todayHours.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    if (timeMatch) {
      const [, openTime, closeTime] = timeMatch;
      return `Open until ${closeTime}`;
    }
    
    // If it says "Closed"
    if (todayHours.toLowerCase().includes('closed')) {
      return 'Closed today';
    }
    
    return todayHours;
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 10) / 10} mi` : `${Math.round(distance)} mi`;
  }

     async function selectRandomRestaurant() {
       if (restaurants.length === 0) return;
       
       isDeciding = true;
       randomRestaurant = null;
       
       // Create suspense with a spinning animation
       const spinDuration = 2000 + Math.random() * 1000; // 2-3 seconds
       const spinInterval = 50; // Update every 50ms
       const totalUpdates = spinDuration / spinInterval;
       let currentUpdate = 0;
       
       const spinIntervalId = setInterval(() => {
         currentUpdate++;
         if (currentUpdate >= totalUpdates) {
           clearInterval(spinIntervalId);
           // Select the final restaurant
           const randomIndex = Math.floor(Math.random() * restaurants.length);
           randomRestaurant = restaurants[randomIndex];
           isDeciding = false;
         }
       }, spinInterval);
     }

     function clearRandomSelection() {
       randomRestaurant = null;
     }

     // Clear search results when switching away from My Noms tab
     $: if (activeTab !== 'my-noms') {
       searchResults = [];
       selectedRestaurant = null;
     }

</script>

<div class="restaurant-list">
  <!-- Tab Navigation -->
  <div class="flex border-b border-gray-200">
    <button
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'decider' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      on:click={() => activeTab = 'decider'}
    >
      Decider
    </button>
    <button
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'my-noms' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      on:click={() => activeTab = 'my-noms'}
    >
      My Noms
    </button>
  </div>

  <!-- Tab Content -->
  <div class="mt-1">
     {#if activeTab === 'decider'}
       <!-- Decider Tab -->
       <div class="text-center py-12">
         <h3 class="text-lg text-gray-500 mb-2">No Drama</h3>
         <h2 class="text-3xl font-bold text-primary mb-6">Dinner Decider</h2>
         
         {#if isDeciding}
           <!-- Roulette Wheel Animation -->
           <div class="flex flex-col items-center justify-center py-8">
             <div class="relative mb-6">
               <!-- Roulette Wheel -->
               <div class="w-48 h-48 border-8 border-primary/20 rounded-full relative overflow-hidden">
                 <!-- Spinning wheel with restaurant names -->
                 <div class="absolute inset-0 animate-spin" style="animation-duration: 0.5s;">
                   {#each restaurants as restaurant, index}
                     <div 
                       class="absolute w-full h-full flex items-center justify-center text-xs font-medium text-primary"
                       style="transform: rotate({360 / restaurants.length * index}deg) translateY(-80px);"
                     >
                       {restaurant.name.length > 12 ? restaurant.name.substring(0, 12) + '...' : restaurant.name}
                     </div>
                   {/each}
                 </div>
                 <!-- Center circle -->
                 <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                   <div class="w-3 h-3 bg-white rounded-full"></div>
                 </div>
                 <!-- Pointer -->
                 <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-primary"></div>
               </div>
             </div>
             
             <!-- Deciding text with dots animation -->
             <div class="flex items-center gap-1 mb-4">
               <span class="text-lg font-medium text-primary">Deciding</span>
               <div class="flex gap-1">
                 <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                 <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                 <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
               </div>
             </div>
             
             <p class="text-gray-600 text-sm">The wheel is spinning...</p>
           </div>
         {:else if randomRestaurant}
           <div class="bg-base-100 border border-base-200 rounded-lg p-6 max-w-md mx-auto">
             <h4 class="text-xl font-semibold mb-4">{randomRestaurant.name}</h4>
             {#if randomRestaurant.address}
               <p class="text-gray-600 mb-4">{randomRestaurant.address}</p>
             {/if}
             {#if randomRestaurant.rating}
               <div class="flex items-center justify-center gap-1 mb-4">
                 <Star class="h-4 w-4 text-yellow-500 fill-current" />
                 <span>{randomRestaurant.rating}</span>
               </div>
             {/if}
             <div class="flex gap-2 justify-center">
               <button class="btn btn-primary" on:click={selectRandomRestaurant}>
                 Double or Muffin?
               </button>
               <button class="btn btn-ghost" on:click={clearRandomSelection}>
                 Clear
               </button>
             </div>
           </div>
         {:else}
           <p class="text-gray-600 mb-6">Let us decide for you!</p>
           <button 
             class="btn btn-primary btn-lg"
             on:click={selectRandomRestaurant}
             disabled={restaurants.length === 0}
           >
             Decide My Dinner
           </button>
           {#if restaurants.length === 0}
             <p class="text-sm text-gray-500 mt-4">Add some restaurants first!</p>
           {/if}
         {/if}
       </div>
  {:else if activeTab === 'my-noms'}
    <!-- My Noms Tab -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-primary">Nearby Noms</h2>
      <div class="flex gap-2">
        <button 
          class="btn btn-primary btn-sm"
          on:click={() => showAddModal = true}
        >
          <Plus class="h-4 w-4" />
          Add Noms
        </button>
      </div>
    </div>
    
    <!-- Search Component (only on My Noms tab) -->
    <div class="mb-6">
      <SearchComponent />
    </div>
    
    <!-- Search Results -->
    {#if $restaurantSearchTerm && $restaurantSearchTerm.trim().length >= 2}
    <div class="mb-6">
      <div class="bg-base-100 border border-base-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Search Results</h3>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 p-1"
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
                Add to My Noms
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
                class="w-full text-left p-3 hover:bg-base-200 border border-base-200 rounded-lg"
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
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <p class="text-gray-600 text-center py-4">No restaurants found. Try a different search term.</p>
        {/if}
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="mt-4 text-gray-600">Loading restaurants...</p>
      </div>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <span>Error loading restaurants: {error}</span>
    </div>
  {:else if restaurants.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-600 mb-4">No restaurants added yet.</p>
      <button 
        class="btn btn-primary"
        on:click={() => showAddModal = true}
      >
        <Plus class="h-4 w-4" />
        Add Your First Restaurant
      </button>
    </div>
  {:else}
    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {#each restaurants as restaurant (restaurant.id)}
        <div class="card bg-base-100 shadow-md border border-base-200">
          <div class="card-body p-3">
            {#if editingRestaurant && editingRestaurant.id === restaurant.id}
              <!-- Edit Mode -->
              <div class="space-y-3">
                <input 
                  type="text" 
                  class="input input-sm input-bordered w-full" 
                  bind:value={editingRestaurant.name}
                  placeholder="Restaurant name"
                />
                <input 
                  type="text" 
                  class="input input-sm input-bordered w-full" 
                  bind:value={editingRestaurant.cuisine}
                  placeholder="Cuisine type"
                />
                <input 
                  type="text" 
                  class="input input-sm input-bordered w-full" 
                  bind:value={editingRestaurant.address}
                  placeholder="Address"
                />
                <input 
                  type="text" 
                  class="input input-sm input-bordered w-full" 
                  bind:value={editingRestaurant.phone}
                  placeholder="Phone number"
                />
                <textarea 
                  class="textarea textarea-sm textarea-bordered w-full" 
                  bind:value={editingRestaurant.notes}
                  placeholder="Notes"
                  rows="2"
                ></textarea>
                <div class="flex gap-2">
                  <input 
                    type="number" 
                    class="input input-sm input-bordered flex-1" 
                    bind:value={editingRestaurant.rating}
                    placeholder="Rating (1-5)"
                    min="1"
                    max="5"
                    step="0.1"
                  />
                  <select class="select select-sm select-bordered flex-1" bind:value={editingRestaurant.price_range}>
                    <option value="$">$</option>
                    <option value="$$">$$</option>
                    <option value="$$$">$$$</option>
                    <option value="$$$$">$$$$</option>
                  </select>
                </div>
                <div class="flex gap-2">
                  <button 
                    class="btn btn-sm btn-primary flex-1"
                    on:click={() => updateRestaurant(editingRestaurant)}
                  >
                    Save
                  </button>
                  <button 
                    class="btn btn-sm btn-ghost flex-1"
                    on:click={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {:else}
              <!-- View Mode -->
              <div class="space-y-0">
                <div class="flex items-start gap-1.5">
                  <h3 class="font-semibold text-base flex-1">{restaurant.name}</h3>
                  <div class="flex gap-0 -mr-1">
                    <button 
                      class="text-gray-600 hover:text-gray-800 p-0.5 mr-1 -ml-2"
                      on:click={() => startEdit(restaurant)}
                    >
                      <Edit class="h-5 w-5" />
                    </button>
                    <button 
                      class="text-error hover:text-error-focus p-0.5"
                      on:click={() => deleteRestaurant(restaurant.id)}
                    >
                      <Trash2 class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <!-- Map link and stars on second line -->
                <div class="flex items-center justify-between">
                  {#if restaurant.rating}
                    <div class="flex items-center gap-1">
                      <Star class="h-3 w-3 text-yellow-500 fill-current" />
                      <span class="text-sm">{restaurant.rating}</span>
                    </div>
                  {:else}
                    <div></div>
                  {/if}
                  {#if restaurant.address}
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(restaurant.address)}" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-primary hover:text-primary-focus p-0.5 w-14 flex items-center"
                      title="Open in Google Maps"
                    >
                      <Map class="h-5 w-5" />&nbsp;<span class="text-sm">Map</span>
                    </a>
                  {/if}
                </div>

                <!-- Cuisine, Price Range, and Distance (always visible) -->
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  {#if restaurant.cuisine && restaurant.cuisine !== 'Restaurant'}
                    <span class="badge badge-outline">{restaurant.cuisine}</span>
                  {/if}
                  {#if restaurant.price_range}
                    <span class="badge badge-outline bg-green-50 text-green-700 border-green-200">{restaurant.price_range}</span>
                  {/if}
                  {#if restaurant.latitude && restaurant.longitude && $locationSearchParams.location}
                    {@const distance = calculateDistance($locationSearchParams.location.lat, $locationSearchParams.location.lng, restaurant.latitude, restaurant.longitude)}
                    {#if distance}
                      <span class="badge badge-outline bg-blue-50 text-blue-700 border-blue-200">{distance}</span>
                    {/if}
                  {:else if restaurant.latitude && restaurant.longitude}
                    <!-- Show distance from last known location if available -->
                    <span class="badge badge-outline bg-gray-50 text-gray-600 border-gray-200">Location needed</span>
                  {/if}
                </div>
                
                <!-- Details Accordion -->
                <div>
                  <button 
                    class="w-full flex items-center justify-between p-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    on:click={() => toggleDetails(restaurant.id)}
                  >
                    <div class="flex items-center gap-2">
                      <MapPin class="h-4 w-4" />
                      <span class="font-medium">
                        {#if restaurant.address}
                          {@const firstLine = restaurant.address.split(',')[0]}
                          {firstLine}
                        {:else}
                          Details
                        {/if}
                      </span>
                    </div>
                    {#if expandedDetails.has(restaurant.id)}
                      <ChevronUp class="h-4 w-4" />
                    {:else}
                      <ChevronDown class="h-4 w-4" />
                    {/if}
                  </button>
                  
                  {#if expandedDetails.has(restaurant.id)}
                    <div class="px-2 pb-2">
                      <div class="pt-1 space-y-2">
                        <!-- Address -->
                        {#if restaurant.address}
                          {@const addressParts = restaurant.address.split(',')}
                          {#if addressParts.length > 1}
                            <div class="flex items-start gap-2 text-sm text-gray-600">
                              <div class="h-4 w-4 flex-shrink-0"></div>
                              <span class="flex-1">{addressParts.slice(1).join(',').trim()}</span>
                            </div>
                          {/if}
                        {/if}

                        <!-- Phone -->
                        {#if restaurant.phone}
                          <div class="flex items-center gap-2 text-sm text-gray-600">
                            <Phone class="h-4 w-4" />
                            <span>{restaurant.phone}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>


                  {#if (restaurant.current_opening_hours && restaurant.current_opening_hours.length > 0) || (restaurant.opening_hours && restaurant.opening_hours.length > 0)}
                  <div>
                    <button 
                      class="w-full flex items-center justify-between p-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      on:click={() => toggleHours(restaurant.id)}
                    >
                      <div class="flex items-center gap-2">
                        <Clock class="h-4 w-4" />
                        <span class="font-medium">
                          Hours: 
                          {#if restaurant.current_opening_hours && restaurant.current_opening_hours.length > 0}
                            {@const currentHours = restaurant.current_opening_hours[0]}
                            {#if currentHours.toLowerCase().includes('closed')}
                              Closed
                            {:else if currentHours.toLowerCase().includes('open')}
                              {currentHours}
                            {:else}
                              {currentHours}
                            {/if}
                          {:else if restaurant.opening_hours && restaurant.opening_hours.length > 0}
                            {@const todayHours = getTodayHours(restaurant.opening_hours)}
                            {#if todayHours}
                              {todayHours}
                            {:else}
                              See schedule
                            {/if}
                          {:else}
                            See schedule
                          {/if}
                        </span>
                      </div>
                      {#if expandedHours.has(restaurant.id)}
                        <ChevronUp class="h-4 w-4" />
                      {:else}
                        <ChevronDown class="h-4 w-4" />
                      {/if}
                    </button>
                    
                    {#if expandedHours.has(restaurant.id)}
                      <div class="px-2 pb-2">
                        <div class="pt-2 space-y-1">
                          {#if restaurant.current_opening_hours && restaurant.current_opening_hours.length > 0}
                            {#each restaurant.current_opening_hours as hours}
                              <div class="text-xs text-gray-600">{hours}</div>
                            {/each}
                          {:else if restaurant.opening_hours && restaurant.opening_hours.length > 0}
                            {#each restaurant.opening_hours as hours}
                              <div class="text-xs text-gray-600">{hours}</div>
                            {/each}
                          {/if}
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if restaurant.notes}
                  <p class="text-sm text-gray-600 mt-2">{restaurant.notes}</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {/if}
  </div>
</div>

<!-- Add Restaurant Modal -->
{#if showAddModal}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-24 sm:mt-28 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
      <div class="flex items-center h-8 m-0">
        <h3 class="flex-1 font-bold text-lg mt-0">Add Restaurant</h3>
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

