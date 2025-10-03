# Supabase Setup

This directory stores SQL migrations for the hosted Postgres database that will back nomstack. The initial migration (`20241212000000_init_schema.sql`) defines:

- profile rows keyed to `auth.users`
- user-scoped tables for sources, categories, meals, selections, and eat-out roulette entries
- many-to-many bridges and meal flags
- row-level security policies enforcing `auth.uid()` ownership

## Bootstrapping a New Project

1. Create a Supabase project and grab the service role + anon keys.
2. Install the Supabase CLI locally (`npm install -g supabase`).
3. Link the CLI to your project:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
4. Push the migration:
   ```bash
   supabase db push
   ```
5. Seed a profile row for your own account after first sign-in:
   ```sql
   insert into public.profiles (id, display_name)
   values ('<uuid of your auth user>', 'Your Name')
   on conflict (id) do update set display_name = excluded.display_name;
   ```
6. Update your SvelteKit `.env` with the Supabase keys so server routes can proxy requests.

### Migrating Existing Local Data

1. Ensure your legacy SQLite file (`nomstack.db`) contains the latest meals, categories, and selections.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_USER_ID` to `.env` (or export them in your shell). The service key is required because the script bypasses row-level security during import.
3. Install the Supabase client library if you have not already: `npm install` (this picks up `@supabase/supabase-js`).
4. Run the migration script:
   ```bash
   node scripts/migrate-to-supabase.js --purge
   ```
   - `--purge` clears any existing meals/sources/selections for the user before seeding.
   - Omit `--purge` if you prefer the script to upsert into the existing records.
5. Verify the imported rows in the Supabase dashboard (look under the `public` schema).

## Notes

- Each table has cascading deletes so removing a profile cleans up all dependent rows.
- `meal_flags.flag` accepts simple identifiers (`lunch`, `dinner`, `snack`). Expand or replace with dedicated columns if you prefer.
- `meal_plan_selections.position` is optional but enables ordered plans. Add application-level logic to maintain sequence numbers.
- Use Supabase Edge Functions or triggers if you want to auto-populate default sources/categories for new users.
