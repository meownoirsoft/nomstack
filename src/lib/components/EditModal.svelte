<script>
    import Checkbox from './Checkbox.svelte';
    import { X, XCircle, CheckCircle, ChevronDown, ChevronUp, ChefHat, Plus } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    import RecipeEditor from './RecipeEditor.svelte';
    import RecipeViewer from './RecipeViewer.svelte';
    import PayGate from './PayGate.svelte';
    import { subscriptionStatus, needsUpgradeForLimit } from '$lib/stores/userTier.js';
    const dispatch = createEventDispatcher();

    const LUNCH_FLAG = 'lunch';
    const DINNER_FLAG = 'dinner';
    const FLAG_SET = new Set([LUNCH_FLAG, DINNER_FLAG]);

    let saveSuccessClass = 'hidden';
    let saveErrorClass = 'hidden';
    let showCats = false;
    let showNotes = false;
    
    // New category variables
    let newCategoryName = '';
    let showAddCategory = false;
    let addingCategory = false;

    export let showModal;
    export let meal;
    export let selectedCats = [];
    export let cats = [];
    export let srcs = [];

    let name = '';
    let source = '';
    let notes = '';
    let selectedItems = [];
    let lastMealId;
    let lastSelectedSnapshot = '';
    let nameTouched = false;
    let nameError = '';
    let nameIsValid = false;
    
    // Recipe-related state
    let showRecipeEditor = false;
    let showRecipeViewer = false;
    let currentRecipe = null;
    let totalRecipes = 0; // Will be loaded from API

    function normalizeSelection(values) {
        if (!Array.isArray(values)) {
            return [];
        }
        return values
            .map((value) => (typeof value === 'object' ? value?.id : value))
            .map((value) => (value == null ? '' : String(value).trim()))
            .filter((value) => value.length > 0);
    }

    $: if (meal?.id !== lastMealId) {
        lastMealId = meal?.id;
        name = meal?.name ?? '';
        source = meal?.source ?? '';
        notes = meal?.notes ?? '';
        nameTouched = false;
        nameError = '';
        // Load recipe count when meal changes
        if (meal?.id) {
            loadRecipeCount();
        }
    }

    $: {
        const signature = Array.isArray(selectedCats) ? selectedCats.join(',') : '';
        if (signature !== lastSelectedSnapshot) {
            selectedItems = normalizeSelection(selectedCats);
            lastSelectedSnapshot = signature;
        }
    }

    $: nameIsValid = name.trim().length > 0;
    $: if (nameTouched) {
        nameError = nameIsValid ? '' : 'Enter a meal name.';
    }
    
    function closeModal() {
        nameTouched = false;
        nameError = '';
        dispatch('close'); // Notify the parent that the modal is closing
    }

    function toggleCats(){
        showCats = !showCats;
    }

    function toggleNotes(){
        showNotes = !showNotes;
    }

    function toggleAddCategory() {
        showAddCategory = !showAddCategory;
        if (!showAddCategory) {
            newCategoryName = '';
        }
    }

    async function addNewCategory() {
        if (!newCategoryName.trim()) return;
        
        addingCategory = true;
        try {
            const result = await api.addCategory({
                name: newCategoryName.trim()
            });
            
            // Store the name for the success message before clearing
            const categoryName = newCategoryName.trim();
            
            // Add the new category to the list
            cats = [...cats, { id: result.data.id, name: categoryName }]
                .sort((a, b) => a.name.localeCompare(b.name));
            
            // Automatically select the new category
            selectedItems = [...selectedItems, String(result.data.id)];
            
            // Clear the input and hide the form
            newCategoryName = '';
            showAddCategory = false;
            
            notifySuccess(`Category "${categoryName}" added successfully!`);
            
        } catch (error) {
            console.error('Error adding category:', error);
            notifyError('Failed to add category. Please try again.');
        } finally {
            addingCategory = false;
        }
    }

    function cancelAddCategory() {
        newCategoryName = '';
        showAddCategory = false;
    }
    
    function buildCatsArray(values) {
        const unique = new Set(normalizeSelection(values));
        return Array.from(unique);
    }

    function showError() {
        saveErrorClass = '';
        setTimeout(() => {
            saveErrorClass = 'hidden';
        }, 2000);
    }

    async function updateMeal(){
        nameTouched = true;
        if (!nameIsValid) {
            nameError = 'Enter a meal name.';
            return;
        }

        const payload = {
            name: name.trim(),
            source,
            cats: buildCatsArray(selectedItems),
            notes: notes.trim()
        };

        // Add meal ID if editing existing meal
        if (meal && meal.id) {
            payload.id = meal.id;
        }

        try {
            let result;
            if (meal && meal.id) {
                // Update existing meal
                result = await api.updateMeal(payload);
            } else {
                // Add new meal
                result = await api.addMeal(payload);
            }
            
            if (result.success) {
                saveSuccessClass = '';
                dispatch('save', { meal: result.meal || payload });
                notifySuccess(meal && meal.id ? 'Meal updated successfully.' : 'Meal added successfully.');
                setTimeout(() => {
                    saveSuccessClass = 'hidden';
                    closeModal();
                }, 1200);
            } else {
                const message = result.error || (meal && meal.id ? 'Unable to update meal.' : 'Unable to add meal.');
                console.error('Error saving meal:', message);
                notifyError(message);
                showError();
            }
        } catch (error) {
            console.error('Failed to save meal:', error);
            notifyError(meal && meal.id ? 'Unable to update meal. Please try again.' : 'Unable to add meal. Please try again.');
            showError();
        }
    }

    async function confirmDelete(){
        const confirmDelete = confirm('This meal will be deleted from all views. Are you sure?');
        if (confirmDelete) {
            await deleteMeal();
        }
    }

    async function deleteMeal(){
        if (!meal) {
            return;
        }

        try {
            const result = await api.deleteMeal(meal.id);
            
            if (result.success) {
                saveSuccessClass = '';
                dispatch('delete', { id: meal.id });
                notifySuccess('Meal deleted.');
                setTimeout(() => {
                    saveSuccessClass = 'hidden';
                    closeModal();
                }, 1200);
            } else {
                const message = result.error || 'Unable to delete meal.';
                console.error('Error deleting row:', message);
                notifyError(message);
                showError();
            }
        } catch (error) {
            console.error('Failed to delete meal:', error);
            notifyError('Unable to delete meal. Please try again.');
            showError();
        }
    }

    // Load total recipe count for limit checking
    async function loadRecipeCount() {
        try {
            const result = await api.getMeals('all');
            if (result && Array.isArray(result)) {
                // Count meals that have recipes
                let count = 0;
                for (const meal of result) {
                    try {
                        const recipeResult = await api.getRecipe(meal.id);
                        if (recipeResult && recipeResult.recipe) {
                            count++;
                        }
                    } catch (error) {
                        // Recipe doesn't exist, that's fine
                    }
                }
                totalRecipes = count;
            }
        } catch (error) {
            console.error('Error loading recipe count:', error);
            totalRecipes = 0;
        }
    }

    // Recipe functions. Always opens the viewer — the viewer itself handles
    // the "no recipe yet" empty state with an Add Recipe button. We only
    // surface a toast on actual server/network failures.
    async function openRecipeViewer() {
        try {
            const result = await api.getRecipe(meal.id);
            // Tolerate both the current ({ success, recipe }) and legacy
            // (recipe object directly) response shapes.
            currentRecipe = result?.recipe !== undefined ? result.recipe : (result || null);
            showRecipeViewer = true;
        } catch (error) {
            console.error('Error loading recipe:', error);
            // 404/no-row → just open the viewer in its empty state.
            const msg = error?.message || '';
            if (msg.includes('404') || msg.toLowerCase().includes('not found') || msg.includes('PGRST116')) {
                currentRecipe = null;
                showRecipeViewer = true;
                return;
            }
            notifyError('Failed to load recipe');
        }
    }

    async function openRecipeEditor(recipe = null) {
        currentRecipe = recipe;
        showRecipeEditor = true;
    }

    function closeRecipeEditor() {
        showRecipeEditor = false;
        currentRecipe = null;
    }

    function closeRecipeViewer() {
        showRecipeViewer = false;
        currentRecipe = null;
    }

    function handleRecipeSaved(event) {
        currentRecipe = event.detail.recipe;
        closeRecipeEditor();
        notifySuccess('Recipe saved!');
    }

    function handleRecipeDeleted(event) {
        currentRecipe = null;
        closeRecipeViewer();
        notifySuccess('Recipe deleted');
    }

    function handleEditRecipe() {
        showRecipeViewer = false;
        openRecipeEditor(currentRecipe);
    }
</script>
{#if showModal}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-12 sm:mt-16 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-base-200 px-4 py-4">
            <div class="flex items-center m-0 h-8">
                <h3 class="flex-1 font-bold text-lg">{meal && meal.id ? 'Edit Meal' : 'Add Meal'}</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0"><X /></button>
                </div>
            </div>
            <!-- NAME -->
            <small class="font-bold m-0 pb-0">Name</small>
            <input
              id="meal_name"
              type="text"
              class="input input-bordered input-sm w-full max-w-xs"
              class:input-error={!nameIsValid && nameTouched}
              placeholder="Meal Name"
              bind:value={name}
              on:blur={() => (nameTouched = true)}
              aria-invalid={!nameIsValid && nameTouched}
              aria-describedby={nameError ? 'edit_meal_name_error' : undefined}
            />
            {#if nameError}
              <p id="edit_meal_name_error" class="mt-1 text-xs text-error" role="alert">{nameError}</p>
            {/if}
            <!-- SOURCE -->
            <small class="font-bold m-0 pb-0">Source</small>
            <select id="meal_source" class="w-full select select-bordered select-sm max-w-xs" bind:value={source}>
                <option value="">-- Select Source --</option>
                {#each srcs as src}
                    <option value={src.abbrev}>{src.name}</option>
                {/each}
            </select>
            <!-- L/D -->
            <label class="flex items-center justify-between mx-2 mt-2 mb-4 text-sm text-primary">
                <Checkbox label="Lunch?" value={LUNCH_FLAG} bind:selectedItems lblClass="font-medium" />
                <Checkbox label="Dinner?" value={DINNER_FLAG} bind:selectedItems lblClass="font-medium" />
            </label>
            <!-- CATS -->
            <div class="categories">
                <button class="flex w-full items-center justify-between mt-2 my-3" on:click={toggleCats}>
                    <div class="flex-5">
                        <div class="text-md font-bold m-0 pb-0">
                            Categories
                            {selectedItems?.filter((item) => !FLAG_SET.has(item)).length > 0
                                ? `(${selectedItems.filter((item) => !FLAG_SET.has(item)).length})`
                                : ''}
                        </div>
                    </div>
                    {#if showCats}
                        <div class="ml-auto"><ChevronUp /></div>
                    {:else}
                        <div class="ml-auto"><ChevronDown /></div>
                    {/if}
                </button>
                <div class={showCats ? 'cats-shown' : 'hidden'}>
                    <div class="overflow-y-scroll h-40"> 
                        {#each cats as cat}
                            <Checkbox label={cat.name} value={cat.id} bind:selectedItems lblClass="text-sm text-primary" />
                        {/each}
                    </div>
                    
                    <!-- Add Category Section - Outside scroll area -->
                    <div class="border-t border-base-300 pt-2 mt-2">
                        {#if showAddCategory}
                            <div class="flex items-center gap-2 mb-2">
                                <input 
                                    type="text" 
                                    class="input input-sm input-bordered flex-1" 
                                    placeholder="New category name"
                                    bind:value={newCategoryName}
                                    on:keydown={(e) => e.key === 'Enter' && addNewCategory()}
                                    disabled={addingCategory}
                                />
                                <button 
                                    class="btn btn-sm btn-success"
                                    on:click={addNewCategory}
                                    disabled={addingCategory || !newCategoryName.trim()}
                                >
                                    {#if addingCategory}
                                        <span class="loading loading-spinner loading-xs"></span>
                                    {:else}
                                        <CheckCircle class="h-4 w-4" />
                                    {/if}
                                </button>
                                <button 
                                    class="btn btn-sm btn-ghost"
                                    on:click={cancelAddCategory}
                                    disabled={addingCategory}
                                >
                                    <X class="h-4 w-4" />
                                </button>
                            </div>
                        {:else}
                            <button 
                                class="btn btn-sm btn-outline w-full"
                                on:click={toggleAddCategory}
                            >
                                <Plus class="h-4 w-4 mr-1" />
                                Add Category
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
            <!-- NOTES -->
            <div class="notes">
                <button class="flex w-full items-center justify-between mt-2 my-3" on:click={toggleNotes}>
                    <div class="flex-5"><div class="text-md font-bold m-0 pb-0">Notes</div></div>
                    {#if showNotes}
                        <div class="ml-auto"><ChevronUp /></div>
                    {:else}
                        <div class="ml-auto"><ChevronDown /></div>
                    {/if}
                </button>
                <div class={showNotes ? 'notes-shown' : 'hidden'}>
                    <textarea id="meal_notes" class="textarea textarea-bordered w-full m-0" rows="3" placeholder="add notes" bind:value={notes}></textarea>
                </div>
            </div>
            <div class="flex justify-between items-center gap-2">
                <button
                  class="btn btn-xs btn-ghost text-error underline"
                  on:click={confirmDelete}
                >Delete meal</button>
                {#if meal && meal.id}
                    <PayGate
                        resource="maxRecipes"
                        currentCount={totalRecipes}
                        showUpgradeButton={true}
                    >
                        <button
                            class="btn btn-sm btn-ghost text-primary underline pl-1"
                            on:click={openRecipeViewer}
                            title="View recipe"
                        >
                            <ChefHat class="h-5 w-5 -ml-1" />
                            Recipe
                        </button>
                    </PayGate>
                {/if}
                <button class="btn btn-sm btn-primary" on:click={updateMeal} disabled={!nameIsValid}>Save</button>
            </div>
    </div>
  </div>
{/if}

{#if saveSuccessClass === ''}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white">
    <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
  </div>
{/if}

{#if saveErrorClass === ''}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white">
    <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
  </div>
{/if}

<!-- Recipe Components -->
{#if showRecipeEditor && meal}
  <RecipeEditor
    mealId={meal.id}
    mealName={meal.name}
    recipe={currentRecipe}
    on:close={closeRecipeEditor}
    on:saved={handleRecipeSaved}
    on:deleted={handleRecipeDeleted}
  />
{/if}

{#if showRecipeViewer && meal}
  <RecipeViewer
    mealId={meal.id}
    mealName={meal.name}
    recipe={currentRecipe}
    on:close={closeRecipeViewer}
    on:edit={handleEditRecipe}
    on:deleted={handleRecipeDeleted}
  />
{/if}
