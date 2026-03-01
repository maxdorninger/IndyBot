import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const DAYS = ['Mo', 'Mi', 'Fr'] as const;
export const HOURS = [3, 4] as const;

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) return { bookings: [], availableHours: [], subjects: [], teachers: [] };

	const [{ data: bookings }, { data: availableHours }, { data: subjects }, { data: teachers }] =
		await Promise.all([
			supabase
				.schema('private')
				.from('booking_data')
				.select('id, teacher, day, hour, subject, activity, priority')
				.eq('user_id', user.id)
				.in('day', [...DAYS])
				.in('hour', [...HOURS])
				.order('priority'),
			supabase
				.schema('private')
				.from('hours')
				.select('day, hour, teacher, fullname')
				.in('day', [...DAYS])
				.in('hour', [...HOURS]),
			supabase.schema('private').from('subjects').select('subject').order('subject'),
			supabase
				.schema('private')
				.from('teachers')
				.select('tid, firstname, lastname')
				.order('lastname')
		]);

	return {
		bookings: bookings ?? [],
		availableHours: availableHours ?? [],
		subjects: (subjects ?? []).map((s: { subject: string }) => s.subject),
		teachers: teachers ?? []
	};
};

export const actions: Actions = {
	addEntry: async ({ request, locals: { supabase } }) => {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'addEntry', error: 'Not authenticated.' });

		const fd = await request.formData();
		const day = fd.get('day') as string;
		const hourValue = fd.get('hour');
		const hour = Number(hourValue);
		const teacher = fd.get('teacher') as string;
		const subject = fd.get('subject') as string;
		const activity = (fd.get('activity') as string)?.trim();
		const priority = Number(fd.get('priority')) || 1;
		const slotKey = `${day}-${hour}`;
		const isValidDay = DAYS.includes(day as (typeof DAYS)[number]);
		const isValidHour = HOURS.includes(hour as (typeof HOURS)[number]);

		if (
			!day ||
			Number.isNaN(hour) ||
			!teacher ||
			!subject ||
			!activity ||
			!isValidDay ||
			!isValidHour
		) {
			return fail(400, {
				action: 'addEntry',
				slotKey,
				error: 'Missing required fields or invalid day/hour values.'
			});
		}

		const { error } = await supabase.schema('private').from('booking_data').insert({
			user_id: user.id,
			day,
			hour,
			teacher,
			subject,
			activity,
			priority
		});

		if (error) return fail(500, { action: 'addEntry', slotKey, error: error.message });
		return { action: 'addEntry', slotKey, success: true };
	},

	deleteEntry: async ({ request, locals: { supabase } }) => {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'deleteEntry', error: 'Not authenticated.' });

		const fd = await request.formData();
		const id = Number(fd.get('id'));

		if (Number.isNaN(id)) {
			return fail(400, { action: 'deleteEntry', error: 'Invalid entry ID.' });
		}

		const { error } = await supabase
			.schema('private')
			.from('booking_data')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { action: 'deleteEntry', error: error.message });
		return { action: 'deleteEntry', success: true };
	},

	copyHour3ToHour4: async ({ request, locals: { supabase } }) => {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return fail(401, { action: 'copyHour3ToHour4', error: 'Not authenticated.' });

		const fd = await request.formData();
		const day = fd.get('day') as string;
		if (!day || !DAYS.includes(day as (typeof DAYS)[number])) {
			return fail(400, { action: 'copyHour3ToHour4', day, error: 'Invalid day.' });
		}

		const { data: hour3Entries, error: fetchError } = await supabase
			.schema('private')
			.from('booking_data')
			.select('teacher, subject, activity, priority')
			.eq('user_id', user.id)
			.eq('day', day)
			.eq('hour', 3);

		if (fetchError)
			return fail(500, { action: 'copyHour3ToHour4', day, error: fetchError.message });

		if (!hour3Entries?.length)
			return fail(400, { action: 'copyHour3ToHour4', day, error: 'No Hour 3 entries to copy.' });

		const { error: insertError } = await supabase
			.schema('private')
			.from('booking_data')
			.insert(hour3Entries.map((e) => ({ ...e, user_id: user.id, day, hour: 4 })));

		if (insertError)
			return fail(500, { action: 'copyHour3ToHour4', day, error: insertError.message });

		return { action: 'copyHour3ToHour4', day, success: true };
	}
};
