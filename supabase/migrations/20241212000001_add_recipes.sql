-- Add recipes table for basic recipe functionality
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  ingredients TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  prep_time INTEGER DEFAULT 0, -- minutes
  servings INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own recipes
CREATE POLICY "Users can view their own recipes" ON recipes
  FOR SELECT USING (
    meal_id IN (
      SELECT id FROM meals WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert their own recipes" ON recipes
  FOR INSERT WITH CHECK (
    meal_id IN (
      SELECT id FROM meals WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (
    meal_id IN (
      SELECT id FROM meals WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (
    meal_id IN (
      SELECT id FROM meals WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
