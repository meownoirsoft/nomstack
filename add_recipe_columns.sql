-- Add new columns to existing recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';

-- Update existing records to have default values
UPDATE recipes SET notes = '' WHERE notes IS NULL;
UPDATE recipes SET cook_time = 0 WHERE cook_time IS NULL;
UPDATE recipes SET title = '' WHERE title IS NULL;
