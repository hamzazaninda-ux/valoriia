<script lang="ts">
	import { onMount } from 'svelte';
	import { validateOrderForm } from '$lib/utils/validation';
	import { formatPrice, buildWhatsappUrl } from '$lib/utils/format';
	import StarRating from '$lib/components/shared/StarRating.svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import { getDefaultTheme, buildThemeCssVars, RADIUS_MAP } from '$lib/types/theme';

	let { product, settings, theme }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('minimal'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	// First available image across all admin image lists (never a broken hero)
	let heroSrc = $derived(
		content.heroImage?.trim() ||
			content.gallery?.find((g) => g.src && g.src.trim())?.src ||
			content.carousel?.find((c) => c.image && c.image.trim())?.image ||
			''
	);

	let selectedPack = $state<number | null>(null);

	const currentPackId = $derived(
		selectedPack ?? pricing.offers.find((o: ProductOffer) => o.isPopular)?.id ?? pricing.offers[0]?.id ?? 1
	);

	const activeOffer = $derived(
		pricing.offers.find((o: ProductOffer) => o.id === currentPackId) || pricing.offers[0] || { title: '', price: 0, originalPrice: 0, quantity: 1 }
	);

	let fullName = $state('');
	let city = $state('');
	let phoneNumber = $state('');
	let errors = $state({ fullName: '', city: '', phoneNumber: '' });
	let loading = $state(false);
	let submitError = $state('');
	let shouldShakePhone = $state(false);
	let showStickyBtn = $state(true);

	function scrollToForm() {
		document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		const formEl = document.getElementById('order-form');
		if (!formEl) return;

		let formVisible = false;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target.id === 'order-form') {
						formVisible = entry.isIntersecting;
					}
				}
				showStickyBtn = !formVisible;
			},
			{ threshold: 0.1 }
		);

		observer.observe(formEl);

		return () => observer.disconnect();
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


		// Product-specific URL takes priority over the global default
		const sheetsUrl = (order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim();

		const saveAndRedirect = () => {
			const calculatedTotal = orderData.price || 229;
			if (typeof window !== 'undefined' && (window as any).ttq) {
				try {
					(window as any).ttq.track('CompletePayment', {
						content_name: 'طقم التنظيم المنزلي',
						currency: 'MAD',
						value: calculatedTotal || 229
					});
				} catch (err) {
					console.warn('[Pixel] ttq CompletePayment error:', err);
				}
			}
			try {
				sessionStorage.setItem('order_tracked_' + orderId, 'true');
				localStorage.setItem('order_tracked_' + orderId, 'true');
			} catch {}

			localStorage.setItem('latestOrder', JSON.stringify(orderData));
			sessionStorage.setItem('latestOrder', JSON.stringify(orderData));
			setTimeout(() => {
				window.location.href = '/thank-you';
			}, 200);
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

	const whatsappUrl = $derived(() => {
		const num = settings.brand.whatsappNumber || order.whatsappNumber;
		return buildWhatsappUrl(num, content.title);
	});
</script>

<div class="min-h-screen transition-all duration-300" style="{buildThemeCssVars(t)}; background-color: var(--t-bg, #ffffff); color: var(--t-text, #111827);">
	<section class="max-w-3xl mx-auto px-4 py-10 sm:py-16">
		<div class="text-center" dir="rtl">
			{#if t.sections.hero.showBadge && t.sections.hero.badgeText}
				<div class="mb-4">
					<span class="inline-block text-xs font-bold px-3 py-1 rounded-full text-white" style="background-color: var(--t-accent, #6b7280);">
						{t.sections.hero.badgeText}
					</span>
				</div>
			{/if}

			<h1 class="text-3xl sm:text-4xl font-extrabold leading-tight" style="color: var(--t-text, #111827);">
				{content.title}
			</h1>
			<p class="mt-3 text-lg" style="color: var(--t-text-muted, #6b7280);">{content.subtitle}</p>

			{#if t.sections.hero.showRating}
				<div class="flex items-center justify-center gap-1 mt-4">
					<StarRating rating={content.rating} reviewCount={content.reviewCount} />
				</div>
			{/if}

			{#if heroSrc}
				<img
					src={heroSrc}
					alt={content.title}
					class="w-full max-w-md mx-auto mt-8 rounded-xl"
					loading="eager"
				/>
			{/if}

			<div class="mt-6 flex flex-col items-center justify-center gap-1">
				<div class="flex items-center justify-center gap-3">
					<span class="text-2xl font-black" style="color: var(--t-primary, #111827);">{formatPrice(activeOffer.price, settings.commerce.currencySymbol)}</span>
					{#if t.sections.pricing.showOriginalPrice}
						<span class="text-sm text-gray-400 line-through">{formatPrice(activeOffer.originalPrice, settings.commerce.currencySymbol)}</span>
					{/if}
				</div>
				{#if t.sections.hero.showSalesCount && t.sections.hero.salesCountText}
					<p class="text-xs font-semibold mt-1" style="color: var(--t-primary, #111827);">{t.sections.hero.salesCountText}</p>
				{/if}
			</div>
			<p class="text-xs font-semibold mt-1" style="color: var(--t-primary, #111827);">{settings.commerce.freeShippingText}</p>

			<button
				onclick={scrollToForm}
				class="mt-6 px-8 py-3 text-white font-bold transition-colors"
				style="background-color: var(--t-cta, #111827); border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '8px'};"
			>
				{t.sections.pricing.ctaText || 'اطلب الآن'}
			</button>
		</div>
	</section>

	{#if content.gallery.length > 0}
		<section class="max-w-3xl mx-auto px-4 py-8">
			<div class="grid grid-cols-2 gap-3">
				{#each content.gallery as image, i}
					<img
						src={image.src}
						alt={image.alt}
						class="w-full aspect-square object-cover rounded-lg"
						loading={i < 2 ? 'eager' : 'lazy'}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<section id="order-form" class="max-w-3xl mx-auto px-4 py-10">
		<div class="text-center mb-8">
			<h2 class="text-2xl sm:text-3xl font-extrabold" style="color: var(--t-text, #111827);">{t.sections.orderForm.title}</h2>
		</div>

		<div class="space-y-3 mb-8">
			{#each pricing.offers as offer}
				<button
					type="button"
					onclick={() => (selectedPack = offer.id)}
					class="w-full text-right p-4 border-2 transition-all"
					style="
						border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '12px'};
						border-color: {currentPackId === offer.id ? 'var(--t-primary, #111827)' : 'rgba(156, 163, 175, 0.2)'};
						background-color: {currentPackId === offer.id ? 'color-mix(in srgb, var(--t-primary, #111827) 8%, var(--t-surface, #f9fafb))' : 'var(--t-surface, #f9fafb)'};
					"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {currentPackId === offer.id ? '' : 'border-gray-300'}" style="{currentPackId === offer.id ? 'border-color: var(--t-primary, #111827); background-color: var(--t-primary, #111827);' : ''}">
								{#if currentPackId === offer.id}
									<div class="w-1.5 h-1.5 bg-white rounded-full"></div>
								{/if}
							</div>
							<div>
								<span class="block text-sm font-bold" style="color: var(--t-text, #111827);">{offer.title}</span>
								<span class="block text-xs mt-0.5" style="color: var(--t-text-muted, #6b7280);">{offer.subtitle}</span>
							</div>
						</div>
						<div class="text-left">
							{#if offer.badge}
								<span class="block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1" style="background-color: var(--t-accent, #6b7280); color: white;">{offer.badge}</span>
							{/if}
						<span class="block text-xl font-black" style="color: var(--t-primary, #111827);">{formatPrice(offer.price, settings.commerce.currencySymbol)}</span>
						<span class="block text-xs line-through" style="color: var(--t-text-muted, #6b7280);">{formatPrice(offer.originalPrice, settings.commerce.currencySymbol)}</span>
						</div>
					</div>
				</button>
			{/each}
		</div>

		<div class="rounded-xl p-5" style="background-color: var(--t-surface, #f9fafb); border: 1px solid rgba(156, 163, 175, 0.15);">
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="fullName" class="block text-sm font-bold mb-1" style="color: var(--t-text, #111827);">الاسم الكامل</label>
					<input
						id="fullName"
						type="text"
						bind:value={fullName}
						placeholder={t.sections.orderForm.namePlaceholder}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
						style="background-color: var(--t-bg, #ffffff); color: var(--t-text, #111827); border-color: rgba(156, 163, 175, 0.3);"
					/>
					{#if errors.fullName}
						<p class="mt-1 text-xs text-red-600">{errors.fullName}</p>
					{/if}
				</div>

				<div>
					<label for="city" class="block text-sm font-bold mb-1" style="color: var(--t-text, #111827);">
						<span class="text-red-500">*</span> المدينة
					</label>
					<input
						id="city"
						type="text"
						bind:value={city}
						placeholder={t.sections.orderForm.cityPlaceholder}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
						style="background-color: var(--t-bg, #ffffff); color: var(--t-text, #111827); border-color: rgba(156, 163, 175, 0.3);"
					/>
					{#if errors.city}
						<p class="mt-1 text-xs text-red-600">{errors.city}</p>
					{/if}
				</div>

				<div>
					<label for="phoneNumber" class="block text-sm font-bold mb-1" style="color: var(--t-text, #111827);">
						<span class="text-red-500">*</span> رقم الهاتف
					</label>
					<input
						id="phoneNumber"
						type="tel"
						bind:value={phoneNumber}
						placeholder={t.sections.orderForm.phonePlaceholder}
						class="w-full px-4 py-3 border rounded-lg outline-none {errors.phoneNumber ? 'border-red-500' : ''}"
						style="background-color: var(--t-bg, #ffffff); color: var(--t-text, #111827); border-color: {errors.phoneNumber ? '#dc2626' : 'rgba(156, 163, 175, 0.3)'};"
					/>
					{#if errors.phoneNumber}
						<p class="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
					{/if}
				</div>

				{#if submitError}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-xs font-bold text-red-700">{submitError}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					style="background-color: var(--t-primary, #111827); border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '8px'};"
				>
					{#if loading}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						<span>{t.sections.orderForm.processingText}</span>
					{:else}
						<span>{t.sections.orderForm.submitText}</span>
					{/if}
				</button>

				<p class="text-center text-[10px] text-gray-500">🔒 معلوماتك آمنة</p>
			</form>
		</div>
	</section>

	{#if content.faq.length > 0 && t.sections.trustBadges.showFAQ}
		<section class="max-w-3xl mx-auto px-4 py-8">
			<h2 class="text-xl font-bold mb-4 text-center" style="color: var(--t-text, #111827);">{t.sections.trustBadges.faqTitle}</h2>
			<div class="space-y-2">
				{#each content.faq as item}
					<details class="rounded-lg overflow-hidden" style="background-color: var(--t-surface, #f9fafb); border: 1px solid rgba(156, 163, 175, 0.1);">
						<summary class="px-4 py-3 cursor-pointer font-bold text-sm hover:bg-gray-100/50 transition-colors" style="color: var(--t-text, #111827);">
							{item.question}
						</summary>
						<div class="px-4 pb-3 text-sm border-t border-gray-200/50" style="color: var(--t-text-muted, #6b7280);">
							<p class="pt-2">{item.answer}</p>
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/if}

	{#if settings.brand.whatsappNumber || order.whatsappNumber}
		<section class="max-w-3xl mx-auto px-4 py-8 text-center">
			<a
				href={whatsappUrl()}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 text-white font-bold px-6 py-3 transition-colors"
				style="background-color: var(--t-primary, #111827); border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '8px'};"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
					<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
				</svg>
				تواصل معنا
			</a>
		</section>
	{/if}

	<footer class="py-6 text-center text-xs text-gray-500 border-t border-gray-100" dir="rtl">
		{content.footerText || `© ${new Date().getFullYear()} ${settings?.brand?.name && settings.brand.name !== 'Valoriia' ? settings.brand.name : 'Lhamza Shop'}`}
	</footer>

	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-0 left-0 right-0 z-50 p-3 border-t border-gray-200" style="background-color: var(--t-surface, #ffffff);" dir="rtl">
			<button
				onclick={scrollToForm}
				class="w-full py-3 text-white font-bold transition-colors animate-pulse"
				style="background-color: var(--t-cta, #111827); border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '8px'};"
			>
				🛒 {t.sections.pricing.stickyCtaText || 'اطلب الآن'}
			</button>
		</div>
	{/if}
</div>

<style>
	input:focus {
		border-color: var(--t-primary, #111827) !important;
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--t-primary, #111827) 20%, transparent) !important;
	}
</style>
