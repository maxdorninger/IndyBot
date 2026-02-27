<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	let {
		class: className,
		form,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		form?: {
			error?: string;
			message?: string;
			email?: string;
			name?: string;
			success?: boolean;
		} | null;
	} = $props();
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Create your account</Card.Title>
			<Card.Description>Enter your email below to create your account</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-center text-sm text-green-700">
					{form.message}
				</p>
			{/if}
			<form method="POST" action="?/signup" use:enhance>
				<Field.Group>
					<Field.Field>
						<Field.Label for="name">Full Name</Field.Label>
						<Input
							id="name"
							name="name"
							type="text"
							placeholder="John Doe"
							value={form?.name ?? ''}
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.Label for="email">Email</Field.Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="m@example.com"
							value={form?.email ?? ''}
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.Field class="grid grid-cols-2 gap-4">
							<Field.Field>
								<Field.Label for="password">Password</Field.Label>
								<Input id="password" name="password" type="password" required />
							</Field.Field>
							<Field.Field>
								<Field.Label for="confirm-password">Confirm Password</Field.Label>
								<Input id="confirm-password" name="confirm-password" type="password" required />
							</Field.Field>
						</Field.Field>
						<Field.Description>Must be at least 8 characters long.</Field.Description>
					</Field.Field>
					<Field.Field>
						<Button type="submit">Create Account</Button>
						<Field.Description class="text-center">
							Already have an account? <a href={resolve('/login')}>Sign in</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</form>
		</Card.Content>
	</Card.Root>
</div>
