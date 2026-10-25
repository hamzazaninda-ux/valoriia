<script lang="ts">
	import type { ProductOffer } from '$lib/types/templates';

	let {
		offers = [],
		selectedId = $bindable(1),
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

	function offerPrefix(offer: ProductOffer): string {
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

<div class="space-y-2.5" dir="rtl" role="radiogroup" aria-label="أكمل طلبك الآن">
	<div class="flex flex-col gap-2 pt-2">
		{#each offers as offer (offer.id)}
			{@const isSelected = selectedId === offer.id}
			{@const savings = getSavings(offer)}
			<label
				for="offer-tier-{offer.id}"
				class="relative w-full py-[10px] px-[12px] rounded-[14px] border-[1.5px] cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 sm:gap-2.5 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1F5C4B] {offer.id === 2 || offer.isPopular
					? 'min-h-[104px]'
					: 'min-h-[88px]'} {isSelected
					? 'border-[#1F5C4B] bg-[#E3F0EA] shadow-[inset_0_0_0_0.5px_#1F5C4B,0_0_0_3px_rgba(31,92,75,0.15)]'
					: 'border-[#D9D4C7] bg-white opacity-100 hover:border-[#1F5C4B]/50'}"
			>
				<!-- Real Accessible Radio Input -->
				<input
					id="offer-tier-{offer.id}"
					type="radio"
					name="offer_selection"
					value={offer.id}
					checked={isSelected}
					onchange={() => chooseOffer(offer)}
					class="sr-only"
				/>

				<!-- Card 2 Best Value Badge: Top-Right (RTL start) so it never overlaps top-left selected badge -->
				{#if offer.id === 2 || offer.isPopular}
					<span class="absolute -top-2 start-3 bg-[#1F5C4B] text-white text-[12px] font-bold leading-none px-2.5 py-[3px] rounded-full z-10 whitespace-nowrap">
						الأوفر
					</span>
				{/if}

				<!-- Selected State Label: Top-Left (RTL end) -->
				{#if isSelected}
					<span class="absolute -top-2 end-3 bg-[#1F5C4B] text-white text-[12px] font-bold leading-none px-2 py-[3px] rounded-full z-10 whitespace-nowrap">
						✓ تم الاختيار
					</span>
				{/if}

				<!-- 1. [radio] (RTL far right) -->
				<span
					aria-hidden="true"
					class="w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-[background-color,border-color] duration-150 {isSelected
						? 'border-[#1F5C4B] bg-[#1F5C4B] text-white'
						: 'border-[#9CA3AF] bg-white'}"
				>
					{#if isSelected}
						<svg class="w-3 h-3 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{/if}
				</span>

				<!-- 2. [thumbnail 56px] -->
				<div class="w-[56px] h-[56px] rounded-[10px] overflow-hidden border border-[#D9D4C7] shrink-0 bg-white">
					{#if offer.image}
						<img
							src={offer.image}
							alt="{offerPrefix(offer)}{hasGiftSuffix(offer) ? ' هدية' : ''}"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-[#E3F0EA] text-[#1F5C4B]">
							<svg aria-hidden="true" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21" />
							</svg>
						</div>
					{/if}
				</div>

				<!-- 3. [text column] -->
				<div class="flex-1 min-w-0 text-start">
					<!-- Title: 15px bold with explicit spaces around "هدية" and gift icon -->
					<div class="text-[15px] font-bold text-[#1A1A1A] leading-[1.25]">
						{#if hasGiftSuffix(offer)}
							<span>{offerPrefix(offer)}{' '}</span><span class="whitespace-nowrap">هدية{' '}<svg
								aria-hidden="true"
								class="inline-block w-3.5 h-3.5 align-[-2px] text-[#1F5C4B]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
							</svg></span>
						{:else}
							<span>{offerPrefix(offer)}</span>
						{/if}
					</div>

					<!-- Savings chip (12px) + per-piece line (12px) on one line -->
					<div class="mt-1 flex flex-wrap items-center gap-1 leading-none">
						<span
							class="inline-flex items-center rounded-full px-1.5 py-[2px] text-[12px] font-bold text-[#1F5C4B] leading-[1.2] whitespace-nowrap transition-colors duration-150 {isSelected
								? 'bg-white border border-[#1F5C4B]/20'
								: 'bg-[#E3F0EA]'}"
						>
							وفّر {savings} درهم
						</span>
						{#if offer.id === 2 || offer.isPopular}
							<span class="text-[12px] font-bold text-[#1F5C4B] leading-[1.2] tracking-tight whitespace-nowrap">
								فقط 174 درهم للقطعة
							</span>
						{/if}
					</div>

					<!-- Card 2 micro-copy on a single 12px muted line -->
					{#if offer.id === 2 || offer.isPopular}
						<p class="mt-1 text-[12px] font-normal text-[#6B6B6B] leading-[1.25] tracking-tight">
							مناسب لحمامين أو هدية للوالدة
						</p>
					{/if}
				</div>

				<!-- 4. [price column on the far left] -->
				<div class="shrink-0 flex flex-col items-end justify-center text-end leading-none">
					<span class="text-[22px] font-bold text-[#1F5C4B] leading-[1.1] whitespace-nowrap">
						{offer.price}{' '}<span class="text-[15px] font-bold">درهم</span>
					</span>
					{#if offer.originalPrice}
						<span class="mt-1 text-[14px] font-normal text-[#6B6B6B] line-through leading-none whitespace-nowrap">
							{offer.originalPrice} درهم
						</span>
					{/if}
				</div>
			</label>
		{/each}
	</div>

	<!-- Single Trust Line Under the Two Cards -->
	<p class="pt-0.5 text-center text-[13px] font-medium text-[#1A1A1A] leading-relaxed whitespace-nowrap">
		🚚 توصيل 24-48 ساعة · 📦 الدفع بعد المعاينة
	</p>
</div>
