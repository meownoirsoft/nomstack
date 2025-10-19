<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { hasFeatureAccess } from '$lib/stores/userTier.js';
  import { currentMealPlan } from '$lib/stores/mealPlan.js';
  import { user } from '$lib/stores/auth.js';
  import { X, Copy, Calendar, Link, Users, MessageSquare, Clock } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let mealPlanId = null;

  let shareLink = null;
  let expiresAt = null;
  let loading = false;
  let copying = false;
  let showExpiryPicker = false;

  // Use mealPlanId prop or current meal plan
  $: activeMealPlanId = mealPlanId || $currentMealPlan?.id;

  onMount(() => {
    if (isOpen && activeMealPlanId) {
      loadShareLink();
    }
  });

  $: if (isOpen && activeMealPlanId) {
    loadShareLink();
  }

  // Clear expiry date when checkbox is unchecked
  $: if (!showExpiryPicker) {
    expiresAt = null;
  }

  async function loadShareLink() {
    if (!activeMealPlanId) return;
    
    try {
      loading = true;
      console.log('Loading share link for meal plan:', activeMealPlanId);
      console.log('User:', $user);
      console.log('User email:', $user?.email);
      
      const result = await api.getShareLink(activeMealPlanId);
      if (result.success) {
        shareLink = result.data;
        expiresAt = shareLink?.expires_at ? new Date(shareLink.expires_at) : null;
        showExpiryPicker = !!expiresAt;
      }
    } catch (error) {
      console.error('Error loading share link:', error);
      console.error('Error details:', error.message);
    } finally {
      loading = false;
    }
  }

  async function createShareLink() {
    if (!activeMealPlanId) return;

    try {
      loading = true;
      const result = await api.createShareLink(activeMealPlanId, expiresAt);
      if (result.success) {
        shareLink = result.data;
        notifySuccess('Share link created!');
      } else {
        notifyError(result.error);
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      notifyError('Failed to create share link');
    } finally {
      loading = false;
    }
  }

  async function regenerateLink() {
    if (!activeMealPlanId) return;

    try {
      loading = true;
      const result = await api.regenerateShareLink(activeMealPlanId, expiresAt);
      if (result.success) {
        shareLink = result.data;
        notifySuccess('Share link regenerated!');
      } else {
        notifyError(result.error);
      }
    } catch (error) {
      console.error('Error regenerating share link:', error);
      notifyError('Failed to regenerate share link');
    } finally {
      loading = false;
    }
  }

  async function copyLink() {
    if (!shareLink?.share_url) return;

    try {
      copying = true;
      await navigator.clipboard.writeText(shareLink.share_url);
      notifySuccess('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      notifyError('Failed to copy link');
    } finally {
      copying = false;
    }
  }

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }


  function getShareUrl() {
    if (!shareLink?.share_url) return '';
    return `${window.location.origin}${shareLink.share_url}`;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6 sm:py-10">
    <div class="relative mt-12 sm:mt-16 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-base-200 px-6 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg">
            <Link class="h-5 w-5 text-primary" />
          </div>
          <h2 class="text-xl font-bold text-primary">Share Shopping List</h2>
        </div>
        <button
          class="btn btn-ghost btn-sm"
          on:click={closeModal}
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      {#if !$user}
        <!-- Not Logged In -->
        <div class="text-center py-8">
          <Users class="h-16 w-16 mx-auto text-primary/40 mb-4" />
          <h3 class="text-lg font-semibold text-primary mb-2">Login Required</h3>
          <p class="text-primary/70 mb-6">
            You need to be logged in to share shopping lists.
          </p>
          <a href="/login" class="btn btn-primary">
            Go to Login
          </a>
        </div>
      {:else if !hasFeatureAccess('smartPantry')}
        <!-- Plus Only Message -->
        <div class="text-center py-8">
          <Users class="h-16 w-16 mx-auto text-primary/40 mb-4" />
          <h3 class="text-lg font-semibold text-primary mb-2">Plus Feature</h3>
          <p class="text-primary/70 mb-6">
            Share your shopping list with family members so they can add items and leave comments.
          </p>
          <a href="/upgrade" class="btn btn-primary">
            Upgrade to Plus
          </a>
        </div>
      {:else if loading}
        <!-- Loading State -->
        <div class="text-center py-8">
          <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p class="text-primary/70">Loading...</p>
        </div>
      {:else if !shareLink}
        <!-- No Share Link -->
        <div class="space-y-6">
          <div class="text-center">
            <MessageSquare class="h-12 w-12 mx-auto text-primary/40 mb-4" />
            <h3 class="text-lg font-semibold text-primary mb-2">Create Share Link</h3>
            <p class="text-primary/70 mb-6">
              Generate a secure link to share with family members. They can add items and leave comments on your shopping list.
            </p>
          </div>

          <!-- Expiry Options -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="set-expiry"
                bind:checked={showExpiryPicker}
                class="checkbox checkbox-primary"
              />
              <label for="set-expiry" class="text-sm text-primary">
                Set expiration date (optional)
              </label>
            </div>

            {#if showExpiryPicker}
              <div class="flex items-center gap-3">
                <Calendar class="h-4 w-4 text-primary/60" />
                <input
                  type="datetime-local"
                  bind:value={expiresAt}
                  class="input input-bordered input-sm flex-1"
                />
              </div>
            {/if}
          </div>

          <button
            class="btn btn-primary w-full"
            on:click={createShareLink}
            disabled={loading}
          >
            <Link class="h-4 w-4" />
            Create Share Link
          </button>
        </div>
      {:else}
        <!-- Share Link Exists -->
        <div class="space-y-6">
          <div class="text-center">
            <div class="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
              <Link class="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h3 class="text-lg font-semibold text-green-800">Share Link Active</h3>
            </div>
          </div>

          <!-- Share URL -->
          <div class="space-y-3">
            <label class="text-sm font-medium text-primary">Share this link:</label>
            <div class="flex gap-2">
              <input
                type="text"
                value={getShareUrl()}
                readonly
                class="input input-bordered flex-1 text-sm"
              />
              <button
                class="btn btn-outline btn-sm"
                on:click={copyLink}
                disabled={copying}
              >
                {#if copying}
                  <div class="loading loading-spinner loading-xs"></div>
                {:else}
                  <Copy class="h-4 w-4" />
                {/if}
              </button>
            </div>
          </div>

          <!-- Expiry Info -->
          {#if shareLink.expires_at}
            <div class="flex items-center gap-2 text-sm text-primary/70">
              <Clock class="h-4 w-4" />
              <span>Expires: {new Date(shareLink.expires_at).toLocaleDateString()}</span>
            </div>
          {:else}
            <div class="flex items-center gap-2 text-sm text-primary/70">
              <Clock class="h-4 w-4" />
              <span>Never expires</span>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="btn btn-outline flex-1"
              on:click={regenerateLink}
              disabled={loading}
            >
              Regenerate Link
            </button>
            <button
              class="btn btn-primary flex-1"
              on:click={copyLink}
              disabled={copying}
            >
              {#if copying}
                <div class="loading loading-spinner loading-xs"></div>
              {:else}
                <Copy class="h-4 w-4" />
              {/if}
              Copy Link
            </button>
          </div>

          <!-- Info -->
          <div class="text-xs text-primary/60 space-y-1">
            <p>• Family members can add items to your List tab</p>
            <p>• They can leave comments on existing items</p>
            <p>• You have full control over all changes</p>
            <p>• Regenerate link if compromised</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
