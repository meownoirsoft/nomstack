<script>
  import { currentMealPlan, mealPlans, loadMealPlans, createMealPlan, updateMealPlan, setCurrentMealPlan } from '$lib/stores/mealPlan.js';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { Edit3, Plus, Trash2, Save, X, Calendar } from 'lucide-svelte';

  export let isOpen = false;
  export let onClose = () => {};

  let editingPlan = null;
  let tempTitle = '';
  let newPlanTitle = '';
  let creating = false;

  // Reset state when modal opens/closes
  $: if (isOpen) {
    editingPlan = null;
    tempTitle = '';
    newPlanTitle = '';
    creating = false;
  }

  async function startEditing(plan) {
    editingPlan = plan;
    tempTitle = plan.title;
  }

  function cancelEditing() {
    editingPlan = null;
    tempTitle = '';
  }

  async function saveEdit() {
    if (!tempTitle.trim()) {
      notifyError('Please enter a meal plan title');
      return;
    }

    try {
      const result = await updateMealPlan(editingPlan.id, { title: tempTitle.trim() });
      if (result) {
        notifySuccess('Meal plan updated');
        editingPlan = null;
        tempTitle = '';
      } else {
        notifyError('Failed to update meal plan');
      }
    } catch (error) {
      console.error('Error updating meal plan:', error);
      notifyError('Failed to update meal plan');
    }
  }

  async function startCreating() {
    creating = true;
    newPlanTitle = '';
  }

  function cancelCreating() {
    creating = false;
    newPlanTitle = '';
  }

  async function createNewPlan() {
    if (!newPlanTitle.trim()) {
      notifyError('Please enter a meal plan title');
      return;
    }

    try {
      const result = await createMealPlan(newPlanTitle.trim());
      if (result) {
        notifySuccess('Meal plan created');
        creating = false;
        newPlanTitle = '';
      } else {
        notifyError('Failed to create meal plan');
      }
    } catch (error) {
      console.error('Error creating meal plan:', error);
      notifyError('Failed to create meal plan');
    }
  }

  async function deletePlan(planId) {
    if (!confirm('Are you sure you want to delete this meal plan? This will also delete all associated meal selections.')) {
      return;
    }

    try {
      const result = await api.deleteMealPlan(planId);
      if (result.success) {
        notifySuccess('Meal plan deleted');
        // Reload meal plans
        await loadMealPlans();
        // If we deleted the current plan, clear it
        if ($currentMealPlan && $currentMealPlan.id === planId) {
          currentMealPlan.set(null);
        }
      } else {
        notifyError('Failed to delete meal plan');
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      notifyError('Failed to delete meal plan');
    }
  }

  async function setAsCurrent(planId) {
    try {
      await setCurrentMealPlan(planId);
      notifySuccess('Meal plan set as current');
    } catch (error) {
      console.error('Error setting current meal plan:', error);
      notifyError('Failed to set meal plan as current');
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <Calendar class="h-5 w-5 text-primary" />
          <h2 class="text-lg font-semibold text-primary">Manage Meal Plans</h2>
        </div>
        <button 
          class="btn btn-ghost btn-sm"
          on:click={onClose}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 overflow-y-auto max-h-[60vh]">
        <!-- Create New Plan -->
        {#if creating}
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <Plus class="h-4 w-4 text-primary" />
              <span class="font-medium text-primary">Create New Plan</span>
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={newPlanTitle}
                placeholder="Enter meal plan title"
                class="input input-bordered input-sm flex-1"
                on:keydown={(e) => e.key === 'Enter' && createNewPlan()}
              />
              <button 
                class="btn btn-primary btn-sm"
                on:click={createNewPlan}
                disabled={!newPlanTitle.trim()}
              >
                <Save class="h-4 w-4" />
              </button>
              <button 
                class="btn btn-ghost btn-sm"
                on:click={cancelCreating}
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        {:else}
          <button 
            class="btn btn-outline btn-sm w-full mb-4"
            on:click={startCreating}
          >
            <Plus class="h-4 w-4" />
            Create New Meal Plan
          </button>
        {/if}

        <!-- Existing Plans -->
        <div class="space-y-2">
          {#each $mealPlans as plan}
            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              {#if editingPlan && editingPlan.id === plan.id}
                <div class="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    bind:value={tempTitle}
                    class="input input-bordered input-sm flex-1"
                    on:keydown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <button 
                    class="btn btn-primary btn-sm"
                    on:click={saveEdit}
                    disabled={!tempTitle.trim()}
                  >
                    <Save class="h-4 w-4" />
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm"
                    on:click={cancelEditing}
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              {:else}
                <div class="flex items-center gap-2 flex-1">
                  <span class="font-medium {plan.id === $currentMealPlan?.id ? 'text-primary' : 'text-gray-700'}">
                    {plan.title}
                  </span>
                  {#if plan.id === $currentMealPlan?.id}
                    <span class="badge badge-primary badge-sm">Current</span>
                  {/if}
                </div>
                <div class="flex items-center gap-1">
                  {#if plan.id !== $currentMealPlan?.id}
                    <button 
                      class="btn btn-ghost btn-sm text-primary"
                      on:click={() => setAsCurrent(plan.id)}
                      title="Set as current meal plan"
                    >
                      Set Current
                    </button>
                  {/if}
                  <button 
                    class="btn btn-ghost btn-sm"
                    on:click={() => startEditing(plan)}
                    title="Edit meal plan"
                  >
                    <Edit3 class="h-4 w-4" />
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm text-red-500"
                    on:click={() => deletePlan(plan.id)}
                    title="Delete meal plan"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        {#if $mealPlans.length === 0}
          <div class="text-center py-8 text-gray-500">
            <Calendar class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No meal plans yet</p>
            <p class="text-sm">Create your first meal plan to get started</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200">
        <button 
          class="btn btn-primary w-full"
          on:click={onClose}
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
