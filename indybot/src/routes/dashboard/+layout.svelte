<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children, data } = $props();

	const sidebarUser = $derived({
		name: data.authUser.user_metadata?.full_name ?? data.authUser.email ?? 'User',
		email: data.authUser.email ?? '',
		avatar: data.authUser.user_metadata?.avatar_url ?? ''
	});
</script>

<Sidebar.Provider>
	<AppSidebar user={sidebarUser} />
	<Sidebar.Inset>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
