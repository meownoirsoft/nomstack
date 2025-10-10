// Offline-first data management system
import { db } from './database.js';
import { syncManager, triggerSync } from './syncManager.js';
import { offlineData } from './dataManager.js';
import { migrationManager } from './migration.js';

export { db, syncManager, triggerSync, offlineData, migrationManager };

// Initialize the offline system
export async function initializeOfflineSystem() {
  try {
    // Initialize the data manager
    await offlineData.initialize();
    
    // Check if migration is needed
    if (await migrationManager.needsMigration()) {
      console.log('Migration needed, starting...');
      await migrationManager.migrateFromServer();
    }
    
    console.log('Offline system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize offline system:', error);
    return false;
  }
}

// Convenience function to get sync status
export async function getSyncStatus() {
  return await offlineData.getSyncStatus();
}

// Convenience function to force sync
export async function forceSync() {
  return await offlineData.forceSync();
}

export default {
  initializeOfflineSystem,
  getSyncStatus,
  forceSync,
  offlineData,
  syncManager,
  migrationManager
};
