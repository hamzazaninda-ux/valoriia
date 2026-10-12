<script lang="ts">
	import { slide } from 'svelte/transition';
	import { trackAddToCart } from '$lib/tracking/pixel.js';

	interface Props {
		productName?: string;
		price?: number;
		targetId?: string;
	}

	let {
		productName = 'Gummies Bundle',
		price = 249,
		targetId = 'order'
	}: Props = $props();

	let scrollY = $state(0);

	function handleClick() {
		if (typeof window !== 'undefined') {
			// 1. Instantly update browser address bar to /cart
			window.history.pushState({ page: 'cart' }, '', '/cart');

			// 2. Fire Meta Pixel AddToCart with 1000ms debounce
			trackAddToCart(productName, price);
		}

		// 3. Smoothly scroll to order section
		const el = document.getElementById(targetId) || document.getElementById('product-order-box') || document.getElementById('offers');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<svelte:window bind:scrollY />

{#if scrollY > 350}
	<div
		transition:slide={{ duration: 250 }}
		class="fixed bottom-3.5 inset-x-3.5 z-40 max-w-sm mx-auto sm:hidden pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
		dir="rtl"
	>
		<button
			type="button"
			onclick={handleClick}
			class="pointer-events-auto relative overflow-hidden w-full min-h-[54px] rounded-full bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#143427] text-white px-5 py-2.5 shadow-[0_12px_32px_rgba(20,52,39,0.5),0_2px_8px_rgba(20,52,39,0.2)] border border-emerald-400/35 active:scale-[0.98] transition-all flex items-center justify-between gap-3 cursor-pointer group"
			aria-label="اطلبي الآن والدفع عند الاستلام"
		>
			<!-- Shimmer Light-Beam Streak -->
			<div
				class="shimmer-pill-beam absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
				aria-hidden="true"
			></div>

			<!-- Right Side: Live Pulse Dot + Headline & Trust Micro-Copy -->
			<div class="relative z-10 flex items-center gap-2.5 text-start leading-tight">
				<span class="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
				</span>

				<div class="flex flex-col">
					<div class="flex items-center gap-1.5">
						<span class="font-display font-black text-sm text-white tracking-tight">
							اطلبي الآن • الدفع عند الاستلام
						</span>
						<span class="text-xs">🛍️</span>
					</div>
					<span class="text-[10px] text-emerald-200/90 font-semibold mt-0.5 flex items-center gap-1">
						<span>🚚 توصيل فابور</span>
						<span class="text-emerald-400/50">•</span>
						<span>📦 معاينة عند الباب</span>
					</span>
				</div>
			</div>

			<!-- Left Side: Circular Arrow Badge -->
			<div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white border border-white/25 text-xs font-black transition-transform group-hover:-translate-x-0.5 shadow-inner">
				←
			</div>
		</button>
	</div>
{/if}

<style>
	@keyframes shimmerSweep {
		0% {
			transform: translateX(-150%) skewX(-20deg);
		}
		35%, 100% {
			transform: translateX(250%) skewX(-20deg);
		}
	}
	.shimmer-pill-beam {
		animation: shimmerSweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
</style>
