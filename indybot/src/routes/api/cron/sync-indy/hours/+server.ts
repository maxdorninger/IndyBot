import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CRON_SECRET } from '$env/static/private';
import { syncHours } from '$lib/server/indySync.js';

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const result = await syncHours();
	return json(result, { status: result.ok ? 200 : 502 });
};
