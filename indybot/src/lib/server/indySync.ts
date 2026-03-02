import { CRON_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { createIndyClient } from '$lib/api/client.js';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export type SyncResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Validates the `Authorization: Bearer <CRON_SECRET>` header.
 * Returns a 401 `Response` if invalid, or `null` if the request is authorised.
 */
export function checkCronAuth(request: Request): Response | null {
	if (!CRON_SECRET || !CRON_SECRET.trim()) {
		return json({ error: 'Server misconfigured' }, { status: 500 });
	}

	const authHeader = request.headers.get('Authorization');
	if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}

/** Unauthenticated client — sufficient for all synced public endpoints. */
export const publicIndyClient = createIndyClient();

export async function syncHours(): Promise<SyncResult> {
	const { data, error: apiError } = await publicIndyClient.GET('/hour/');
	if (apiError) return { ok: false, error: String(apiError) };

	if (!Array.isArray(data)) return { ok: false, error: 'Unexpected response: expected an array' };

	type RawHour = {
		day: string;
		hour: number;
		room: string;
		teacher: string;
		consultation: number | boolean;
		slimit: number;
		fullname: string;
		area_of_expertise?: string;
	};

	function isValidHour(item: unknown): item is RawHour {
		if (typeof item !== 'object' || item === null) return false;
		const h = item as Record<string, unknown>;
		return (
			typeof h.day === 'string' &&
			typeof h.hour === 'number' &&
			typeof h.room === 'string' &&
			typeof h.teacher === 'string' &&
			typeof h.slimit === 'number' &&
			typeof h.fullname === 'string'
		);
	}

	const valid = data.filter(isValidHour);
	if (valid.length !== data.length) {
		console.warn(`syncHours: skipped ${data.length - valid.length} invalid rows`);
	}

	const rows = valid.map((h) => ({
		day: h.day,
		hour: h.hour,
		room: h.room,
		teacher: h.teacher,
		consultation: Boolean(h.consultation),
		slimit: h.slimit,
		fullname: h.fullname,
		area_of_expertise: h.area_of_expertise ?? null
	}));

	const { error: delError } = await supabaseAdmin.schema('private').from('hours').delete();

	if (delError) return { ok: false, error: `delete: ${delError.message}` };

	const { error: insError } = await supabaseAdmin.schema('private').from('hours').insert(rows);
	if (insError) return { ok: false, error: `insert: ${insError.message}` };
	return { ok: true, message: `${rows.length} rows replaced` };
}

export async function syncSubjects(): Promise<SyncResult> {
	const { data, error: apiError } = await publicIndyClient.GET('/subject/active');
	if (apiError) return { ok: false, error: String(apiError) };

	if (!Array.isArray(data)) return { ok: false, error: 'Unexpected response: expected an array' };

	function isValidSubject(item: unknown): item is { subject: string; longname?: string } {
		if (typeof item !== 'object' || item === null) return false;
		const s = item as Record<string, unknown>;
		return typeof s.subject === 'string';
	}

	const valid = data.filter(isValidSubject);
	if (valid.length !== data.length) {
		console.warn(`syncSubjects: skipped ${data.length - valid.length} invalid rows`);
	}

	const rows = valid.map((s) => ({
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

	if (!Array.isArray(data)) return { ok: false, error: 'Unexpected response: expected an array' };

	type RawSpecialIndy = {
		teacher: string;
		day: string;
		hour: number;
		area_of_expertise?: string;
		start_date: string;
		end_date: string;
		slimit?: number;
		room?: string;
		fullname?: string;
	};

	function isValidSpecialIndy(item: unknown): item is RawSpecialIndy {
		if (typeof item !== 'object' || item === null) return false;
		const s = item as Record<string, unknown>;
		return (
			typeof s.teacher === 'string' &&
			typeof s.day === 'string' &&
			typeof s.hour === 'number' &&
			typeof s.start_date === 'string' &&
			typeof s.end_date === 'string'
		);
	}

	const valid = data.filter(isValidSpecialIndy);
	if (valid.length !== data.length) {
		console.warn(`syncSpecialIndy: skipped ${data.length - valid.length} invalid rows`);
	}

	const rows = valid.map((s) => ({
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
