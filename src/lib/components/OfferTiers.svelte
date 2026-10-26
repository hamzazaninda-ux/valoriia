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
				class="offer-card {isSelected ? 'is-selected' : ''}"
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

				<!-- Card 2 Best Value Badge: small, absolute, adds zero height, never overlaps heading -->
				{#if offer.id === 2 || offer.isPopular}
					<span class="offer-badge">
						الأوفر
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

				<!-- 2. Clean Product Thumbnail -->
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

				<!-- 3. Text Column (1-line target title with text-wrap: balance fallback) -->
				<div class="offer-content">
					<div class="offer-title">
						{#if hasGiftSuffix(offer)}
							<span>{offerPrefix(offer)}{' '}</span><span class="offer-gift-tail">هدية{' '}<svg
								aria-hidden="true"
								class="offer-gift-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
							</svg></span>
						{:else}
							<span>{offerPrefix(offer)}</span>
						{/if}
					</div>

					<!-- Savings chip + per-piece line -->
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

				<!-- 4. Price Column (RTL far left) -->
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
		letter-spacing: 0;
	}

	.offer-cards-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-row-gap: 10px;
		row-gap: 10px;
	}

	.offer-card {
		position: relative;
		width: 100%;
		min-width: 0;
		min-height: 62px;
		box-sizing: border-box;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid #D9D4C7;
		background-color: #FFFFFF;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		display: grid;
		grid-template-columns: 16px 38px minmax(0, 1fr) auto;
		grid-column-gap: 6px;
		column-gap: 6px;
		align-items: center;
		letter-spacing: 0;
		transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.offer-card:hover {
		border-color: rgba(31, 92, 75, 0.45);
	}

	/* 1.5px visual border via 1px border + 0.5px inset stroke -> 0.0px layout shift, no heavy shadow */
	.offer-card.is-selected {
		border-color: #1F5C4B;
		background-color: #E3F0EA;
		box-shadow: inset 0 0 0 0.5px #1F5C4B;
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
		right: 12px;
		inset-inline-start: 12px;
		background-color: #1F5C4B;
		color: #FFFFFF;
		font-size: 11.5px;
		font-weight: 600;
		line-height: 1;
		letter-spacing: 0;
		padding: 2.5px 8px;
		border-radius: 9999px;
		z-index: 10;
		white-space: nowrap;
		pointer-events: none;
	}

	.offer-radio-dot {
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		border: 1.5px solid #B8B2A6;
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
		width: 10px;
		height: 10px;
		color: #FFFFFF;
		stroke-width: 2.6;
	}

	.offer-thumb {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #EAE6DC;
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
		font-size: 13.5px;
		font-size: clamp(0.8125rem, 3.7vw, 0.875rem);
		font-weight: 600;
		color: #1A1A1A;
		line-height: 1.32;
		letter-spacing: 0;
		overflow-wrap: break-word;
	}

	@media (max-width: 350px) {
		.offer-title {
			text-wrap: balance;
		}
	}

	.offer-gift-tail {
		white-space: nowrap;
	}

	.offer-gift-icon {
		display: inline-block;
		width: 12px;
		height: 12px;
		vertical-align: -2px;
		color: #1F5C4B;
	}

	.offer-meta-row {
		margin-top: 2px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin-left: -2px;
		margin-right: -2px;
	}

	.offer-meta-row > * {
		margin: 1px 2px;
	}

	@supports (gap: 4px) {
		.offer-meta-row {
			margin-left: 0;
			margin-right: 0;
			gap: 2px 4px;
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
		font-weight: 600;
		color: #1F5C4B;
		line-height: 1.3;
		letter-spacing: 0;
		white-space: nowrap;
		max-width: 100%;
		background-color: #E3F0EA;
		border: 1px solid transparent;
	}

	.offer-savings-chip.is-selected {
		background-color: #FFFFFF;
		border-color: rgba(31, 92, 75, 0.18);
	}

	.offer-per-unit {
		font-size: 12px;
		font-weight: 500;
		color: #1F5C4B;
		line-height: 1.3;
		letter-spacing: 0;
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
		line-height: 1.2;
	}

	.offer-price-current {
		font-size: 20px;
		font-size: clamp(1.15625rem, 5.5vw, 1.28125rem);
		font-weight: 700;
		color: #1F5C4B;
		line-height: 1.15;
		letter-spacing: 0;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.offer-price-currency {
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0;
	}

	.offer-price-old {
		margin-top: 2px;
		font-size: 12.5px;
		font-size: clamp(0.75rem, 3.45vw, 0.8125rem);
		font-weight: 400;
		color: #666666;
		text-decoration: line-through;
		line-height: 1.2;
		letter-spacing: 0;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* Ultra-small phones (320px - 345px): graceful fit with zero horizontal overflow */
	@media (max-width: 345px) {
		.offer-card {
			padding: 8px 9px;
			grid-template-columns: 16px 36px minmax(0, 1fr) auto;
			grid-column-gap: 5px;
			column-gap: 5px;
		}
		.offer-thumb {
			width: 36px;
			height: 36px;
		}
	}

	/* Larger screens: 18px radio + 44px thumbnail while keeping single-line balance */
	@media (min-width: 400px) {
		.offer-card {
			grid-template-columns: 18px 44px minmax(0, 1fr) auto;
			grid-column-gap: 9px;
			column-gap: 9px;
		}
		.offer-radio-dot {
			width: 18px;
			height: 18px;
		}
		.offer-thumb {
			width: 44px;
			height: 44px;
		}
	}
</style>
