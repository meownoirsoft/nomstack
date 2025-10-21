# Google Places API Setup Guide

## Overview
The app now includes Google Places API integration for automatic restaurant discovery. This allows users to search for restaurants and automatically populate restaurant data.

## Setup Steps

### 1. Get Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** and **Maps JavaScript API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Configure Environment Variables
Add the following to your `.env` file:

```bash
# Google Places API (server-side)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Important:** The API key should be added to the server-side environment variables, not the client-side ones, for security.

### 3. Run Database Migrations
Run the new migration to add Google Places fields to the restaurants table:

```sql
-- Run this in your Supabase SQL editor or via migration
-- File: supabase/migrations/20241212000002_add_google_places_fields.sql
```

### 4. Test the Feature
1. Start your development server: `npm run dev`
2. Go to the "Eating Out" mode
3. Click "Search Google" button
4. Type a restaurant name (e.g., "pizza", "sushi", "mcdonalds")
5. Select a restaurant from the suggestions
6. Click "Add to My Restaurants"

## Features

### What's Automatically Fetched:
- ✅ Restaurant name
- ✅ Full address
- ✅ Phone number
- ✅ Google rating (1-5 stars)
- ✅ Price level ($, $$, $$$, $$$$)
- ✅ Cuisine type
- ✅ Website URL
- ✅ Opening hours
- ✅ Location coordinates

### Security Notes:
- API calls are made server-side to avoid CORS issues
- API key is kept secure on the server
- All requests are authenticated with user tokens
- No API key is exposed to the client

## Troubleshooting

### Common Issues:
1. **"Google Places API key not configured"** - Make sure `GOOGLE_PLACES_API_KEY` is set in your `.env` file
2. **"Google Places API error"** - Check that the Places API is enabled in Google Cloud Console
3. **No search results** - Try different search terms or check your location permissions

### API Quotas:
- Google Places API has usage limits
- Monitor your usage in Google Cloud Console
- Consider implementing caching for frequently searched restaurants

## Cost Considerations
- Google Places API charges per request
- Text Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- Monitor usage in Google Cloud Console to avoid unexpected charges


