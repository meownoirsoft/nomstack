<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { CheckCircle, Sparkles, ArrowRight } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  let isVisible = false;
  let showSteps = false;

  // Show the welcome message when component mounts
  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 500);
  });

  function handleGetStarted() {
    dispatch('dismiss');
    isVisible = false;
  }

  function toggleSteps() {
    showSteps = !showSteps;
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
      <div class="text-center">
        <!-- Header -->
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle class="w-8 h-8 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to NomStack!</h2>
          <p class="text-gray-600">Your meal planning account is all set up and ready to go.</p>
        </div>

        <!-- What's Ready -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">What's ready for you:</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="flex items-center text-gray-600">
              <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
              6 recipe sources
            </div>
            <div class="flex items-center text-gray-600">
              <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
              10 meal categories
            </div>
            <div class="flex items-center text-gray-600">
              <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
              10 sample meals
            </div>
            <div class="flex items-center text-gray-600">
              <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
              Meal filters
            </div>
            <div class="flex items-center text-gray-600">
              <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
              Your first meal plan
            </div>
          </div>
        </div>

        <!-- Quick Start Steps -->
        <div class="mb-6">
          <button 
            class="btn btn-outline btn-sm mb-3"
            on:click={toggleSteps}
          >
            {showSteps ? 'Hide' : 'Show'} Quick Start Guide
          </button>
          
          {#if showSteps}
            <div class="text-left bg-gray-50 rounded-lg p-4 space-y-3">
              <div class="flex items-start">
                <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                <div>
                  <h4 class="font-semibold text-gray-900">Explore your meals</h4>
                  <p class="text-sm text-gray-600">Check out the sample meals in your meal library</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                <div>
                  <h4 class="font-semibold text-gray-900">Add your own meals</h4>
                  <p class="text-sm text-gray-600">Click the "+ Add" buttons to add your favorite recipes</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                <div>
                  <h4 class="font-semibold text-gray-900">Plan your week</h4>
                  <p class="text-sm text-gray-600">Use the meal plan feature to organize your weekly meals</p>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Action Button -->
        <button 
          class="btn btn-primary w-full"
          on:click={handleGetStarted}
        >
          Get Started
          <ArrowRight class="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  </div>
{/if}
