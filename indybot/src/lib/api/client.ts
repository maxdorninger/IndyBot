import createClient from 'openapi-fetch';
import { PUBLIC_INDY_API_URL } from '$env/static/public';
import type { paths } from './types.js';

/** Shape of the /token response (spec types it as unknown). */
export interface IndyTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in?: number;
}

/** Shape of the /refresh response (spec types it as unknown). */
export interface IndyRefreshResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
}

/**
 * Create a typed IndY API client.
 *
 * @param accessToken - Optional Bearer token for authenticated requests.
 */
export function createIndyClient(accessToken?: string) {
	return createClient<paths>({
		baseUrl: PUBLIC_INDY_API_URL,
		headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
	});
}

/** Shared unauthenticated client for public endpoints (login, refresh). */
const _baseClient = createIndyClient();

/**
 * Authenticate with IndY using username + password.
 * Works in both browser and server environments.
 */
export async function loginToIndy(
	username: string,
	password: string
): Promise<{ data: IndyTokenResponse } | { error: string }> {
	const { data, error } = await _baseClient.POST('/token', {
		body: {
			username,
			password,
			grant_type: 'password',
			scope: '',
			client_id: null,
			client_secret: null
		},
		bodySerializer: (body) =>
			new URLSearchParams(
				Object.entries(body as Record<string, unknown>)
					.filter(([, v]) => v != null)
					.map(([k, v]): [string, string] => [k, String(v)])
			).toString(),
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
	});

	if (error) return { error: `IndY login failed: ${JSON.stringify(error)}` };
	const token = data as IndyTokenResponse;
	if (!token?.refresh_token) return { error: 'IndY did not return a refresh token.' };
	return { data: token };
}

/**
 * Exchange a refresh token for a new access token via POST /refresh.
 */
export async function refreshIndyToken(
	refreshToken: string
): Promise<{ data: IndyRefreshResponse } | { error: string }> {
	const { data, error } = await _baseClient.POST('/refresh', {
		body: { refresh_token: refreshToken }
	});

	if (error) return { error: `Failed to refresh IndY token: ${JSON.stringify(error)}` };
	const refreshed = data as IndyRefreshResponse;
	if (!refreshed?.access_token) return { error: 'IndY did not return an access token.' };
	return { data: refreshed };
}

export type IndyClient = ReturnType<typeof createIndyClient>;
