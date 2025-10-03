-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  notes TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  google_place_id VARCHAR(255) UNIQUE,
  website TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);

-- Create index for name for search functionality
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own restaurants
CREATE POLICY "Users can view their own restaurants" ON restaurants
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: users can insert their own restaurants
CREATE POLICY "Users can insert their own restaurants" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can update their own restaurants
CREATE POLICY "Users can update their own restaurants" ON restaurants
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: users can delete their own restaurants
CREATE POLICY "Users can delete their own restaurants" ON restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at 
  BEFORE UPDATE ON restaurants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
