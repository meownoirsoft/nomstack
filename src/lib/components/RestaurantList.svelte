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
  import DeciderTab from './DeciderTab.svelte';
  import NearbyNomsTab from './NearbyNomsTab.svelte';

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

<div class="restaurant-list h-full flex flex-col">
  <!-- Tab Navigation -->
  <div class="flex border-b border-gray-200">
    <button
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'decider' ? 'border-primary text-primary' : 'border-transparent text-primary/60 hover:text-primary/80'}"
      on:click={() => activeTab = 'decider'}
    >
      Decider
    </button>
    <button
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'my-noms' ? 'border-primary text-primary' : 'border-transparent text-primary/60 hover:text-primary/80'}"
      on:click={() => activeTab = 'my-noms'}
    >
      My Noms
    </button>
  </div>

  <!-- Tab Content -->
  <div class="mt-1 flex-1 flex flex-col min-h-0">
    {#if activeTab === 'decider'}
       <!-- Decider Tab -->
       <DeciderTab 
         {restaurants}
         {isDeciding}
         {randomRestaurant}
         {selectRandomRestaurant}
         {clearRandomSelection}
       />
    {:else if activeTab === 'my-noms'}
      <!-- Nearby Noms Tab -->
      <NearbyNomsTab 
        {restaurants}
        {loading}
        {error}
        {showAddModal}
        {editingRestaurant}
        {searchResults}
        {expandedHours}
        {expandedDetails}
        {searchLoading}
        {selectedRestaurant}
        {addRestaurant}
        {updateRestaurant}
        {deleteRestaurant}
        {selectRestaurant}
        {addSelectedRestaurant}
        {cancelSelection}
        {performSearch}
      />
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

