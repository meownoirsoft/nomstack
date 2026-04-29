import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeText } = await request.json();

    if (!recipeText || !recipeText.trim()) {
      return json({ error: 'Recipe text is required' }, { status: 400 });
    }

    // Convert fraction characters to literal fractions for easier processing
    let normalizedRecipeText = recipeText;
    normalizedRecipeText = normalizedRecipeText.replace(/¼/g, '1/4');
    normalizedRecipeText = normalizedRecipeText.replace(/½/g, '1/2');
    normalizedRecipeText = normalizedRecipeText.replace(/¾/g, '3/4');
    normalizedRecipeText = normalizedRecipeText.replace(/⅓/g, '1/3');
    normalizedRecipeText = normalizedRecipeText.replace(/⅔/g, '2/3');

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Prepare the prompt for GPT-4
    const prompt = `Parse the following recipe text and extract structured information. Return ONLY a valid JSON object with these exact fields:

{
  "ingredients": "string with each ingredient on a new line, prefixed with *",
  "instructions": "string with each step on a new line, numbered",
  "prepTime": number (in minutes, 0 if not specified),
  "servings": number (1 if not specified)
}

IMPORTANT INGREDIENT FORMATTING:
- Put adjectives BEFORE the main ingredient noun, actions AFTER a comma
- Keep amounts and units together with the ingredient name
- Format: "amount unit adjective ingredient, action" or "amount adjective ingredient, action"
- Examples: 
  * "1/4 cup cider vinegar"
  * "3 Tbsp coarse-ground prepared mustard" 
  * "3 cloves garlic, peeled and minced"
  * "1 lime, juiced"
  * "6 skinless boneless chicken breast halves"
  * "1/2 cup brown sugar, lightly packed"
  * "2 Tbsp sesame seeds, crushed"
  * "1 large onion, diced"
- This makes ingredients more natural and easier to read

Recipe text to parse:
${normalizedRecipeText}

IMPORTANT TIME EXTRACTION RULES:
- ONLY extract prep time and cooking time
- IGNORE "additional time", "total time", "chill time", "rest time", "marinate time", etc.
- If only cooking time is available, use that as the prep time
- If both prep time and cooking time are available, add them together
- If neither is available, use 0
- Convert all times to minutes (e.g., "1 hour 30 minutes" = 90)

Other Rules:
- For ingredients: Use * prefix for each ingredient, one per line
- For instructions: Number each step (1., 2., 3., etc.), one per line
- For servings: Extract number of servings, default to 1
- Return ONLY the JSON, no other text`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return json(
        { error: 'Failed to parse recipe with AI', details: errorData },
        { status: response.status === 401 || response.status === 429 ? response.status : 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response from AI
    let parsedRecipe;
    try {
      // Clean up the response (remove any markdown formatting)
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedRecipe = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      return json({ error: 'AI returned invalid response format' }, { status: 500 });
    }

    // Validate the parsed data
    if (!parsedRecipe.ingredients || !parsedRecipe.instructions) {
      return json({ error: 'AI failed to extract required recipe information' }, { status: 500 });
    }

    // Ensure numeric values are valid
    parsedRecipe.prepTime = parseInt(parsedRecipe.prepTime) || 0;
    parsedRecipe.servings = parseInt(parsedRecipe.servings) || 1;

    return json({ 
      success: true, 
      recipe: parsedRecipe 
    });

  } catch (error) {
    console.error('Recipe parsing error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
