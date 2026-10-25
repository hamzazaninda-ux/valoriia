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

	function cleanOfferTitle(offer: ProductOffer): string {
		if (offer.id === 1) return '1 قطعة + رشاشة';
		if (offer.id === 2) return '2 قطع + رشاشين';
		return (offer.title || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
	}

	function hasGiftSuffix(offer: ProductOffer): boolean {
		return offer.id === 1 || offer.id === 2;
	}

	function getSavings(offer: ProductOffer): number {
		if (offer.originalPrice && offer.originalPrice > offer.price) {
			return Math.round(offer.originalPrice - offer.price);
		}
		return offer.id === 2 ? 109 : 70;
	}
</script>

<div class="space-y-3" dir="rtl" role="radiogroup" aria-label="أكمل طلبك الآن">
	<div class="flex flex-col gap-3">
		{#each offers as offer (offer.id)}
			{@const isSelected = selectedId === offer.id}
			{@const savings = getSavings(offer)}
			<div
				onclick={() => chooseOffer(offer)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						chooseOffer(offer);
					}
				}}
				role="radio"
				aria-checked={isSelected}
				tabindex="0"
				class="relative w-full min-h-[96px] px-2.5 py-3 sm:p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 flex items-center justify-between gap-2 sm:gap-3.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C4B]/40 {offer.id === 2 || offer.isPopular ? 'mt-2.5' : ''} {isSelected
					? 'border-[#1F5C4B] bg-[#F5F0E6] shadow-[inset_0_0_0_0.5px_#1F5C4B,0_6px_16px_rgba(31,92,75,0.09)]'
					: 'border-[#D9D4C7] bg-white hover:border-[#1F5C4B]/50'}"
			>
				<!-- Top-corner badge on Card 2 -->
				{#if offer.id === 2 || offer.isPopular}
					<span class="absolute -top-3 start-3.5 bg-[#1F5C4B] text-white text-[14px] font-bold leading-none px-3 py-1 rounded-full z-10 whitespace-nowrap">
						الأوفر
					</span>
				{/if}

				<!-- Right (RTL Start): Radio Indicator -->
				<div
					class="w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors duration-150 {isSelected
						? 'border-[#1F5C4B] bg-[#1F5C4B] text-white'
						: 'border-[#D9D4C7] bg-white'}"
				>
					{#if isSelected}
						<svg aria-hidden="true" class="w-3 h-3 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{/if}
				</div>

				<!-- Middle: Offer Details & Price Hierarchy -->
				<div class="flex-1 min-w-0 text-start">
					<!-- Title + 1 Small Consistent Gift Icon -->
					<div class="text-[15px] sm:text-[16px] font-bold text-[#1A1A1A] leading-snug">
						{#if hasGiftSuffix(offer)}
							<span>{cleanOfferTitle(offer)} </span><span class="whitespace-nowrap">هدية<svg
								aria-hidden="true"
								class="inline-block w-4 h-4 ms-1 -mt-0.5 text-[#1F5C4B]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
							</svg></span>
						{:else}
							<span>{cleanOfferTitle(offer)}</span>
						{/if}
					</div>

					<!-- Price Row: 28px New Price + 16px Strikethrough Old Price -->
					<div class="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 sm:gap-x-2 gap-y-0.5">
						<span class="text-[28px] font-bold leading-none text-[#1F5C4B] whitespace-nowrap">
							{offer.price} درهم
						</span>
						{#if offer.originalPrice}
							<span class="text-[16px] font-normal leading-none text-[#6B6B6B] line-through whitespace-nowrap">
								{offer.originalPrice} درهم
							</span>
						{/if}
					</div>

					<!-- Savings Chip -->
					<div class="mt-2">
						<span class="inline-flex items-center rounded-full bg-[#E3F0EA] px-2.5 py-0.5 text-[14px] font-bold text-[#1F5C4B] leading-snug whitespace-nowrap">
							وفّر {savings} درهم
						</span>
					</div>

					{#if offer.id === 2 || offer.isPopular}
						<p class="mt-1.5 text-[14px] font-bold text-[#1F5C4B] leading-snug">
							فقط 174 درهم للقطعة
						</p>
						<p class="mt-0.5 text-[13px] font-normal text-[#6B6B6B] leading-snug">
							مناسب لحمامين أو هدية للوالدة
						</p>
					{/if}
				</div>

				<!-- Left (RTL End): Small Product Thumbnail (72px) -->
				<div class="w-[72px] h-[72px] rounded-[10px] overflow-hidden border border-[#D9D4C7] shrink-0 bg-white">
					{#if offer.image}
						<img src={offer.image} alt="{cleanOfferTitle(offer)}{hasGiftSuffix(offer) ? ' هدية' : ''}" class="w-full h-full object-cover" loading="lazy" />
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-[#E3F0EA] text-[#1F5C4B]">
							<svg aria-hidden="true" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21" />
							</svg>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Single Trust Line Under the Two Cards -->
	<p class="pt-1 text-center text-[14px] font-medium text-[#1A1A1A] leading-relaxed">
		🚚 توصيل 24-48 ساعة · 📦 الدفع بعد المعاينة
	</p>
</div>
