import { db } from './database.js';
import { api } from '../api.js';
import { offlineData } from './dataManager.js';

// Migration utility to seed local database with server data
export class MigrationManager {
  constructor() {
    this.isMigrating = false;
  }

  // Check if migration is needed
  async needsMigration() {
    const deviceId = localStorage.getItem('nomstack_device_id');
    const status = await db.syncStatus.get(deviceId);
    
    // Migration needed if no last sync time or if it's been more than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return !status || !status.lastSyncTime || status.lastSyncTime < oneDayAgo;
  }

  // Perform full migration from server
  async migrateFromServer() {
    if (this.isMigrating) return;
    
    this.isMigrating = true;
    
    try {
      console.log('Starting migration from server...');
      
      // Migrate each data type
      await this.migrateMeals();
      await this.migrateCategories();
      await this.migrateMealPlans();
      await this.migrateStores();
      await this.migrateIngredients();
      await this.migrateMealFilters();
      
      // Update sync status
      const deviceId = localStorage.getItem('nomstack_device_id');
      await db.syncStatus.update(deviceId, {
        lastSyncTime: Date.now(),
        isOnline: navigator.onLine
      });
      
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }

  // Migrate meals
  async migrateMeals() {
    try {
      const serverMeals = await api.getMeals('all');
      if (serverMeals && Array.isArray(serverMeals)) {
        for (const meal of serverMeals) {
          await db.meals.put({
            ...meal,
            synced: true,
            lastModified: Date.now(),
            version: 1,
            deviceId: localStorage.getItem('nomstack_device_id')
          });
        }
        console.log(`Migrated ${serverMeals.length} meals`);
      }
    } catch (error) {
      console.error('Failed to migrate meals:', error);
    }
  }

  // Migrate recipes
  async migrateRecipes() {
    try {
      // Get recipes through meals (since there's no direct recipes endpoint)
      const meals = await db.meals.toArray();
      for (const meal of meals) {
        if (meal.recipe) {
          await db.recipes.put({
            ...meal.recipe,
            synced: true,
            lastModified: Date.now(),
            version: 1,
            deviceId: localStorage.getItem('nomstack_device_id')
          });
        }
      }
      console.log('Migrated recipes from meals');
    } catch (error) {
      console.error('Failed to migrate recipes:', error);
    }
  }

  // Migrate recipes
  async migrateRecipes() {
    try {
      // Get recipes through meals (since there's no direct recipes endpoint)
      const meals = await db.meals.toArray();
      for (const meal of meals) {
        try {
          const recipeResponse = await api.getRecipe(meal.id);
          if (recipeResponse && recipeResponse.recipe) {
            await db.recipes.put({
              ...recipeResponse.recipe,
              meal_id: meal.id,
              synced: true,
              lastModified: Date.now(),
              version: 1,
              deviceId: localStorage.getItem('nomstack_device_id')
            });
          }
        } catch (error) {
          // Some meals might not have recipes, that's ok
          // Some meals don't have recipes, that's ok
        }
      }
      console.log('Migrated recipes from meals');
    } catch (error) {
      console.error('Failed to migrate recipes:', error);
    }
  }

  // Migrate categories
  async migrateCategories() {
    try {
      const serverCategories = await api.getCategories();
      if (serverCategories && Array.isArray(serverCategories)) {
        for (const category of serverCategories) {
          await db.categories.put({
            ...category,
            synced: true,
            lastModified: Date.now(),
            version: 1,
            deviceId: localStorage.getItem('nomstack_device_id')
          });
        }
        console.log(`Migrated ${serverCategories.length} categories`);
      }
    } catch (error) {
      console.error('Failed to migrate categories:', error);
    }
  }

  // Migrate meal plans
  async migrateMealPlans() {
    try {
      // This would need to be implemented based on your meal plans API
      // For now, we'll skip this and let it be created as needed
      console.log('Meal plans migration skipped (to be implemented)');
    } catch (error) {
      console.error('Failed to migrate meal plans:', error);
    }
  }

  // Migrate stores
  async migrateStores() {
    try {
      // This would need to be implemented based on your stores API
      // For now, we'll skip this and let it be created as needed
      console.log('Stores migration skipped (to be implemented)');
    } catch (error) {
      console.error('Failed to migrate stores:', error);
    }
  }

  // Migrate ingredients
  async migrateIngredients() {
    try {
      // This would need to be implemented based on your ingredients API
      // For now, we'll skip this and let it be created as needed
      console.log('Ingredients migration skipped (to be implemented)');
    } catch (error) {
      console.error('Failed to migrate ingredients:', error);
    }
  }

  // Migrate meal filters
  async migrateMealFilters() {
    try {
      const serverFilters = await api.getMealFilters();
      if (serverFilters && serverFilters.success && Array.isArray(serverFilters.data)) {
        for (const filter of serverFilters.data) {
          await db.mealFilters.put({
            ...filter,
            synced: true,
            lastModified: Date.now(),
            version: 1,
            deviceId: localStorage.getItem('nomstack_device_id')
          });
        }
        console.log(`Migrated ${serverFilters.data.length} meal filters`);
      }
    } catch (error) {
      console.error('Failed to migrate meal filters:', error);
    }
  }

  // Check if data exists locally
  async hasLocalData() {
    const mealCount = await db.meals.count();
    const categoryCount = await db.categories.count();
    return mealCount > 0 || categoryCount > 0;
  }

  // Clear local data and re-migrate
  async resetAndMigrate() {
    console.log('Resetting local data and re-migrating...');
    await db.clear();
    await this.migrateFromServer();
  }
}

// Create global instance
export const migrationManager = new MigrationManager();

export default migrationManager;
