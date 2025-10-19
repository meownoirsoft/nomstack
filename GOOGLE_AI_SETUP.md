# Google AI (Gemini) Setup for Recipe Photo Import

## Overview
The app now uses Google's Gemini Pro Vision model for recipe photo imports, which is significantly cheaper than OpenAI's GPT-4o while maintaining excellent quality.

## Cost Comparison
- **OpenAI GPT-4o**: ~$0.03-0.05 per recipe import
- **Google Gemini Pro Vision**: ~$0.005-0.01 per recipe import (5-10x cheaper!)

## Setup Instructions

### 1. Get Google AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the API key

### 2. Add to Environment Variables
Add the following environment variable to your deployment:

```
GOOGLE_AI_API_KEY=your_api_key_here
```

### 3. Netlify Setup
If deploying to Netlify:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add `GOOGLE_AI_API_KEY` with your API key value

### 4. Local Development
For local development, create a `.env` file in the project root:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

## Fallback Behavior
The app is configured with intelligent fallback:
1. **Primary**: Uses Gemini Pro Vision if `GOOGLE_AI_API_KEY` is available
2. **Fallback**: Uses OpenAI GPT-4o if Gemini fails or isn't configured
3. **Error**: Returns error if neither service is available

## API Usage
- **Model**: `gemini-1.5-pro`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
- **Temperature**: 0.1 (for consistent parsing)
- **Max Tokens**: 1500

## Benefits
- **Cost Savings**: 5-10x cheaper than OpenAI
- **Quality**: Excellent recipe extraction capabilities
- **Reliability**: Automatic fallback to OpenAI if needed
- **Speed**: Fast processing times

## Testing
To test the integration:
1. Ensure `GOOGLE_AI_API_KEY` is set
2. Try importing a recipe photo
3. Check the console logs for "Successfully parsed recipe with Gemini Pro Vision"
4. If Gemini fails, you'll see fallback to OpenAI in the logs
