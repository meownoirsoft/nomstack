<script>
  import { createEventDispatcher } from 'svelte';
  import { Camera, Upload, X, Check, AlertCircle, Search, ChefHat } from 'lucide-svelte';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { api } from '$lib/api.js';

  const dispatch = createEventDispatcher();

  let isOpen = false;
  let selectedFiles = [];
  let processing = false;
  let processedCount = 0;
  let totalCount = 0;
  let issues = [];
  
  // Meal selection state
  let importMode = 'new'; // 'new' or 'existing'
  let allMeals = [];
  let filteredMeals = [];
  let searchTerm = '';
  let selectedMealId = null;
  let loadingMeals = false;

  export function open() {
    isOpen = true;
    selectedFiles = [];
    processing = false;
    processedCount = 0;
    totalCount = 0;
    issues = [];
    importMode = 'new';
    selectedMealId = null;
    searchTerm = '';
    loadMeals();
  }

  export function close() {
    isOpen = false;
    selectedFiles = [];
    processing = false;
    processedCount = 0;
    totalCount = 0;
    issues = [];
  }

  function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = [...selectedFiles, ...files];
  }

  function removeFile(index) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function handleCameraClick() {
    // Trigger camera input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera
    input.onchange = handleFileSelect;
    input.click();
  }

  function handleGalleryClick() {
    // Trigger gallery input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handleFileSelect;
    input.click();
  }

  async function processPhotos() {
    if (selectedFiles.length === 0) return;
    
    processing = true;
    totalCount = selectedFiles.length;
    processedCount = 0;
    issues = [];

    try {
      const successfulImports = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Simulate AI processing (replace with actual AI call)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual AI recipe parsing
        const mockResult = await parseRecipeFromPhoto(file);
        
        if (mockResult.success) {
          successfulImports.push({ recipe: mockResult.recipe, file });
        } else {
          issues.push({
            file: file.name,
            issue: mockResult.error,
            fileIndex: i
          });
        }
        
        processedCount++;
      }

      // Dispatch a single event with all successful imports
      if (successfulImports.length > 0) {
        dispatch('recipes-imported', { 
          imports: successfulImports,
          importMode,
          selectedMealId: importMode === 'existing' ? selectedMealId : null
        });
      }

      if (issues.length > 0) {
        // Show issues for user to review
        showIssues();
      } else {
        close();
      }
      
    } catch (error) {
      console.error('Error processing photos:', error);
      notifyError('Failed to process photos. Please try again.');
    } finally {
      processing = false;
    }
  }

  // Real AI parsing function using OpenAI Vision API
  async function parseRecipeFromPhoto(file) {
    try {
      const result = await api.parseRecipeFromPhoto(file);
      return result;
    } catch (error) {
      console.error('Error parsing recipe from photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse recipe from photo'
      };
    }
  }

  function showIssues() {
    // TODO: Show issues modal for user to review
    console.log('Issues to review:', issues);
  }

  function closeModal() {
    close();
    dispatch('close');
  }

  // Meal loading and filtering
  async function loadMeals() {
    loadingMeals = true;
    try {
      const result = await api.getMeals('all');
      allMeals = result || [];
      filteredMeals = allMeals;
    } catch (error) {
      console.error('Error loading meals:', error);
      notifyError('Failed to load meals');
    } finally {
      loadingMeals = false;
    }
  }

  // Filter meals based on search term
  $: {
    if (searchTerm.trim()) {
      filteredMeals = allMeals.filter(meal => 
        meal.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      filteredMeals = allMeals;
    }
  }

  function selectMeal(mealId) {
    selectedMealId = mealId;
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={closeModal}
    role="button"
    tabindex="0"
  >
    <!-- Modal -->
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-primary">Import Recipes from Photos</h2>
        <button 
          class="text-primary/60 hover:text-primary"
          on:click={closeModal}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if !processing}
          <!-- Import Options -->
          <div class="space-y-4">
            <p class="text-primary/70 text-sm">
              Take photos of recipes or select from your gallery. Works with cookbooks, screenshots, handwritten recipes, and more!
            </p>
            
            <!-- Import Mode Selection -->
            <div class="space-y-3">
              <h3 class="font-medium text-primary">Add recipes to:</h3>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={importMode} 
                    value="new" 
                    class="radio radio-primary radio-sm"
                  />
                  <span class="text-sm text-primary">Create new meals</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    bind:group={importMode} 
                    value="existing" 
                    class="radio radio-primary radio-sm"
                  />
                  <span class="text-sm text-primary">Add to existing meal</span>
                </label>
              </div>
            </div>

            <!-- Meal Selection (only show when "existing" is selected) -->
            {#if importMode === 'existing'}
              <div class="space-y-3">
                <h3 class="font-medium text-primary">Select meal:</h3>
                
                <!-- Search input -->
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search meals..."
                    bind:value={searchTerm}
                    class="input input-bordered input-sm w-full pl-8 border-primary focus:border-primary focus:outline-primary text-primary"
                  />
                  <Search class="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-primary/60" />
                </div>
                
                <!-- Meal list -->
                <div class="max-h-32 overflow-y-auto border rounded-lg">
                  {#if loadingMeals}
                    <div class="p-3 text-center text-sm text-primary/60">
                      Loading meals...
                    </div>
                  {:else if filteredMeals.length === 0}
                    <div class="p-3 text-center text-sm text-primary/60">
                      {searchTerm ? 'No meals found' : 'No meals available'}
                    </div>
                  {:else}
                    {#each filteredMeals as meal}
                      <button
                        class="w-full text-left p-3 hover:bg-primary/5 border-b last:border-b-0 flex items-center gap-2 {selectedMealId === meal.id ? 'bg-primary/10' : ''}"
                        on:click={() => selectMeal(meal.id)}
                      >
                        <ChefHat class="h-4 w-4 text-primary/60" />
                        <span class="text-sm {selectedMealId === meal.id ? 'font-medium text-primary' : 'text-primary/70'}">
                          {meal.name}
                        </span>
                        {#if selectedMealId === meal.id}
                          <Check class="h-4 w-4 text-primary ml-auto" />
                        {/if}
                      </button>
                    {/each}
                  {/if}
                </div>
              </div>
            {/if}
            
            <div class="grid grid-cols-2 gap-4">
              <button
                class="btn btn-primary flex flex-col items-center gap-2 h-24"
                on:click={handleCameraClick}
              >
                <Camera class="h-8 w-8 text-white" />
                <span class="text-white">Take Photo</span>
              </button>
              
              <button
                class="btn btn-outline text-primary border-primary hover:bg-primary hover:text-white flex flex-col items-center gap-2 h-24"
                on:click={handleGalleryClick}
              >
                <Upload class="h-8 w-8" />
                <span>From Gallery</span>
              </button>
            </div>

            <!-- Selected Files -->
            {#if selectedFiles.length > 0}
              <div class="space-y-2">
                <h3 class="font-medium text-primary">Selected Photos ({selectedFiles.length})</h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  {#each selectedFiles as file, index}
                    <div class="flex items-center justify-between p-2 bg-primary/5 rounded">
                      <span class="text-sm text-primary/70 truncate">{file.name}</span>
                      <button
                        class="text-red-500 hover:text-red-700"
                        on:click={() => removeFile(index)}
                      >
                        <X class="h-4 w-4" />
                      </button>
                    </div>
                  {/each}
                </div>
                
                <button
                  class="btn btn-primary w-full"
                  on:click={processPhotos}
                  disabled={selectedFiles.length === 0 || (importMode === 'existing' && !selectedMealId)}
                >
                  <span class="text-white">Import {selectedFiles.length} Recipe{selectedFiles.length !== 1 ? 's' : ''}</span>
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <!-- Processing -->
          <div class="text-center space-y-4">
            <div class="loading loading-spinner loading-lg text-primary"></div>
            <div>
              <h3 class="font-medium text-primary">Processing Recipes...</h3>
              <p class="text-sm text-primary/70">
                {processedCount} of {totalCount} processed
              </p>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-primary/20 rounded-full h-2">
              <div 
                class="bg-primary h-2 rounded-full transition-all duration-300"
                style="width: {(processedCount / totalCount) * 100}%"
              ></div>
            </div>
            
            <p class="text-xs text-primary/60">
              AI is extracting recipe details from your photos...
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
