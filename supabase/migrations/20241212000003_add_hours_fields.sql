-- Add hours of operation and busy hours fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN current_opening_hours TEXT[],
ADD COLUMN popular_times JSONB;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.current_opening_hours IS 'Current opening hours (may differ from regular hours)';
COMMENT ON COLUMN restaurants.popular_times IS 'Popular times and busy hours data from Google Places API';
