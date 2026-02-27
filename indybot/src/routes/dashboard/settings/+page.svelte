<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	let deleteConfirm = $state('');

	$effect(() => {
		if (form?.action === 'deleteAccount' && form?.success) {
			goto(resolve('/login'));
		}
	});
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
					<Breadcrumb.Link href="/dashboard">Account</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Settings</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>

<div class="flex max-w-xl flex-1 flex-col gap-6 p-6 pt-0">
	<!-- Profile -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Profile</Card.Title>
			<Card.Description>Update your display name.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'updateProfile' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.action === 'updateProfile' && form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
					Profile updated successfully.
				</p>
			{/if}
			<form method="POST" action="?/updateProfile" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="full_name">Full Name</Label>
					<Input
						id="full_name"
						name="full_name"
						type="text"
						placeholder="John Doe"
						value={data.fullName}
						required
					/>
				</div>
				<div>
					<Button type="submit">Save changes</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Email -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Email address</Card.Title>
			<Card.Description>
				Change the email address associated with your account. A confirmation will be sent to the
				new address.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'updateEmail' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.action === 'updateEmail' && form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
					{form.message}
				</p>
			{/if}
			<form method="POST" action="?/updateEmail" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="m@example.com"
						value={data.email}
						required
					/>
				</div>
				<div>
					<Button type="submit">Update email</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Password -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Password</Card.Title>
			<Card.Description>Choose a strong password for your account.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'updatePassword' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.action === 'updatePassword' && form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
					Password updated successfully.
				</p>
			{/if}
			<form method="POST" action="?/updatePassword" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="password">New password</Label>
					<Input id="password" name="password" type="password" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="confirm_password">Confirm new password</Label>
					<Input id="confirm_password" name="confirm_password" type="password" required />
				</div>
				<div>
					<Button type="submit">Update password</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Danger zone -->
	<Card.Root class="border-destructive">
		<Card.Header>
			<Card.Title class="text-destructive">Danger zone</Card.Title>
			<Card.Description>
				Permanently delete your account and all associated data. This action cannot be undone.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'deleteAccount' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			<form method="POST" action="?/deleteAccount" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="delete_confirm">
						Type <span class="font-semibold">delete my account</span> to confirm
					</Label>
					<Input
						id="delete_confirm"
						type="text"
						placeholder="delete my account"
						bind:value={deleteConfirm}
					/>
				</div>
				<div>
					<Button
						type="submit"
						variant="destructive"
						disabled={deleteConfirm !== 'delete my account'}
					>
						Delete account
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
