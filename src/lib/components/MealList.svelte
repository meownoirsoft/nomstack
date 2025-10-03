<script>
    import Checkbox from '$lib/components/Checkbox.svelte';
    import EditModal from '$lib/components/EditModal.svelte';
    import SocialIcon from '$lib/components/SocialIcon.svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    import { Edit, Check, Plus } from 'lucide-svelte';

    const LUNCH_FLAG = 'lunch';
    const DINNER_FLAG = 'dinner';

    export let meals = [];
    export let sels = [];
    export let cats = [];
    export let srcs = [];
    export let page;

    let selectedItems = parseIds(sels);
    let selectedCats = [];
    let showModal = false;
    let mealToEdit = null;
    let modalCats = Array.isArray(cats) ? cats : [];
    let lastSelsSnapshot = Array.isArray(sels) ? sels.join(',') : String(sels ?? '');
    let displayMeals = [];

    $: modalCats = Array.isArray(cats) ? cats : [];

    $: {
      const signature = Array.isArray(sels) ? sels.join(',') : String(sels ?? '');
      if (signature !== lastSelsSnapshot) {
        selectedItems = parseIds(sels);
        lastSelsSnapshot = signature;
      }
    }

    $: displayMeals = filterMealsByPage(meals, page);

    function toIdList(items) {
      if (!Array.isArray(items)) {
        return [];
      }
      return items
        .map((item) => (typeof item === 'object' ? item?.id : item))
        .map((value) => (value == null ? '' : String(value).trim()))
        .filter((value) => value.length > 0);
    }

    function filterMealsByPage(list, currentPage) {
      if (!Array.isArray(list)) {
        return [];
      }
      if (currentPage === 'lunch') {
        return list.filter((meal) => hasFlag(meal, LUNCH_FLAG));
      }
      if (currentPage === 'dinner') {
        return list.filter((meal) => hasFlag(meal, DINNER_FLAG));
      }
      return list;
    }

    function parseIds(value) {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return toIdList(value);
      }
      return String(value)
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }

    function hasFlag(meal, flag) {
      return Array.isArray(meal?.flags) && meal.flags.includes(flag);
    }

    function openModal(meal) {
      mealToEdit = meal ? { ...meal } : null;
      const catIds = parseIds(meal?.cats);
      const flags = Array.isArray(meal?.flags) ? meal.flags : [];
      selectedCats = [...catIds, ...flags];
      showModal = true;
    }

    function handleModalClose() {
      showModal = false;
      mealToEdit = null;
      selectedCats = [];
    }

    function clearAll(){
      const previous = selectedItems;
      selectedItems = [];
      updateSelections(selectedItems, previous);
    }

    async function updateSelections(items, previousItems = selectedItems, { successMessage } = {}) {
      const ids = toIdList(items);

      try {
        const result = await api.updateSelections(page, ids);
        
        if (result.success) {
          selectedItems = ids;
          if (successMessage) {
            notifySuccess(successMessage);
          }
        } else {
          throw new Error(result.error || 'Failed to update selections');
        }
      } catch (error) {
        console.error('Error updating selections:', error);
        selectedItems = previousItems;
        notifyError(error.message || 'Unable to save selections. Please try again.');
      }
    }

    function handleMealSave(event) {
      const updatedMeal = event.detail?.meal;
      if (!updatedMeal) {
        return;
      }

      meals = meals.map((meal) =>
        meal.id === updatedMeal.id ? { ...meal, ...updatedMeal } : meal
      );
    }

    async function handleMealDelete(event) {
      const mealId = event.detail?.id;
      if (!mealId) {
        return;
      }

      meals = meals.filter((meal) => meal.id !== mealId);
      const previous = selectedItems;
      selectedItems = selectedItems.filter((id) => id !== mealId);
      await updateSelections(selectedItems, previous, { successMessage: 'Meal removed from selection.' });
    }
  </script>
    
  <main class="flex flex-col min-h-auto gap-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-primary/70">checked = meal plan</p>
      <div class="flex items-center gap-2">
        <button class="btn btn-xs sm:btn-sm btn-ghost text-primary" on:click={clearAll}>
          <Check class="h-4 w-4" /> Clear checks
        </button>
        <button class="btn btn-sm btn-primary text-white shadow-sm" on:click={() => showModal = true}>
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">Add meal</span>
          <span class="sm:hidden">New</span>
        </button>
      </div>
    </div>
    <div class="scroller flex-grow overflow-y-auto pr-1 min-h-[15rem]">
      <ul class="space-y-3">
        {#each displayMeals as meal}
          <li class="w-full">
            <div class="flex items-center gap-3 rounded-xl bg-base-100 pl-4 pr-3 py-3 shadow-sm border border-base-200">
              <Checkbox type="sels" label={meal.name} value={meal.id} {page} bind:selectedItems lblClass="font-medium text-primary" />
              <div class="ml-auto flex items-center gap-1 text-sm text-primary/70">
                <SocialIcon icon={meal.source} />
                <span
                  class="w-3 text-center font-semibold"
                  class:opacity-0={!hasFlag(meal, LUNCH_FLAG)}
                >L</span>
                <span
                  class="w-3 text-center font-semibold"
                  class:opacity-0={!hasFlag(meal, DINNER_FLAG)}
                >D</span>
                <button
                  class="text-primary hover:text-primary-focus focus:outline-none p-0 h-6 w-6 flex items-center justify-center"
                  on:click={() => openModal(meal)}
                >
                  <Edit class="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
    {#if showModal}
      <EditModal
        {showModal}
        meal={mealToEdit}
        {selectedCats}
        cats={modalCats}
        {srcs}
        on:close={handleModalClose}
        on:save={handleMealSave}
        on:delete={handleMealDelete}
      />
    {/if}
  </main>
