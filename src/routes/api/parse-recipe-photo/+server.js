import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo');

    if (!photo) {
      return json({ error: 'Photo is required' }, { status: 400 });
    }

    // Check if Gemini API key is available (with OpenAI fallback)
    if (!process.env.GOOGLE_AI_API_KEY && !process.env.OPENAI_API_KEY) {
      return json({ error: 'No AI API key configured (Google AI or OpenAI required)' }, { status: 500 });
    }

    // Convert photo to base64 for Gemini Vision API
    const photoBuffer = await photo.arrayBuffer();
    const photoBase64 = Buffer.from(photoBuffer).toString('base64');
    const photoMimeType = photo.type || 'image/jpeg';

    // Prepare the prompt for Gemini Vision
    const prompt = `Extract recipe information from this image. Return ONLY a JSON object with this exact structure:

{
  "title": "string (recipe name)",
  "ingredients": "string with each ingredient on a new line, prefixed with *",
  "instructions": "string with each step on a new line, numbered",
  "prepTime": number (in minutes, 0 if not specified),
  "cookTime": number (in minutes, 0 if not specified),
  "servings": number (1 if not specified),
  "notes": "string (any additional notes, tips, or variations)"
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
- For notes: Include any cooking tips, variations, serving suggestions, or additional information found in the recipe
- Return ONLY the JSON, no other text`;

    let aiResponse;
    
    // Try Gemini first if API key is available
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        console.log('Attempting to parse recipe with Gemini Pro Vision...');
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  },
                  {
                    inline_data: {
                      mime_type: photoMimeType,
                      data: photoBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1, // Low temperature for consistent parsing
              maxOutputTokens: 1500
            }
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log('Successfully parsed recipe with Gemini Pro Vision');
        } else {
          const errorData = await geminiResponse.text();
          console.error('Gemini Vision API error:', geminiResponse.status, errorData);
          throw new Error('Gemini API failed');
        }
      } catch (geminiError) {
        console.error('Gemini parsing failed, falling back to OpenAI:', geminiError.message);
        aiResponse = null;
      }
    }

    // Fallback to OpenAI if Gemini failed or isn't available
    if (!aiResponse && process.env.OPENAI_API_KEY) {
      try {
        console.log('Attempting to parse recipe with OpenAI GPT-4o...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${photoMimeType};base64,${photoBase64}`,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 1500,
            response_format: { type: 'json_object' }
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          aiResponse = openaiData.choices[0]?.message?.content;
        } else {
          const errorData = await openaiResponse.text();
          console.error('OpenAI Vision API error:', openaiResponse.status, errorData);
          throw new Error(`OpenAI API failed: ${openaiResponse.status} ${errorData.slice(0, 200)}`);
        }
      } catch (openaiError) {
        console.error('OpenAI parsing also failed:', openaiError.message);
        return json(
          { error: 'Failed to parse recipe from photo', details: openaiError.message },
          { status: 500 }
        );
      }
    }

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
    parsedRecipe.cookTime = parseInt(parsedRecipe.cookTime) || 0;
    parsedRecipe.servings = parseInt(parsedRecipe.servings) || 1;
    
    // Ensure notes field exists
    parsedRecipe.notes = parsedRecipe.notes || '';

    // Calculate total time
    parsedRecipe.totalTime = parsedRecipe.prepTime + parsedRecipe.cookTime;

    return json({ 
      success: true, 
      recipe: parsedRecipe 
    });

  } catch (error) {
    console.error('Photo recipe parsing error:', error);
    return json({ 
      error: 'Failed to parse recipe from photo', 
      details: error.message 
    }, { status: 500 });
  }
}
