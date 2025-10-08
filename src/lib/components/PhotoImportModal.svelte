<script>
  import { createEventDispatcher } from 'svelte';
  import { Camera, Upload, X, Check, AlertCircle } from 'lucide-svelte';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { api } from '$lib/api.js';

  const dispatch = createEventDispatcher();

  let isOpen = false;
  let selectedFiles = [];
  let processing = false;
  let processedCount = 0;
  let totalCount = 0;
  let issues = [];

  export function open() {
    isOpen = true;
    selectedFiles = [];
    processing = false;
    processedCount = 0;
    totalCount = 0;
    issues = [];
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
        dispatch('recipes-imported', { imports: successfulImports });
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
        <h2 class="text-xl font-semibold text-gray-900">Import Recipes from Photos</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
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
            <p class="text-gray-600 text-sm">
              Take photos of recipes or select from your gallery. Works with cookbooks, screenshots, handwritten recipes, and more!
            </p>
            
            <div class="grid grid-cols-2 gap-4">
              <button
                class="btn btn-outline btn-primary flex flex-col items-center gap-2 h-24"
                on:click={handleCameraClick}
              >
                <Camera class="h-8 w-8" />
                <span>Take Photo</span>
              </button>
              
              <button
                class="btn btn-outline btn-primary flex flex-col items-center gap-2 h-24"
                on:click={handleGalleryClick}
              >
                <Upload class="h-8 w-8" />
                <span>From Gallery</span>
              </button>
            </div>

            <!-- Selected Files -->
            {#if selectedFiles.length > 0}
              <div class="space-y-2">
                <h3 class="font-medium text-gray-900">Selected Photos ({selectedFiles.length})</h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  {#each selectedFiles as file, index}
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span class="text-sm text-gray-700 truncate">{file.name}</span>
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
                  disabled={selectedFiles.length === 0}
                >
                  Import {selectedFiles.length} Recipe{selectedFiles.length !== 1 ? 's' : ''}
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <!-- Processing -->
          <div class="text-center space-y-4">
            <div class="loading loading-spinner loading-lg text-primary"></div>
            <div>
              <h3 class="font-medium text-gray-900">Processing Recipes...</h3>
              <p class="text-sm text-gray-600">
                {processedCount} of {totalCount} processed
              </p>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-primary h-2 rounded-full transition-all duration-300"
                style="width: {(processedCount / totalCount) * 100}%"
              ></div>
            </div>
            
            <p class="text-xs text-gray-500">
              AI is extracting recipe details from your photos...
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
