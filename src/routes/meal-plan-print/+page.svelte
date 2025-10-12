<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { currentMealPlan, loadMealPlans } from '$lib/stores/mealPlan.js';
  import { user, accessToken, loading as authLoading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { Printer, Calendar, List, Plus, X, Coffee, Utensils, Moon, Apple } from 'lucide-svelte';

  let loading = true;
  let error = null;
  let allMeals = [];
  let selectedMeals = [];
  let printFormat = 'options'; // 'options' or 'schedule'
  let showBoth = false;
  
  // Schedule data
  let weeklySchedule = {
    monday: { breakfast: null, lunch: null, dinner: null, snack: null },
    tuesday: { breakfast: null, lunch: null, dinner: null, snack: null },
    wednesday: { breakfast: null, lunch: null, dinner: null, snack: null },
    thursday: { breakfast: null, lunch: null, dinner: null, snack: null },
    friday: { breakfast: null, lunch: null, dinner: null, snack: null },
    saturday: { breakfast: null, lunch: null, dinner: null, snack: null },
    sunday: { breakfast: null, lunch: null, dinner: null, snack: null }
  };

  // Options data
  let mealOptions = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  onMount(async () => {
    console.log('Meal plan print page mounted');
    console.log('User:', $user);
    console.log('Auth loading:', $authLoading);
    
    // Wait for auth to complete, then redirect if not authenticated
    const unsubscribe = user.subscribe(async (currentUser) => {
      console.log('User subscription triggered:', currentUser, 'Auth loading:', $authLoading);
      if (!$authLoading) {
        if (!currentUser) {
          console.log('No user, redirecting to login');
          goto('/login');
          return;
        }
        
        console.log('User authenticated, loading data...');
        try {
          loading = true;
          console.log('About to call loadData()');
          await loadData();
          console.log('Data loaded successfully');
        } catch (err) {
          console.error('Error loading data:', err);
          error = err.message || 'Unable to load data. Please try again.';
        } finally {
          loading = false;
        }
        unsubscribe();
      }
    });
  });

  // Track the last loaded meal plan to prevent infinite loops
  let lastLoadedMealPlanId = null;

  // React to changes in current meal plan
  $: if ($currentMealPlan && !loading && $currentMealPlan.id !== lastLoadedMealPlanId) {
    console.log('Current meal plan changed, reloading data...');
    lastLoadedMealPlanId = $currentMealPlan.id;
    loadDataForCurrentPlan();
  }

  async function loadDataForCurrentPlan() {
    try {
      loading = true;
      console.log('Loading data for current meal plan:', $currentMealPlan);
      
      // Load current meal plan selections
      if ($currentMealPlan) {
        const result = await api.getSelections('all', $currentMealPlan.id);
        console.log('Selections result for new plan:', result);
        
        // Extract meal IDs from the response and look up actual meal objects
        if (Array.isArray(result) && result.length > 0 && result[0].meals) {
          const mealIds = result[0].meals;
          console.log('Selected meal IDs for new plan:', mealIds);
          
          // Look up actual meal objects from allMeals using the IDs
          selectedMeals = mealIds.map(mealId => {
            const meal = allMeals.find(m => m.id === mealId);
            console.log(`Looking up meal ID ${mealId}:`, meal);
            return meal;
          }).filter(meal => meal !== undefined); // Remove any undefined meals
          
          console.log('Selected meals for new plan (looked up):', selectedMeals);
        } else {
          selectedMeals = [];
          console.log('No meals selected for new plan - result structure:', result);
        }
        
        // Debug: Show which meals are actually selected
        selectedMeals.forEach(meal => {
          console.log(`Selected meal for new plan: ${meal.name}`);
        });
        
        // Initialize meal options from selected meals
        initializeMealOptions();
        loadWeeklySchedule();
      }
    } catch (error) {
      console.error('Error loading data for current plan:', error);
      error = error.message || 'Failed to load data for current plan';
    } finally {
      loading = false;
    }
  }

  async function loadData() {
    try {
      console.log('loadData() called');
      // Load all meals
      const mealsResult = await api.getMeals();
      console.log('Meals API result:', mealsResult);
      // Handle both direct array response and wrapped response
      allMeals = Array.isArray(mealsResult) ? mealsResult : (mealsResult.data || []);
      console.log('Loaded all meals:', allMeals.length);
      
      // Load meal plans to ensure we have current meal plan
      console.log('About to load meal plans');
      await loadMealPlans();
      console.log('Current meal plan:', $currentMealPlan);
      
      // Load current meal plan selections
      if ($currentMealPlan) {
        const result = await api.getSelections('all', $currentMealPlan.id);
        console.log('Selections result:', result);
        console.log('Result type:', typeof result);
        console.log('Is array:', Array.isArray(result));
        console.log('Result length:', result?.length);
        console.log('First item:', result?.[0]);
        console.log('First item meals:', result?.[0]?.meals);
        
        // Extract meal IDs from the response and look up actual meal objects
        if (Array.isArray(result) && result.length > 0 && result[0].meals) {
          const mealIds = result[0].meals;
          console.log('Selected meal IDs:', mealIds);
          
          // Look up actual meal objects from allMeals using the IDs
          selectedMeals = mealIds.map(mealId => {
            const meal = allMeals.find(m => m.id === mealId);
            console.log(`Looking up meal ID ${mealId}:`, meal);
            return meal;
          }).filter(meal => meal !== undefined); // Remove any undefined meals
          
          console.log('Selected meals (looked up):', selectedMeals);
        } else {
          selectedMeals = [];
          console.log('No meals selected - result structure:', result);
        }
        
        // Debug: Show which meals are actually selected
        selectedMeals.forEach(meal => {
          console.log(`Selected meal: ${meal.name}`);
        });
        
        // Initialize meal options from selected meals
        initializeMealOptions();
        loadWeeklySchedule();
        
        // Set the last loaded meal plan ID to prevent reactive statement from triggering
        lastLoadedMealPlanId = $currentMealPlan.id;
      } else {
        console.log('No meal plan selected, using all meals');
        // If no meal plan selected, show all meals as options
        initializeMealOptions();
        loadWeeklySchedule();
        
        // Set to null since no meal plan is selected
        lastLoadedMealPlanId = null;
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      error = error.message || 'Failed to load data';
    }
  }

  function initializeMealOptions() {
    // Try to load saved meal options from localStorage
    const savedMealOptions = localStorage.getItem('mealPlanPrintOptions');
    if (savedMealOptions) {
      try {
        const parsed = JSON.parse(savedMealOptions);
        // Validate that the saved data has the right structure
        if (parsed.breakfast && parsed.lunch && parsed.dinner && parsed.snack) {
          mealOptions = parsed;
          console.log('Loaded saved meal options from localStorage:', mealOptions);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved meal options:', error);
      }
    }
    
    // If no saved data or parsing failed, start with empty lists
    mealOptions = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    console.log('Initialized empty meal options - meals will be added manually via dropdowns');
  }

  function saveMealOptions() {
    try {
      localStorage.setItem('mealPlanPrintOptions', JSON.stringify(mealOptions));
      console.log('Saved meal options to localStorage');
    } catch (error) {
      console.error('Error saving meal options:', error);
    }
  }

  function addMealToOptions(meal, category) {
    if (!mealOptions[category].find(m => m.id === meal.id)) {
      mealOptions[category].push(meal);
    }
    
    // Force reactivity update
    mealOptions = { ...mealOptions };
    
    // Save to localStorage
    saveMealOptions();
    
    // Close the dropdown by removing focus
    document.activeElement?.blur();
  }

  function removeMealFromOptions(meal, category) {
    mealOptions[category] = mealOptions[category].filter(m => m.id !== meal.id);
    
    // Force reactivity update
    mealOptions = { ...mealOptions };
    
    // Save to localStorage
    saveMealOptions();
  }

  function saveWeeklySchedule() {
    try {
      localStorage.setItem('mealPlanPrintWeeklySchedule', JSON.stringify(weeklySchedule));
      console.log('Saved weekly schedule to localStorage');
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
    }
  }

  function loadWeeklySchedule() {
    const savedSchedule = localStorage.getItem('mealPlanPrintWeeklySchedule');
    if (savedSchedule) {
      try {
        const parsed = JSON.parse(savedSchedule);
        // Validate that the saved data has the right structure
        if (parsed && typeof parsed === 'object') {
          weeklySchedule = parsed;
          console.log('Loaded saved weekly schedule from localStorage:', weeklySchedule);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved weekly schedule:', error);
      }
    }
    
    // If no saved data or parsing failed, start with empty schedule
    weeklySchedule = {
      monday: { breakfast: null, lunch: null, dinner: null, snack: null },
      tuesday: { breakfast: null, lunch: null, dinner: null, snack: null },
      wednesday: { breakfast: null, lunch: null, dinner: null, snack: null },
      thursday: { breakfast: null, lunch: null, dinner: null, snack: null },
      friday: { breakfast: null, lunch: null, dinner: null, snack: null },
      saturday: { breakfast: null, lunch: null, dinner: null, snack: null },
      sunday: { breakfast: null, lunch: null, dinner: null, snack: null }
    };
    console.log('Initialized empty weekly schedule');
  }
  

  function assignMealToSchedule(day, mealType, meal) {
    weeklySchedule[day][mealType] = meal;
    
    // Force reactivity update
    weeklySchedule = { ...weeklySchedule };
    
    // Save to localStorage
    saveWeeklySchedule();
    
    // Close the dropdown by removing focus
    document.activeElement?.blur();
  }

  function removeMealFromSchedule(day, mealType) {
    weeklySchedule[day][mealType] = null;
    
    // Force reactivity update
    weeklySchedule = { ...weeklySchedule };
    
    // Save to localStorage
    saveWeeklySchedule();
  }

  function getAvailableMeals(category) {
    // Use selected meals if available, otherwise use all meals
    const mealsToUse = selectedMeals.length > 0 ? selectedMeals : allMeals;
    
    // Debug: Check if Assassin Chicken is in the meals being filtered
    const assassinChicken = mealsToUse.find(meal => meal.name === 'Assassin Chicken');
    if (assassinChicken) {
      console.log(`🚨 ASSASSIN CHICKEN FOUND IN ${mealsToUse === selectedMeals ? 'SELECTED' : 'ALL'} MEALS:`, assassinChicken);
    }
    
    // Filter meals that are flagged for this specific category
    const categoryMeals = mealsToUse.filter(meal => {
      if (meal.flags && meal.flags.length > 0) {
        const hasFlag = meal.flags.some(flag => flag.toLowerCase() === category.toLowerCase());
        return hasFlag;
      }
      return false;
    });
    
    // Then filter out meals already added to this category
    const available = categoryMeals.filter(meal => 
      !mealOptions[category].find(m => m.id === meal.id)
    );
    
    return available;
  }

  function getAvailableMealsForSchedule(mealType) {
    // Use selected meals if available, otherwise use all meals
    const mealsToUse = selectedMeals.length > 0 ? selectedMeals : allMeals;
    
    // Filter meals that are flagged for this specific meal type
    const categoryMeals = mealsToUse.filter(meal => {
      if (meal.flags && meal.flags.length > 0) {
        return meal.flags.some(flag => flag.toLowerCase() === mealType.toLowerCase());
      }
      return false;
    });
    
    return categoryMeals;
  }

  function printPage() {
    window.print();
  }

  function clearAllSavedData() {
    localStorage.removeItem('mealPlanPrintOptions');
    localStorage.removeItem('mealPlanPrintWeeklySchedule');
    console.log('Cleared all saved meal plan print data');
    
    // Reset to empty state
    initializeMealOptions();
    loadWeeklySchedule();
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  function getMealIcon(mealType) {
    switch(mealType) {
      case 'breakfast': return Coffee;
      case 'lunch': return Utensils;
      case 'dinner': return Moon;
      case 'snack': return Apple;
      default: return Utensils;
    }
  }
</script>


<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-6xl mx-auto print-content">
    <!-- Header -->
    <div class="mb-2 print-header">
      <div>
        {#if $currentMealPlan}
          <h1 class="text-lg font-bold text-primary print-page-title">{$currentMealPlan.title}</h1>
        {:else}
          <h1 class="text-lg font-bold text-primary print-page-title">All Meals</h1>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="loading loading-spinner loading-lg"></div>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <span>{error}</span>
      </div>
    {:else}
      <!-- Format Selection -->
      <div class="mb-2 print-format-selection">
        <h2 class="text-lg font-semibold mb-1">Print Format</h2>
        <div class="space-y-0.5">
          <div class="flex items-center justify-between">
            <label class="cursor-pointer label justify-start">
              <input type="radio" bind:group={printFormat} value="options" class="radio radio-primary" />
              <span class="label-text ml-2">Options List</span>
            </label>
            {#if printFormat === 'options'}
              <button on:click={printPage} class="btn btn-primary btn-sm print-button">
                <Printer class="h-4 w-4" />
                Print
              </button>
            {/if}
          </div>
          <div class="flex items-center justify-between">
            <label class="cursor-pointer label justify-start">
              <input type="radio" bind:group={printFormat} value="schedule" class="radio radio-primary" />
              <span class="label-text ml-2">Weekly Schedule</span>
            </label>
            {#if printFormat === 'schedule'}
              <button on:click={printPage} class="btn btn-primary btn-sm print-button">
                <Printer class="h-4 w-4" />
                Print
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Content -->
      {#if printFormat === 'options'}
        <!-- ADHD-Friendly Options List -->
        <div class="card bg-base-100 shadow-xl mb-6 print:shadow-none">
          <div class="card-body m-1 p-1">
            <h2 class="card-title flex items-center gap-2 print-options-title">
              <List class="h-5 w-5" />
              Meal Options
            </h2>
            
            <!-- Print title outside grid -->
            <div class="print-options-title-only" data-meal-plan="{$currentMealPlan?.title || 'All Meals'}"></div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print-options-list">
              <!-- Top row: Breakfast and Lunch -->
              {#each ['breakfast', 'lunch'] as category}
                <div class="space-y-3 meal-category">
                  <div class="flex items-center justify-between border-b pb-2">
                    <h3 class="font-semibold text-lg capitalize">{category}</h3>
                    <!-- Add meal dropdown -->
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-sm btn-link">
                        <Plus class="h-3 w-3" />
                        Add Meal
                      </label>
                      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-purple-100 border border-purple-300 rounded-box w-auto min-w-48 max-w-64 max-h-32 overflow-y-auto z-50">
                        {#each getAvailableMeals(category) as meal}
                          <li>
                            <button on:click={() => addMealToOptions(meal, category)}>
                              {meal.name}
                            </button>
                          </li>
                        {:else}
                          <li class="text-sm text-gray-500 p-2">
                            {#if allMeals.length === 0}
                              No meals found. Please add meals first.
                            {:else if selectedMeals.length === 0}
                              No meals selected in current meal plan.
                            {:else}
                              No meals in this category.
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                  
                  <!-- Meal list -->
                  <div class="space-y-2">
                    {#each mealOptions[category] as meal}
                      <div class="flex items-center justify-between p-2 bg-base-200 rounded meal-item">
                        <span class="text-sm">{meal.name}</span>
                        <button 
                          on:click={() => removeMealFromOptions(meal, category)}
                          class="btn btn-ghost btn-xs"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
              
              <!-- Bottom row: Dinner and Snack -->
              {#each ['dinner', 'snack'] as category}
                <div class="space-y-3 meal-category">
                  <div class="flex items-center justify-between border-b pb-2">
                    <h3 class="font-semibold text-lg capitalize">{category}</h3>
                    <!-- Add meal dropdown -->
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-sm btn-link">
                        <Plus class="h-3 w-3" />
                        Add Meal
                      </label>
                      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-purple-100 border border-purple-300 rounded-box w-auto min-w-48 max-w-64 max-h-32 overflow-y-auto z-50">
                        {#each getAvailableMeals(category) as meal}
                          <li>
                            <button on:click={() => addMealToOptions(meal, category)}>
                              {meal.name}
                            </button>
                          </li>
                        {:else}
                          <li class="text-sm text-gray-500 p-2">
                            {#if allMeals.length === 0}
                              No meals found. Please add meals first.
                            {:else if selectedMeals.length === 0}
                              No meals selected in current meal plan.
                            {:else}
                              No meals in this category.
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                  
                  <!-- Meal list -->
                  <div class="space-y-2">
                    {#each mealOptions[category] as meal}
                      <div class="flex items-center justify-between p-2 bg-base-200 rounded meal-item">
                        <span class="text-sm">{meal.name}</span>
                        <button 
                          on:click={() => removeMealFromOptions(meal, category)}
                          class="btn btn-ghost btn-xs"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if printFormat === 'schedule'}
        <!-- Weekly Schedule -->
        <div class="card bg-base-100 shadow-xl m-0 mb-6 print:shadow-none">
          <div class="card-body m-1 p-1">
            <h2 class="card-title flex items-center gap-2 print-weekly-title">
              <Calendar class="h-5 w-5" />
              Weekly Schedule
            </h2>
            
            <!-- Print view: Two-row layout with full labels -->
            <div class="space-y-4 print-weekly-schedule print-view-only" data-meal-plan="{$currentMealPlan?.title || 'All Meals'}">
              <!-- First row: Monday - Thursday -->
              <div class="week-row print-view-only">
                {#each ['monday', 'tuesday', 'wednesday', 'thursday'] as day}
                  <div class="border border-base-300 rounded-lg px-2 py-2 day-container">
                    <h3 class="text-lg font-bold mb-3 day-title">{dayLabels[day]}</h3>
                    
                    <!-- Print view: Show meals with full labels -->
                    <div class="meal-list">
                      {#each mealTypes as mealType}
                        <div class="meal-section">
                          <div class="meal-type-label">{mealType}:</div>
                          <div class="meal-name">
                            {#if weeklySchedule[day] && weeklySchedule[day][mealType]}
                              <div class="meal-with-icon">
                                <svelte:component this={getMealIcon(mealType)} class="meal-icon" style="width: 12pt; height: 12pt; color: #8b5cf6; fill: #8b5cf6; stroke: #8b5cf6;" />
                                <span class="meal-text">{weeklySchedule[day][mealType].name}</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Second row: Friday - Sunday -->
              <div class="week-row">
                {#each ['friday', 'saturday', 'sunday'] as day}
                  <div class="border border-base-300 rounded-lg px-2 py-2 day-container">
                    <h3 class="text-lg font-bold mb-3 day-title">{dayLabels[day]}</h3>
                    
                    <!-- Print view: Show meals with full labels -->
                    <div class="meal-list">
                      {#each mealTypes as mealType}
                        <div class="meal-section">
                          <div class="meal-type-label">{mealType}:</div>
                          <div class="meal-name">
                            {#if weeklySchedule[day] && weeklySchedule[day][mealType]}
                              <div class="meal-with-icon">
                                <svelte:component this={getMealIcon(mealType)} class="meal-icon" style="width: 12pt; height: 12pt; color: #8b5cf6; fill: #8b5cf6; stroke: #8b5cf6;" />
                                <span class="meal-text">{weeklySchedule[day][mealType].name}</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Screen view: Original single-column layout -->
            <div class="space-y-4 screen-only">
              {#each days as day}
                <div class="border border-base-300 rounded-lg px-2 py-2 day-container">
                  <h3 class="text-lg font-bold mb-3 day-title">{dayLabels[day]}</h3>
                  
                  <!-- Edit view: Show interactive grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 meal-slots screen-only">
                    {#each mealTypes as mealType}
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-gray-600 meal-type-label">{mealType}</div>
                        {#if weeklySchedule[day][mealType]}
                          <div class="flex items-center justify-between p-2 bg-base-200 rounded meal-slot">
                            <span class="text-sm">{weeklySchedule[day][mealType].name}</span>
                            <button 
                              on:click={() => removeMealFromSchedule(day, mealType)}
                              class="btn btn-ghost btn-xs"
                            >
                              <X class="h-3 w-3" />
                            </button>
                          </div>
                        {:else}
                          <div class="dropdown dropdown-start">
                            <label tabindex="0" class="btn btn-sm btn-link">
                              <Plus class="h-3 w-3" />
                              Add
                            </label>
                            <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-purple-100 border border-purple-300 rounded-box w-auto min-w-48 max-w-64 max-h-32 overflow-y-auto z-50">
                              {#each getAvailableMealsForSchedule(mealType) as meal}
                                <li>
                                  <button on:click={() => assignMealToSchedule(day, mealType, meal)}>
                                    {meal.name}
                                  </button>
                                </li>
                              {:else}
                                <li class="text-sm text-gray-500 p-2">
                                  {#if allMeals.length === 0}
                                    No meals found. Please add meals first.
                                  {:else if selectedMeals.length === 0}
                                    No meals selected in current meal plan.
                                  {:else}
                                    No meals in this category.
                                  {/if}
                                </li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  @media print {
    .btn, .dropdown, .card-body > .card-title:last-child {
      display: none !important;
    }
    
    .card {
      break-inside: avoid;
      box-shadow: none !important;
      border: 1px solid #ccc;
    }
    
    body {
      background: white !important;
    }
    
    .bg-base-200 {
      background: white !important;
    }
    
    .bg-base-100 {
      background: white !important;
    }
    
    .bg-base-200 {
      background: #f5f5f5 !important;
    }
    
    /* Options List Print Layout - 2x2 grid with equal height */
    .print-options-list {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: 50vh 50vh !important;
      gap: 0.5rem !important;
      padding: 0.5rem !important;
      height: 100vh !important;
    }
    
    .print-options-list .meal-category {
      break-inside: avoid;
      page-break-inside: avoid;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    .print-options-list .meal-category h3 {
      font-size: 18pt !important;
      font-weight: bold !important;
      margin-bottom: 1rem !important;
      border-bottom: 2px solid #000 !important;
      padding-bottom: 0.5rem !important;
      flex-shrink: 0 !important;
    }
    
    .print-options-list .meal-category .space-y-2 {
      flex: 1 !important;
      min-height: 0 !important;
    }
    
    .print-options-list .meal-item {
      font-size: 18pt !important;
      margin-bottom: 0.25rem !important;
      padding: 0.25rem !important;
      border: none !important;
      background: white !important;
      min-height: 1.5rem !important;
      display: flex !important;
      align-items: center !important;
    }
    
    .print-options-list .meal-item span {
      font-weight: bold !important;
      font-size: 14pt !important;
      line-height: 1.1 !important;
    }
    
    /* Reduce spacing in meal lists for print */
    .print-options-list .space-y-2 {
      gap: 0.125rem !important;
    }
    
    /* Add icons before meal names in print using CSS content */
    .print-options-list .meal-item span::before {
      content: "☕" !important;
      color: #8b5cf6 !important;
      margin-right: 0.5rem !important;
      font-size: 14pt !important;
    }
    
    /* Different icons for different categories */
    .print-options-list .meal-category:nth-child(1) .meal-item span::before {
      content: "☕" !important; /* Breakfast */
    }
    
    .print-options-list .meal-category:nth-child(2) .meal-item span::before {
      content: "🍽️" !important; /* Lunch */
    }
    
    .print-options-list .meal-category:nth-child(3) .meal-item span::before {
      content: "🌙" !important; /* Dinner */
    }
    
    .print-options-list .meal-category:nth-child(4) .meal-item span::before {
      content: "🍎" !important; /* Snack */
    }
    
    .print-options-list .meal-item:empty {
      border: none !important;
      background: white !important;
    }
    
    
    /* Weekly Schedule Print Layout */
    .print-weekly-schedule {
      display: block !important;
      padding: 0.25rem !important;
      width: 100% !important;
    }
    
    .print-weekly-schedule .week-row {
      display: flex !important;
      gap: 0.75rem !important;
      margin-bottom: 1rem !important;
    }
    
    .print-weekly-schedule .day-container {
      break-inside: avoid;
      page-break-inside: avoid;
      border: none !important;
      padding: 0.25rem !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    .print-weekly-schedule .day-title {
      font-size: 16pt !important;
      font-weight: bold !important;
      margin-bottom: 0.5rem !important;
      text-align: center !important;
      border-bottom: 2px solid #000 !important;
      padding-bottom: 0.5rem !important;
      line-height: 1.2 !important;
      flex-shrink: 0 !important;
    }
    
    .print-weekly-schedule .meal-section {
      margin-bottom: 0.75rem !important;
    }
    
    .print-weekly-schedule .meal-type-label {
      font-size: 12pt !important;
      font-weight: bold !important;
      margin-bottom: 0.25rem !important;
      text-transform: capitalize !important;
      line-height: 1.2 !important;
    }
    
    .print-weekly-schedule .meal-name {
      font-size: 11pt !important;
      margin-bottom: 0.25rem !important;
      padding: 0.25rem !important;
      min-height: 1.25rem !important;
      line-height: 1.2 !important;
    }
    
    .print-weekly-schedule .meal-list {
      height: auto !important;
      min-height: 0 !important;
    }
    
    
    
    
    /* Override global print styles for meal-list elements */
    .meal-list.print-only {
      display: block !important;
    }
    
    .meal-item {
      display: flex !important;
      align-items: center !important;
    }
    
    .meal-label {
      display: inline !important;
      font-weight: bold !important;
      margin-right: 0.25rem !important;
    }
  }
  
  /* Component-specific print/screen visibility - force hide print elements on screen */
  .print-only {
    display: none !important;
  }
  
  .print-view-only {
    display: none !important;
  }
  
  .screen-only {
    display: block !important;
  }
  
  /* Force hide specific print elements on screen */
  .print-weekly-schedule {
    display: none !important;
  }
  
  .week-row {
    display: none !important;
  }
  
  .meal-section {
    display: none !important;
  }
  
  .meal-type-label {
    display: block !important;
    text-transform: capitalize !important;
    font-weight: bold !important;
  }
  
  .meal-name {
    display: none !important;
  }
  
  .meal-with-icon {
    display: none !important;
  }
  
  .meal-icon {
    display: none !important;
  }
  
  .meal-text {
    display: none !important;
  }
  
  /* Make meal names bigger and purple in screen version */
  .meal-slot span {
    font-size: 0.875rem !important;
    color: #8b5cf6 !important;
    line-height: 1.1 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Make meal names bigger and purple in options list view */
  .meal-item span {
    font-size: 0.875rem !important;
    color: #8b5cf6 !important;
    line-height: 1.1 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  
  /* Ensure meal slots are visible in screen version */
  .meal-slots.screen-only {
    display: grid !important;
  }
  
  .meal-slot {
    display: flex !important;
    padding: 0.125rem !important;
    margin: 0 !important;
  }
  
  .meal-item {
    padding: 0.125rem !important;
    margin: 0 !important;
  }
  
  /* Reduce spacing around Add buttons */
  .btn.btn-link {
    padding: 0.25rem 0.5rem !important;
    margin: 0 !important;
    line-height: 1.2 !important;
  }
  
  /* Reduce spacing in meal type sections */
  .space-y-2 > * + * {
    margin-top: 0.125rem !important;
  }
  
  /* Reduce spacing in meal lists */
  .space-y-2 {
    gap: 0.125rem !important;
  }

  @media print {
    /* Force landscape orientation */
    @page {
      size: A4 landscape;
      margin: 0.25in;
    }
    
    .print-only {
      display: block !important;
    }
    
    .print-view-only {
      display: block !important;
    }
    
    .screen-only {
      display: none !important;
    }
    
    /* Show print elements only in print */
    .print-weekly-schedule {
      display: block !important;
    }
    
    .week-row {
      display: grid !important;
    }
    
    .meal-section {
      display: block !important;
    }
    
    .meal-type-label {
      display: block !important;
    }
    
    .meal-name {
      display: block !important;
    }
    
    .meal-with-icon {
      display: flex !important;
    }
    
    .meal-icon {
      display: block !important;
    }
    
    .meal-text {
      display: inline !important;
    }
    
    
    /* Icon styling for print view */
    .print-weekly-schedule .meal-with-icon {
      display: flex !important;
      align-items: center !important;
      gap: 0.3rem !important;
      margin-left: 0.5rem !important;
    }
    
    .print-weekly-schedule .meal-icon {
      width: 12pt !important;
      height: 12pt !important;
      flex-shrink: 0 !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    .print-weekly-schedule .meal-icon svg {
      width: 12pt !important;
      height: 12pt !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    /* Target Lucide icons specifically */
    .print-weekly-schedule .meal-icon :global(svg) {
      width: 12pt !important;
      height: 12pt !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    /* Ensure all child elements inherit the color */
    .print-weekly-schedule .meal-icon * {
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    /* More specific targeting for Lucide icons */
    .print-weekly-schedule .meal-with-icon .meal-icon {
      width: 12pt !important;
      height: 12pt !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    .print-weekly-schedule .meal-with-icon .meal-icon :global(svg) {
      width: 12pt !important;
      height: 12pt !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    /* Target specific Lucide icon components */
    .print-weekly-schedule .meal-with-icon :global(.lucide) {
      width: 12pt !important;
      height: 12pt !important;
      color: #8b5cf6 !important;
      fill: #8b5cf6 !important;
      stroke: #8b5cf6 !important;
    }
    
    .print-weekly-schedule .meal-text {
      font-size: 11pt !important;
      line-height: 1.1 !important;
    }
    
    /* Ensure screen-only elements are hidden in print */
    .space-y-4.screen-only {
      display: none !important;
    }
    
    .meal-slots.screen-only {
      display: none !important;
    }
    
    /* Hide the print format selection section */
    .print-format-selection {
      display: none !important;
    }
    
    /* Hide the print button in print view */
    .print-button {
      display: none !important;
    }
    
    /* Move title to the right in print view */
    .print-header {
      margin-bottom: 0.5rem !important;
      justify-content: flex-end !important;
    }
    
    /* Hide the original meal plan title in print since we're using the new format */
    .print-page-title {
      display: none !important;
    }
    
    /* Hide the original titles in print */
    .print-options-title {
      display: none !important;
    }
    
    .print-weekly-title {
      display: none !important;
    }
    
    /* Add print type headers for options list outside grid */
    .print-options-title-only::before {
      content: "📋 Meal Options: " attr(data-meal-plan) !important;
      font-size: 24pt !important;
      font-weight: bold !important;
      color: #8b5cf6 !important;
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      margin-bottom: 0.25rem !important;
      border: none !important;
      padding: 0 !important;
      line-height: 1.0 !important;
    }
    
    /* Force override any conflicting styles */
    .card .print-options-title-only::before {
      margin: 0 !important;
      margin-bottom: 0.25rem !important;
      padding: 0 !important;
      border: none !important;
      line-height: 1.0 !important;
    }
    
    /* Additional specificity for print */
    @media print {
      .print-options-title-only::before {
        margin: 0 !important;
        margin-bottom: 0.25rem !important;
        padding: 0 !important;
        border: none !important;
        line-height: 1.0 !important;
      }
    }
    
    /* Add print type headers for weekly schedule */
    .print-weekly-schedule::before {
      content: "📅 Weekly Schedule: " attr(data-meal-plan) !important;
      font-size: 24pt !important;
      font-weight: bold !important;
      color: #8b5cf6 !important;
      display: block !important;
      margin-top: 0 !important;
      margin-bottom: 0.5rem !important;
    }
    
    /* Remove card styling for print */
    .card {
      box-shadow: none !important;
      border: none !important;
      background: white !important;
    }
    
    /* Remove borders from day containers in print */
    .day-container {
      border: none !important;
    }
    
    /* Ensure proper page breaks */
    .print-options-list, .print-weekly-schedule {
      page-break-inside: avoid;
    }
  }
</style>
