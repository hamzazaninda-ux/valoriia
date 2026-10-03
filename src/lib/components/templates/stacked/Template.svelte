<script lang="ts">
	import { onMount } from 'svelte';
	import { formatPrice } from '$lib/utils/format';
	import { ShoppingCart } from '@lucide/svelte';
	import StarRating from '$lib/components/shared/StarRating.svelte';
	import CartDrawer from '$lib/components/shared/CartDrawer.svelte';
	import CheckoutModal from '$lib/components/shared/CheckoutModal.svelte';
	import UpsellModal from '$lib/components/shared/UpsellModal.svelte';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';

	let { product, settings, theme, others = [] }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('stacked'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	let selectedPack = $state<number | null>(null);

	const currentPackId = $derived(
		selectedPack ?? pricing.offers.find((o: ProductOffer) => o.isPopular)?.id ?? pricing.offers[0]?.id ?? 1
	);

	const activeOffer = $derived(
		pricing.offers.find((o: ProductOffer) => o.id === currentPackId) || pricing.offers[0] || { title: '', price: 0, quantity: 1 }
	);

	// â”€â”€ Stacked images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	// First image fills a 9:16 frame (all phones identical), the rest keep
	// their natural ratio (1:1 stays 1:1). Upload slots = hero + gallery.
	// Accepts images from EVERY admin image list (gallery â†’ carousel â†’ hero)
	// so a product can never render imageless no matter which tab was used.
	// Empty URLs are filtered out (never render a broken <img>).
	let slides = $derived.by(() => {
		const fromGallery = (content.gallery || [])
			.filter((g) => g.src && g.src.trim())
			.map((g) => ({ src: g.src.trim(), alt: g.alt || content.title }));
		if (fromGallery.length > 0) return fromGallery;
		const fromCarousel = (content.carousel || [])
			.filter((c) => c.image && c.image.trim())
			.map((c) => ({ src: c.image.trim(), alt: c.title || c.alt || content.title }));
		if (fromCarousel.length > 0) return fromCarousel;
		if (content.heroImage && content.heroImage.trim()) {
			return [{ src: content.heroImage.trim(), alt: content.title }];
		}
		return [];
	});
	// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

	let showStickyBtn = $state(true);


	const sheetsUrl = $derived(
		(order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim()
	);

	function addSelectedToCart() {
		cart.add({
			slug: (product as any).slug || '',
			title: content.title || 'منتج',
			image: slides[0]?.src || '',
			price: activeOffer.price || 0,
			offerId: (activeOffer as ProductOffer).id ?? 0,
			offerTitle: activeOffer.title || ''
		});
		cartUi.openDrawer();
	}


	onMount(() => {
		const formTop = document.getElementById('checkout-form');
		const formBottom = document.getElementById('checkout-form-bottom');

		let topVisible = false;
		let bottomVisible = false;

		function updateVisibility() {
			showStickyBtn = !topVisible && !bottomVisible;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target.id === 'checkout-form') {
						topVisible = entry.isIntersecting;
					} else if (entry.target.id === 'checkout-form-bottom') {
						bottomVisible = entry.isIntersecting;
					}
				}
				updateVisibility();
			},
			{ threshold: 0.05 }
		);

		if (formTop) observer.observe(formTop);
		if (formBottom) observer.observe(formBottom);

		return () => {
			observer.disconnect();
		};
	});

</script>

<div
	class="max-w-xl mx-auto shadow-2xl min-h-screen flex flex-col relative border-x border-border/30 pb-20"
	style="{buildThemeCssVars(t)}; background-color: var(--t-bg, #faf9f6); color: var(--t-text, #1c1917);"
>
	<!-- Trust bar -->
	<div class="text-white text-center py-2.5 px-4 text-xs font-bold shadow-sm z-10 flex items-center justify-center gap-2" dir="rtl" style="background: linear-gradient(135deg, var(--t-primary, #047857), #065f46);">
		<span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
		<span>{settings.commerce.freeShippingText} • {settings.commerce.paymentMethod}</span>
	</div>

	<!-- â”€â”€ Stacked images: first fills 9:16, rest keep natural ratio â”€â”€ -->
	{#if slides.length > 0}
		<div class="w-full bg-black/5">
			<img
				src={slides[0].src}
				alt={slides[0].alt}
				class="block w-full aspect-[9/16] object-cover"
				loading="eager"
			/>
			{#each slides.slice(1) as s, i}
				<img
					src={s.src}
					alt={s.alt}
					class="block w-full h-auto"
					loading={i < 2 ? 'eager' : 'lazy'}
				/>
			{/each}
		</div>
	{:else}
		<div class="w-full aspect-[9/16] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-emerald-50 to-[#faf9f6] p-8 text-center" dir="rtl">
			<svg viewBox="0 0 120 100" class="h-24 w-auto text-emerald-800/40" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
				<rect x="25" y="12" width="70" height="76" rx="8" />
				<circle cx="42" cy="32" r="6" />
				<path d="M25 72l18-18 12 12 10-10 30 30" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<p class="font-bold text-emerald-950">بلاصة تصاور المنتج</p>
			<p class="text-xs text-neutral-500 leading-relaxed">زيد الصورة اللولة (9:16) وباقي التصاور من معرض الصور في لوحة التحكم</p>
		</div>
	{/if}

	<!-- Checkout form -->
	<div id="checkout-form" class="px-4 py-6">
		<div class="border border-border/60 shadow-lg overflow-hidden rounded-3xl bg-white" dir="rtl">
			<div class="h-1" style="background-color: var(--t-primary, #047857);"></div>
			<div class="text-center pb-4 pt-6 select-none px-6">
				<h2 class="text-2xl font-extrabold tracking-tight font-display">
					{t.sections.orderForm.title}
				</h2>
				<p class="text-sm font-bold mt-2 px-2 leading-relaxed text-neutral-500">
					عمّر الاستمارة وخلص ملي توصلك السلعة
				</p>
			</div>

			<div class="px-4 pb-6">
				<div class="space-y-4">
					<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
						<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
							اختر العرض المناسب لك:
						</span>

						<div class="grid grid-cols-1 gap-2.5">
							{#each pricing.offers as offer}
								<label
									class="relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 bg-white p-2.5 transition-all duration-200 select-none active:scale-[0.99] {currentPackId === offer.id ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-neutral-200'}"
								>
									<input
										type="radio"
										name="selectedPack-stacked"
										value={offer.id}
										checked={currentPackId === offer.id}
										onchange={() => (selectedPack = offer.id)}
										class="sr-only"
									/>
									{#if offer.image}
										<span class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
											<img src={offer.image} alt={offer.title} class="h-full w-full object-cover" loading="lazy" />
										</span>
									{:else}
										<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
											<svg class="h-5 w-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
												<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
											</svg>
										</span>
									{/if}
									<span class="min-w-0 flex-1 text-right">
										<span class="block text-[13px] font-extrabold text-black">{offer.title}</span>
										{#if offer.subtitle}
											<span class="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-neutral-500">
												<svg class="h-3.5 w-3.5 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
												</svg>
												<span class="truncate">{offer.subtitle}</span>
											</span>
										{/if}
										
										</span>
									<span class="shrink-0 text-left">
										<span class="block whitespace-nowrap text-[15px] font-black text-neutral-900">dh {offer.price.toFixed(2)}</span>
										{#if offer.originalPrice > offer.price}
											<span class="mt-0.5 block whitespace-nowrap text-[11px] text-neutral-400 line-through">dh {offer.originalPrice.toFixed(2)}</span>
										{/if}
									</span>
								</label>
							{/each}
						</div>
					</div>

					<button
						type="button"
						onclick={addSelectedToCart}
						class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FACC15] py-3.5 text-base font-black text-neutral-900 shadow-lg transition-all hover:bg-[#eab308] active:scale-[0.98]"
					>
						<ShoppingCart class="h-5 w-5 shrink-0" />
						<span>أضف إلى السلة · {formatPrice(activeOffer.price, settings.commerce.currencySymbol)}</span>
					</button>


					{#if t.sections.pricing.showGuarantee}
						<p class="text-center text-xs font-bold text-emerald-800 mt-1">
							{t.sections.pricing.guaranteeText}
						</p>
					{/if}

				</div>
			</div>
		</div>
	</div>

	<!-- Rating summary -->
	{#if t.sections.hero.showRating}
		<div class="px-4 pb-2" dir="rtl">
			<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 text-center shadow-sm">
				<div class="flex items-center justify-center">
					<StarRating rating={content.rating} reviewCount={content.reviewCount} />
				</div>
				{#if t.sections.hero.showSalesCount && t.sections.hero.salesCountText}
					<p class="text-xs text-neutral-500 font-semibold mt-1.5">{t.sections.hero.salesCountText}</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- FAQ -->
	{#if t.sections.trustBadges.showFAQ && content.faq && content.faq.length > 0}
		<div class="px-4 py-4" dir="rtl">
			<h2 class="text-center font-display text-xl font-bold mb-3">{t.sections.trustBadges.faqTitle}</h2>
			<div class="space-y-2.5">
				{#each content.faq as item}
					<details class="group rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
						<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-extrabold text-neutral-900 [&::-webkit-details-marker]:hidden">
							{item.question}
							<svg class="h-4 w-4 shrink-0 text-emerald-700 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
							</svg>
						</summary>
						<p class="px-4 pb-4 text-sm leading-relaxed text-neutral-500">{item.answer}</p>
					</details>
				{/each}
			</div>
		</div>
	{/if}

	<div id="checkout-form-bottom"></div>

	<footer class="bg-neutral-950 py-6 text-center text-xs text-neutral-400 px-4" dir="rtl">
		<p>{content.footerText || `© ${new Date().getFullYear()} ${settings.brand.name}. جميع الحقوق محفوظة.`}</p>
	</footer>

	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" dir="rtl">
			<button
				onclick={addSelectedToCart}
				style="background-color: var(--t-cta, #16a34a);"
				class="w-full max-w-xl mx-auto block py-4 px-6 text-lg font-extrabold text-white rounded-2xl shadow-xl active:scale-[0.98] transition-all duration-300 pointer-events-auto cursor-pointer text-center"
			>
				{t.sections.pricing.stickyCtaText || t.sections.pricing.ctaText}
			</button>
		</div>
	{/if}

	<CartDrawer others={others} currency={settings.commerce.currencySymbol || 'درهم'} salesText={t.sections.hero.salesCountText} offers={pricing.offers} currentSlug={(product as any).slug || ''} currentTitle={content.title} currentImage={slides[0]?.src || ''} />
	<CheckoutModal
		currency={settings.commerce.currencySymbol || 'درهم'}
		sheetsUrl={sheetsUrl}
		productTitle={content.title}
		sku={(product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'SKU-GENERAL'}
		onDone={(order) => cartUi.beginUpsell(order)}
	/>
	<UpsellModal
		order={cartUi.upsell!}
		products={others}
		currency={settings.commerce.currencySymbol || 'درهم'}
		sheetsUrl={sheetsUrl}
		sku={(product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'SKU-GENERAL'}
		onFinish={() => { cartUi.resetAll(); window.location.href = '/thank-you'; }}
	/>
</div>
