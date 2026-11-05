import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Database access for tables the app references before they exist in the
 * generated schema types (currently `product_reviews` and `admin_notifications`).
 * Same client and session as `supabase`; only the compile-time table typing is relaxed.
 * Move callers back to the typed `supabase` client once those tables are included
 * in the generated database schema.
 */
export const untypedDb = supabase as unknown as SupabaseClient<any>;
