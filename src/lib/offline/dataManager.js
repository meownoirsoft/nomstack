import { db } from './database.js';
import { syncManager } from './syncManager.js';

// Offline-first data manager
export class OfflineDataManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the offline data manager
  async initialize() {
    if (this.isInitialized) return;
    
    // Initialize database
    await db.open();
    
    // Initialize sync status
    const { initializeSyncStatus, setupNetworkMonitoring } = await import('./database.js');
    await initializeSyncStatus();
    setupNetworkMonitoring();
    
    // Start periodic sync after a delay to ensure user is fully authenticated
    setTimeout(() => {
      syncManager.startPeriodicSync();
    }, 5000); // 5 second delay
    
    this.isInitialized = true;
  }

  // Generic CRUD operations
  async create(table, data) {
    await this.ensureInitialized();
    
    // Add to local database (hooks will add timestamps)
    const id = data.id || this.generateId();
    const record = { ...data, id };
    
    await db[table].add(record);
    
    // Queue for sync
    await syncManager.queueOperation('create', table, record);
    
    return record;
  }

  async read(table, id) {
    await this.ensureInitialized();
    return await db[table].get(id);
  }

  async readAll(table, filters = {}) {
    await this.ensureInitialized();
    
    let query = db[table].toCollection();
    
    // Apply filters
    if (filters.where) {
      query = query.filter(filters.where);
    }
    
    if (filters.orderBy) {
      query = query.sortBy(filters.orderBy);
    }
    
    return await query;
  }

  async update(table, id, changes) {
    await this.ensureInitialized();
    
    // Get current record
    const currentRecord = await db[table].get(id);
    if (!currentRecord) {
      throw new Error(`Record with id ${id} not found in ${table}`);
    }
    
    // Update local database (hooks will add timestamps)
    await db[table].update(id, changes);
    
    // Get updated record
    const updatedRecord = await db[table].get(id);
    
    // Queue for sync
    await syncManager.queueOperation('update', table, updatedRecord);
    
    return updatedRecord;
  }

  async delete(table, id) {
    await this.ensureInitialized();
    
    // Get record before deletion
    const record = await db[table].get(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found in ${table}`);
    }
    
    // Delete from local database
    await db[table].delete(id);
    
    // Queue for sync
    await syncManager.queueOperation('delete', table, record);
    
    return true;
  }

  // Specific methods for each data type
  async createMeal(mealData) {
    return await this.create('meals', mealData);
  }

  async getMeals(filters = {}) {
    return await this.readAll('meals', filters);
  }

  async updateMeal(id, changes) {
    return await this.update('meals', id, changes);
  }

  async deleteMeal(id) {
    return await this.delete('meals', id);
  }

  async createRecipe(recipeData) {
    return await this.create('recipes', recipeData);
  }

  async getRecipes(filters = {}) {
    return await this.readAll('recipes', filters);
  }

  async updateRecipe(id, changes) {
    return await this.update('recipes', id, changes);
  }

  async deleteRecipe(id) {
    return await this.delete('recipes', id);
  }

  async createCategory(categoryData) {
    return await this.create('categories', categoryData);
  }

  async getCategories(filters = {}) {
    return await this.readAll('categories', filters);
  }

  async updateCategory(id, changes) {
    return await this.update('categories', id, changes);
  }

  async deleteCategory(id) {
    return await this.delete('categories', id);
  }

  async createMealPlan(mealPlanData) {
    return await this.create('mealPlans', mealPlanData);
  }

  async getMealPlans(filters = {}) {
    return await this.readAll('mealPlans', filters);
  }

  async updateMealPlan(id, changes) {
    return await this.update('mealPlans', id, changes);
  }

  async deleteMealPlan(id) {
    return await this.delete('mealPlans', id);
  }

  async createStore(storeData) {
    return await this.create('stores', storeData);
  }

  async getStores(filters = {}) {
    return await this.readAll('stores', filters);
  }

  async updateStore(id, changes) {
    return await this.update('stores', id, changes);
  }

  async deleteStore(id) {
    return await this.delete('stores', id);
  }

  async createIngredient(ingredientData) {
    return await this.create('ingredients', ingredientData);
  }

  async getIngredients(filters = {}) {
    return await this.readAll('ingredients', filters);
  }

  async updateIngredient(id, changes) {
    return await this.update('ingredients', id, changes);
  }

  async deleteIngredient(id) {
    return await this.delete('ingredients', id);
  }

  async createMealFilter(mealFilterData) {
    return await this.create('mealFilters', mealFilterData);
  }

  async getMealFilters(filters = {}) {
    return await this.readAll('mealFilters', filters);
  }

  async updateMealFilter(id, changes) {
    return await this.update('mealFilters', id, changes);
  }

  async deleteMealFilter(id) {
    return await this.delete('mealFilters', id);
  }

  // Utility methods
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Sync status
  async getSyncStatus() {
    await this.ensureInitialized();
    
    const deviceId = localStorage.getItem('nomstack_device_id');
    const status = await db.syncStatus.get(deviceId);
    const pendingCount = await db.syncQueue.where('status').equals('pending').count();
    const failedCount = await db.syncQueue.where('status').equals('failed').count();
    
    return {
      ...status,
      pendingSyncCount: pendingCount,
      failedSyncCount: failedCount,
      isOnline: navigator.onLine
    };
  }

  // Force sync
  async forceSync() {
    await this.ensureInitialized();
    await syncManager.triggerSync();
  }

  // Clear all data (for testing/reset)
  async clearAllData() {
    await this.ensureInitialized();
    await db.clear();
  }
}

// Create global instance
export const offlineData = new OfflineDataManager();

export default offlineData;
