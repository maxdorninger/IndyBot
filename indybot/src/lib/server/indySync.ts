import { INDY_SERVICE_USERNAME, INDY_SERVICE_PASSWORD, CRON_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { createIndyClient, loginToIndy } from '$lib/api/client.js';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export type SyncResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Validates the `Authorization: Bearer <CRON_SECRET>` header.
 * Returns a 401 `Response` if invalid, or `null` if the request is authorised.
 */
export function checkCronAuth(request: Request): Response | null {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}

/** Obtain an authenticated IndY client. Shared by endpoints that need it (e.g. /teacher/). */
export async function getAuthenticatedIndyClient() {
	const result = await loginToIndy(INDY_SERVICE_USERNAME, INDY_SERVICE_PASSWORD);
	if ('error' in result) return { error: result.error };
	return { client: createIndyClient(result.data.access_token) };
}

export const publicIndyClient = createIndyClient();

export async function syncTeachers(): Promise<SyncResult> {
	const authResult = await getAuthenticatedIndyClient();
	if ('error' in authResult) return { ok: false, error: `IndY login failed: ${authResult.error}` };

	const { data, error: apiError } = await authResult.client.GET('/teacher/');
	if (apiError) return { ok: false, error: String(apiError) };

	const rows = (
		data as {
			tid: string;
			firstname: string;
			lastname: string;
			username?: string;
			email?: string;
			areaofexpertise?: string;
		}[]
	).map((t) => ({
		tid: t.tid,
		firstname: t.firstname,
		lastname: t.lastname,
		username: t.username ?? null,
		email: t.email ?? null,
		area_of_expertise: t.areaofexpertise ?? null
	}));

	const { error } = await supabaseAdmin
		.schema('private')
		.from('teachers')
		.upsert(rows, { onConflict: 'tid' });

	if (error) return { ok: false, error: error.message };
	return { ok: true, message: `${rows.length} rows upserted` };
}

export async function syncHours(): Promise<SyncResult> {
	const { data, error: apiError } = await publicIndyClient.GET('/hour/');
	if (apiError) return { ok: false, error: String(apiError) };

	const rows = (
		data as {
			day: string;
			hour: number;
			room: string;
			teacher: string;
			consultation: number | boolean;
			slimit: number;
			fullname: string;
			area_of_expertise?: string;
		}[]
	).map((h) => ({
		day: h.day,
		hour: h.hour,
		room: h.room,
		teacher: h.teacher,
		consultation: Boolean(h.consultation),
		slimit: h.slimit,
		fullname: h.fullname,
		area_of_expertise: h.area_of_expertise ?? null
	}));

	const { error: delError } = await supabaseAdmin
		.schema('private')
		.from('hours')
		.delete()
		.neq('id', 0);

	if (delError) return { ok: false, error: `delete: ${delError.message}` };

	const { error: insError } = await supabaseAdmin.schema('private').from('hours').insert(rows);
	if (insError) return { ok: false, error: `insert: ${insError.message}` };
	return { ok: true, message: `${rows.length} rows replaced` };
}

export async function syncSubjects(): Promise<SyncResult> {
	const { data, error: apiError } = await publicIndyClient.GET('/subject/active');
	if (apiError) return { ok: false, error: String(apiError) };

	const rows = (data as { subject: string; longname?: string }[]).map((s) => ({
		subject: s.subject,
		longname: s.longname ?? null
	}));

	const { error } = await supabaseAdmin
		.schema('private')
		.from('subjects')
		.upsert(rows, { onConflict: 'subject' });

	if (error) return { ok: false, error: error.message };
	return { ok: true, message: `${rows.length} rows upserted` };
}

export async function syncSpecialIndy(): Promise<SyncResult> {
	const today = new Date().toISOString().slice(0, 10);

	const { data, error: apiError } = await publicIndyClient.GET('/specialindy/', {
		params: { query: { start_date: today } }
	});
	if (apiError) return { ok: false, error: String(apiError) };

	const rows = (
		data as {
			teacher: string;
			day: string;
			hour: number;
			area_of_expertise?: string;
			start_date: string;
			end_date: string;
			slimit?: number;
			room?: string;
			fullname?: string;
		}[]
	).map((s) => ({
		teacher: s.teacher,
		day: s.day,
		hour: s.hour,
		area_of_expertise: s.area_of_expertise ?? null,
		start_date: s.start_date,
		end_date: s.end_date,
		slimit: s.slimit ?? 0,
		room: s.room ?? null,
		fullname: s.fullname ?? null
	}));

	const { error: delError } = await supabaseAdmin
		.schema('private')
		.from('special_indy')
		.delete()
		.gte('start_date', today);

	if (delError) return { ok: false, error: `delete: ${delError.message}` };

	if (rows.length > 0) {
		const { error: insError } = await supabaseAdmin
			.schema('private')
			.from('special_indy')
			.insert(rows);
		if (insError) return { ok: false, error: `insert: ${insError.message}` };
	}

	return { ok: true, message: `${rows.length} rows replaced` };
}
