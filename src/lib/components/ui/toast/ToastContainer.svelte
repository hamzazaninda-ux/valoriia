<script lang="ts">
	import { onMount } from 'svelte';
	import { toasts, type Toast } from '$lib/stores/toast';

	function getBgColor(type: Toast['type']): string {
		if (type === 'success') return 'bg-emerald-600';
		if (type === 'error') return 'bg-red-600';
		return 'bg-blue-600';
	}

	function getIcon(type: Toast['type']): string {
		if (type === 'success') return '✓';
		if (type === 'error') return '✕';
		return 'ℹ';
	}

	// Auto-dismiss: track timers per toast ID
	const timers = new Map<number, ReturnType<typeof setTimeout>>();

	function scheduleRemove(toast: Toast) {
		if (timers.has(toast.id)) return; // already scheduled
		const timer = setTimeout(() => {
			toasts.remove(toast.id);
			timers.delete(toast.id);
		}, toast.duration);
		timers.set(toast.id, timer);
	}

	function cancelTimer(id: number) {
		const t = timers.get(id);
		if (t) {
			clearTimeout(t);
			timers.delete(id);
		}
	}

	function manualRemove(id: number) {
		cancelTimer(id);
		toasts.remove(id);
	}
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 pointer-events-none">
	{#each $toasts as toast (toast.id)}
		{@const _ = scheduleRemove(toast)}
		<div
			class="pointer-events-auto animate-toast-in"
			role="alert"
		>
			<div class="{getBgColor(toast.type)} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[480px]">
				<span class="text-lg font-bold">{getIcon(toast.type)}</span>
				<span class="text-sm font-medium flex-1">{toast.message}</span>
				<button
					onclick={() => manualRemove(toast.id)}
					class="text-white/70 hover:text-white text-lg leading-none ml-2 cursor-pointer"
					aria-label="Close"
				>
					×
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(-12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-toast-in {
		animation: toast-in 0.25s ease-out;
	}
</style>
