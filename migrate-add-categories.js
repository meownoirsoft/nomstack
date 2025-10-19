#!/usr/bin/env node

// Migration script to add "Dessert" and "Side" categories to all existing users
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Try different possible environment variable names
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Environment variables found:');
console.log('- supabaseUrl:', supabaseUrl ? 'Found' : 'Missing');
console.log('- supabaseServiceKey:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('Available variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  console.error('Looking for:');
  console.error('- PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateCategories() {
  try {
    console.log('Starting migration to add Dessert and Side categories...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    console.log(`Found ${users.length} users to process`);
    
    let totalAdded = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;
    
    for (const user of users) {
      try {
        // Get existing categories for this user
        const { data: existingCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', user.id);
        
        if (categoriesError) {
          console.error(`Error fetching categories for user ${user.id}:`, categoriesError.message);
          continue;
        }
        
        const existingNames = existingCategories?.map(cat => cat.name) || [];
        
        // Define the new categories we want to add
        const newCategories = [
          { name: 'Dessert', color: '#ec4899', sort_order: 5 },
          { name: 'Side', color: '#84cc16', sort_order: 6 }
        ];
        
        // Filter out categories that already exist
        const categoriesToAdd = newCategories.filter(cat => !existingNames.includes(cat.name));
        
        if (categoriesToAdd.length === 0) {
          usersSkipped++;
          continue;
        }
        
        // Add the missing categories
        const { data: addedCategories, error: insertError } = await supabase
          .from('categories')
          .insert(
            categoriesToAdd.map(cat => ({
              user_id: user.id,
              name: cat.name,
              color: cat.color,
              sort_order: cat.sort_order
            }))
          )
          .select('id, name');
        
        if (insertError) {
          console.error(`Error adding categories for user ${user.id}:`, insertError.message);
          continue;
        }
        
        totalAdded += addedCategories.length;
        usersProcessed++;
        
        console.log(`User ${user.id}: Added ${addedCategories.length} categories (${addedCategories.map(c => c.name).join(', ')})`);
        
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error.message);
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Users processed: ${usersProcessed}`);
    console.log(`Users skipped (already had categories): ${usersSkipped}`);
    console.log(`Total categories added: ${totalAdded}`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateCategories()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
