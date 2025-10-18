<script>
  import { FileText, CheckCircle, AlertCircle, Star, MessageSquare } from 'lucide-svelte';
  import FeedbackSection from '$lib/components/FeedbackSection.svelte';
</script>

<svelte:head>
  <title>Updates - nomStack</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="flex items-center gap-2 mb-8">
    <FileText class="h-6 w-6 text-primary" />
    <h1 class="text-2xl font-bold text-primary">Updates</h1>
  </div>

  <!-- Version 1.1.0 -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
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
  </div>

  <!-- Version 1.0.0 -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-primary">Version 1.0.0</h2>
        <span class="badge badge-outline">Initial Release</span>
      </div>
      <p class="text-sm text-primary/60 mb-6">Released November 2024</p>
      
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
  </div>

  <!-- Coming Soon -->
  <div class="card bg-base-100 shadow-lg border border-primary/30 mb-6">
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
  </div>

  <!-- Feedback -->
  <FeedbackSection />
</div>
