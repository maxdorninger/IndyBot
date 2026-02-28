import createClient from 'openapi-fetch';
import type { paths } from './types.js';

/**
 * Create a typed IndY API client.
 *
 * @param baseUrl - Base URL of the IndY API (e.g. https://api.example.com)
 * @param accessToken - Optional Bearer token for authenticated requests.
 *                      Pass the token retrieved from POST /token.
 */
export function createIndyClient(baseUrl: string, accessToken?: string) {
	return createClient<paths>({
		baseUrl,
		headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
	});
}

export type IndyClient = ReturnType<typeof createIndyClient>;
