<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event: string) => {
			if (event !== 'INITIAL_SESSION') {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
