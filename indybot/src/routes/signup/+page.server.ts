import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	signup: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirm-password') as string;
		const name = formData.get('name') as string;

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', email, name });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.', email, name });
		}

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: name },
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { error: error.message, email, name });
		}

		return { success: true, message: 'Check your email to confirm your account.' };
	}
};
