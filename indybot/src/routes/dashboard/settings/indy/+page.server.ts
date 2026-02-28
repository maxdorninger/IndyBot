import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { encrypt } from '$lib/server/indyCrypto';
import { PRIVATE_INDY_ENCRYPTION_KEY } from '$env/static/private';
import { loginToIndy } from '$lib/api/client';

const REFRESH_TOKEN_TTL_DAYS = 30;

function expiryDate(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().split('T')[0];
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return { connected: false, mode: null, expiresAt: null, hasStoredCredentials: false };

	const [{ data: tokenRow }, { data: credRow }] = await Promise.all([
		supabase
			.schema('private')
			.from('refresh_tokens')
			.select('valid_until')
			.eq('user_id', user.id)
			.maybeSingle(),
		supabase
			.schema('private')
			.from('indy_credentials')
			.select('user_id')
			.eq('user_id', user.id)
			.maybeSingle()
	]);

	const connected = !!tokenRow;
	const mode: 'token_only' | 'credentials' | null = credRow
		? 'credentials'
		: connected
			? 'token_only'
			: null;

	return {
		connected,
		mode,
		expiresAt: tokenRow?.valid_until ?? null,
		hasStoredCredentials: !!credRow
	};
};

export const actions: Actions = {
	// calls indy on the server with provided creds, but only stores the refresh token
	saveTokenOnly: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (!username || !password) {
			return fail(400, { action: 'saveTokenOnly', error: 'Username and password are required.' });
		}

		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'saveTokenOnly', error: 'Not authenticated.' });

		const result = await loginToIndy(username, password);
		if ('error' in result)
			return fail(400, {
				action: 'saveTokenOnly',
				error: 'Failed to connect to IndY. Please check your credentials and try again.'
			});

		const { error: tokenError } = await supabase
			.schema('private')
			.from('refresh_tokens')
			.upsert(
				{
					user_id: user.id,
					refresh_token: result.data.refresh_token,
					valid_until: expiryDate(REFRESH_TOKEN_TTL_DAYS)
				},
				{ onConflict: 'user_id' }
			);

		if (tokenError) return fail(500, { action: 'saveTokenOnly', error: tokenError.message });

		await supabase.schema('private').from('indy_credentials').delete().eq('user_id', user.id);

		return { action: 'saveTokenOnly', success: true };
	},

	saveCredentials: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (!username || !password) {
			return fail(400, {
				action: 'saveCredentials',
				error: 'Username and password are required.'
			});
		}

		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'saveCredentials', error: 'Not authenticated.' });

		const result = await loginToIndy(username, password);
		if ('error' in result)
			return fail(400, {
				action: 'saveCredentials',
				error: 'Failed to connect to IndY. Please check your credentials and try again.'
			});

		if (!PRIVATE_INDY_ENCRYPTION_KEY) {
			return fail(500, {
				action: 'saveCredentials',
				error: 'Server encryption key is not configured.'
			});
		}

		const encryptedPassword = encrypt(password, PRIVATE_INDY_ENCRYPTION_KEY);

		const [{ error: tokenError }, { error: credError }] = await Promise.all([
			supabase
				.schema('private')
				.from('refresh_tokens')
				.upsert(
					{
						user_id: user.id,
						refresh_token: result.data.refresh_token,
						valid_until: expiryDate(REFRESH_TOKEN_TTL_DAYS)
					},
					{ onConflict: 'user_id' }
				),
			supabase.schema('private').from('indy_credentials').upsert(
				{
					user_id: user.id,
					username: username,
					encrypted_password: encryptedPassword
				},
				{ onConflict: 'user_id' }
			)
		]);

		if (tokenError) return fail(500, { action: 'saveCredentials', error: tokenError.message });
		if (credError) return fail(500, { action: 'saveCredentials', error: credError.message });

		return { action: 'saveCredentials', success: true };
	},

	disconnect: async ({ locals: { supabase } }) => {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'disconnect', error: 'Not authenticated.' });

		await Promise.all([
			supabase.schema('private').from('refresh_tokens').delete().eq('user_id', user.id),
			supabase.schema('private').from('indy_credentials').delete().eq('user_id', user.id)
		]);

		return { action: 'disconnect', success: true };
	}
};
