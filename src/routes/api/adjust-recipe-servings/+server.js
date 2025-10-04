import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';

// Helper function to convert ingredients to decimal format for AI processing
function convertIngredientsToDecimals(ingredients) {
  return ingredients.split('\n').map(line => {
    const originalLine = line.trim();
    if (!originalLine) return null;
    
    // Convert measurements to decimal format
    let decimalLine = originalLine;
    
    // Convert regular fractions and mixed numbers (fractions are already normalized to 1/2, 1/4, etc.)
    // First try to match known units, then fall back to any word(s)
    const knownUnits = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole|tablespoons?|teaspoons?|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?)\b/gi;
    const anyWords = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(\w+(?:\s+\w+)*)/gi;
    
    // Try known units first
    decimalLine = decimalLine.replace(knownUnits, (match, amount, unit) => {
      const decimalAmount = parseFraction(amount);
      
      // Normalize unit abbreviations
      let normalizedUnit = unit || '';
      if (normalizedUnit) {
        if (normalizedUnit.toLowerCase().includes('tablespoon')) normalizedUnit = 'Tbsp';
        else if (normalizedUnit.toLowerCase().includes('teaspoon')) normalizedUnit = 'tsp';
        else if (normalizedUnit.toLowerCase().includes('pound')) normalizedUnit = 'lb';
        else if (normalizedUnit.toLowerCase().includes('ounce')) normalizedUnit = 'oz';
        else if (normalizedUnit.toLowerCase().includes('gram')) normalizedUnit = 'g';
        else if (normalizedUnit.toLowerCase().includes('kilogram')) normalizedUnit = 'kg';
        else if (normalizedUnit.toLowerCase().includes('milliliter')) normalizedUnit = 'ml';
        else if (normalizedUnit.toLowerCase().includes('liter')) normalizedUnit = 'l';
        else if (normalizedUnit.toLowerCase().includes('cup')) normalizedUnit = 'cup';
        else if (normalizedUnit.toLowerCase().includes('clove')) normalizedUnit = 'cloves';
        else if (normalizedUnit.toLowerCase().includes('half')) normalizedUnit = 'halves';
        else if (normalizedUnit.toLowerCase().includes('piece')) normalizedUnit = 'pieces';
        else if (normalizedUnit.toLowerCase().includes('whole')) normalizedUnit = 'whole';
      }
      
      return normalizedUnit ? `${decimalAmount} ${normalizedUnit}` : `${decimalAmount}`;
    });
    
    // Then handle any remaining number + word combinations
    decimalLine = decimalLine.replace(anyWords, (match, amount, unit) => {
      const decimalAmount = parseFraction(amount);
      
      // Normalize unit abbreviations - handle any word(s) that follow the number
      let normalizedUnit = unit || '';
      if (normalizedUnit) {
        // For common measurements, use standard abbreviations
        if (normalizedUnit.toLowerCase().includes('tablespoon')) normalizedUnit = 'Tbsp';
        else if (normalizedUnit.toLowerCase().includes('teaspoon')) normalizedUnit = 'tsp';
        else if (normalizedUnit.toLowerCase().includes('pound')) normalizedUnit = 'lb';
        else if (normalizedUnit.toLowerCase().includes('ounce')) normalizedUnit = 'oz';
        else if (normalizedUnit.toLowerCase().includes('gram')) normalizedUnit = 'g';
        else if (normalizedUnit.toLowerCase().includes('kilogram')) normalizedUnit = 'kg';
        else if (normalizedUnit.toLowerCase().includes('milliliter')) normalizedUnit = 'ml';
        else if (normalizedUnit.toLowerCase().includes('liter')) normalizedUnit = 'l';
        else if (normalizedUnit.toLowerCase().includes('cup')) normalizedUnit = 'cup';
        // For everything else, keep the original text (it's likely an ingredient name)
        // This handles cases like "6 chicken breast halves" -> "6" + "chicken breast halves"
      }
      
      return normalizedUnit ? `${decimalAmount} ${normalizedUnit}` : `${decimalAmount}`;
    });
    
    return {
      original: originalLine,
      decimal: decimalLine
    };
  }).filter(Boolean);
}

// Helper function to parse fractions and mixed numbers
function parseFraction(str) {
  // Handle mixed numbers like "1 ½" or "1 1/2"
  if (str.includes(' ')) {
    const parts = str.split(' ');
    const whole = parseFloat(parts[0]);
    const fraction = parts[1];
    if (fraction.includes('/')) {
      const [numerator, denominator] = fraction.split('/');
      return whole + (parseFloat(numerator) / parseFloat(denominator));
    }
    return whole + parseFloat(fraction);
  }
  
  // Handle simple fractions like "½" or "1/2"
  if (str.includes('/')) {
    const [numerator, denominator] = str.split('/');
    return parseFloat(numerator) / parseFloat(denominator);
  }
  
  return parseFloat(str);
}

// Helper function to convert decimal back to original format
function convertDecimalToOriginal(decimal, original) {
  // Find the original amount to preserve its format
  const measurementRegex = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/i;
  const match = original.match(measurementRegex);
  
  if (match) {
    const [fullMatch, originalAmount, unit] = match;
    const formattedAmount = formatAmount(decimal);
    return original.replace(fullMatch, `${formattedAmount} ${unit}`);
  }
  
  return original;
}

// Helper function to format decimal amounts back to cooking-friendly format
function formatAmount(amount) {
  // Convert to fractions for common amounts
  const fractionMap = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
    1.25: '1 1/4',
    1.33: '1 1/3',
    1.5: '1 1/2',
    1.67: '1 2/3',
    1.75: '1 3/4'
  };
  
  if (fractionMap[amount]) return fractionMap[amount];
  if (amount % 1 === 0) return amount.toString();
  return amount.toFixed(2).replace(/\.00$/, '');
}

// Helper function to round to nearest practical cooking fraction
function roundToPracticalFraction(amount) {
  // Define practical cooking fractions based on common measuring tools
  // Most home cooks have: 1/4, 1/3, 1/2, 2/3, 3/4, 1 cup measures
  // And: 1/4, 1/2, 1 tsp/tbsp measures
  const practicalFractions = [
    0, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.33, 1.5, 1.67, 1.75, 2, 2.25, 2.33, 2.5, 2.67, 2.75, 3
  ];
  
  // Find the closest practical fraction
  let closest = practicalFractions[0];
  let minDiff = Math.abs(amount - closest);
  
  for (const fraction of practicalFractions) {
    const diff = Math.abs(amount - fraction);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fraction;
    }
  }
  
  return closest;
}

// Helper function to calculate practical change amounts
function calculatePracticalChange(originalAmount, adjustedAmount) {
  const originalDecimal = parseFraction(originalAmount);
  const adjustedDecimal = parseFraction(adjustedAmount);
  const difference = adjustedDecimal - originalDecimal;
  
  // Round the difference to a practical fraction
  const practicalDifference = roundToPracticalFraction(Math.abs(difference));
  const sign = difference >= 0 ? '+' : '-';
  
  if (practicalDifference === 0) {
    return 'no change';
  }
  
  return `${sign}${formatAmount(practicalDifference)}`;
}

export async function POST({ request }) {
  try {
    // Check authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalIngredients, originalServings, newServings } = await request.json();

    if (!originalIngredients || !originalServings || !newServings) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Normalize fraction characters to literal fractions first
    let normalizedIngredients = originalIngredients;
    normalizedIngredients = normalizedIngredients.replace(/¼/g, '1/4');
    normalizedIngredients = normalizedIngredients.replace(/½/g, '1/2');
    normalizedIngredients = normalizedIngredients.replace(/¾/g, '3/4');
    normalizedIngredients = normalizedIngredients.replace(/⅓/g, '1/3');
    normalizedIngredients = normalizedIngredients.replace(/⅔/g, '2/3');

    // Convert ingredients to decimal format for AI processing
    const decimalIngredients = convertIngredientsToDecimals(normalizedIngredients);
    const decimalIngredientsText = decimalIngredients.map(ing => ing.decimal).join('\n');
    

    // Prepare the prompt for GPT-4
    const prompt = `You are a professional chef and recipe expert. Analyze the following recipe ingredients and determine how they should be adjusted from ${originalServings} servings to ${newServings} servings.

CRITICAL REQUIREMENTS:
1. You MUST process EVERY SINGLE ingredient line from the recipe below
2. Do NOT skip any ingredients - analyze each one individually
3. Some ingredients should NOT scale linearly (like salt, pepper, lemon juice, vinegar, baking powder, vanilla extract)
4. Flavoring ingredients (herbs, spices, seasonings) need minimal adjustment
5. Main ingredients (meat, vegetables, flour, etc.) should scale proportionally
6. Return a JSON object with this exact structure:

EXAMPLE FORMAT:
{
  "ingredients": [
    {
      "originalDecimal": "0.25 cup cider vinegar",
      "adjustedDecimal": "0.33 cup cider vinegar", 
      "change": "+0.08 cup"
    },
    {
      "originalDecimal": "3 tablespoons prepared coarse-ground mustard or to taste",
      "adjustedDecimal": "3 tablespoons prepared coarse-ground mustard or to taste",
      "change": "no change"
    },
    {
      "originalDecimal": "6 skinless, boneless chicken breast halves",
      "adjustedDecimal": "8 skinless, boneless chicken breast halves",
      "change": "+2 halves"
    }
  ]
}
6. For ingredients that shouldn't scale, use "no change" for the change field
7. The change field should show the ACTUAL DIFFERENCE in decimal amounts like "+0.5 cups", "-0.25 tsp", "+1.5 tbsp", etc.
8. Calculate the difference between original and adjusted decimal amounts
9. Use common cooking measurements: cups, tbsp, tsp, oz, lb, g, kg, ml, l
10. Process EVERY SINGLE ingredient line from the original recipe
11. If scaling from 4 to 6 servings, most main ingredients should increase by about 50%
12. If scaling from 6 to 4 servings, most main ingredients should decrease by about 33%

Original recipe (${originalServings} servings) with decimal amounts:
${decimalIngredientsText}

IMPORTANT: 
- There are ${decimalIngredients.length} ingredients in this recipe
- You MUST return exactly ${decimalIngredients.length} ingredients in your response
- Do NOT skip any ingredients
- Return ONLY valid JSON. Do not include any text before or after the JSON object. Start your response with { and end with }.

Return the JSON analysis:`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return json({ error: 'Failed to adjust recipe servings' }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return json({ error: 'No response from AI' }, { status: 500 });
    }
    

    try {
      const parsedResponse = JSON.parse(aiResponse);
      
      if (!parsedResponse.ingredients || !Array.isArray(parsedResponse.ingredients)) {
        return json({ error: 'Invalid AI response format' }, { status: 500 });
      }

      // Validate that we got the right number of ingredients
      if (parsedResponse.ingredients.length !== decimalIngredients.length) {
        console.error(`AI returned ${parsedResponse.ingredients.length} ingredients but expected ${decimalIngredients.length}`);
        return json({ error: `AI returned wrong number of ingredients: ${parsedResponse.ingredients.length} instead of ${decimalIngredients.length}` }, { status: 500 });
      }

      // Convert AI results back to original format
      const convertedIngredients = parsedResponse.ingredients.map((aiIngredient, index) => {
        const originalIngredient = decimalIngredients[index];
        if (!originalIngredient) {
          console.log(`No original ingredient found for index ${index}`);
          return null;
        }
        

        // Convert the adjusted decimal amounts back to original format
        let adjustedOriginal = aiIngredient.adjustedDecimal;
        
        // Replace decimal amounts with properly formatted amounts
        adjustedOriginal = adjustedOriginal.replace(/(\d+(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/gi, (match, decimalAmount, unit) => {
          const formattedAmount = formatAmount(parseFloat(decimalAmount));
          return `${formattedAmount} ${unit}`;
        });

        // Calculate practical change amount by comparing original and adjusted
        let practicalChange = 'no change';
        
        // Extract the first measurement from both original and adjusted to calculate change
        const originalMeasurementRegex = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/i;
        const adjustedMeasurementRegex = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/i;
        
        const originalMatch = originalIngredient.original.match(originalMeasurementRegex);
        const adjustedMatch = adjustedOriginal.match(adjustedMeasurementRegex);
        
        
        // Always use AI's change and convert to practical format
        if (aiIngredient.change !== 'no change') {
          const changeMatch = aiIngredient.change.match(/([+-])(\d+(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/i);
          if (changeMatch) {
            const sign = changeMatch[1];
            const amount = parseFloat(changeMatch[2]);
            const unit = changeMatch[3];
            const practicalAmount = roundToPracticalFraction(amount);
            if (practicalAmount > 0) {
              practicalChange = `${sign}${formatAmount(practicalAmount)} ${unit}`;
            }
          }
        }

        const result = {
          original: originalIngredient.original,
          adjusted: adjustedOriginal,
          change: practicalChange
        };
        
        return result;
      }).filter(Boolean);

      return json({ 
        success: true, 
        ingredients: convertedIngredients
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('Recipe serving adjustment error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
