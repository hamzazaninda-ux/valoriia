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
				<span class="inline-flex items-center gap-1 text-[10px] font-bold text-pink-100">
					<svg class="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
					</svg>
					<span>توصيل فابور مجاني</span>
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
