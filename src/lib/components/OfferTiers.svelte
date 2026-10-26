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

<div class="offer-tiers-root" dir="rtl" role="radiogroup" aria-label="أكمل طلبك الآن">
	<div class="offer-cards-grid">
		{#each offers as offer (offer.id)}
			{@const isSelected = selectedId === offer.id}
			{@const savings = getSavings(offer)}
			<label
				for="offer-tier-{offer.id}"
				class="offer-card {offer.id === 2 || offer.isPopular
					? 'offer-card--tier2'
					: 'offer-card--tier1'} {isSelected ? 'is-selected' : ''}"
			>
				<!-- Real Accessible Radio Input -->
				<input
					id="offer-tier-{offer.id}"
					type="radio"
					name="offer_selection"
					value={offer.id}
					checked={isSelected}
					onchange={() => chooseOffer(offer)}
					class="offer-radio-native sr-only"
				/>

				<!-- Card 2 Best Value Badge: Top-Right (RTL start), absolute so zero added height -->
				{#if offer.id === 2 || offer.isPopular}
					<span class="offer-badge offer-badge--start">
						الأوفر
					</span>
				{/if}

				<!-- Selected State Label: Top-Left (RTL end), absolute so zero added height / zero layout shift -->
				{#if isSelected}
					<span class="offer-badge offer-badge--end">
						✓ تم الاختيار
					</span>
				{/if}

				<!-- 1. Custom Accessible Radio Visual (RTL far right) -->
				<span
					aria-hidden="true"
					class="offer-radio-dot {isSelected ? 'is-checked' : ''}"
				>
					{#if isSelected}
						<svg class="offer-radio-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{/if}
				</span>

				<!-- 2. Compact Thumbnail (44px, shrinks to 40px at <=345px) -->
				<div class="offer-thumb">
					{#if offer.image}
						<img
							src={offer.image}
							alt="{offerPrefix(offer)}{hasGiftSuffix(offer) ? ' هدية' : ''}"
							class="offer-thumb-img"
							loading="lazy"
						/>
					{:else}
						<div class="offer-thumb-fallback">
							<svg aria-hidden="true" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21" />
							</svg>
						</div>
					{/if}
				</div>

				<!-- 3. Text Column (min-width: 0 so it wraps cleanly at 320px and 130% font scale) -->
				<div class="offer-content">
					<div class="offer-title">
						{#if hasGiftSuffix(offer)}
							<span>{offerPrefix(offer)}{' '}</span><span class="offer-gift-tail">هدية{' '}<svg
								aria-hidden="true"
								class="offer-gift-icon"
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

					<!-- Savings chip + per-piece line on the same row whenever width fits -->
					<div class="offer-meta-row">
						<span class="offer-savings-chip {isSelected ? 'is-selected' : ''}">
							وفّر {savings} درهم
						</span>
						{#if offer.id === 2 || offer.isPopular}
							<span class="offer-per-unit">
								فقط 174 درهم للقطعة
							</span>
						{/if}
					</div>
				</div>

				<!-- 4. Price Column (RTL far left, strictly single-line prices) -->
				<div class="offer-price-col">
					<span class="offer-price-current">
						{offer.price}{' '}<span class="offer-price-currency">درهم</span>
					</span>
					{#if offer.originalPrice}
						<span class="offer-price-old">
							{offer.originalPrice} درهم
						</span>
					{/if}
				</div>
			</label>
		{/each}
	</div>
</div>

<style>
	.offer-tiers-root {
		width: 100%;
		min-width: 0;
	}

	.offer-cards-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-row-gap: 8px;
		row-gap: 8px;
		padding-top: 2px;
	}

	.offer-card {
		position: relative;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: 7px 9px;
		border-radius: 12px;
		border: 1.5px solid #D9D4C7;
		background-color: #FFFFFF;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		display: grid;
		grid-template-columns: 18px 44px minmax(0, 1fr) auto;
		grid-column-gap: 6px;
		column-gap: 6px;
		align-items: center;
		transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.offer-card--tier1 {
		min-height: 68px;
	}

	.offer-card--tier2 {
		min-height: 78px;
	}

	.offer-card:hover {
		border-color: rgba(31, 92, 75, 0.55);
	}

	.offer-card.is-selected {
		border-color: #1F5C4B;
		background-color: #E3F0EA;
		box-shadow: inset 0 0 0 0.5px #1F5C4B, 0 0 0 2.5px rgba(31, 92, 75, 0.14);
	}

	/* Keyboard focus fallback for older Safari (<15.4) + modern :has(:focus-visible) */
	.offer-card:focus-within {
		outline: 2px solid #1F5C4B;
		outline-offset: 2px;
	}

	@supports selector(:has(*)) {
		.offer-card:focus-within {
			outline: none;
		}
		.offer-card:has(.offer-radio-native:focus-visible) {
			outline: 2px solid #1F5C4B;
			outline-offset: 2px;
		}
	}

	.offer-radio-native {
		accent-color: #1F5C4B;
	}

	.offer-badge {
		position: absolute;
		top: -8px;
		background-color: #1F5C4B;
		color: #FFFFFF;
		font-size: 11.5px;
		font-size: clamp(0.71875rem, 3.1vw, 0.75rem);
		font-weight: 700;
		line-height: 1;
		padding: 2px 7px;
		border-radius: 9999px;
		z-index: 10;
		white-space: nowrap;
		pointer-events: none;
	}

	.offer-badge--start {
		right: 10px;
		inset-inline-start: 10px;
	}

	.offer-badge--end {
		left: 10px;
		inset-inline-end: 10px;
	}

	.offer-radio-dot {
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		border: 1.5px solid #8C8C8C;
		background-color: #FFFFFF;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.offer-radio-dot.is-checked {
		border-color: #1F5C4B;
		background-color: #1F5C4B;
		color: #FFFFFF;
	}

	.offer-radio-check {
		width: 11px;
		height: 11px;
		color: #FFFFFF;
		stroke-width: 3;
	}

	.offer-thumb {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #D9D4C7;
		background-color: #FFFFFF;
		flex-shrink: 0;
	}

	.offer-thumb-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.offer-thumb-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #E3F0EA;
		color: #1F5C4B;
	}

	.offer-content {
		min-width: 0;
		text-align: right;
		text-align: start;
	}

	.offer-title {
		font-size: 14px;
		font-size: clamp(0.8125rem, 3.8vw, 0.9375rem);
		font-weight: 700;
		color: #1A1A1A;
		line-height: 1.2;
		overflow-wrap: break-word;
	}

	.offer-gift-tail {
		white-space: nowrap;
	}

	.offer-gift-icon {
		display: inline-block;
		width: 13px;
		height: 13px;
		vertical-align: -2px;
		color: #1F5C4B;
	}

	.offer-meta-row {
		margin-top: 3px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin-left: -3px;
		margin-right: -3px;
	}

	.offer-meta-row > * {
		margin: 1px 3px;
	}

	@supports (gap: 4px) {
		.offer-meta-row {
			margin-left: 0;
			margin-right: 0;
			gap: 2px 5px;
		}
		.offer-meta-row > * {
			margin: 0;
		}
	}

	.offer-savings-chip {
		display: inline-flex;
		align-items: center;
		border-radius: 9999px;
		padding: 1px 5px;
		font-size: 11.5px;
		font-size: clamp(0.71875rem, 3.1vw, 0.75rem);
		font-weight: 700;
		color: #1F5C4B;
		line-height: 1.15;
		white-space: nowrap;
		max-width: 100%;
		background-color: #E3F0EA;
		border: 1px solid transparent;
	}

	.offer-savings-chip.is-selected {
		background-color: #FFFFFF;
		border-color: rgba(31, 92, 75, 0.22);
	}

	.offer-per-unit {
		font-size: 11.5px;
		font-size: clamp(0.71875rem, 3.1vw, 0.75rem);
		font-weight: 700;
		color: #1F5C4B;
		line-height: 1.15;
		white-space: nowrap;
		max-width: 100%;
	}

	.offer-price-col {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		text-align: left;
		text-align: end;
		line-height: 1;
	}

	.offer-price-current {
		font-size: 20px;
		font-size: clamp(1.125rem, 5.5vw, 1.3125rem);
		font-weight: 700;
		color: #1F5C4B;
		line-height: 1.05;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.offer-price-currency {
		font-size: 13px;
		font-size: clamp(0.75rem, 3.4vw, 0.875rem);
		font-weight: 700;
	}

	.offer-price-old {
		margin-top: 2px;
		font-size: 13px;
		font-size: clamp(0.75rem, 3.5vw, 0.8125rem);
		font-weight: 400;
		color: #595959;
		text-decoration: line-through;
		line-height: 1.1;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* Ultra-small phones (320px - 345px): shrink thumbnail to 40px & tighten horizontal padding */
	@media (max-width: 345px) {
		.offer-card {
			padding: 6px 7px;
			grid-template-columns: 17px 40px minmax(0, 1fr) auto;
			grid-column-gap: 5px;
			column-gap: 5px;
		}
		.offer-thumb {
			width: 40px;
			height: 40px;
		}
		.offer-radio-dot {
			width: 17px;
			height: 17px;
		}
	}

	/* Tall viewports (>800px height): add +8px card breathing room without breaking one-screen fit */
	@media (min-height: 801px) {
		.offer-cards-grid {
			grid-row-gap: 10px;
			row-gap: 10px;
		}
		.offer-card {
			padding: 10px 12px;
			grid-column-gap: 8px;
			column-gap: 8px;
		}
		.offer-card--tier1 {
			min-height: 76px;
		}
		.offer-card--tier2 {
			min-height: 86px;
		}
	}
</style>
