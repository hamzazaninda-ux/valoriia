<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		price?: number;
		tierLabel?: string;
		onCtaClick?: () => void;
	}

	let {
		price = 279,
		tierLabel = 'باقة الثنائي (شهرين)',
		onCtaClick
	}: Props = $props();

	let scrollY = $state(0);
	const visible = $derived(scrollY > 350);

	function handleClick() {
		if (onCtaClick) {
			onCtaClick();
			return;
		}
		const el = document.getElementById('showcase');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			window.location.href = '/products/gummies_biotine';
		}
	}
</script>

<svelte:window bind:scrollY={scrollY} />

{#if visible}
	<div
		transition:slide={{ duration: 300 }}
		class="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-[#E86A7C] via-[#e5596e] to-[#d8485e] text-white p-3 shadow-[0_-10px_30px_rgba(232,106,124,0.35)] border-t border-white/25 sm:hidden"
		dir="rtl"
	>
		<div class="flex items-center justify-between gap-3 max-w-md mx-auto">
			<div class="flex flex-col text-start leading-tight text-white">
				<span class="text-[10px] font-bold text-pink-100">
					توصيل فابور مجاني 🚚
				</span>
				<div class="flex items-baseline gap-1 mt-0.5">
					<span class="font-display text-lg font-black text-white">{price} MAD</span>
					<span class="text-[10px] text-pink-200 line-through">398 MAD</span>
				</div>
			</div>

			<button
				type="button"
				onclick={handleClick}
				class="flex-1 min-h-11 rounded-xl bg-white text-[#E86A7C] hover:bg-pink-50 active:scale-95 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
			>
				<span>اطلبي الآن • الدفع عند الاستلام</span>
				<span class="text-sm">←</span>
			</button>
		</div>
	</div>
{/if}
