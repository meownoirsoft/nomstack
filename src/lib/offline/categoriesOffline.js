// Offline-first categories management
import { offlineData } from './dataManager.js';

export class CategoriesOffline {
  // Get all categories
  async getCategories() {
    return await offlineData.getCategories({
      orderBy: 'name'
    });
  }

  // Create a new category
  async createCategory(categoryData) {
    return await offlineData.createCategory({
      name: categoryData.name,
      user_id: categoryData.user_id
    });
  }

  // Update a category
  async updateCategory(id, changes) {
    return await offlineData.updateCategory(id, changes);
  }

  // Delete a category
  async deleteCategory(id) {
    return await offlineData.deleteCategory(id);
  }

  // Get category by ID
  async getCategory(id) {
    return await offlineData.read('categories', id);
  }
}

// Create global instance
export const categoriesOffline = new CategoriesOffline();

export default categoriesOffline;
