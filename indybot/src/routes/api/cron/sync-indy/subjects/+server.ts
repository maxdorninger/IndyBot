import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSubjects, checkCronAuth } from '$lib/server/indySync.js';

export const GET: RequestHandler = async ({ request }) => {
	const authError = checkCronAuth(request);
	if (authError) return authError;

	const result = await syncSubjects();
	return json(result, { status: result.ok ? 200 : 502 });
};
