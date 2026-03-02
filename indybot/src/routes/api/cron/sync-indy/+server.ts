import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CRON_SECRET } from '$env/static/private';
import { syncTeachers, syncHours, syncSubjects, syncSpecialIndy } from '$lib/server/indySync.js';

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [teachers, hours, subjects, special_indy] = await Promise.all([
		syncTeachers(),
		syncHours(),
		syncSubjects(),
		syncSpecialIndy()
	]);

	const results = { teachers, hours, subjects, special_indy };
	const hasErrors = Object.values(results).some((r) => !r.ok);

	return json({ ok: !hasErrors, results }, { status: hasErrors ? 207 : 200 });
};
