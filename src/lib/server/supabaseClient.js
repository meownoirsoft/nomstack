/**
 * Legacy module name: data access now uses PostgreSQL via pg-data-client.
 * @deprecated Use `$lib/server/pg-data-client.js` directly in new code.
 */
export { supabaseAdmin } from './pg-data-client.js';
