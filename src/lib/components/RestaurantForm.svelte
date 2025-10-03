<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let restaurant = {
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    notes: '',
    rating: '',
    price_range: '$$'
  };

  function handleSubmit() {
    if (!restaurant.name.trim()) {
      return;
    }
    
    const restaurantData = {
      ...restaurant,
      rating: restaurant.rating ? parseFloat(restaurant.rating) : null
    };
    
    dispatch('save', restaurantData);
  }
</script>

<div class="restaurant-form">
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Restaurant Name *</span>
      </label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={restaurant.name}
        placeholder="e.g., Mario's Pizza"
        required
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Cuisine</span>
        </label>
        <input 
          type="text" 
          class="input input-bordered" 
          bind:value={restaurant.cuisine}
          placeholder="e.g., Italian"
        />
      </div>
      
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Price Range</span>
        </label>
        <select class="select select-bordered" bind:value={restaurant.price_range}>
          <option value="$">$ (Budget)</option>
          <option value="$$">$$ (Moderate)</option>
          <option value="$$$">$$$ (Expensive)</option>
          <option value="$$$$">$$$$ (Very Expensive)</option>
        </select>
      </div>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Address</span>
      </label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={restaurant.address}
        placeholder="e.g., 123 Main St, Downtown"
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Phone</span>
      </label>
      <input 
        type="tel" 
        class="input input-bordered" 
        bind:value={restaurant.phone}
        placeholder="e.g., (555) 123-4567"
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Rating (1-5)</span>
      </label>
      <input 
        type="number" 
        class="input input-bordered" 
        bind:value={restaurant.rating}
        placeholder="4.5"
        min="1"
        max="5"
        step="0.1"
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Notes</span>
      </label>
      <textarea 
        class="textarea textarea-bordered" 
        bind:value={restaurant.notes}
        placeholder="Any additional notes about this restaurant..."
        rows="3"
      ></textarea>
    </div>

    <div class="flex gap-3 pt-4">
      <button type="submit" class="btn btn-primary flex-1">
        Add Restaurant
      </button>
      <button type="button" class="btn btn-ghost flex-1" on:click={() => dispatch('cancel')}>
        Cancel
      </button>
    </div>
  </form>
</div>


