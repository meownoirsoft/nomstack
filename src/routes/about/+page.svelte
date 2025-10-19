<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FeedbackSection from '$lib/components/FeedbackSection.svelte';
  import { FileText, CheckCircle, AlertCircle, Star, MessageSquare, Home, TableCellsSplit, ShoppingCart, Settings, Info, Tag, Filter, Store, Palette, ChefHat, Edit3, Printer, Plus, Calendar, Trash2, Check, X, Search, Menu, ArrowLeft, ArrowRightLeft, ListChecks, GripVertical, ChevronUp, ChevronDown, HelpCircle, Camera, Upload } from 'lucide-svelte';

  // Page title for header
  $: pageTitle = 'About';
</script>

<svelte:head>
  <title>About - nomStack</title>
</svelte:head>

<main class="container mx-auto px-4 py-6 max-w-4xl">
  <div class="space-y-8">
    
    <!-- About Section -->
    <section class="card bg-white shadow-lg border border-primary/30">
      <div class="card-body">
        <div class="flex items-center gap-3 mb-4">
          <Star class="h-6 w-6 text-primary" />
          <h2 class="text-2xl font-bold text-primary">About nomStack</h2>
        </div>
        <div class="prose max-w-none">
          <p class="text-primary/70 mb-4">
            nomStack is your personal meal planning and grocery shopping assistant. 
            Designed to simplify the daily question of "What's for dinner?", nomStack helps you:
          </p>
          <ul class="list-disc list-inside text-primary/70 space-y-2 mb-6">
            <li>Plan meals for the week with our smart meal planner</li>
            <li>Generate shopping lists automatically from your meal plans</li>
            <li>Organize ingredients by store and category</li>
            <li>Track your pantry inventory</li>
            <li>Discover new recipes and save your favorites</li>
            <li>Manage meal categories and dietary preferences</li>
          </ul>
          <p class="text-primary/70">
            Built with modern web technologies and designed for both desktop and mobile use, 
            nomStack puts the power of organized meal planning in your hands.
          </p>
        </div>
      </div>
    </section>

    <!-- Icon Legend -->
    <section class="card bg-white shadow-lg border border-primary/30">
      <div class="card-body">
        <div class="flex items-center gap-3 mb-6">
          <HelpCircle class="h-6 w-6 text-primary" />
          <h2 class="text-2xl font-bold text-primary">Icon Legend</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Navigation Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Navigation</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <Home class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Meals & Meal Plans</span>
              </div>
              <div class="flex items-center gap-3">
                <TableCellsSplit class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Pantry</span>
              </div>
              <div class="flex items-center gap-3">
                <ShoppingCart class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Shopping Lists</span>
              </div>
              <div class="flex items-center gap-3">
                <Settings class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Settings</span>
              </div>
              <div class="flex items-center gap-3">
                <Info class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">About</span>
              </div>
            </div>
          </div>

          <!-- Management Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Management</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <Tag class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Categories</span>
              </div>
              <div class="flex items-center gap-3">
                <Filter class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Meal Filters</span>
              </div>
              <div class="flex items-center gap-3">
                <Store class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Grocery Stores</span>
              </div>
              <div class="flex items-center gap-3">
                <Palette class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Theme Colors</span>
              </div>
            </div>
          </div>

          <!-- Action Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Actions</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <ChefHat class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Has Recipe</span>
              </div>
              <div class="flex items-center gap-3">
                <Edit3 class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Edit</span>
              </div>
              <div class="flex items-center gap-3">
                <Printer class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Print</span>
              </div>
              <div class="flex items-center gap-3">
                <Plus class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Add New</span>
              </div>
              <div class="flex items-center gap-3">
                <Trash2 class="h-4 w-4 text-red-500" />
                <span class="text-primary/70 text-sm">Delete</span>
              </div>
            </div>
          </div>

          <!-- Shopping Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Shopping</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <ListChecks class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Have This</span>
              </div>
              <div class="flex items-center gap-3">
                <ArrowRightLeft class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Move To Store/List</span>
              </div>
              <div class="flex items-center gap-3">
                <ChevronUp class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Move Up</span>
              </div>
              <div class="flex items-center gap-3">
                <ChevronDown class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Move Down</span>
              </div>
            </div>
          </div>

          <!-- Status Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Status & Controls</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <Check class="h-4 w-4 text-green-500" />
                <span class="text-primary/70 text-sm">Complete/Selected</span>
              </div>
              <div class="flex items-center gap-3">
                <X class="h-4 w-4 text-red-500" />
                <span class="text-primary/70 text-sm">Cancel/Close</span>
              </div>
              <div class="flex items-center gap-3">
                <Search class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Search</span>
              </div>
              <div class="flex items-center gap-3">
                <Menu class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Menu</span>
              </div>
              <div class="flex items-center gap-3">
                <Calendar class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Meal Planning</span>
              </div>
            </div>
          </div>

          <!-- Import Icons -->
          <div>
            <h3 class="text-lg font-semibold text-primary mb-3">Import & Upload</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <Camera class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Take Photo</span>
              </div>
              <div class="flex items-center gap-3">
                <Upload class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Upload File</span>
              </div>
              <div class="flex items-center gap-3">
                <ArrowLeft class="h-4 w-4 text-primary" />
                <span class="text-primary/70 text-sm">Back/Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Version 1.1.0 -->
    <section class="card bg-white shadow-lg border border-primary/30 mb-6">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-primary">Version 1.1.0</h2>
          <span class="badge badge-primary">Latest</span>
        </div>
        <p class="text-sm text-primary/60 mb-6">Released October 2025</p>
        
        <div class="space-y-4">
          <!-- New Features -->
          <div>
            <h3 class="flex items-center gap-2 text-lg font-semibold text-primary mb-3">
              <CheckCircle class="h-5 w-5 text-green-500" />
              New Features
            </h3>
            <ul class="space-y-2 text-primary/70">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Dynamic Theme System:</strong> Choose from 8 beautiful color themes including Purple, Blue, Green, Red, Orange, Pink, Indigo, and Cyan. Your entire app adapts to your chosen theme!</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Streamlined Navigation:</strong> Moved all page titles to the header for a cleaner, more consistent experience across the app.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Enhanced Mobile Experience:</strong> Improved mobile menu and notification styling with solid backgrounds and better touch targets.</span>
              </li>
            </ul>
          </div>

          <!-- Improvements -->
          <div>
            <h3 class="flex items-center gap-2 text-lg font-semibold text-primary mb-3">
              <Star class="h-5 w-5 text-yellow-500" />
              Improvements
            </h3>
            <ul class="space-y-2 text-primary/70">
              <li class="flex items-start gap-2">
                <span class="text-yellow-500 mt-1">•</span>
                <span><strong>Simplified Recipe Management:</strong> Removed the separate recipes page - all recipe functionality is now integrated into the meals workflow for a more intuitive experience.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-500 mt-1">•</span>
                <span><strong>Better Button Styling:</strong> Fixed conflicting button styles and improved consistency across all components.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-500 mt-1">•</span>
                <span><strong>Enhanced Settings Organization:</strong> Reorganized settings cards for better logical flow and user experience.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-500 mt-1">•</span>
                <span><strong>Improved Form Elements:</strong> All inputs, dropdowns, and form controls now properly use theme colors.</span>
              </li>
            </ul>
          </div>

          <!-- User Feedback Responses -->
          <div>
            <h3 class="flex items-center gap-2 text-lg font-semibold text-primary mb-3">
              <MessageSquare class="h-5 w-5 text-blue-500" />
              User Feedback Responses
            </h3>
            <ul class="space-y-2 text-primary/70">
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span><strong>"Can we have different colors?"</strong> - We heard you! The new theme system lets you choose from 8 different color schemes.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span><strong>"The recipes page is confusing"</strong> - We've simplified this by integrating recipe management directly into meals, making the workflow more intuitive.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span><strong>"Mobile experience needs work"</strong> - We've improved mobile menus, notifications, and touch targets throughout the app.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span><strong>"Checkboxes are hard to see"</strong> - Our new custom checkboxes are beautiful, accessible, and work perfectly with all themes.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Version 1.0.0 -->
    <section class="card bg-white shadow-lg border border-primary/30 mb-6">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-primary">Version 1.0.0</h2>
          <span class="badge badge-outline">Initial Release</span>
        </div>
        <p class="text-sm text-primary/60 mb-6">Released September 2025</p>
        
        <div class="space-y-4">
          <div>
            <h3 class="flex items-center gap-2 text-lg font-semibold text-primary mb-3">
              <CheckCircle class="h-5 w-5 text-green-500" />
              Initial Features
            </h3>
            <ul class="space-y-2 text-primary/70">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Meal Planning:</strong> Create and manage meal plans with custom categories and filters.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Shopping Lists:</strong> Generate organized shopping lists based on your meal plans.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Recipe Management:</strong> Add recipes to meals with ingredients and instructions.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Pantry Tracking:</strong> Keep track of items you already have at home.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Store Organization:</strong> Organize shopping lists by store for efficient shopping trips.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span><strong>Photo Import:</strong> Import recipes from photos using AI-powered text recognition.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Coming Soon -->
    <section class="card bg-white shadow-lg border border-primary/30 mb-6">
      <div class="card-body">
        <div class="flex items-center gap-2 mb-4">
          <AlertCircle class="h-6 w-6 text-orange-500" />
          <h2 class="text-xl font-bold text-primary">Coming Soon</h2>
        </div>
        
        <div class="space-y-3 text-primary/70">
          <strong>Here's our ideas and suggestions from the community we're thinking about:</strong>
          <p class="flex items-start gap-2">
            <span class="text-orange-500 mt-1">•</span>
            <span><strong>Meal Sharing:</strong> Share meal plans and recipes with family and friends.</span>
          </p>
          <p class="flex items-start gap-2">
            <span class="text-orange-500 mt-1">•</span>
            <span><strong>Export Features:</strong> Export meal plans and shopping lists to PDF or other formats.</span>
          </p>
          <p class="flex items-start gap-2">
              <span class="text-orange-500 mt-1">•</span>
              <span><strong>Nutrition Info:</strong> We want to add nutrition information to meals and recipes if that is helpful to you. Let us know if you'd like this feature.</span>
            </p>
            <p class="flex items-start gap-2">
              <span class="text-orange-500 mt-1">•</span>
              <span><strong>Cost Tracking:</strong> How much does a meal cost? Would this feature help you plan your meals and stay within your budget?</span>
            </p>
          <br />
          <strong>What's next?</strong>
          <br />You tell us! We want to make this the best it can be for you. 
          If you have any ideas or suggestions, please let us know.
        </div>
      </div>
    </section>

    <!-- Have Feedback Section -->
    <FeedbackSection />
    
  </div>
</main>
