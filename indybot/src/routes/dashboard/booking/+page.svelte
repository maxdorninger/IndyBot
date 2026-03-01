<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { enhance } from '$app/forms';
	import { DAYS, HOURS } from '$lib/indyBooking';

	let { data, form } = $props();
	const f = $derived(form as Record<string, unknown> | null);

	type Day = (typeof DAYS)[number];

	const DAY_LABELS: Record<Day, string> = { Mo: 'Monday', Mi: 'Wednesday', Fr: 'Friday' };

	/** Map `${day}-${hour}` → list of currently available teachers for that slot. */
	const availableBySlot = $derived(
		data.availableHours.reduce(
			(acc: Record<string, { teacher: string; fullname: string }[]>, a) => {
				const key = `${a.day}-${a.hour}`;
				(acc[key] ??= []).push({ teacher: a.teacher, fullname: a.fullname });
				return acc;
			},
			{}
		)
	);

	/** Map teacher tid → display name. */
	const teacherNameMap = $derived(
		Object.fromEntries(
			data.teachers.map((t: { tid: string; firstname: string; lastname: string }) => [
				t.tid,
				`${t.firstname} ${t.lastname}`
			])
		) as Record<string, string>
	);

	function entriesForSlot(day: string, hour: number) {
		return data.bookings
			.filter((b: { day: string; hour: number }) => b.day === day && b.hour === hour)
			.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);
	}

	function slotTeachers(day: string, hour: number): { teacher: string; fullname: string }[] {
		return availableBySlot[`${day}-${hour}`] ?? [];
	}

	function isTeacherAvailable(teacher: string, day: string, hour: number): boolean {
		return slotTeachers(day, hour).some((t) => t.teacher === teacher);
	}
</script>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="me-2 h-4" />
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Booking Preferences</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>

<div class="flex flex-1 flex-col gap-6 p-6 pt-0">
	<!-- Page header + copy action -->
	<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-xl font-semibold">Booking Preferences</h1>
			<p class="text-sm text-muted-foreground">
				Set your preferred teacher, subject, and activity for Indy hours. Use the copy button next
				to each day if you want the same teacher for both hours.
			</p>
		</div>
	</div>

	<!-- Info box -->
	<div
		class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/30"
	>
		<p class="font-medium text-blue-800 dark:text-blue-300">How booking preferences work</p>
		<ul class="mt-1.5 list-disc space-y-1 pl-4 text-blue-700 dark:text-blue-400">
			<li>
				<span class="font-medium">Entries</span> are your preferred teacher, subject, and activity combinations
				for a given slot. IndyBot will try to book you with your highest-priority teacher first. If that
				teacher is unavailable it falls back to the next entry
			</li>
			<li>
				<span class="font-medium">Priority</span>: lower means higher preference (1 is tried first,
				2 second, ...)
			</li>
			<li>
				It is recommended to have <span class="font-medium">at least 2–3 entries per slot</span> to decrease
				the chance of a booking failure.
			</li>
		</ul>
	</div>

	<!-- Day sections -->
	{#each DAYS as day (day)}
		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between gap-4">
				<h2 class="text-base font-medium">{DAY_LABELS[day]}</h2>
				<div class="flex items-center gap-2">
					<form method="POST" action="?/copyHour3ToHour4" use:enhance>
						<input type="hidden" name="day" value={day} />
						<Button type="submit" variant="outline" size="sm">Add Hour 3 entries to Hour 4</Button>
					</form>
					{#if f?.action === 'copyHour3ToHour4' && f?.day === day && f?.success}
						<p class="text-xs text-green-600">Hour 3 entries added to Hour 4.</p>
					{:else if f?.action === 'copyHour3ToHour4' && f?.day === day && f?.error}
						<p class="text-xs text-destructive">{f.error}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each HOURS as hour (hour)}
					{@const teachers = slotTeachers(day, hour)}
					{@const entries = entriesForSlot(day, hour)}
					{@const slotKey = `${day}-${hour}`}

					<Card.Root>
						<Card.Header class="pb-2">
							<div class="flex items-center justify-between">
								<Card.Title class="text-sm font-semibold">Hour {hour}</Card.Title>
								{#if entries.length === 0}
									<span class="text-xs font-medium text-red-600">0 entries</span>
								{:else if entries.length === 1}
									<span class="text-xs font-medium text-orange-500">1 entry</span>
								{:else}
									<span class="text-xs font-medium text-green-600">{entries.length} entries</span>
								{/if}
							</div>
							{@const invalidCount = entries.filter(
								(e: { teacher: string }) => !isTeacherAvailable(e.teacher, day, hour)
							).length}
							{#if invalidCount > 0}
								<p class="text-xs text-yellow-700 dark:text-yellow-400">
									{invalidCount}
									{invalidCount === 1 ? 'entry is' : 'entries are'} not (or no longer) valid, since the
									teacher is not scheduled regularly for this slot.
								</p>
							{/if}
						</Card.Header>
						<Card.Content class="flex flex-col gap-3 pt-0">
							{#if entries.length > 0}
								<div class="flex flex-col gap-1.5">
									{#each entries as entry (entry.id)}
										{@const available = isTeacherAvailable(entry.teacher, day, hour)}
										<div
											class="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm {available
												? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
												: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30'}"
										>
											<div class="flex flex-col gap-0.5 leading-snug">
												<div class="flex items-center gap-1.5">
													{#if available}
														<span class="text-green-600" title="Teacher available for this slot"
															>✓</span
														>
													{:else}
														<span
															class="text-yellow-600"
															title="Teacher not available for this slot">⚠</span
														>
													{/if}
													<span class="font-medium"
														>{teacherNameMap[entry.teacher] ?? entry.teacher}</span
													>
													<span class="text-muted-foreground">·</span>
													<span class="text-muted-foreground">{entry.subject}</span>
												</div>
												<div class="pl-5 text-xs text-muted-foreground">
													{entry.activity}
													<span class="ml-2 opacity-60">Priority {entry.priority}</span>
												</div>
												{#if !available}
													<div
														class="pl-5 text-xs font-medium text-yellow-700 dark:text-yellow-400"
													>
														This teacher is not or no longer scheduled regularly for this slot and
														will be skipped.
													</div>
												{/if}
											</div>
											<form method="POST" action="?/deleteEntry" use:enhance>
												<input type="hidden" name="id" value={entry.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
													title="Remove entry"
												>
													✕
												</Button>
											</form>
										</div>
									{/each}
								</div>
							{/if}

							<!-- Error for this slot's add form -->
							{#if f?.action === 'addEntry' && f?.slotKey === slotKey && f?.error}
								<p class="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
									{f.error}
								</p>
							{/if}

							<!-- Add form -->
							{#if teachers.length > 0}
								<form
									method="POST"
									action="?/addEntry"
									use:enhance
									class="flex flex-col gap-2 border-t pt-3"
								>
									<input type="hidden" name="day" value={day} />
									<input type="hidden" name="hour" value={hour} />

									<div class="flex flex-col gap-1">
										<Label class="text-xs text-muted-foreground">Teacher</Label>
										<select
											name="teacher"
											required
											class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
										>
											<option value="" disabled selected>Select teacher…</option>
											{#each teachers as t (t.teacher)}
												<option value={t.teacher}>{t.fullname}</option>
											{/each}
										</select>
									</div>

									<div class="flex flex-col gap-1">
										<Label class="text-xs text-muted-foreground">Subject</Label>
										<select
											name="subject"
											required
											class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
										>
											<option value="" disabled selected>Select subject…</option>
											{#each data.subjects as subject (subject)}
												<option value={subject}>{subject}</option>
											{/each}
										</select>
									</div>

									<div class="flex flex-col gap-1">
										<Label class="text-xs text-muted-foreground">Activity / Task</Label>
										<Input
											name="activity"
											type="text"
											placeholder="e.g. Exam preparation"
											required
										/>
									</div>

									<div class="flex items-end gap-2">
										<div class="flex flex-1 flex-col gap-1">
											<Label class="text-xs text-muted-foreground"
												>Priority <span class="opacity-60">(1 = highest)</span></Label
											>
											<Input
												name="priority"
												type="number"
												min="1"
												value={entries.length + 1}
												class="w-full"
											/>
										</div>
										<Button type="submit" class="shrink-0">Add</Button>
									</div>
								</form>
							{:else}
								<p class="border-t pt-3 text-xs text-muted-foreground">
									No teachers are currently available for this slot. Check back later or adjust the
									IndY schedule.
								</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>

		{#if day !== 'Fr'}
			<Separator />
		{/if}
	{/each}
</div>
