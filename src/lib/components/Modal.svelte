<script>
    // Imports
    import Checkbox from './Checkbox.svelte';
    import { XMark, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
    import { createEventDispatcher } from 'svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { invalidateAll } from '$app/navigation';
    const dispatch = createEventDispatcher();
    const LUNCH_FLAG = 'lunch';
    const DINNER_FLAG = 'dinner';
    let sourceOptions = [];
    let availableCats = [];
    let optionsLoaded = false;
    // Vars
    let selectedItems = [];
    let saveSuccess = false;
    let saveError = false;
    let showCats = false;
    let showNotes = false;
    let name = '';
    let source = '';
    let notes = '';
    let nameTouched = false;
    let nameError = '';
    let nameIsValid = false;

    // Props
    export let showModal; 
    
    function closeModal() {
        resetForm();
        dispatch('close'); // Notify the parent that the modal is closing
    }

    function toggleCats(){
        showCats = !showCats;
    }

    function toggleNotes(){
        showNotes = !showNotes;
    }

    $: nameIsValid = name.trim().length > 0;
    $: if (nameTouched) {
        nameError = nameIsValid ? '' : 'Enter a meal name.';
    }

    async function loadOptions() {
        try {
            const [srcRes, catRes] = await Promise.all([
                fetch('/api/src-get'),
                fetch('/api/cat-get')
            ]);

            if (!srcRes.ok) {
                throw new Error(`Sources request failed: ${srcRes.status}`);
            }
            if (!catRes.ok) {
                throw new Error(`Categories request failed: ${catRes.status}`);
            }

            const [srcData, catData] = await Promise.all([srcRes.json(), catRes.json()]);
            sourceOptions = Array.isArray(srcData) ? srcData : [];
            availableCats = Array.isArray(catData)
                ? catData
                    .map((cat) => ({ ...cat, id: String(cat.id) }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                : [];
            optionsLoaded = true;
        } catch (error) {
            console.error('Failed to load modal options:', error);
            notifyError('Unable to load sources or categories.');
        }
    }

    $: if (showModal && !optionsLoaded) {
        loadOptions();
    }

    async function addNewMeal() {
        nameTouched = true;
        if (!nameIsValid) {
            nameError = 'Enter a meal name.';
            return;
        }
        const cats = Array.from(new Set(
            selectedItems
                .map((value) => (value == null ? '' : String(value).trim()))
                .filter((value) => value.length > 0)
        ));
        const newData = {
            name: name.trim(),
            source,
            cats,
            notes: notes.trim()
        };
        try {
            const response = await fetch('/api/meal-add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                saveSuccess = true;
                notifySuccess('Meal added successfully.');
                try {
                    await invalidateAll();
                } catch (error) {
                    console.error('Failed to refresh meals:', error);
                }
                setTimeout(() => {
                    saveSuccess = false;
                    resetForm();
                    closeModal();
                }, 1200);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            saveError = true;
            notifyError('Unable to add meal. Please try again.');
            setTimeout(() => {
                saveError = false;
            }, 2000);
            console.error('Error adding row:', error);
        }
    }

    function resetForm() {
        name = '';
        source = '';
        notes = '';
        selectedItems = [];
        saveSuccess = false;
        saveError = false;
        nameTouched = false;
        nameError = '';
    }
</script>
{#if showModal}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-24 sm:mt-28 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
            <div class="flex items-center h-8 m-0">
                <h3 class="flex-1 font-bold text-lg mt-0">Add Meal</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0" style="z-index: 999;"><XMark /></button>
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
              aria-describedby={nameError ? 'meal_name_error' : undefined}
            />
            {#if nameError}
              <p id="meal_name_error" class="mt-1 text-xs text-error" role="alert">{nameError}</p>
            {/if}
            <!-- SOURCE -->
            <small class="font-bold m-0 pb-0">Source</small>
            <select id="meal_source" class="w-full select select-bordered select-sm max-w-xs" bind:value={source}>
                <option value="">-- Select Source --</option>
                {#each sourceOptions as option}
                    <option value={option.abbrev}>{option.name}</option>
                {/each}
            </select>
            <!-- L/D -->
            <div class="flex items-center justify-between mx-2 mt-2 mb-4 text-sm text-primary">
                <Checkbox label="Lunch?" value={LUNCH_FLAG} bind:selectedItems lblClass="font-medium" />
               <Checkbox label="Dinner?" value={DINNER_FLAG} bind:selectedItems lblClass="font-medium" />
            </div>
            <!-- CATS -->
            <div class="categories">
                <button class="flex w-full items-center justify-between mt-2 my-3" on:click={toggleCats}>
                    <div class="flex-5"><div class="text-md font-bold m-0 pb-0">Categories</div></div>
                    {#if showCats}
                        <div class="ml-auto"><ChevronUp /></div>
                    {:else}
                        <div class="ml-auto"><ChevronDown /></div>
                    {/if}
                </button>
                <div class={showCats ? 'cats-shown' : 'hidden'}>
                    <div class="overflow-y-scroll h-40"> 
                        {#each availableCats as category}
                            <Checkbox label={category.name} value={category.id} bind:selectedItems lblClass="text-sm text-primary" />
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
            <div class="flex justify-end">
                <button
                  class="flex-1 btn btn-sm ml-auto bg-primary text-white disabled:bg-primary/50 disabled:text-white/90 disabled:border-primary/50"
                  on:click={addNewMeal}
                  disabled={!nameIsValid}
                >
                  Save
                </button>
            </div>
    </div>
  </div>
{/if}

{#if saveSuccess}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white/70">
    <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
  </div>
{/if}

{#if saveError}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-white/70">
    <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
  </div>
{/if}
