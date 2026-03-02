import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncTeachers, syncHours, syncSubjects, syncSpecialIndy, checkCronAuth } from '$lib/server/indySync.js';

export const GET: RequestHandler = async ({ request }) => {
	const authError = checkCronAuth(request);
	if (authError) return authError;

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
