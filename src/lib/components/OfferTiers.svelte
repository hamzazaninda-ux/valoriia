<script lang="ts">
	import type { ProductOffer } from '$lib/types/templates';

	let {
		offers = [],
		selectedId = $bindable(2),
		onSelect = () => {}
	}: {
		offers?: ProductOffer[];
		selectedId?: number;
		onSelect?: (offer: ProductOffer) => void;
	} = $props();

	function chooseOffer(offer: ProductOffer) {
		selectedId = offer.id;
		onSelect(offer);
	}
</script>

<div class="space-y-3 my-3" dir="rtl" role="radiogroup" aria-label="اختر العرض المناسب لك">
	<span class="block text-right font-extrabold text-sm text-neutral-900 mb-1 select-none">
		اختر العرض المناسب لك:
	</span>

	<div class="flex flex-col gap-2.5 pt-1">
		{#each offers as offer (offer.id)}
			<div
				onclick={() => chooseOffer(offer)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						chooseOffer(offer);
					}
				}}
				role="radio"
				aria-checked={selectedId === offer.id}
				tabindex="0"
				class="relative p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-2.5 sm:gap-3 select-none {offer.id === 2 ? 'mt-4' : ''} {selectedId === offer.id
					? 'border-[#0B3B24] bg-emerald-50/40 shadow-md ring-1 ring-[#0B3B24]/20 scale-[1.01]'
					: 'border-gray-200 bg-white hover:border-gray-300'}"
			>
				<!-- Floating Pill Badge on Top of Best Offer (Tier 2) -->
				{#if offer.id === 2 || offer.isPopular}
					<span class="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1 whitespace-nowrap">
						⭐ الأكثر طلباً
					</span>
				{/if}

				<!-- Right Group: Radio + Image + Details -->
				<div class="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
					<!-- Visual Selection Indicator: Animated Radio Checkmark -->
					<div
						class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 {selectedId === offer.id
							? 'border-[#0B3B24] bg-[#0B3B24] text-white shadow-xs'
							: 'border-gray-300 bg-white'}"
					>
						{#if selectedId === offer.id}
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3.5] animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
							</svg>
						{/if}
					</div>

					<!-- Product Thumbnail Image -->
					<div class="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-50 shadow-2xs">
						{#if offer.image}
							<img src={offer.image} alt={offer.title} class="w-full h-full object-cover" loading="lazy" />
						{:else}
							<div class="w-full h-full flex items-center justify-center text-neutral-400 text-lg">🎁</div>
						{/if}
					</div>

					<!-- Middle Details: Title + Badges + Unit Price -->
					<div class="flex-1 min-w-0 text-right pr-0.5">
						<div class="font-black text-gray-900 text-[13px] sm:text-sm leading-snug mb-1">
							{offer.title}
						</div>

						<div class="flex flex-wrap items-center gap-1.5">
							{#if offer.id === 2}
								<span class="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
									وفّر 109 درهم
								</span>
								<span class="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
									توصيل فابور 🚚
								</span>
								<span class="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 whitespace-nowrap">
									(فقط 174 درهم للقطعة ⚡)
								</span>
							{:else}
								<span class="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-500 text-white whitespace-nowrap">
									توصيل فابور 🚚
								</span>
								<span class="text-[10px] sm:text-[11px] font-bold text-neutral-500 whitespace-nowrap">
									(229 درهم للقطعة)
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Left Price Column (Crossed out old price + Active Price) -->
				<div class="shrink-0 text-left border-r border-gray-100 pr-2.5 pl-0.5 flex flex-col items-end justify-center" dir="ltr">
					{#if offer.originalPrice}
						<span class="text-[11px] text-gray-400 line-through block leading-none mb-1 whitespace-nowrap">
							{offer.originalPrice} درهم
						</span>
					{/if}
					<span class="text-[15px] sm:text-lg font-black leading-none whitespace-nowrap {selectedId === offer.id ? 'text-[#0B3B24]' : 'text-gray-900'}">
						{offer.price} درهم
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	@keyframes scaleIn {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	.animate-scale-in {
		animation: scaleIn 0.15s ease-out forwards;
	}
</style>
