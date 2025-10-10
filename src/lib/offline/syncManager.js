import { db } from './database.js';
import { api } from '../api.js';

// Sync queue management
export class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryDelay = 5000; // 5 seconds
    this.maxRetries = 3;
  }

  // Add operation to sync queue
  async queueOperation(operation, table, data) {
    const queueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation, // 'create', 'update', 'delete'
      table,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      error: null
    };

    await db.syncQueue.add(queueItem);
    
    // No automatic sync triggering - user must manually trigger syncs
  }

  // Main sync function
  async sync(force = false) {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    const syncStartTime = Date.now();
    
    try {
      // Check if we need to sync by comparing timestamps (unless forced)
      if (!force) {
        const needsSync = await this.checkIfSyncNeeded();
        if (!needsSync) {
          console.log('🔄 No sync needed - data is up to date');
          return;
        }
      }

      // Process pending queue items
      const queueItems = await db.syncQueue.where('status').equals('pending').count();
      await this.processSyncQueue();
      
      // Pull latest changes from server
      await this.pullFromServer();
      
      // Update sync status
      const deviceId = localStorage.getItem('nomstack_device_id');
      await db.syncStatus.update(deviceId, { 
        lastSyncTime: Date.now() 
      });
      
      // Single summary log
      const syncDuration = Date.now() - syncStartTime;
      console.log(`🔄 Sync completed in ${syncDuration}ms (${queueItems} queue items processed)`);
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Force sync (bypass timestamp check)
  async forceSync() {
    return await this.sync(true);
  }

  // Check if sync is needed by comparing server and local timestamps
  async checkIfSyncNeeded() {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('sb-access-token');
      if (!token) {
        console.log('🔄 No auth token, skipping sync check');
        return false;
      }

      // Get server's last updated timestamp
      const serverStatus = await api.getSyncStatus();
      if (!serverStatus || !serverStatus.success || !serverStatus.lastUpdated) {
        // If we can't get server status, assume we need to sync
        console.log('🔄 Cannot get server sync status, assuming sync needed');
        return true;
      }

      const serverLastUpdated = new Date(serverStatus.lastUpdated).getTime();
      
      // Get our last sync time
      const deviceId = localStorage.getItem('nomstack_device_id');
      const localSyncStatus = await db.syncStatus.get(deviceId);
      
      if (!localSyncStatus || !localSyncStatus.lastSyncTime) {
        // Never synced before, need to sync
        console.log('🔄 Never synced before, sync needed');
        return true;
      }

      const localLastSync = localSyncStatus.lastSyncTime;
      
      // Check if server data is newer than our last sync
      const needsSync = serverLastUpdated > localLastSync;
      
      if (needsSync) {
        console.log(`🔄 Server data updated ${new Date(serverLastUpdated).toLocaleString()}, last sync ${new Date(localLastSync).toLocaleString()}`);
      }
      
      return needsSync;
      
    } catch (error) {
      console.error('Error checking sync status:', error);
      // If we can't check, assume we need to sync
      return true;
    }
  }

  // Process items in sync queue
  async processSyncQueue() {
    const pendingItems = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    for (const item of pendingItems) {
      try {
        await this.processQueueItem(item);
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        await this.handleQueueItemError(item, error);
      }
    }
  }

  // Process individual queue item
  async processQueueItem(item) {
    const { operation, table, data } = item;
    
    switch (operation) {
      case 'create':
        await this.pushCreateToServer(table, data);
        break;
      case 'update':
        await this.pushUpdateToServer(table, data);
        break;
      case 'delete':
        await this.pushDeleteToServer(table, data);
        break;
    }
    
    // Mark as synced
    await db.syncQueue.update(item.id, { 
      status: 'synced',
      error: null 
    });
    
    // Mark local record as synced
    await db[table].update(data.id, { synced: true });
  }

  // Push create operation to server
  async pushCreateToServer(table, data) {
    let response;
    
    switch (table) {
      case 'meals':
        response = await api.addMeal(data);
        break;
      case 'recipes':
        // Recipes are added through meals, so we'll handle this in the meal sync
        return;
      case 'categories':
        response = await api.addCategory(data);
        break;
      case 'mealPlans':
        response = await api.createMealPlan(data);
        break;
      case 'stores':
        response = await api.createStore(data);
        break;
      case 'ingredients':
        response = await api.createIngredient(data);
        break;
      case 'mealFilters':
        response = await api.updateMealFilters([data]);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
    
    // Update local record with server response
    if (response && response.id) {
      await db[table].update(data.id, {
        ...response,
        synced: true,
        lastModified: Date.now()
      });
    }
  }

  // Push update operation to server
  async pushUpdateToServer(table, data) {
    let response;
    
    switch (table) {
      case 'meals':
        response = await api.updateMeal(data);
        break;
      case 'recipes':
        // Recipes are updated through meals, so we'll handle this in the meal sync
        return;
      case 'categories':
        response = await api.updateCategory(data);
        break;
      case 'mealPlans':
        response = await api.updateMealPlan(data);
        break;
      case 'stores':
        response = await api.updateStore(data);
        break;
      case 'ingredients':
        response = await api.updateIngredient(data);
        break;
      case 'mealFilters':
        response = await api.updateMealFilters([data]);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
    
    if (response) {
      await db[table].update(data.id, {
        ...response,
        synced: true,
        lastModified: Date.now()
      });
    }
  }

  // Push delete operation to server
  async pushDeleteToServer(table, data) {
    switch (table) {
      case 'meals':
        await api.deleteMeal(data.id);
        break;
      case 'recipes':
        // Recipes are deleted through meals, so we'll handle this in the meal sync
        return;
      case 'categories':
        await api.deleteCategory(data.id);
        break;
      case 'mealPlans':
        await api.deleteMealPlan(data.id);
        break;
      case 'stores':
        await api.deleteStore(data.id);
        break;
      case 'ingredients':
        await api.deleteIngredient(data.id);
        break;
      case 'mealFilters':
        // For meal filters, we need to get all filters and remove the one being deleted
        const allFilters = await api.getMealFilters();
        const updatedFilters = allFilters.data.filter(f => f.id !== data.id);
        await api.updateMealFilters(updatedFilters);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  // Pull latest changes from server
  async pullFromServer() {
    const tables = ['meals', 'categories', 'mealPlans', 'stores', 'ingredients', 'mealFilters'];
    
    for (const table of tables) {
      try {
        await this.pullTableFromServer(table);
      } catch (error) {
        console.error(`Failed to pull ${table} from server:`, error);
      }
    }
  }

  // Pull specific table from server
  async pullTableFromServer(table) {
    try {
      let response;
      
      switch (table) {
        case 'meals':
          response = await api.getMeals();
          break;
        case 'recipes':
          // Get recipes through meals since there's no direct recipes endpoint
          try {
            const mealsResponse = await api.getMeals();
            if (mealsResponse && mealsResponse.data) {
              const recipes = [];
              let mealsWithoutRecipes = 0;
              // Limit to first 10 meals to avoid overwhelming the server during sync
              const mealsToCheck = mealsResponse.data.slice(0, 10);
              for (const meal of mealsToCheck) {
                try {
                  const recipeResponse = await api.getRecipe(meal.id);
                  if (recipeResponse && recipeResponse.recipe) {
                    recipes.push({
                      ...recipeResponse.recipe,
                      meal_id: meal.id
                    });
                  } else {
                    mealsWithoutRecipes++;
                  }
                } catch (error) {
                  mealsWithoutRecipes++;
                }
              }
              if (mealsWithoutRecipes > 0) {
                console.log(`Recipes sync: ${recipes.length} recipes found, ${mealsWithoutRecipes} meals without recipes`);
              }
              response = { data: recipes };
            }
          } catch (error) {
            console.error('Failed to get recipes during sync:', error);
            // Return empty array to avoid breaking the sync
            response = { data: [] };
          }
          break;
        case 'categories':
          response = await api.getCategories();
          break;
        case 'mealPlans':
          response = await api.getMealPlans();
          break;
        case 'stores':
          response = await api.getStores();
          break;
        case 'ingredients':
          response = await api.getIngredients();
          break;
        case 'mealFilters':
          response = await api.getMealFilters();
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }
      
      if (response && response.data) {
        // Update local database with server data
        await db[table].clear();
        await db[table].bulkAdd(response.data);
        // Only log if there's data to avoid spam
        if (response.data.length > 0) {
          console.log(`Pulled ${response.data.length} ${table} from server`);
        }
      }
    } catch (error) {
      console.error(`Failed to pull ${table} from server:`, error);
      throw error;
    }
  }

  // Resolve conflicts using last-write-wins
  async resolveConflict(table, serverRecord) {
    const localRecord = await db[table].get(serverRecord.id);
    
    if (!localRecord) {
      // Server only - pull to local
      await db[table].put({
        ...serverRecord,
        synced: true
      });
    } else if (!localRecord.synced) {
      // Local has unsynced changes - check timestamps
      if (serverRecord.lastModified > localRecord.lastModified) {
        // Server is newer - pull to local
        await db[table].put({
          ...serverRecord,
          synced: true
        });
      }
      // If local is newer, it will be synced via queue
    } else {
      // Both synced - server wins if timestamps equal, newer wins otherwise
      if (serverRecord.lastModified >= localRecord.lastModified) {
        await db[table].put({
          ...serverRecord,
          synced: true
        });
      }
    }
  }

  // Handle queue item errors
  async handleQueueItemError(item, error) {
    const newRetryCount = item.retryCount + 1;
    
    if (newRetryCount >= this.maxRetries) {
      // Max retries reached - mark as failed
      await db.syncQueue.update(item.id, {
        status: 'failed',
        retryCount: newRetryCount,
        error: error.message
      });
    } else {
      // Retry later
      await db.syncQueue.update(item.id, {
        retryCount: newRetryCount,
        error: error.message
      });
      
      // Schedule retry
      setTimeout(() => {
        this.triggerSync();
      }, this.retryDelay * newRetryCount);
    }
  }


  // Sync recipes on demand (for recipes page)
  async syncRecipes() {
    try {
      console.log('Syncing recipes on demand...');
      await this.pullTableFromServer('recipes');
      console.log('Recipes sync completed');
    } catch (error) {
      console.error('Failed to sync recipes:', error);
    }
  }

  // Start periodic sync
  startPeriodicSync(intervalMs = 30000) { // 30 seconds
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        // Check if user is authenticated before attempting sync
        try {
          const token = localStorage.getItem('sb-access-token');
          if (token) {
            await this.triggerSync();
          }
        } catch (error) {
          // Silently ignore sync errors during periodic sync
          console.log('Periodic sync skipped:', error.message);
        }
      }
    }, intervalMs);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Trigger sync (public method)
  async triggerSync() {
    if (navigator.onLine && !this.isSyncing) {
      this.sync();
    }
  }
}

// Create global sync manager instance
export const syncManager = new SyncManager();

// Export convenience functions
export const triggerSync = () => syncManager.triggerSync();
export const syncRecipes = () => syncManager.syncRecipes();
