import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_API_KEY } from '$env/static/private';

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_API_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});
