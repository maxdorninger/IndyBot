<script lang="ts">
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import SignupForm from '$lib/components/signup-form.svelte';
	import { resolve } from '$app/paths';

	let { form } = $props();
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href={resolve('/')} class="flex items-center gap-2 self-center font-medium">
			<div
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<GalleryVerticalEndIcon class="size-4" />
			</div>
			IndyBot
		</a>
		<SignupForm {form} />
	</div>
</div>
