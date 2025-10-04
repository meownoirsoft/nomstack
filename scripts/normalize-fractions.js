#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeFractions(text) {
  if (!text) return text;
  
  let normalized = text;
  normalized = normalized.replace(/¼/g, '1/4');
  normalized = normalized.replace(/½/g, '1/2');
  normalized = normalized.replace(/¾/g, '3/4');
  normalized = normalized.replace(/⅓/g, '1/3');
  normalized = normalized.replace(/⅔/g, '2/3');
  
  return normalized;
}

async function normalizeRecipeFractions() {
  console.log('Starting fraction normalization...');
  
  try {
    // Get all recipes
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, ingredients, instructions');
    
    if (fetchError) {
      console.error('Error fetching recipes:', fetchError);
      return;
    }
    
    console.log(`Found ${recipes.length} recipes to process`);
    
    let updatedCount = 0;
    
    for (const recipe of recipes) {
      let needsUpdate = false;
      const updates = {};
      
      // Normalize ingredients
      if (recipe.ingredients) {
        const normalizedIngredients = normalizeFractions(recipe.ingredients);
        if (normalizedIngredients !== recipe.ingredients) {
          updates.ingredients = normalizedIngredients;
          needsUpdate = true;
        }
      }
      
      // Normalize instructions
      if (recipe.instructions) {
        const normalizedInstructions = normalizeFractions(recipe.instructions);
        if (normalizedInstructions !== recipe.instructions) {
          updates.instructions = normalizedInstructions;
          needsUpdate = true;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('recipes')
          .update(updates)
          .eq('id', recipe.id);
        
        if (updateError) {
          console.error(`Error updating recipe ${recipe.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated recipe ${recipe.id}`);
        }
      }
    }
    
    console.log(`\nFraction normalization complete!`);
    console.log(`Updated ${updatedCount} out of ${recipes.length} recipes`);
    
  } catch (error) {
    console.error('Error during normalization:', error);
  }
}

// Run the normalization
normalizeRecipeFractions();
