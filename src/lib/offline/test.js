// Simple test to verify offline system functionality
import { offlineData } from './dataManager.js';
import { initializeOfflineSystem } from './index.js';

export async function testOfflineSystem() {
  console.log('🧪 Testing offline system...');
  
  try {
    // Initialize the system
    console.log('1. Initializing offline system...');
    await initializeOfflineSystem();
    console.log('✅ Offline system initialized');
    
    // Test creating a category
    console.log('2. Testing category creation...');
    const testCategory = await offlineData.createCategory({
      name: 'Test Category',
      user_id: 'test-user-id'
    });
    console.log('✅ Category created:', testCategory);
    
    // Test reading categories
    console.log('3. Testing category reading...');
    const categories = await offlineData.getCategories();
    console.log('✅ Categories read:', categories.length, 'categories found');
    
    // Test updating a category
    console.log('4. Testing category update...');
    const updatedCategory = await offlineData.updateCategory(testCategory.id, {
      name: 'Updated Test Category'
    });
    console.log('✅ Category updated:', updatedCategory);
    
    // Test sync status
    console.log('5. Testing sync status...');
    const syncStatus = await offlineData.getSyncStatus();
    console.log('✅ Sync status:', syncStatus);
    
    // Test deleting a category
    console.log('6. Testing category deletion...');
    await offlineData.deleteCategory(testCategory.id);
    console.log('✅ Category deleted');
    
    console.log('🎉 All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test if in browser and not in production
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Uncomment the line below to run tests automatically
  // testOfflineSystem();
}
