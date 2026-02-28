<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const expiresAt = $derived(data.expiresAt ? new Date(data.expiresAt) : null);
	const expiresInDays = $derived(
		expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
	);
	const isExpiringSoon = $derived(expiresInDays !== null && expiresInDays <= 5);
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
					<Breadcrumb.Link href="/dashboard/settings">Settings</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>IndY Connection</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>

<div class="flex max-w-2xl flex-1 flex-col gap-6 p-6 pt-0">
	<!-- Current status -->
	{#if data.connected}
		<Card.Root class={isExpiringSoon ? 'border-yellow-500' : 'border-green-500'}>
			<Card.Header>
				<Card.Title class={isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}>
					{isExpiringSoon ? 'Connection expiring soon' : 'Connected to IndY'}
				</Card.Title>
				<Card.Description>
					{#if expiresAt}
						{#if isExpiringSoon}
							Your IndY session expires in <strong
								>{expiresInDays} day{expiresInDays === 1 ? '' : 's'}</strong
							>
							({expiresAt.toLocaleDateString()}). Please reconnect below to continue using IndY.
						{:else}
							Mode: <strong
								>{data.mode === 'credentials'
									? 'Stored credentials (auto-renew)'
									: 'Refresh token only'}</strong
							>. Session valid until <strong>{expiresAt.toLocaleDateString()}</strong>
							({expiresInDays} day{expiresInDays === 1 ? '' : 's'} remaining).
						{/if}
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/disconnect" use:enhance>
					<Button type="submit" variant="outline">Disconnect from IndY</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="border-muted">
			<Card.Header>
				<Card.Title class="text-muted-foreground">Not connected</Card.Title>
				<Card.Description
					>Connect your IndY account using one of the options below.</Card.Description
				>
			</Card.Header>
		</Card.Root>
	{/if}

	<!-- Option A: Stored credentials -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Option A: Store credentials permanently</Card.Title>
			<Card.Description>
				Your credentials are encrypted with AES-256-GCM and stored securely on the server. This
				allows IndyBot to automatically renew your session when the refresh token expires. You only
				need to update this when your password changes.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'saveCredentials' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.action === 'saveCredentials' && form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
					Connected. Your credentials are stored securely.
				</p>
			{/if}
			<form method="POST" action="?/saveCredentials" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="username-b">IndY username</Label>
					<Input id="username-b" name="username" type="text" autocomplete="username" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="password-b">IndY password</Label>
					<Input
						id="password-b"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<p class="text-xs text-muted-foreground">
					Your credentials are encrypted with AES-256-GCM using a server-side key and stored in your
					account. They are only decrypted on the server when renewing your session.
				</p>
				<div>
					<Button type="submit">Connect</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Option B: Token only -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Option B: Refresh token only</Card.Title>
			<Card.Description>
				Your credentials are used once to obtain a refresh token, then discarded. The token is valid
				for <strong>30 days</strong>. You will need to reconnect after it expires, IndyBot will send
				you emails reminding you to do so.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.action === 'saveTokenOnly' && form?.error}
				<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			{#if form?.action === 'saveTokenOnly' && form?.success}
				<p class="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
					Connected. Your refresh token will expire in 30 days — you'll need to reconnect after
					that.
				</p>
			{/if}
			<form method="POST" action="?/saveTokenOnly" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="username-a">IndY username</Label>
					<Input id="username-a" name="username" type="text" autocomplete="username" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="password-a">IndY password</Label>
					<Input
						id="password-a"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<p class="text-xs text-muted-foreground">
					Your credentials are used once to obtain a refresh token and are <strong
						>never stored</strong
					>. Only the resulting refresh token is saved.
				</p>
				<div>
					<Button type="submit">Connect</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
