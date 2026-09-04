<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isValidMoroccanPhone } from '$lib/utils/phone';
	import { validateOrderForm } from '$lib/utils/validation';
	import { formatPrice } from '$lib/utils/format';
	import StarRating from '$lib/components/shared/StarRating.svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';
	import Carousel from './Carousel.svelte';

	let { product, settings, theme }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('classic'));

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

	let fullName = $state('');
	let city = $state('');
	let phoneNumber = $state('');
	let errors = $state({ fullName: '', city: '', phoneNumber: '' });
	let loading = $state(false);
	let submitError = $state('');
	let shouldShakePhone = $state(false);
	let showStickyBtn = $state(true);
	let hasSentLead = $state(false);
	let abandonmentTimeout: ReturnType<typeof setTimeout> | null = null;

	// ── Hero Carousel ──────────────────────────────────────────────
	// Build slides: use content.carousel if available, fallback to heroImage
	let slides = $derived(
		(content.carousel && content.carousel.length > 0) 
			? content.carousel 
			: (content.heroImage ? [{ image: content.heroImage, title: content.title }] : [])
	);
	// ──────────────────────────────────────────────────────────────

	function scrollToForm() {
		document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		// Sticky button visibility observer
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
		const cityVal = city.trim();
		const phoneVal = phoneNumber.trim();

		if (abandonmentTimeout) {
			clearTimeout(abandonmentTimeout);
			abandonmentTimeout = null;
		}

		if (
			nameVal.length >= 2 &&
			cityVal.length >= 3 &&
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

		const validation = validateOrderForm(fullName, city, phoneNumber);
		if (validation.errors.fullName || validation.errors.city || validation.errors.phoneNumber) {
			errors = validation.errors;
			shouldShakePhone = validation.shouldShake;
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
			address: city.trim(),
			city: city.trim(),
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

		// Track Pixel Purchase event if present
		if (typeof window !== 'undefined') {
			if ((window as any).fbq) {
				(window as any).fbq('track', 'Purchase', { value: orderData.price, currency: 'MAD', content_name: productTitle });
			}
			if ((window as any).ttq) {
				(window as any).ttq.track('CompletePayment', { value: orderData.price, currency: 'MAD', content_name: productTitle });
			}
		}

		// Product-specific URL takes priority over the global default
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
	style="{buildThemeCssVars(t)}; background-color: var(--t-bg, #f9fafb); color: var(--t-text, #111827);"
>
	<div class="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center py-2.5 px-4 text-xs font-bold shadow-sm z-10 flex items-center justify-center gap-2" dir="rtl" style="background: linear-gradient(135deg, var(--t-primary, #10b981), #059669);">
		<span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
		<span>{t.sections.trustBadges.freeShippingText || settings.commerce.freeShippingText} • {t.sections.trustBadges.codText || settings.commerce.paymentMethod}</span>
	</div>

	<!-- ── Hero Carousel ─────────────────────────────────────────── -->
	<div class="hero-carousel-wrapper w-full">
		<Carousel {slides} />
	</div>
	<!-- ─────────────────────────────────────────────────────────── -->

	<div class="px-5 pt-8 pb-4 text-center" dir="rtl">
		{#if t.sections.hero.showBadge && t.sections.hero.badgeText}
			<div class="mb-2">
				<span class="inline-block px-3 py-1 text-xs font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
					{t.sections.hero.badgeText}
				</span>
			</div>
		{/if}

		<h1 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight" style="font-family: 'El Messiri', sans-serif;">
			{content.title}
		</h1>

		{#if t.sections.hero.showRating}
			<div class="mt-3">
				<StarRating rating={content.rating} reviewCount={content.reviewCount} />
			</div>
		{/if}

		{#if t.sections.hero.showSalesCount && t.sections.hero.salesCountText}
			<p class="text-xs text-muted-foreground font-semibold mt-1.5">
				{t.sections.hero.salesCountText}
			</p>
		{/if}

		<div class="mt-3 flex items-baseline justify-center gap-2">
			<span class="text-3xl font-black" style="color: var(--t-primary, #10b981);">{formatPrice(activeOffer.price, settings.commerce.currencySymbol)}</span>
			{#if t.sections.pricing.showOriginalPrice}
				<span class="text-base text-muted-foreground line-through font-semibold">{formatPrice(activeOffer.originalPrice, settings.commerce.currencySymbol)}</span>
			{/if}
		</div>
		<p class="text-[11px] font-bold mt-1" style="color: var(--t-primary, #10b981);">{t.sections.pricing.freeShippingBadgeText}</p>
	</div>

	<div id="checkout-form" class="px-4 py-8 bg-gradient-to-b from-muted/5 to-muted/15 flex-1">
		<div class="border border-border/60 shadow-lg overflow-hidden rounded-2xl bg-card" dir="rtl">
			<div class="h-1 bg-emerald-500"></div>
			<div class="text-center pb-4 pt-6 select-none px-6">
				<h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 tracking-wide pb-1.5" style="font-family: 'El Messiri', sans-serif;">
					إستمارة تأكيد الطلب
				</h2>
				<p class="text-emerald-800/90 text-sm font-bold mt-2 px-2 leading-relaxed" style="font-family: 'El Messiri', sans-serif;">
					المرجو إدخال معلوماتكم بدقة لتأكيد الطلب والتوصيل مجاني
				</p>
			</div>

			<div class="px-4 pb-6">
				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
						<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
							اختر العرض المناسب لك:
						</span>

						<div class="grid grid-cols-1 gap-2.5">
							{#each pricing.offers as offer}
								<label
									class="relative flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-300 transform select-none active:scale-[0.98] {currentPackId === offer.id ? 'scale-[1.02] border-emerald-500 bg-emerald-50/15 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/5 z-10' : 'scale-100 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30'}"
								>
									<input
										type="radio"
										name="selectedPack-hero"
										value={offer.id}
										checked={currentPackId === offer.id}
										onchange={() => (selectedPack = offer.id)}
										class="sr-only"
									/>
									<div class="flex items-center gap-3">
										<div class="w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 {currentPackId === offer.id ? 'border-emerald-500 bg-emerald-500 text-white scale-110' : 'border-gray-300 bg-white'}">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="4" stroke="currentColor" class="w-3 h-3 transition-transform duration-300 {currentPackId === offer.id ? 'scale-100' : 'scale-0'}">
												<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
											</svg>
										</div>

										<div class="text-right">
											<span class="block text-sm font-extrabold text-black">{offer.title}</span>
											<span class="block text-[11px] text-muted-foreground font-semibold mt-0.5">{offer.subtitle}</span>
										</div>
									</div>

									<div class="text-left flex flex-col items-end shrink-0">
										{#if offer.badge}
											<span class="text-[9px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 {offer.isPopular ? 'animate-pulse' : ''}">
												{offer.badge}
											</span>
										{/if}
										<div class="flex items-center gap-1.5 justify-end">
											<span class="text-xs text-muted-foreground line-through font-semibold">{formatPrice(offer.originalPrice, settings.commerce.currencySymbol)}</span>
											<span class="font-black transition-all duration-300 {offer.isPopular ? 'text-orange-500 text-[18px] scale-105' : 'text-emerald-600 text-base'}">{formatPrice(offer.price, settings.commerce.currencySymbol)}</span>
										</div>
										<span class="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5 border border-emerald-100">
											+ توصيل مجاني سريع
										</span>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="fullName" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							الاسم الكامل
						</label>

						<div class="w-full flex items-center border border-gray-300 rounded-lg overflow-hidden h-12 bg-white focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="fullName"
								type="text"
								placeholder={t.sections.orderForm.namePlaceholder}
								bind:value={fullName}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.fullName}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.fullName}</p>
						{/if}
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="city" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							<span class="text-red-500 font-bold">*</span>
							<span>المدينة / Ville</span>
						</label>

						<div class="w-full flex items-center border border-gray-300 rounded-lg overflow-hidden h-12 bg-white focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="city"
								type="text"
								placeholder={t.sections.orderForm.cityPlaceholder}
								bind:value={city}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.city}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.city}</p>
						{/if}
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="phoneNumber" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							<span class="text-red-500 font-bold">*</span>
							<span>رقم الهاتف</span>
						</label>

						<div class="w-full flex items-center border rounded-lg overflow-hidden h-12 bg-white transition-all {errors.phoneNumber ? 'border-red-500 focus-within:ring-red-500 focus-within:border-red-500' : 'border-gray-300 focus-within:ring-emerald-500 focus-within:border-emerald-500'} {shouldShakePhone ? 'animate-shake border-red-500 ring-2 ring-red-500/20' : ''}">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.582c0-.71.474-1.356 1.185-1.444L7.5 4.772c.596-.073 1.186.235 1.41.779l1.64 4.002a1.502 1.502 0 0 1-.32 1.586l-1.897 1.897m0 0a15.023 15.023 0 0 0 4.757 4.757l1.897-1.897a1.502 1.502 0 0 1 1.586-.32l4.002 1.64c.544.224.852.814.779 1.41l-.366 2.985c-.088.711-.734 1.185-1.444 1.185C11.127 21 2.25 12.127 2.25 1.75c0-.71.474-1.356 1.185-1.444L6.582 2.25" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="phoneNumber"
								type="tel"
								placeholder={t.sections.orderForm.phonePlaceholder}
								bind:value={phoneNumber}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.phoneNumber}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.phoneNumber}</p>
						{/if}
					</div>

					<div class="pt-3">
						<button
							type="submit"
							disabled={loading}
							style="background-color: var(--t-cta, #f97316);"
							class="w-full py-5 text-base font-extrabold text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 group cursor-pointer {!loading ? 'animate-pulse' : ''}"
						>
							{#if loading}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								<span>{t.sections.orderForm.processingText}</span>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 animate-bounce">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
								</svg>
								<span>{t.sections.orderForm.submitText}</span>
							{/if}
						</button>
					</div>

					{#if t.sections.pricing.showGuarantee}
						<p class="text-center text-xs font-bold text-emerald-800 mt-2">
							{t.sections.pricing.guaranteeText}
						</p>
					{/if}

					{#if submitError}
						<div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-right" dir="rtl">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-red-500 shrink-0">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
							</svg>
							<span class="text-sm font-bold text-red-700">{submitError}</span>
						</div>
					{/if}

					<p class="text-center text-[10px] text-muted-foreground/80 font-medium">
						🔒 معلوماتكم الشخصية آمنة ومحمية بالكامل
					</p>
				</form>
			</div>
		</div>
	</div>

	{#if content.gallery && content.gallery.length > 0}
		<div class="flex flex-col w-full m-0 p-0 overflow-hidden bg-muted">
			{#each content.gallery as image, i}
				<img
					src={image.src}
					alt={image.alt || content.title}
					class="block w-full h-auto m-0 p-0 border-0"
					loading={i === 0 ? 'eager' : 'lazy'}
				/>
			{/each}
		</div>
	{/if}

	<div id="checkout-form-bottom" class="px-4 py-8 bg-gradient-to-b from-muted/5 to-muted/15 flex-1">
		<div class="border border-border/60 shadow-lg overflow-hidden rounded-2xl bg-card" dir="rtl">
			<div class="h-1 bg-emerald-500"></div>
			<div class="text-center pb-4 pt-6 select-none px-6">
				<h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 tracking-wide pb-1.5" style="font-family: 'El Messiri', sans-serif;">
					إستمارة تأكيد الطلب
				</h2>
				<p class="text-emerald-800/90 text-sm font-bold mt-2 px-2 leading-relaxed" style="font-family: 'El Messiri', sans-serif;">
					المرجو إدخال معلوماتكم بدقة لتأكيد الطلب والتوصيل مجاني
				</p>
			</div>

			<div class="px-4 pb-6">
				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
						<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
							اختر العرض المناسب لك:
						</span>

						<div class="grid grid-cols-1 gap-2.5">
							{#each pricing.offers as offer}
								<label
									class="relative flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-300 transform select-none active:scale-[0.98] {currentPackId === offer.id ? 'scale-[1.02] border-emerald-500 bg-emerald-50/15 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/5 z-10' : 'scale-100 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30'}"
								>
									<input
										type="radio"
										name="selectedPack-form"
										value={offer.id}
										checked={currentPackId === offer.id}
										onchange={() => (selectedPack = offer.id)}
										class="sr-only"
									/>
									<div class="flex items-center gap-3">
										<div class="w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 {currentPackId === offer.id ? 'border-emerald-500 bg-emerald-500 text-white scale-110' : 'border-gray-300 bg-white'}">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="4" stroke="currentColor" class="w-3 h-3 transition-transform duration-300 {currentPackId === offer.id ? 'scale-100' : 'scale-0'}">
												<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
											</svg>
										</div>

										<div class="text-right">
											<span class="block text-sm font-extrabold text-black">{offer.title}</span>
											<span class="block text-[11px] text-muted-foreground font-semibold mt-0.5">{offer.subtitle}</span>
										</div>
									</div>

									<div class="text-left flex flex-col items-end shrink-0">
										{#if offer.badge}
											<span class="text-[9px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 {offer.isPopular ? 'animate-pulse' : ''}">
												{offer.badge}
											</span>
										{/if}
										<div class="flex items-center gap-1.5 justify-end">
											<span class="text-xs text-muted-foreground line-through font-semibold">{formatPrice(offer.originalPrice, settings.commerce.currencySymbol)}</span>
											<span class="font-black transition-all duration-300 {offer.isPopular ? 'text-orange-500 text-[18px] scale-105' : 'text-emerald-600 text-base'}">{formatPrice(offer.price, settings.commerce.currencySymbol)}</span>
										</div>
										<span class="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5 border border-emerald-100">
											+ توصيل مجاني سريع
										</span>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="fullName-bottom" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							الاسم الكامل
						</label>

						<div class="w-full flex items-center border border-gray-300 rounded-lg overflow-hidden h-12 bg-white focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="fullName-bottom"
								type="text"
								placeholder="الاسم الكامل"
								bind:value={fullName}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.fullName}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.fullName}</p>
						{/if}
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="city-bottom" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							<span class="text-red-500 font-bold">*</span>
							<span>المدينة / Ville</span>
						</label>

						<div class="w-full flex items-center border border-gray-300 rounded-lg overflow-hidden h-12 bg-white focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="city-bottom"
								type="text"
								placeholder="المدينة"
								bind:value={city}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.city}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.city}</p>
						{/if}
					</div>

					<div class="space-y-1.5 text-right" dir="rtl">
						<label for="phoneNumber-bottom" class="block text-right font-extrabold text-sm text-black select-none pr-1">
							<span class="text-red-500 font-bold">*</span>
							<span>رقم الهاتف</span>
						</label>

						<div class="w-full flex items-center border rounded-lg overflow-hidden h-12 bg-white transition-all {errors.phoneNumber ? 'border-red-500 focus-within:ring-red-500 focus-within:border-red-500' : 'border-gray-300 focus-within:ring-emerald-500 focus-within:border-emerald-500'} {shouldShakePhone ? 'animate-shake border-red-500 ring-2 ring-red-500/20' : ''}">
							<div class="w-12 h-full bg-[#f0f0f0] flex items-center justify-center text-gray-700 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.582c0-.71.474-1.356 1.185-1.444L7.5 4.772c.596-.073 1.186.235 1.41.779l1.64 4.002a1.502 1.502 0 0 1-.32 1.586l-1.897 1.897m0 0a15.023 15.023 0 0 0 4.757 4.757l1.897-1.897a1.502 1.502 0 0 1 1.586-.32l4.002 1.64c.544.224.852.814.779 1.41l-.366 2.985c-.088.711-.734 1.185-1.444 1.185C11.127 21 2.25 12.127 2.25 1.75c0-.71.474-1.356 1.185-1.444L6.582 2.25" />
								</svg>
							</div>

							<div class="h-full w-[1px] bg-gray-300"></div>

							<input
								id="phoneNumber-bottom"
								type="tel"
								placeholder="رقم الهاتف"
								bind:value={phoneNumber}
								class="flex-1 h-full px-3 text-right bg-transparent text-black outline-none text-sm font-medium placeholder-gray-400 border-0"
							/>
						</div>
						{#if errors.phoneNumber}
							<p class="text-[11px] text-destructive font-semibold text-right animate-pulse">{errors.phoneNumber}</p>
						{/if}
					</div>

					<div class="pt-3">
						<button
							type="submit"
							disabled={loading}
							style="background-color: var(--t-cta, #f97316);"
							class="w-full py-6 text-base font-extrabold text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 group cursor-pointer {!loading ? 'animate-pulse' : ''}"
						>
							{#if loading}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								<span>جاري إرسال الطلب...</span>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 animate-bounce">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
								</svg>
								<span>اضغط هنا للطلب وتأكيد الشراء</span>
							{/if}
						</button>
					</div>

					{#if submitError}
						<div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-right" dir="rtl">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-red-500 shrink-0">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
							</svg>
							<span class="text-sm font-bold text-red-700">{submitError}</span>
						</div>
					{/if}

					<p class="text-center text-[10px] text-muted-foreground/80 font-medium">
						🔒 معلوماتكم الشخصية آمنة ومحمية بالكامل
					</p>
				</form>
			</div>
		</div>
	</div>

	<footer class="bg-muted/40 py-6 text-center text-xs text-muted-foreground border-t border-border/20 px-4" dir="rtl">
		<p>{content.footerText || `© ${new Date().getFullYear()} ${settings.brand.name}. جميع الحقوق محفوظة.`}</p>
		<div class="flex justify-center gap-4 mt-2">
			<a href="#checkout-form" class="hover:underline">سياسة الخصوصية</a>
			<span>•</span>
			<a href="#checkout-form" class="hover:underline">شروط الخدمة</a>
		</div>
	</footer>

	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" dir="rtl">
			<button
				onclick={scrollToForm}
				style="background-color: var(--t-cta, #f97316);"
				class="w-full max-w-xl mx-auto block py-4 px-6 text-lg font-extrabold text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 pointer-events-auto cursor-pointer text-center"
			>
				🛒 {t.sections.pricing.stickyCtaText || 'اضغط هنا للطلب الآن'}
			</button>
		</div>
	{/if}
</div>
