/**
 * Recipe comparison and merging utilities
 */

/**
 * Calculate similarity between two recipe titles
 * @param {string} title1 
 * @param {string} title2 
 * @returns {number} Similarity score between 0 and 1
 */
export function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const norm1 = normalize(title1);
  const norm2 = normalize(title2);
  
  if (norm1 === norm2) return 1;
  
  // Check if one title contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.8;
  }
  
  // Simple word overlap calculation
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length === 0) return 0;
  
  const maxWords = Math.max(words1.length, words2.length);
  return commonWords.length / maxWords;
}

/**
 * Compare two recipes and determine if they're likely the same
 * @param {Object} existingRecipe 
 * @param {Object} newRecipe 
 * @returns {Object} Comparison result
 */
export function compareRecipes(existingRecipe, newRecipe) {
  const existingTitle = existingRecipe.title || existingRecipe.mealName;
  const newTitle = newRecipe.title;
  
  const titleSimilarity = calculateTitleSimilarity(existingTitle, newTitle);
  
  // Consider recipes the same if title similarity is above 70%
  const isSameRecipe = titleSimilarity > 0.7;
  
  console.log(`Title similarity: "${existingTitle}" vs "${newTitle}" = ${titleSimilarity} (${isSameRecipe ? 'SAME' : 'DIFFERENT'})`);
  
  return {
    isSameRecipe,
    titleSimilarity,
    confidence: titleSimilarity
  };
}

/**
 * Merge two recipes intelligently, keeping the best data from each
 * @param {Object} existingRecipe 
 * @param {Object} newRecipe 
 * @returns {Object} Merged recipe data
 */
export function mergeRecipes(existingRecipe, newRecipe) {
  // If this is a high-confidence duplicate (same recipe), prefer the new format
  const isHighConfidenceDuplicate = true; // We know this is a duplicate since we're in mergeRecipes
  
  const merged = {
    // Use the longer/more descriptive title
    title: (newRecipe.title && newRecipe.title.length > (existingRecipe.title || existingRecipe.mealName || '').length) 
      ? newRecipe.title 
      : (existingRecipe.title || existingRecipe.mealName || ''),
    
    // For high-confidence duplicates, use new ingredients (better formatting)
    ingredients: isHighConfidenceDuplicate ? (newRecipe.ingredients || '') : mergeIngredients(existingRecipe.ingredients || '', newRecipe.ingredients || ''),
    
    // Use the more detailed instructions
    instructions: (newRecipe.instructions && newRecipe.instructions.length > (existingRecipe.instructions || '').length)
      ? newRecipe.instructions
      : (existingRecipe.instructions || ''),
    
    // Use the higher prep time (more conservative)
    prep_time: Math.max(existingRecipe.prep_time || 0, newRecipe.prepTime || 0),
    
    // Use the higher cook time (more conservative)
    cook_time: Math.max(existingRecipe.cook_time || 0, newRecipe.cookTime || 0),
    
    // Use the higher serving count (more conservative)
    servings: Math.max(existingRecipe.servings || 1, newRecipe.servings || 1),
    
    // Merge notes - combine both sets of notes
    notes: mergeNotes(existingRecipe.notes || '', newRecipe.notes || '')
  };
  
  console.log('mergeRecipes: Using new ingredients for high-confidence duplicate');
  return merged;
}

/**
 * Merge ingredient lists, removing duplicates and combining similar items
 * @param {string} existingIngredients 
 * @param {string} newIngredients 
 * @returns {string} Merged ingredients
 */
function mergeIngredients(existingIngredients, newIngredients) {
  if (!existingIngredients && !newIngredients) return '';
  if (!existingIngredients) return newIngredients;
  if (!newIngredients) return existingIngredients;
  
  const existingList = existingIngredients.split('\n').map(line => line.trim()).filter(line => line);
  const newList = newIngredients.split('\n').map(line => line.trim()).filter(line => line);
  
  // If the lists are identical, return the existing one
  if (existingList.length === newList.length && 
      existingList.every((item, index) => 
        item.toLowerCase().trim() === newList[index].toLowerCase().trim()
      )) {
    return existingIngredients;
  }
  
  // Check if this is likely a formatting update (same number of ingredients, similar content)
  if (existingList.length === newList.length && existingList.length > 0) {
    // Check if ingredients are similar but formatted differently
    let formatMatches = 0;
    const isFormatUpdate = existingList.every((existing, index) => {
      const newIngredient = newList[index];
      // Extract the core ingredient name (remove amounts, units, and formatting)
      const existingCore = extractCoreIngredient(existing);
      const newCore = extractCoreIngredient(newIngredient);
      const matches = existingCore === newCore;
      if (matches) formatMatches++;
      
      console.log(`Ingredient ${index}: "${existing}" -> "${existingCore}" vs "${newIngredient}" -> "${newCore}" = ${matches}`);
      return matches;
    });
    
    // If most ingredients match (80%+), treat as format update
    const matchPercentage = formatMatches / existingList.length;
    if (matchPercentage >= 0.8) {
      console.log('Format update detected:', matchPercentage, 'match rate - REPLACING with new format');
      // This is a formatting update, use the new format
      return newIngredients;
    }
    
    // Even if not all ingredients match exactly, if we have the same count and similar content,
    // and the title similarity is high, it's likely a format update
    if (matchPercentage >= 0.6) {
      console.log('Potential format update with', matchPercentage, 'match rate - REPLACING with new format');
      return newIngredients;
    }
  }
  
  // Additional check: if we have the same number of ingredients and they're mostly the same content
  // but formatted differently, treat as format update
  if (existingList.length === newList.length && existingList.length > 0) {
    // Check if the core ingredients are the same (ignoring order and formatting)
    const existingCores = existingList.map(extractCoreIngredient).sort();
    const newCores = newList.map(extractCoreIngredient).sort();
    
    const coreMatches = existingCores.filter(core => newCores.includes(core)).length;
    const coreMatchPercentage = coreMatches / existingCores.length;
    
    if (coreMatchPercentage >= 0.8) {
      console.log('Core ingredient match detected:', coreMatchPercentage, 'match rate - REPLACING with new format');
      return newIngredients;
    }
  }
  
  // For different ingredient lists, combine and deduplicate
  const combined = [...existingList];
  
  for (const newIngredient of newList) {
    // Check if this ingredient already exists (case-insensitive)
    const exists = combined.some(existing => 
      existing.toLowerCase().trim() === newIngredient.toLowerCase().trim()
    );
    
    if (!exists) {
      combined.push(newIngredient);
    }
  }
  
  return combined.join('\n');
}

/**
 * Extract the core ingredient name from a formatted ingredient string
 * @param {string} ingredient 
 * @returns {string} Core ingredient name
 */
function extractCoreIngredient(ingredient) {
  // Remove bullet points and clean up
  let cleaned = ingredient.replace(/^[•\-\*]\s*/, '').trim();
  
  // Remove amounts and units (numbers, fractions, common units)
  cleaned = cleaned.replace(/^\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole|tablespoons?|teaspoons?|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?)\s*/i, '');
  
  // Remove parentheses and their contents
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Remove commas and everything after (for actions)
  cleaned = cleaned.split(',')[0];
  
  // Clean up extra spaces and normalize
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Remove common descriptive words to get to the core ingredient
  const descriptiveWords = ['prepared', 'coarse-ground', 'skinless', 'boneless', 'large', 'small', 'medium', 'fresh', 'dried', 'frozen', 'canned', 'sliced', 'thinly', 'diced', 'chopped', 'minced', 'crushed', 'lightly', 'packed'];
  const words = cleaned.split(' ');
  const coreWords = words.filter(word => !descriptiveWords.includes(word));
  
  // If we filtered out too many words, keep the last few words as they're likely the main ingredient
  if (coreWords.length === 0 && words.length > 0) {
    return words.slice(-2).join(' '); // Take last 2 words
  }
  
  return coreWords.join(' ');
}

/**
 * Merge notes, combining both sets of information intelligently
 * @param {string} existingNotes 
 * @param {string} newNotes 
 * @returns {string} Merged notes
 */
function mergeNotes(existingNotes, newNotes) {
  if (!existingNotes && !newNotes) return '';
  if (!existingNotes) return newNotes;
  if (!newNotes) return existingNotes;
  
  // Check if notes are identical (case-insensitive)
  if (existingNotes.toLowerCase().trim() === newNotes.toLowerCase().trim()) {
    return existingNotes; // Return existing notes if they're the same
  }
  
  // Check if new notes are already contained in existing notes
  if (existingNotes.toLowerCase().includes(newNotes.toLowerCase().trim())) {
    return existingNotes; // Return existing notes if new notes are already included
  }
  
  // Check if existing notes are contained in new notes
  if (newNotes.toLowerCase().includes(existingNotes.toLowerCase().trim())) {
    return newNotes; // Return new notes if they contain the existing notes
  }
  
  // Only combine if they're genuinely different
  const combined = [existingNotes, newNotes].filter(note => note.trim());
  return combined.join('\n\n---\n\n');
}

/**
 * Check if a merged recipe has meaningful changes compared to the original
 * @param {Object} originalRecipe 
 * @param {Object} mergedRecipe 
 * @returns {boolean} True if there are meaningful changes
 */
export function hasMeaningfulChanges(originalRecipe, mergedRecipe) {
  // Check if any significant fields have changed
  const titleChanged = (mergedRecipe.title || '') !== (originalRecipe.title || originalRecipe.mealName || '');
  const ingredientsChanged = (mergedRecipe.ingredients || '') !== (originalRecipe.ingredients || '');
  const instructionsChanged = (mergedRecipe.instructions || '') !== (originalRecipe.instructions || '');
  const prepTimeChanged = (mergedRecipe.prep_time || 0) !== (originalRecipe.prep_time || 0);
  const cookTimeChanged = (mergedRecipe.cook_time || 0) !== (originalRecipe.cook_time || 0);
  const servingsChanged = (mergedRecipe.servings || 1) !== (originalRecipe.servings || 1);
  const notesChanged = (mergedRecipe.notes || '') !== (originalRecipe.notes || '');
  
  console.log('hasMeaningfulChanges check:');
  console.log('  titleChanged:', titleChanged);
  console.log('  ingredientsChanged:', ingredientsChanged);
  console.log('  instructionsChanged:', instructionsChanged);
  console.log('  prepTimeChanged:', prepTimeChanged);
  console.log('  cookTimeChanged:', cookTimeChanged);
  console.log('  servingsChanged:', servingsChanged);
  console.log('  notesChanged:', notesChanged);
  
  const hasChanges = titleChanged || ingredientsChanged || instructionsChanged || 
         prepTimeChanged || cookTimeChanged || servingsChanged || notesChanged;
  
  console.log('  Overall hasChanges:', hasChanges);
  return hasChanges;
}

/**
 * Find potential duplicate recipes in a list
 * @param {Array} recipes 
 * @param {Object} newRecipe 
 * @returns {Object|null} Best match or null
 */
export function findDuplicateRecipe(recipes, newRecipe) {
  let bestMatch = null;
  let bestScore = 0;
  
  console.log('findDuplicateRecipe: checking', recipes.length, 'existing recipes against:', newRecipe.title);
  
  // First, check for exact title matches
  for (const recipe of recipes) {
    const existingTitle = recipe.title || recipe.mealName;
    if (existingTitle && newRecipe.title && 
        existingTitle.toLowerCase().trim() === newRecipe.title.toLowerCase().trim()) {
      console.log(`Exact title match found: "${existingTitle}"`);
      return { recipe, confidence: 1.0 };
    }
  }
  
  // Then check for similarity matches
  for (const recipe of recipes) {
    const comparison = compareRecipes(recipe, newRecipe);
    console.log(`Comparing "${recipe.title || recipe.mealName}" with "${newRecipe.title}":`, comparison);
    
    if (comparison.isSameRecipe && comparison.confidence > bestScore) {
      bestMatch = recipe;
      bestScore = comparison.confidence;
    }
  }
  
  console.log('Best match found:', bestMatch ? `${bestMatch.title || bestMatch.mealName} (${bestScore})` : 'none');
  return bestMatch ? { recipe: bestMatch, confidence: bestScore } : null;
}
