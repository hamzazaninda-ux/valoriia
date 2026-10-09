<script lang="ts">
	import { onMount } from 'svelte';
	import { sendOrder } from '$lib/utils/checkout';
	import { formatPrice, buildWhatsappUrl } from '$lib/utils/format';
	import StarRating from '$lib/components/shared/StarRating.svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import { getDefaultTheme, buildThemeCssVars, RADIUS_MAP } from '$lib/types/theme';

	let { product, settings, theme }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('killers'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	// Safe read of killers specific content
	let killers = $derived(content.killers || {
		bullets: [],
		featuredReview: { text: '', image: '', author: '' },
		stories: [],
		gridReviews: [],
		benefits: [],
		usageSteps: [],
		footerCta: { text: '', image: '' },
		guarantees: []
	});

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

	// Carousel state
	let currentSlide = $state(0);

	function nextSlide() {
		if (content.carousel && content.carousel.length > 0) {
			currentSlide = (currentSlide + 1) % content.carousel.length;
		}
	}

	function prevSlide() {
		if (content.carousel && content.carousel.length > 0) {
			currentSlide = (currentSlide - 1 + content.carousel.length) % content.carousel.length;
		}
	}

	function scrollToForm() {
		document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
	}

	function isValidPhone(phone: string, currency: string): boolean {
		const clean = phone.replace(/[\s\-()]/g, '');
		if (currency === 'SAR') {
			return /^(?:05|5|\+966|00966)\d{8}$/.test(clean);
		}
		// Moroccan validation fallback
		const LOCAL_REGEX = /^0[567]\d{8}$/;
		const INTL_REGEX = /^(?:\+212|00212|212)[567]\d{8}$/;
		return LOCAL_REGEX.test(clean) || INTL_REGEX.test(clean);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		errors = { fullName: '', city: '', phoneNumber: '' };
		submitError = '';
		shouldShakePhone = false;

		let hasErrors = false;
		if (!fullName.trim()) {
			errors.fullName = 'الاسم الكامل مطلوب لتأكيد الطلب';
			hasErrors = true;
		}

		if (!city.trim()) {
			errors.city = 'يرجى إدخال اسم المدينة';
			hasErrors = true;
		}

		const currency = pricing.currency || 'SAR';
		if (!phoneNumber.trim()) {
			errors.phoneNumber = 'رقم الهاتف مطلوب لتأكيد الطلب';
			shouldShakePhone = true;
			hasErrors = true;
		} else if (!isValidPhone(phoneNumber.trim(), currency)) {
			errors.phoneNumber = currency === 'SAR' 
				? 'رقم الهاتف الذي أدخلتموه غير صحيح (مثال: 05xxxxxxxx)' 
				: 'رقم الهاتف الذي أدخلتموه غير صحيح (مثال: 06XXXXXXXX)';
			shouldShakePhone = true;
			hasErrors = true;
		}

		if (hasErrors) return;

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
			date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
			timestamp: new Date().toISOString()
		};


		// Product-specific URL takes priority over the global default
		const sheetsUrl = (order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim();

		const saveAndRedirect = async () => {
			const orderTotal = orderData.price || 229;
			const orderProductName = (orderData.productTitle || productTitle || content?.title || 'منتج').trim();
			const orderQuantity = orderData.quantity || orderData.qte || 1;
			const phone = orderData.phone || '';
			const formattedPhone = phone.startsWith('+') ? phone : ('+212' + phone.replace(/^0/, ''));

			if (typeof window !== 'undefined' && (window as any).ttq) {
				try {
					(window as any).ttq.track('CompletePayment', {
						content_name: orderProductName,
						currency: 'MAD',
						value: orderTotal
					});
				} catch (err) {
					console.warn('[Pixel] ttq CompletePayment error:', err);
				}
			}
			const snapKey = 'snap_tracked_' + orderId;
			if (!sessionStorage.getItem(snapKey) && typeof window !== 'undefined' && (window as any).snaptr) {
				try {
					// 1. تمرير رقم الهاتف لمطابقة حساب الزبون في سناب شات (Advanced Matching)
					if (formattedPhone && formattedPhone !== '+212') {
						(window as any).snaptr('init', '0f0bf0bb-3983-47ea-9a39-90f43b1cf3ce', {
							'user_phone_number': formattedPhone
						});
					}

					// 2. إطلاق حدث الشراء الفوري
					(window as any).snaptr('track', 'PURCHASE', {
						currency: 'MAD',
						price: orderTotal,
						transaction_id: orderId,
						item_category: orderProductName
					});
					sessionStorage.setItem(snapKey, 'true');
					localStorage.setItem(snapKey, 'true');
				} catch (err) {
					console.warn('[Pixel] snap PURCHASE error:', err);
				}
			}
			const gadsKey = 'gads_tracked_' + orderId;
			if (!sessionStorage.getItem(gadsKey) && typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
				try {
					(window as any).gtag('event', 'conversion', {
						'send_to': 'AW-17426876482/SmXBCMqzj5cdEMKQ5PVA',
						'value': orderTotal || 229,
						'currency': 'MAD',
						'transaction_id': orderId
					});
					(window as any).gtag('event', 'purchase', {
						'send_to': 'AW-17426876482/SmXBCMqzj5cdEMKQ5PVA',
						transaction_id: orderId,
						value: orderTotal || 229,
						currency: 'MAD',
						items: [{
							item_name: orderProductName,
							price: orderTotal || 229,
							quantity: orderQuantity
						}]
					});
					sessionStorage.setItem(gadsKey, 'true');
					localStorage.setItem(gadsKey, 'true');
				} catch (err) {
					console.warn('[Pixel] gtag conversion/purchase error:', err);
				}
			}
			try {
				sessionStorage.setItem('order_tracked_' + orderId, 'true');
				localStorage.setItem('order_tracked_' + orderId, 'true');
			} catch {}

			localStorage.setItem('latestOrder', JSON.stringify(orderData));
			sessionStorage.setItem('latestOrder', JSON.stringify(orderData));

			// Network Flush Buffer (400ms)
			await new Promise((resolve) => setTimeout(resolve, 400));
			window.location.href = '/thank-you';
		};

		sendOrder(orderData, sheetsUrl).finally(saveAndRedirect);
	}

	const whatsappUrl = $derived(() => {
		const num = settings?.brand?.whatsappNumber || order?.whatsappNumber || '';
		return buildWhatsappUrl(num, content.title);
	});

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

		// Autoplay slides
		const timer = setInterval(nextSlide, 5000);

		return () => {
			observer.disconnect();
			clearInterval(timer);
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=El+Messiri:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="killers-theme min-h-screen" dir="rtl" style="{buildThemeCssVars(t)}; background-color: var(--t-bg, #1a1a1a); color: var(--t-text, #f5f0e8); font-family: 'Cairo', sans-serif;">
	
	<!-- Header -->
	<header class="py-4 border-b border-stone-800 bg-[#121212]/95 sticky top-0 z-50 backdrop-blur-sm">
		<div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-xl font-black tracking-wider" style="font-family: 'El Messiri', sans-serif; color: var(--t-primary, #c8a96e);">
					{content.title}
				</span>
			</div>
			<button
				onclick={scrollToForm}
				class="px-4 py-2 text-xs sm:text-sm font-bold text-stone-950 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg"
				style="background-color: var(--t-cta, #c8a96e); border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '8px'};"
			>
				اطلب الآن
			</button>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 pb-24">
		
		<!-- Hero Section -->
		<section class="py-8 sm:py-12">
			<div class="text-center space-y-4">
				{#if t.sections.hero.showBadge}
					<span class="inline-block text-xs font-bold px-3 py-1 rounded-full" style="background-color: color-mix(in srgb, var(--t-primary, #c8a96e) 15%, transparent); border: 1px solid color-mix(in srgb, var(--t-primary, #c8a96e) 30%, transparent); color: var(--t-primary, #c8a96e);">
						{t.sections.hero.badgeText}
					</span>
				{/if}
				
				<h1 class="text-3xl sm:text-5xl font-black text-white leading-tight" style="font-family: 'El Messiri', sans-serif;">
					{content.title}
				</h1>
				
				<p class="text-stone-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
					{content.subtitle}
				</p>

				{#if t.sections.hero.showRating}
					<div class="flex flex-col items-center gap-2 pt-2">
						<StarRating rating={content.rating} reviewCount={content.reviewCount} />
						{#if t.sections.hero.showSalesCount}
							<span class="text-xs text-stone-400 font-medium">({t.sections.hero.salesCountText})</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Carousel / Hero Slider -->
			<div class="relative mt-8 sm:mt-12 max-w-xl mx-auto rounded-2xl overflow-hidden border border-stone-800 bg-[#222222]">
				{#if content.carousel && content.carousel.length > 0}
					<div class="relative w-full aspect-square overflow-hidden flex items-center">
						{#each content.carousel as slide, idx}
							<div class="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out transform {currentSlide === idx ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'}">
								<img src={slide.image} alt={slide.alt || 'Slide'} class="w-full h-full object-cover" />
								{#if slide.title}
									<div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
										<p class="text-xs sm:text-sm font-semibold text-[#f5f0e8]">{slide.title}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					{#if content.carousel.length > 1}
						<button onclick={prevSlide} class="absolute top-1/2 left-4 z-20 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-stone-700 flex items-center justify-center text-white hover:bg-black transition-all">
							←
						</button>
						<button onclick={nextSlide} class="absolute top-1/2 right-4 z-20 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-stone-700 flex items-center justify-center text-white hover:bg-black transition-all">
							→
						</button>
						<div class="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex gap-1.5">
							{#each content.carousel as _, idx}
								<button onclick={() => currentSlide = idx} class="w-1.5 h-1.5 rounded-full transition-all {currentSlide === idx ? 'w-3' : 'bg-stone-500'}" style="{currentSlide === idx ? 'background-color: var(--t-primary, #c8a96e);' : ''}"></button>
							{/each}
						</div>
					{/if}
				{:else if content.heroImage}
					<img src={content.heroImage} alt={content.title} class="w-full aspect-square object-cover" />
				{/if}
			</div>
		</section>

		<!-- Bullets Section -->
		{#if killers.bullets && killers.bullets.length > 0}
			<section class="py-8 border-t border-stone-800/80">
				<div class="max-w-xl mx-auto bg-[#242424] border border-stone-800 rounded-2xl p-6 space-y-4 shadow-xl">
					<h2 class="text-lg font-bold mb-2 flex items-center gap-2" style="color: var(--t-primary, #c8a96e);">
						✨ لماذا هذا المنتج تحديداً؟
					</h2>
					<ul class="space-y-3.5">
						{#each killers.bullets as bullet}
							{#if bullet.trim()}
								<li class="flex items-start gap-3">
									<span class="text-lg shrink-0 mt-0.5" style="color: var(--t-primary, #c8a96e);">✔</span>
									<span class="text-stone-100 text-sm sm:text-base leading-relaxed font-semibold">{bullet}</span>
								</li>
							{/if}
						{/each}
					</ul>
				</div>
			</section>
		{/if}

		<!-- Featured Review Section -->
		{#if killers.featuredReview && killers.featuredReview.text}
			<section class="py-10 border-t border-stone-800/80">
				<div class="max-w-2xl mx-auto text-center space-y-6">
					<h2 class="text-xl sm:text-2xl font-bold text-white">تجارب واقعية للعملاء</h2>
					<div class="bg-gradient-to-br from-[#2a2a2a] to-[#202020] border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
						<span class="absolute top-4 right-6 text-7xl select-none" style="color: color-mix(in srgb, var(--t-primary, #c8a96e) 10%, transparent);">”</span>
						
						<div class="flex justify-center gap-1 mb-4">
							{#each Array(5) as _}
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" style="color: var(--t-primary, #c8a96e)">
									<path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
								</svg>
							{/each}
						</div>

						<p class="text-[#f5f0e8] text-base sm:text-lg italic leading-relaxed relative z-10">
							"{killers.featuredReview.text}"
						</p>

						<div class="mt-6 flex items-center justify-center gap-4">
							{#if killers.featuredReview.image}
								<img src={killers.featuredReview.image} alt={killers.featuredReview.author} class="w-12 h-12 rounded-full object-cover border-2" style="border-color: var(--t-primary, #c8a96e);" />
							{/if}
							<div class="text-right">
								<h4 class="font-bold text-white text-sm sm:text-base">{killers.featuredReview.author}</h4>
								<span class="text-xs text-stone-400">عميل مؤكد الشراء ✅</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- Customer Stories Section (Multirow 1) -->
		{#if killers.stories && killers.stories.length > 0}
			<section class="py-10 border-t border-stone-800/80 space-y-6">
				<h2 class="text-xl sm:text-2xl font-bold text-center text-white">قصص نجاح ملهمة</h2>
				<div class="space-y-6">
					{#each killers.stories as story, idx}
						{#if story.name && story.text}
							<div class="bg-[#242424] border border-stone-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
								<div class="font-black text-lg w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border" style="background-color: color-mix(in srgb, var(--t-primary, #c8a96e) 10%, transparent); border-color: color-mix(in srgb, var(--t-primary, #c8a96e) 20%, transparent); color: var(--t-primary, #c8a96e);">
									{idx + 1}
								</div>
								<div class="space-y-1">
									<h4 class="font-bold text-base" style="color: var(--t-primary, #c8a96e);">{story.name}</h4>
									<p class="text-stone-300 text-sm sm:text-base leading-relaxed">{story.text}</p>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Grid Reviews Section (Multicolumn 1) -->
		{#if killers.gridReviews && killers.gridReviews.length > 0}
			<section class="py-10 border-t border-stone-800/80 space-y-6">
				<h2 class="text-xl sm:text-2xl font-bold text-center text-white">تقييمات حقيقية من عملائنا</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each killers.gridReviews as item}
						{#if item.name && item.text}
							<div class="bg-[#2a2a2a] border border-stone-800 rounded-2xl p-5 space-y-3">
								<div class="flex items-center gap-3">
									{#if item.image}
										<div class="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg border border-stone-700">
											<img src={item.image} alt={item.name} class="w-6 h-6 object-contain" />
										</div>
									{/if}
									<div class="text-right">
										<h4 class="font-bold text-white text-sm">{item.name}</h4>
										<div class="flex gap-0.5 mt-0.5">
											{#each Array(5) as _}
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5" style="color: var(--t-primary, #c8a96e);">
													<path fill-rule="evenodd" d="M10.868 2.784c.26-.75 1.32-.75 1.58 0l1.455 4.205 4.417.355c.784.063 1.096 1.026.516 1.523l-3.2 2.748 1.09 4.24c.2.78-.636 1.39-1.306.974l-3.84-2.316-3.84 2.316c-.67.416-1.507-.194-1.306-.974l1.09-4.24-3.2-2.748c-.58-.497-.268-1.46.516-1.523l4.417-.355 1.455-4.205z" clip-rule="evenodd" />
												</svg>
											{/each}
										</div>
									</div>
								</div>
								<p class="text-stone-300 text-xs sm:text-sm leading-relaxed">{item.text}</p>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Benefits list Section (Multirow 2) -->
		{#if killers.benefits && killers.benefits.length > 0}
			<section class="py-10 border-t border-stone-800/80 space-y-6">
				<h2 class="text-xl sm:text-2xl font-bold text-center text-white">مميزات وفوائد المنتج</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each killers.benefits as benefit}
						{#if benefit.title && benefit.text}
							<div class="bg-[#242424] border border-stone-800/80 rounded-2xl p-5 space-y-2">
								<h4 class="font-extrabold text-base flex items-center gap-2" style="color: var(--t-primary, #c8a96e);">
									<span class="w-2 h-2 rounded-full" style="background-color: var(--t-primary, #c8a96e);"></span>
									{benefit.title}
								</h4>
								<p class="text-stone-300 text-xs sm:text-sm leading-relaxed">{benefit.text}</p>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Usage Steps -->
		{#if killers.usageSteps && killers.usageSteps.length > 0}
			<section class="py-10 border-t border-stone-800/80 space-y-6">
				<h2 class="text-xl sm:text-2xl font-bold text-center text-white">طريقة الاستخدام الصحيحة</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each killers.usageSteps as step, idx}
						{#if step.trim()}
							<div class="bg-[#2a2a2a] border border-stone-850 rounded-2xl p-5 space-y-3 relative overflow-hidden">
								<div class="absolute -left-2 -bottom-4 text-7xl font-black text-white/5 font-mono select-none">
									0{idx + 1}
								</div>
								<div class="w-8 h-8 rounded-full text-stone-950 font-bold text-sm flex items-center justify-center" style="background-color: var(--t-primary, #c8a96e);">
									{idx + 1}
								</div>
								<p class="text-stone-200 text-xs sm:text-sm leading-relaxed relative z-10 font-medium">
									{step}
								</p>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Order Form Section -->
		<section id="order-form" class="py-12 border-t border-stone-800/80">
			<div class="max-w-xl mx-auto bg-gradient-to-b from-[#252525] to-[#1f1f1f] border border-stone-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
				<div class="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl" style="background-color: var(--t-primary, #c8a96e);"></div>
				
				<div class="text-center pb-6">
					<h2 class="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-stone-200 pb-1.5" style="font-family: 'El Messiri', sans-serif;">
						{t.sections.orderForm.title}
					</h2>
					<p class="text-xs sm:text-sm font-bold mt-1" style="color: var(--t-primary, #c8a96e);">
						الرجاء إدخال معلوماتك بدقة لتأكيد وتوصيل الطلب مجاناً
					</p>
				</div>

				<!-- Package Selection -->
				<div class="space-y-3 mb-8">
					<span class="block text-right font-bold text-xs sm:text-sm text-stone-300 mb-2">
						اختر العرض المناسب لك:
					</span>
					{#each pricing.offers as offer}
						<button
							type="button"
							onclick={() => selectedPack = offer.id}
							class="w-full text-right p-4 border transition-all duration-300 relative flex items-center justify-between {currentPackId === offer.id ? 'shadow-lg' : 'hover:border-stone-700'}"
							style="
								border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '16px'};
								border-color: {currentPackId === offer.id ? 'var(--t-primary, #c8a96e)' : 'var(--t-surface, #1e1e1e)'};
								background-color: {currentPackId === offer.id ? 'color-mix(in srgb, var(--t-primary, #c8a96e) 10%, transparent)' : 'var(--t-surface, #1e1e1e)'};
							"
						>
							<div class="flex items-center gap-3">
								<div class="w-5 h-5 rounded-full border flex items-center justify-center {currentPackId === offer.id ? '' : 'border-stone-600 bg-[#2b2b2b]'}" style="{currentPackId === offer.id ? 'border-color: var(--t-primary, #c8a96e); background-color: var(--t-primary, #c8a96e);' : ''}">
									{#if currentPackId === offer.id}
										<div class="w-2 h-2 bg-stone-950 rounded-full"></div>
									{/if}
								</div>
								<div>
									<span class="block text-sm font-bold text-white">{offer.title}</span>
									{#if offer.subtitle}
										<span class="block text-[11px] text-stone-400 font-medium mt-0.5">{offer.subtitle}</span>
									{/if}
								</div>
							</div>

							<div class="text-left flex flex-col items-end shrink-0">
								{#if offer.badge}
									<span class="text-[9px] font-bold text-stone-950 px-2 py-0.5 rounded-full mb-1 {offer.isPopular ? 'animate-pulse' : ''}" style="background-color: var(--t-primary, #c8a96e);">
										{offer.badge}
									</span>
								{/if}
								<div class="flex items-center gap-1.5 justify-end">
									{#if t.sections.pricing.showOriginalPrice}
										<span class="text-xs text-stone-500 line-through font-semibold">{formatPrice(offer.originalPrice, pricing.currency === 'SAR' ? 'ر.س' : 'د.م')}</span>
									{/if}
									<span class="font-black text-lg" style="color: var(--t-primary, #c8a96e);">{formatPrice(offer.price, pricing.currency === 'SAR' ? 'ر.س' : 'د.م')}</span>
								</div>
							</div>
						</button>
					{/each}
				</div>

				<!-- Form Inputs -->
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label for="fullName" class="block text-xs sm:text-sm font-bold text-stone-300 mb-1">الاسم الكامل (ثنائي أو ثلاثي)</label>
						<input
							id="fullName"
							type="text"
							bind:value={fullName}
							placeholder={t.sections.orderForm.namePlaceholder}
							class="w-full px-4 py-3 bg-[#1c1c1c] border border-stone-800 rounded-xl text-[#f5f0e8] placeholder-stone-600 text-sm focus:outline-none transition-colors"
						/>
						{#if errors.fullName}
							<p class="mt-1 text-xs text-red-500 font-medium">{errors.fullName}</p>
						{/if}
					</div>

					<div>
						<label for="city" class="block text-xs sm:text-sm font-bold text-stone-300 mb-1">المنطقة / المدينة</label>
						<input
							id="city"
							type="text"
							bind:value={city}
							placeholder={t.sections.orderForm.cityPlaceholder}
							class="w-full px-4 py-3 bg-[#1c1c1c] border border-stone-800 rounded-xl text-[#f5f0e8] placeholder-stone-600 text-sm focus:outline-none transition-colors"
						/>
						{#if errors.city}
							<p class="mt-1 text-xs text-red-500 font-medium">{errors.city}</p>
						{/if}
					</div>

					<div>
						<label for="phoneNumber" class="block text-xs sm:text-sm font-bold text-stone-300 mb-1">رقم الهاتف</label>
						<input
							id="phoneNumber"
							type="tel"
							bind:value={phoneNumber}
							placeholder={t.sections.orderForm.phonePlaceholder}
							class="w-full px-4 py-3 bg-[#1c1c1c] border rounded-xl text-[#f5f0e8] placeholder-stone-600 text-sm focus:outline-none transition-all {errors.phoneNumber ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-800'} {shouldShakePhone ? 'animate-shake' : ''}"
						/>
						{#if errors.phoneNumber}
							<p class="mt-1 text-xs text-red-500 font-medium">{errors.phoneNumber}</p>
						{/if}
					</div>

					{#if submitError}
						<div class="p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
							<p class="text-xs font-bold text-red-400">{submitError}</p>
						</div>
					{/if}

					<!-- Checkout Button -->
					<div class="pt-2">
						<button
							type="submit"
							disabled={loading}
							class="w-full py-4 text-stone-950 font-black text-sm sm:text-base rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.99] relative overflow-hidden group"
							style="
								background: linear-gradient(to right, var(--t-cta, #c8a96e), var(--t-cta-hover, #b8985e));
								border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '12px'};
							"
						>
							{#if loading}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent"></div>
								<span>{t.sections.orderForm.processingText}</span>
							{:else}
								<span>{t.sections.orderForm.submitText}</span>
							{/if}
							<!-- Subtle glare effect -->
							<div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
						</button>
					</div>

					<div class="flex items-center justify-center gap-4 text-[10px] text-stone-500 font-medium select-none pt-2">
						<span>🔒 تشفير بيانات آمن 100%</span>
						<span>•</span>
						<span>🚚 الشحن مجاني وسريع</span>
					</div>
				</form>
			</div>
		</section>

		<!-- Guarantees Section (Multicolumn 2) -->
		{#if killers.guarantees && killers.guarantees.length > 0}
			<section class="py-10 border-t border-stone-800/80 space-y-6">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					{#each killers.guarantees as item}
						{#if item.title && item.text}
							<div class="bg-[#242424]/40 border border-stone-850 p-4 rounded-2xl text-center space-y-2.5">
								{#if item.image}
									<div class="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto" style="background-color: color-mix(in srgb, var(--t-primary, #c8a96e) 10%, transparent); border-color: color-mix(in srgb, var(--t-primary, #c8a96e) 15%, transparent);">
										<img src={item.image} alt={item.title} class="w-6 h-6 object-contain" />
									</div>
								{/if}
								<div class="space-y-0.5">
									<h4 class="font-extrabold text-white text-xs sm:text-sm">{item.title}</h4>
									<p class="text-stone-400 text-[10px] sm:text-xs leading-relaxed">{item.text}</p>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- FAQs Section -->
		{#if content.faq.length > 0}
			<section class="py-10 border-t border-stone-800/80 max-w-2xl mx-auto space-y-6">
				<h2 class="text-xl sm:text-2xl font-bold text-center text-white">{t.sections.trustBadges.faqTitle}</h2>
				<div class="space-y-3">
					{#each content.faq as item}
						<details class="bg-[#202020] border border-stone-850 rounded-2xl overflow-hidden group">
							<summary class="px-5 py-4 cursor-pointer font-bold text-sm sm:text-base text-white hover:bg-[#252525] transition-colors flex items-center justify-between list-none">
								<span>{item.question}</span>
								<span class="transition-transform duration-300 group-open:rotate-180" style="color: var(--t-primary, #c8a96e);">▼</span>
							</summary>
							<div class="px-5 pb-4 pt-1 text-stone-300 text-xs sm:text-sm leading-relaxed border-t border-stone-850">
								{item.answer}
							</div>
						</details>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Footer CTA Marketing Section -->
		{#if killers.footerCta && killers.footerCta.text}
			<section class="py-12 border-t border-stone-800/80">
				<div class="max-w-xl mx-auto bg-gradient-to-br from-[#2a2a2a] to-[#202020] border border-stone-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
					{#if killers.footerCta.image}
						<img src={killers.footerCta.image} alt="Final call" class="w-32 h-32 object-cover rounded-2xl mx-auto border-2" style="border-color: var(--t-primary, #c8a96e);" />
					{/if}
					<p class="text-[#f5f0e8] text-base sm:text-lg font-bold leading-relaxed">
						{killers.footerCta.text}
					</p>
					<button
						onclick={scrollToForm}
						class="px-8 py-3.5 text-stone-950 font-black rounded-xl shadow-lg transition-all duration-300 transform active:scale-95"
						style="
							background: linear-gradient(to right, var(--t-cta, #c8a96e), var(--t-cta-hover, #b8985e));
							border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '12px'};
						"
					>
						ابدأ الآن واستعد ثقتك!
					</button>
				</div>
			</section>
		{/if}

	</main>

	<!-- Footer -->
	<footer class="py-8 border-t border-stone-800/80 bg-[#121212] text-stone-500 text-center text-xs">
		<div class="max-w-4xl mx-auto px-4 space-y-2">
			<p>© {new Date().getFullYear()} {content.title}. جميع الحقوق محفوظة.</p>
			<p class="text-[10px] text-stone-600">هذا الموقع غير تابع لـ Facebook أو Google أو TikTok بأي شكل من الأشكال.</p>
		</div>
	</footer>

	<!-- Sticky Order Button -->
	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-0 inset-x-0 p-4 bg-[#121212]/90 border-t border-stone-850 backdrop-blur-md z-45 flex items-center justify-between sm:hidden">
			<div class="text-right">
				<span class="block text-[10px] text-stone-400">السعر الحالي:</span>
				<span class="text-base font-black" style="color: var(--t-primary, #c8a96e);">{formatPrice(activeOffer.price, pricing.currency === 'SAR' ? 'ر.س' : 'د.م')}</span>
			</div>
			<button
				onclick={scrollToForm}
				class="px-6 py-3 text-stone-950 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95"
				style="
					background: linear-gradient(to right, var(--t-cta, #c8a96e), var(--t-cta-hover, #b8985e));
					border-radius: {RADIUS_MAP[t.sections.advanced.borderRadius] || '12px'};
				"
			>
				{t.sections.pricing.stickyCtaText}
			</button>
		</div>
	{/if}

</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		15%, 45%, 75% { transform: translateX(-4px); }
		30%, 60% { transform: translateX(4px); }
	}
	:global(.animate-shake) {
		animation: shake 0.4s ease-in-out;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	:global(.group-hover\:animate-shimmer) {
		animation: shimmer 1.5s infinite;
	}

	input:focus {
		border-color: var(--t-primary, #c8a96e) !important;
		box-shadow: 0 0 0 1px var(--t-primary, #c8a96e) !important;
	}
</style>
