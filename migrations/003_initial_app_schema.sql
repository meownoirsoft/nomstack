-- Initial application schema for the self-hosted Postgres backend.
-- Replaces the old Supabase-managed schema. References profiles(id) created in 002_pg_auth.sql.
-- Idempotent where reasonable: drops any leftover legacy tables (integer user_id) before recreating.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop legacy/orphan tables from the pre-Supabase prototype (integer user_id).
DROP TABLE IF EXISTS public.meal_categories CASCADE;
DROP TABLE IF EXISTS public.meal_flags CASCADE;
DROP TABLE IF EXISTS public.meal_plan_selections CASCADE;
DROP TABLE IF EXISTS public.shared_comments CASCADE;
DROP TABLE IF EXISTS public.shared_list_items CASCADE;
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.shopping_lists CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.meal_filters CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.pantry_items CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.sources CASCADE;

-- updated_at auto-touch trigger function.
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== Categories =====
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE UNIQUE INDEX uq_categories_user_name ON public.categories(user_id, name);
CREATE TRIGGER tr_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Sources =====
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abbrev TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sources_user_id ON public.sources(user_id);
CREATE UNIQUE INDEX uq_sources_user_abbrev ON public.sources(user_id, abbrev);
CREATE TRIGGER tr_sources_updated_at BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Meals =====
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_source_id ON public.meals(source_id);
CREATE TRIGGER tr_meals_updated_at BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Meal categories (pivot) =====
CREATE TABLE public.meal_categories (
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (meal_id, category_id)
);
CREATE INDEX idx_meal_categories_category_id ON public.meal_categories(category_id);

-- ===== Meal flags (pivot) =====
CREATE TABLE public.meal_flags (
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  PRIMARY KEY (meal_id, flag)
);

-- ===== Meal plans =====
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Meal Plan',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_status ON public.meal_plans(status);
CREATE TRIGGER tr_meal_plans_updated_at BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Meal plan selections =====
CREATE TABLE public.meal_plan_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'all',
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mps_user_id ON public.meal_plan_selections(user_id);
CREATE INDEX idx_mps_plan_id ON public.meal_plan_selections(plan_id);
CREATE INDEX idx_mps_meal_id ON public.meal_plan_selections(meal_id);
CREATE TRIGGER tr_mps_updated_at BEFORE UPDATE ON public.meal_plan_selections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Meal filters =====
CREATE TABLE public.meal_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  flag TEXT,
  "order" INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_meal_filters_user_id ON public.meal_filters(user_id);
CREATE TRIGGER tr_meal_filters_updated_at BEFORE UPDATE ON public.meal_filters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Stores =====
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  section_order JSONB DEFAULT '[]'::jsonb,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_stores_user_id ON public.stores(user_id);
CREATE TRIGGER tr_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Recipes =====
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  ingredients TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX uq_recipes_meal_id ON public.recipes(meal_id);
CREATE TRIGGER tr_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Ingredients =====
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  source_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount TEXT,
  unit TEXT,
  category TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  is_pantry BOOLEAN DEFAULT FALSE,
  deemphasized BOOLEAN DEFAULT FALSE,
  checked BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX idx_ingredients_plan_id ON public.ingredients(plan_id);
CREATE INDEX idx_ingredients_store_id ON public.ingredients(store_id);
CREATE INDEX idx_ingredients_source_recipe_id ON public.ingredients(source_recipe_id);
CREATE TRIGGER tr_ingredients_updated_at BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Shopping lists =====
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Shopping List',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_shopping_lists_plan_id ON public.shopping_lists(plan_id);
CREATE TRIGGER tr_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Restaurants =====
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cuisine TEXT,
  address TEXT,
  phone TEXT,
  notes TEXT,
  rating NUMERIC,
  price_range TEXT,
  google_place_id TEXT,
  website TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  opening_hours JSONB,
  current_opening_hours JSONB,
  popular_times JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);
CREATE TRIGGER tr_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Pantry items =====
CREATE TABLE public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE UNIQUE INDEX uq_pantry_items_user_name ON public.pantry_items(user_id, lower(name));
CREATE TRIGGER tr_pantry_items_updated_at BEFORE UPDATE ON public.pantry_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Share links =====
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  share_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_share_links_user_id ON public.share_links(user_id);
CREATE UNIQUE INDEX uq_share_links_meal_plan ON public.share_links(meal_plan_id);
CREATE TRIGGER tr_share_links_updated_at BEFORE UPDATE ON public.share_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- ===== Shared list items =====
CREATE TABLE public.shared_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_shared_list_items_share_link_id ON public.shared_list_items(share_link_id);

-- ===== Shared comments =====
CREATE TABLE public.shared_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_shared_comments_share_link_id ON public.shared_comments(share_link_id);
CREATE INDEX idx_shared_comments_ingredient_id ON public.shared_comments(ingredient_id);

-- ===== User subscriptions =====
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT FALSE,
  status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  expires_at TIMESTAMPTZ,
  stripe_current_period_start TIMESTAMPTZ,
  stripe_current_period_end TIMESTAMPTZ,
  stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX uq_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE TRIGGER tr_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();
