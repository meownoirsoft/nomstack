<script>
    import Checkbox from './Checkbox.svelte';
    import { XMark, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
    import { createEventDispatcher } from 'svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    const dispatch = createEventDispatcher();

    const LUNCH_FLAG = 'lunch';
    const DINNER_FLAG = 'dinner';
    const FLAG_SET = new Set([LUNCH_FLAG, DINNER_FLAG]);

    let saveSuccessClass = 'hidden';
    let saveErrorClass = 'hidden';
    let showCats = false;
    let showNotes = false;

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
        if (!meal) {
            return;
        }

        nameTouched = true;
        if (!nameIsValid) {
            nameError = 'Enter a meal name.';
            return;
        }

        const payload = {
            id: meal.id,
            name: name.trim(),
            source,
            cats: buildCatsArray(selectedItems),
            notes: notes.trim()
        };

        try {
            const result = await api.updateMeal(payload);
            
            if (result.success) {
                saveSuccessClass = '';
                dispatch('save', { meal: payload });
                notifySuccess('Meal updated successfully.');
                setTimeout(() => {
                    saveSuccessClass = 'hidden';
                    closeModal();
                }, 1200);
            } else {
                const message = result.error || 'Unable to update meal.';
                console.error('Error updating row:', message);
                notifyError(message);
                showError();
            }
        } catch (error) {
            console.error('Failed to update meal:', error);
            notifyError('Unable to update meal. Please try again.');
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
</script>
{#if showModal}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-24 sm:mt-28 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
            <div class="flex items-center m-0 h-8">
                <h3 class="flex-1 font-bold text-lg">Edit Meal</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0"><XMark /></button>
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
                <button class="btn btn-sm btn-primary text-white" on:click={updateMeal} disabled={!nameIsValid}>Update</button>
            </div>
    </div>
  </div>
{/if}

{#if saveSuccessClass === ''}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white/70">
    <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
  </div>
{/if}

{#if saveErrorClass === ''}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white/70">
    <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
  </div>
{/if}
