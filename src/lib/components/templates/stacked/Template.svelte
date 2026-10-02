<script lang="ts">
	import { onMount } from 'svelte';
	import { isValidMoroccanPhone } from '$lib/utils/phone';
	import { formatPrice } from '$lib/utils/format';
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

	// ── Stacked images ─────────────────────────────────────────────
	// First image fills a 9:16 frame (all phones identical), the rest keep
	// their natural ratio (1:1 stays 1:1). Upload slots = hero + gallery.
	// Accepts images from EVERY admin image list (gallery → carousel → hero)
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
	// ──────────────────────────────────────────────────────────────

	let fullName = $state('');
	let phoneNumber = $state('');
	let errors = $state({ fullName: '', city: '', phoneNumber: '' });
	let loading = $state(false);
	let submitError = $state('');
	let shouldShakePhone = $state(false);
	let showStickyBtn = $state(true);
	let hasSentLead = $state(false);
	let abandonmentTimeout: ReturnType<typeof setTimeout> | null = null;

	const waNumber = $derived(
		(order?.whatsappNumber || settings?.brand?.whatsappNumber || '').replace(/\D/g, '')
	);

	function scrollToForm() {
		document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
	}

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

	function waOrderLink() {
		const text = `السلام ${settings?.brand?.name || 'Valoriia'}، بغيت نطلب:\n• ${content.title} — ${activeOffer?.title || ''}\nالثمن: ${activeOffer?.price || 0} ${settings?.commerce?.currencySymbol || 'درهم'}\nالاسم الكامل: \nالمدينة: \nالهاتف: `;
		return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
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

	$effect(() => {
		const nameVal = fullName.trim();
		const phoneVal = phoneNumber.trim();

		if (abandonmentTimeout) {
			clearTimeout(abandonmentTimeout);
			abandonmentTimeout = null;
		}

		if (
			nameVal.length >= 2 &&
			phoneVal.length >= 8 &&
			isValidMoroccanPhone(phoneVal) &&
			!hasSentLead
		) {
			abandonmentTimeout = setTimeout(() => {
				if (hasSentLead) return;
				hasSentLead = true;
			}, 15000);
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		errors = { fullName: '', city: '', phoneNumber: '' };
		submitError = '';
		shouldShakePhone = false;

		// Stacked checkout asks for name + phone only (city is confirmed on the call)
		if (fullName.trim().length < 2) {
			errors.fullName = 'المرجو إدخال الاسم الكامل';
			return;
		}
		if (!isValidMoroccanPhone(phoneNumber.trim())) {
			errors.phoneNumber = 'المرجو إدخال رقم هاتف مغربي صحيح';
			shouldShakePhone = true;
			return;
		}

		loading = true;

		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		const productSku = (product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'SKU-GENERAL';
		const productTitle = content.title || 'منتج';

		const orderData = {
			orderId,
			fullName: fullName.trim(),
			phoneNumber: phoneNumber.trim(),
			address: '',
			city: '',
			offer: activeOffer?.title || '',
			price: activeOffer?.price || 0,
			quantity: activeOffer?.quantity || 1,
			qte: activeOffer?.quantity || 1,
			sku: productSku,
			productTitle,
			pageUrl: typeof window !== 'undefined' ? window.location.href : '',
			date: new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
			timestamp: new Date().toISOString()
		};

		if (typeof window !== 'undefined') {
			if ((window as any).fbq) {
				(window as any).fbq('track', 'Purchase', { value: orderData.price, currency: 'MAD', content_name: productTitle });
			}
			if ((window as any).ttq) {
				(window as any).ttq.track('CompletePayment', { value: orderData.price, currency: 'MAD', content_name: productTitle });
			}
		}

		const sheetsUrl = (order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim();

		const saveAndRedirect = () => {
			localStorage.setItem('latestOrder', JSON.stringify(orderData));
			window.location.href = '/thank-you';
		};

		if (sheetsUrl) {
			fetch(sheetsUrl, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'text/plain;charset=utf-8' },
				body: JSON.stringify(orderData)
			})
				.then(saveAndRedirect)
				.catch(saveAndRedirect);
		} else {
			saveAndRedirect();
		}
	}
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

	<!-- ── Stacked images: first fills 9:16, rest keep natural ratio ── -->
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
				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
						<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
							اختر العرض المناسب لك:
						</span>

						<div class="grid grid-cols-1 gap-3">
							{#each pricing.offers as offer}
								<label
									class="relative block cursor-pointer overflow-hidden rounded-3xl border-2 bg-white transition-all duration-300 select-none active:scale-[0.99] {currentPackId === offer.id ? 'border-emerald-600 shadow-lg shadow-emerald-600/10' : 'border-neutral-200'}"
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
										<span class="block h-48 w-full overflow-hidden bg-neutral-100">
											<img src={offer.image} alt={offer.title} class="h-full w-full object-cover" loading="lazy" />
										</span>
									{/if}
									<span class="block p-4">
										<span class="flex items-start justify-between gap-3">
											<span class="min-w-0 flex-1 text-right">
												<span class="block text-base font-extrabold leading-snug text-black">{offer.title}</span>
												{#if offer.subtitle}
													<span class="mt-1 block text-xs leading-relaxed text-neutral-500">{offer.subtitle}</span>
												{/if}
											</span>
											{#if offer.badge}
												<span class="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white {offer.isPopular ? 'animate-pulse' : ''}">{offer.badge}</span>
											{/if}
										</span>
										<span class="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-neutral-200 pt-3">
											<span class="text-right">
												<span class="block text-2xl font-black text-emerald-700">{formatPrice(offer.price, settings.commerce.currencySymbol)}</span>
												{#if offer.originalPrice > offer.price}
													<span class="mt-0.5 flex items-center gap-1.5">
														<span class="text-xs font-semibold text-neutral-400 line-through">{formatPrice(offer.originalPrice, settings.commerce.currencySymbol)}</span>
														<span class="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">-{Math.round((1 - offer.price / offer.originalPrice) * 100)}%</span>
													</span>
												{/if}
											</span>
											<span class={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${currentPackId === offer.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300 bg-white text-transparent'}`}>
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3.5" stroke="currentColor" class="h-4 w-4">
													<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
												</svg>
											</span>
										</span>
									</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="st-fullName" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							الاسم الكامل
						</label>
						<div class="w-full flex items-center border border-gray-300 rounded-2xl overflow-hidden h-14 bg-white focus-within:ring-1 focus-within:ring-emerald-600 focus-within:border-emerald-600 transition-all">
							<div class="w-12 h-full bg-neutral-100 flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
							</div>
							<div class="h-full w-[1px] bg-gray-300"></div>
							<input
								id="st-fullName"
								type="text"
								placeholder={t.sections.orderForm.namePlaceholder}
								bind:value={fullName}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-[15px] font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.fullName}
							<p class="text-[11px] text-red-600 font-semibold text-right animate-pulse">{errors.fullName}</p>
						{/if}
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="st-phone" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							<span class="text-red-500 font-bold">*</span>
							<span>رقم الهاتف</span>
						</label>
						<div class="w-full flex items-center border rounded-2xl overflow-hidden h-14 bg-white transition-all {errors.phoneNumber ? 'border-red-500' : 'border-gray-300 focus-within:ring-emerald-600 focus-within:border-emerald-600'} {shouldShakePhone ? 'animate-shake border-red-500 ring-2 ring-red-500/20' : ''}">
							<div class="w-12 h-full bg-neutral-100 flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
								</svg>
							</div>
							<div class="h-full w-[1px] bg-gray-300"></div>
							<input
								id="st-phone"
								type="tel"
								placeholder={t.sections.orderForm.phonePlaceholder}
								bind:value={phoneNumber}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-[15px] font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.phoneNumber}
							<p class="text-[11px] text-red-600 font-semibold text-right animate-pulse">{errors.phoneNumber}</p>
						{/if}
					</div>

					<div class="pt-2 space-y-2.5">
						<button
							type="submit"
							disabled={loading}
							style="background-color: var(--t-cta, #16a34a);"
							class="w-full py-4 text-base font-extrabold text-white rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
						>
							{#if loading}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								<span>{t.sections.orderForm.processingText}</span>
							{:else}
								<span>{t.sections.orderForm.submitText}</span>
							{/if}
						</button>
						<a
							href={waOrderLink()}
							target="_blank"
							rel="noopener"
							class="w-full py-3.5 text-sm font-extrabold text-white rounded-2xl shadow active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba56]"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							<span>اطلب عبر واتساب</span>
						</a>
					</div>

					{#if t.sections.pricing.showGuarantee}
						<p class="text-center text-xs font-bold text-emerald-800 mt-1">
							{t.sections.pricing.guaranteeText}
						</p>
					{/if}

					{#if submitError}
						<div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-right" dir="rtl">
							<span class="text-sm font-bold text-red-700">{submitError}</span>
						</div>
					{/if}
				</form>
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

	<CartDrawer others={others} currency={settings.commerce.currencySymbol || 'درهم'} salesText={t.sections.hero.salesCountText} />
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
		onFinish={() => { window.location.href = '/thank-you'; }}
	/>
</div>
