import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const user = await supabase.auth.getUser();

	if (!user.data?.user) {
		redirect(303, '/login');
	}
	const { data: session } = await supabase.auth.getSession();

	return { user, session };
};
