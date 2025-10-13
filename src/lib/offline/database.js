import Dexie from 'dexie';

// Create the offline database
export const db = new Dexie('nomstack_offline');

// Define the database schema
db.version(1).stores({
  // Core data tables
  meals: 'id, name, category_id, created_at, lastModified, version, deviceId, synced',
  recipes: 'id, meal_id, title, ingredients, instructions, servings, prep_time, cook_time, created_at, lastModified, version, deviceId, synced',
  categories: 'id, name, user_id, created_at, lastModified, version, deviceId, synced',
  mealPlans: 'id, user_id, title, start_date, end_date, created_at, lastModified, version, deviceId, synced',
  mealPlanSelections: 'id, plan_id, meal_id, created_at, lastModified, version, deviceId, synced',
  stores: 'id, user_id, name, section_order, last_used, created_at, lastModified, version, deviceId, synced',
  shoppingLists: 'id, plan_id, store_id, title, status, created_at, lastModified, version, deviceId, synced',
  ingredients: 'id, user_id, plan_id, store_id, name, amount, unit, is_custom, checked, deemphasized, source_recipe_id, category, created_at, lastModified, version, deviceId, synced',
  mealFilters: 'id, user_id, category_id, name, order, is_default, is_system, created_at, lastModified, version, deviceId, synced',
  
  // Sync management
  syncQueue: 'id, operation, table, data, timestamp, status, retryCount, error',
  syncStatus: 'id, lastSyncTime, deviceId, isOnline'
});

// Add hooks for automatic timestamp management
db.meals.hook('creating', function (primKey, obj, trans) {
  obj.created_at = obj.created_at || new Date().toISOString();
  obj.lastModified = Date.now();
  obj.version = 1;
  obj.deviceId = getDeviceId();
  obj.synced = false;
});

db.meals.hook('updating', function (modifications, primKey, obj, trans) {
  modifications.lastModified = Date.now();
  modifications.version = (obj.version || 1) + 1;
  modifications.synced = false;
});

// Apply same hooks to all tables
const tables = ['recipes', 'categories', 'mealPlans', 'mealPlanSelections', 'stores', 'shoppingLists', 'ingredients', 'mealFilters'];

tables.forEach(tableName => {
  db[tableName].hook('creating', function (primKey, obj, trans) {
    obj.created_at = obj.created_at || new Date().toISOString();
    obj.lastModified = Date.now();
    obj.version = 1;
    obj.deviceId = getDeviceId();
    obj.synced = false;
  });

  db[tableName].hook('updating', function (modifications, primKey, obj, trans) {
    modifications.lastModified = Date.now();
    modifications.version = (obj.version || 1) + 1;
    modifications.synced = false;
  });
});

// Safe localStorage access
function safeLocalStorage() {
  if (typeof localStorage === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }
  return localStorage;
}

// Generate a unique device ID
function getDeviceId() {
  const storage = safeLocalStorage();
  let deviceId = storage.getItem('nomstack_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    storage.setItem('nomstack_device_id', deviceId);
  }
  return deviceId;
}

// Initialize sync status
export async function initializeSyncStatus() {
  const deviceId = getDeviceId();
  const existing = await db.syncStatus.get(deviceId);
  if (!existing) {
    await db.syncStatus.put({
      id: deviceId,
      lastSyncTime: 0,
      deviceId,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    });
  }
}

// Network status monitoring
export function setupNetworkMonitoring() {
  if (typeof window === 'undefined') {
    return;
  }
  
  const updateOnlineStatus = async () => {
    const deviceId = getDeviceId();
    await db.syncStatus.update(deviceId, { isOnline: navigator.onLine });
    
    // No automatic sync triggering - user must manually trigger syncs
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

export default db;
