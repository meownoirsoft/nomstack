<script>
  import { Star } from 'lucide-svelte';
  
  export let restaurants = [];
  export let isDeciding = false;
  export let randomRestaurant = null;
  export let selectRandomRestaurant = () => {};
  export let clearRandomSelection = () => {};
</script>

<div class="text-center pt-6 pb-12">
  <img src="/no-drama-dinner-decider300.png" alt="No Drama Dinner Decider" class="mx-auto mb-6 max-w-xs" />
  
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
