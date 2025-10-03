-- Add Google Places fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Create index for google_place_id for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON restaurants(google_place_id);

-- Create index for location (latitude, longitude) for geospatial queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);


