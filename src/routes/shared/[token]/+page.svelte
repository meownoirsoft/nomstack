<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { 
    ShoppingCart, 
    Plus, 
    MessageSquare, 
    Send, 
    CheckCircle, 
    Circle,
    Store,
    HelpCircle,
    X
  } from 'lucide-svelte';

  let shareData = null;
  let ingredients = [];
  let loading = true;
  let error = null;
  let newItemName = '';
  let newItemQuantity = '';
  let addingItem = false;
  let newComments = {};
  let commenterInitials = '';
  let userInitials = '';
  let initialsSet = false;

  $: token = $page.params.token;

  onMount(async () => {
    await loadSharedList();
    // Check if initials are already set in localStorage
    if (browser) {
      const stored = localStorage.getItem(`shared-initials-${token}`);
      if (stored) {
        userInitials = stored;
        initialsSet = true;
      }
    }
  });

  function setInitials() {
    if (!userInitials.trim()) {
      notifyError('Please enter your initials');
      return;
    }
    if (userInitials.length > 5) {
      notifyError('Initials must be 5 characters or less');
      return;
    }
    
    initialsSet = true;
    if (browser) {
      localStorage.setItem(`shared-initials-${token}`, userInitials.trim());
    }
    notifySuccess('Initials saved! You can now add items and comments.');
  }

  async function loadSharedList() {
    try {
      loading = true;
      error = null;
      
      const result = await api.getSharedShoppingList(token);
      if (result.success) {
        shareData = result.data;
        ingredients = result.data.ingredients || [];
        
        // Load any existing shared items from localStorage
        if (browser) {
          const localStorageKey = `shared-items-${token}`;
          console.log('Looking for shared items with key:', localStorageKey);
          const storedItems = localStorage.getItem(localStorageKey);
          console.log('Stored items from localStorage:', storedItems);
          if (storedItems) {
            try {
              const parsedItems = JSON.parse(storedItems);
              console.log('Parsed shared items:', parsedItems);
              ingredients = [...ingredients, ...parsedItems];
              console.log('Updated ingredients with shared items:', ingredients);
            } catch (e) {
              console.error('Error parsing stored shared items:', e);
            }
          } else {
            console.log('No stored shared items found');
          }
        }
      } else {
        error = result.error;
      }
    } catch (err) {
      console.error('Error loading shared list:', err);
      error = err.message || 'Failed to load shopping list';
    } finally {
      loading = false;
    }
  }

  async function addItem() {
    if (!newItemName.trim()) {
      notifyError('Please enter an item name');
      return;
    }

    try {
      addingItem = true;
      const itemData = {
        name: newItemName.trim(),
        quantity: newItemQuantity.trim() || null,
        created_by: userInitials.trim()
      };
      console.log('Adding item with data:', itemData);
      console.log('User initials:', userInitials);
      
      const result = await api.addItemToSharedList(token, itemData);
      console.log('Add item API result:', result);
      
      if (result.success) {
        console.log('Item added successfully, result data:', result.data);
        // Mark the item as a shared item
        const sharedItem = {
          ...result.data,
          type: 'shared_item'
        };
        console.log('Adding shared item:', sharedItem);
        
        // Update ingredients array with proper reactivity
        ingredients = [...ingredients, sharedItem];
        console.log('Updated ingredients array:', ingredients);
        
        // Save to localStorage
        if (browser) {
          const sharedItems = ingredients.filter(ingredient => ingredient.type === 'shared_item');
          localStorage.setItem(`shared-items-${token}`, JSON.stringify(sharedItems));
          console.log('Saved shared items to localStorage:', sharedItems);
        }
        
        newItemName = '';
        newItemQuantity = '';
        notifySuccess('Item added to shopping list!');
      } else {
        console.error('Add item failed:', result.error);
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error adding item:', err);
      notifyError('Failed to add item');
    } finally {
      addingItem = false;
    }
  }

  async function addComment(ingredientId) {
    const comment = newComments[ingredientId];
    if (!comment?.trim()) {
      notifyError('Please enter a comment');
      return;
    }

    try {
      const result = await api.addCommentToSharedList(token, ingredientId, comment.trim(), userInitials.trim());
      if (result.success) {
        // Update the ingredient with the new comment
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (ingredient) {
          if (!ingredient.comments) ingredient.comments = [];
          ingredient.comments.push(result.data);
        }
        newComments[ingredientId] = '';
        notifySuccess('Comment added!');
      } else {
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      notifyError('Failed to add comment');
    }
  }

  async function removeComment(commentId) {
    try {
      // Call API to delete the comment from the database
      const result = await api.deleteSharedComment(token, commentId);
      
      if (result.success) {
        // Remove it from the local state
        ingredients = ingredients.map(ingredient => {
          if (ingredient.comments) {
            ingredient.comments = ingredient.comments.filter(comment => comment.id !== commentId);
          }
          return ingredient;
        });
        notifySuccess('Comment removed');
      } else {
        notifyError(result.error || 'Failed to remove comment');
      }
    } catch (err) {
      console.error('Error removing comment:', err);
      notifyError('Failed to remove comment');
    }
  }

  async function removeItem(ingredientId) {
    try {
      // Call API to delete the item from the database
      const result = await api.deleteSharedItem(token, ingredientId);
      
      if (result.success) {
        // Remove the item from the local state
        ingredients = ingredients.filter(ingredient => ingredient.id !== ingredientId);
        
        // Update localStorage
        if (browser) {
          const sharedItems = ingredients.filter(ingredient => ingredient.type === 'shared_item');
          localStorage.setItem(`shared-items-${token}`, JSON.stringify(sharedItems));
          console.log('Updated shared items in localStorage:', sharedItems);
        }
        
        notifySuccess('Item removed');
      } else {
        notifyError(result.error || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      notifyError('Failed to remove item');
    }
  }

  function getIngredientCount() {
    return ingredients.length;
  }

  function getCommentsCount() {
    return ingredients.reduce((count, ingredient) => {
      return count + (ingredient.comments?.length || 0);
    }, 0);
  }
</script>

<svelte:head>
  <title>Shared Shopping List - nomStack</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-gray-600">Loading shopping list...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-500 text-lg mb-4">⚠️</div>
        <p class="text-red-600 mb-4">{error}</p>
        <button class="btn btn-primary" on:click={loadSharedList}>Try Again</button>
      </div>
    </div>
  {:else if !shareData}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-500 text-lg mb-4">🔒</div>
        <p class="text-red-600 mb-4">This shopping list is no longer available</p>
      </div>
    </div>
  {:else}
    <!-- Meal Plan Info -->
    <div class="bg-gray-50 border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <span class="font-medium">{shareData.meal_plan_title}</span>
          <span>•</span>
          <span>{getCommentsCount()} comments</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Initials Setup -->
      {#if !initialsSet}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <MessageSquare class="h-5 w-5" />
            Set Your Initials (Required)
          </h2>
          <div class="flex gap-3">
            <input
              type="text"
              placeholder="Your initials (e.g., 'JS', 'Mom', 'Dad')"
              bind:value={userInitials}
              class="input input-bordered w-48"
              maxlength="5"
              on:keydown={(e) => e.key === 'Enter' && setInitials()}
            />
            <button
              class="btn btn-primary"
              on:click={setInitials}
              disabled={!userInitials.trim()}
            >
              Save Initials
            </button>
          </div>
        </div>
      {:else}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-2 -mt-4">
          <div class="flex items-center gap-2">
            <span class="bg-primary text-white text-sm font-medium px-2 py-1 rounded-full">
              {userInitials}
            </span>
            <span class="text-green-700 text-sm">You're signed in as {userInitials}</span>
          </div>
        </div>
      {/if}

      <!-- Add Item Form -->
      {#if initialsSet}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-1 -mt-2 flex items-center">
            <Plus class="h-5 w-5 text-primary" />
            Add Item to List
          </h2>
          <div class="space-y-2 sm:space-y-0 sm:flex sm:gap-3">
            <input
              type="text"
              placeholder="Item name (e.g., milk, bread, apples)"
              bind:value={newItemName}
              class="input input-bordered w-full sm:flex-1"
              on:keydown={(e) => e.key === 'Enter' && addItem()}
            />
            <div class="flex gap-3">
              <input
                type="text"
                placeholder="Quantity (optional)"
                bind:value={newItemQuantity}
                class="input input-bordered flex-1 w-24"
                on:keydown={(e) => e.key === 'Enter' && addItem()}
              />
              <button
                class="btn btn-primary flex-shrink-0"
                on:click={addItem}
                disabled={addingItem || !newItemName.trim()}
              >
                {#if addingItem}
                  <div class="loading loading-spinner loading-xs"></div>
                {:else}
                  <Plus class="h-4 w-4" />
                {/if}
                <span class="sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Items You've Added -->
      <!-- Debug: {JSON.stringify(ingredients)} -->
      <!-- Debug: Shared items count: {ingredients.filter(ingredient => ingredient.type === 'shared_item').length} -->
      {#if ingredients.filter(ingredient => ingredient.type === 'shared_item').length > 0}
        <div class="mt-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Items You've Added</h3>
          <div class="space-y-2">
            {#each ingredients.filter(ingredient => ingredient.type === 'shared_item') as ingredient}
              <div class="bg-blue-50 p-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">
                      {#if ingredient.quantity}
                        {ingredient.quantity} {ingredient.name}
                      {:else}
                        {ingredient.name}
                      {/if}
                    </span>
                  </div>
                  <button
                    class="text-gray-400 hover:text-red-500"
                    on:click={() => removeItem(ingredient.id)}
                    title="Remove item"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Shopping List -->
      {#if ingredients.length === 0}
        <div class="text-center py-12">
          <HelpCircle class="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No items yet</h3>
          <p class="text-gray-600">Add items above to get started!</p>
        </div>
      {:else}
        <div class="space-y-2 mt-4">
          <strong>Ingredients</strong>
          {#each ingredients as ingredient}
            <div class="bg-white rounded-lg shadow-sm py-1 px-2">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-medium text-gray-900">{ingredient.name}</h3>
                    {#if ingredient.quantity}
                      <span class="text-sm text-gray-500">({ingredient.quantity})</span>
                    {/if}
                  </div>

                  <!-- Comments -->
                  {#if ingredient.comments && ingredient.comments.length > 0}
                    <div class="space-y-1 mb-2">
                      {#each ingredient.comments as comment}
                        <div class="bg-blue-50 rounded-lg p-2">
                          <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700">
                              <span class="font-medium">You said:</span> {comment.comment}
                            </p>
                            <button
                              class="text-gray-400 hover:text-red-500 ml-2"
                              on:click={() => removeComment(comment.id)}
                              title="Remove comment"
                            >
                              <X class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}

                  <!-- Add Comment -->
                  {#if initialsSet}
                    <div class="flex gap-1">
                      <input
                        type="text"
                        placeholder="Add a comment (e.g., 'we need 3 milk', 'out of eggs')"
                        bind:value={newComments[ingredient.id]}
                        class="input input-bordered input-sm flex-1"
                        maxlength="255"
                        on:keydown={(e) => e.key === 'Enter' && addComment(ingredient.id)}
                      />
                      <button
                        class="btn btn-ghost text-primary btn-sm"
                        on:click={() => addComment(ingredient.id)}
                        disabled={!newComments[ingredient.id]?.trim()}
                      >
                        <Send class="h-5 w-5" />
                      </button>
                    </div>
                  {:else}
                    <div class="text-sm text-gray-500 italic">
                      Set your initials above to add comments
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Footer Info -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>Info is shared with the list owner in real-time.</p>
        <p>Thank you for sharing!</p>
      </div>

    </div>
  {/if}
</div>
