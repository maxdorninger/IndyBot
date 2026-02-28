import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseClient';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	return {
		email: user?.email ?? '',
		fullName: user?.user_metadata?.full_name ?? ''
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		let fullName = formData.get('full_name');

		if (typeof fullName !== 'string' || fullName.trim() === '') {
			return fail(400, { action: 'updateProfile', error: 'Full name is required.' });
		}
		fullName = fullName.trim();
		const { error } = await supabase.auth.updateUser({
			data: { full_name: fullName }
		});

		if (error) return fail(400, { action: 'updateProfile', error: error.message });
		return { action: 'updateProfile', success: true };
	},

	updateEmail: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		let email = formData.get('email');

		if (typeof email !== 'string' || email.trim() === '') {
			return fail(400, { action: 'updateEmail', error: 'Email is required.' });
		}

		email = email.trim();

		const { error } = await supabase.auth.updateUser(
			{ email },
			{ emailRedirectTo: `${url.origin}/auth/callback` }
		);

		if (error) return fail(400, { action: 'updateEmail', error: error.message });
		return {
			action: 'updateEmail',
			success: true,
			message: 'Confirmation email sent. Check your inbox to confirm the change.'
		};
	},

	updatePassword: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirm_password') as string;

		if (password !== confirmPassword) {
			return fail(400, { action: 'updatePassword', error: 'Passwords do not match.' });
		}

		if (password.length < 8) {
			return fail(400, {
				action: 'updatePassword',
				error: 'Password must be at least 8 characters long.'
			});
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) return fail(400, { action: 'updatePassword', error: error.message });
		return { action: 'updatePassword', success: true };
	},

	deleteAccount: async ({ locals: { supabase } }) => {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) return fail(400, { action: 'deleteAccount', error: 'Not authenticated.' });

		const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

		if (error) return fail(400, { action: 'deleteAccount', error: error.message });

		await supabase.auth.signOut();
		return { action: 'deleteAccount', success: true };
	}
};
