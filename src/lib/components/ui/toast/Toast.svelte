<script lang="ts">
	import { onMount } from 'svelte';

	let {
		message = '',
		type = 'success',
		duration = 3000,
		onclose
	}: {
		message: string;
		type?: 'success' | 'error' | 'info';
		duration?: number;
		onclose?: () => void;
	} = $props();

	let visible = $state(false);

	onMount(() => {
		visible = true;
		const timer = setTimeout(() => {
			visible = false;
			setTimeout(() => onclose?.(), 300);
		}, duration);
		return () => clearTimeout(timer);
	});

	const bgColor = $derived(
		type === 'success' ? 'bg-emerald-600' :
		type === 'error' ? 'bg-red-600' :
		'bg-blue-600'
	);

	const icon = $derived(
		type === 'success' ? '✓' :
		type === 'error' ? '✕' :
		'i'
	);
</script>

<div
	class="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-300 {visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}"
	role="alert"
>
	<div class="{bgColor} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[480px]">
		<span class="text-lg font-bold">{icon}</span>
		<span class="text-sm font-medium flex-1">{message}</span>
		<button
			onclick={() => { visible = false; setTimeout(() => onclose?.(), 300); }}
			class="text-white/70 hover:text-white text-lg leading-none ml-2"
			aria-label="Close"
		>
			×
		</button>
	</div>
</div>
