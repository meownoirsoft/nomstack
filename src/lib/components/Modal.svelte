<script>
    // Imports
    import Checkbox from './Checkbox.svelte';
    import sources from '../data/sources.json';
    import categories from '../data/cats.json';
    import { XMark, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const catsSorted = categories.sort((a, b) => a.name.localeCompare(b.name));
    // Vars
    let selectedItems = [];
    let saveSuccess = false;
    let showCats = false;
    let showNotes = false;

    // Props
    export let showModal; 
    
    function closeModal() {
        dispatch('close'); // Notify the parent that the modal is closing
    }

    function toggleCats(){
        showCats = !showCats;
    }

    function toggleNotes(){
        showNotes = !showNotes;
    }

    async function addNewMeal() {
        const name = document.querySelector('#meal_name').value;
        const source = document.querySelector('#meal_source').value;
        const notes = document.querySelector('#meal_notes').value;
        const cats = document.querySelectorAll('.collapse-content input[type="checkbox"]');
        const newData = { name, source, notes, cats: cats};
        const response = await fetch('/api/meal-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });

        const result = await response.json();
        if (result.success) {
            saveSuccess = true;
            setTimeout(() => {
                saveSuccess = false;
            }, 2000);
        } else {
            console.error('Error adding row:', result.error);
        }
    }
</script>
{#if showModal}
    <div class="modal modal-open text-primary">
        <div class="modal-box px-2 py-2">
            <div class="flex items-center h-8 m-0">
                <h3 class="flex-1 font-bold text-lg mt-0">Add Meal</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0" style="z-index: 999;"><XMark /></button>
                </div>
            </div>
            <!-- NAME -->
            <small class="font-bold m-0 pb-0">Name</small>
            <input id="meal_name" type="text" class="input input-bordered input-sm w-full max-w-xs" placeholder="Meal Name" />
            <!-- SOURCE -->
            <small class="font-bold m-0 pb-0">Source</small>
            <select id="meal_source" class="w-full select select-bordered select-sm max-w-xs">
                <option value="">-- Select Source --</option>
                {#each sources as source}
                    <option value={source.abbrev}>{source.name}</option>
                {/each}
            </select>
            <!-- L/D -->
            <div class="flex items-center justify-between mx-2 mt-2 mb-4">
                <Checkbox label="Lunch?" value="Lunch" bind:selectedItems lblClass="modal-chk" />
                <Checkbox label="Dinner?" value="Dinner" bind:selectedItems lblClass="modal-chk" />
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
                        {#each catsSorted as category}
                            <Checkbox label={category.name} value={category.name} bind:selectedItems lblClass="modal-chk" />
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
                    <textarea id="meal_notes" class="textarea textarea-bordered w-full m-0" rows="3" placeholder="add notes"></textarea>
                </div>
            </div>
            <div class="flex justify-end">
                <button class="flex-1 btn btn-sm btn-primary text-white ml-auto" on:click={addNewMeal}>Save</button>
                {#if saveSuccess}
                    <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50">
                        <CheckCircle class="h-16 w-16 mt-8 text-green-500" />
                    </div>
                {/if}
            </div>
        </div>
    </div>  
{/if}