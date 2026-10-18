<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import { PRICING_TIERS } from '$lib/constants/pricing';
	import { buildOrderFulfillmentLabel } from '$lib/data/products';
	import { slide } from 'svelte/transition';
	import { trackAddToCart } from '$lib/tracking/pixel.js';
	import { trackPurchase } from '$lib/utils/checkout';

	let { data } = $props();

	// Inline Direct COD Form & Pre-Thank-You Upsell Modal State
	let fullName = $state('');
	let phone = $state('');
	let nameError = $state('');
	let phoneError = $state('');
	let isSubmitting = $state(false);
	let showUpsellModal = $state(false);
	let upsellCountdown = $state(10);
	let upsellTimerId: ReturnType<typeof setInterval> | null = null;
	let pendingOrderId = $state('');
	let orderDispatched = $state(false);
	let fullNameInputEl = $state<HTMLInputElement | null>(null);
	let directFormEl = $state<HTMLFormElement | null>(null);
	let isFormVisible = $state(false);

	const UPSELL_PRICE = 99;
	const BIOTINE_UPSELL_IMAGE =
		'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752602/mockup-Biotine_gummies-main.png';

	onMount(() => {
		if (
			typeof window !== 'undefined' &&
			(window.location.hash === '#order' ||
				window.location.hash === '#offers' ||
				window.location.hash === '#direct-cod-form')
		) {
			setTimeout(() => {
				const target =
					document.getElementById('direct-cod-form') ||
					document.getElementById('order') ||
					document.getElementById('product-order-box') ||
					document.getElementById('offers');
				if (target) {
					target.scrollIntoView({ behavior: 'smooth', block: 'center' });
					setTimeout(() => fullNameInputEl?.focus(), 350);
				}
			}, 150);
		}

		let observer: IntersectionObserver | null = null;
		const formNode = directFormEl || document.getElementById('direct-cod-form');
		if (typeof IntersectionObserver !== 'undefined' && formNode) {
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						isFormVisible = entry.isIntersecting;
					}
				},
				{ threshold: 0.1 }
			);
			observer.observe(formNode);
		}

		// Fail-Safe: If the Pre-Thank-You Upsell Modal is open and the user closes the tab/browser
		// without clicking either button, automatically dispatch the base order via sendBeacon/keepalive
		const handleFailSafeExit = () => {
			if (!showUpsellModal || orderDispatched) return;
			orderDispatched = true;
			const basePayload = buildUnifiedOrderPayload(false);
			try {
				const jsonStr = JSON.stringify(basePayload);
				if (typeof localStorage !== 'undefined') localStorage.setItem('latestOrder', jsonStr);
				if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('latestOrder', jsonStr);

				let beaconSent = false;
				if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
					const blob = new Blob([jsonStr], { type: 'application/json' });
					beaconSent = navigator.sendBeacon('/api/checkout', blob);
				}
				if (!beaconSent && typeof fetch === 'function') {
					fetch('/api/checkout', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: jsonStr,
						keepalive: true
					}).catch(() => {});
				}
			} catch {}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				handleFailSafeExit();
			}
		};

		const onPageHide = () => {
			handleFailSafeExit();
		};

		window.addEventListener('pagehide', onPageHide);
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			observer?.disconnect();
			window.removeEventListener('pagehide', onPageHide);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});

	const product = $derived(data.product);
	const brand = $derived(data.brand);

	// Scroll State for Sticky Mobile Bottom Bar
	let scrollY = $state(0);

	// FAQ Accordion State
	let openFaq = $state<number | null>(0);
	function toggleFaq(idx: number) {
		openFaq = openFaq === idx ? null : idx;
	}

	// Image Gallery State
	let activeImage = $state('');
	$effect(() => {
		activeImage = data.product.image;
	});

	// Header States
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let query = $state('');

	// Tier Selection (Default to Tier 1 - 2 Bottles Most Popular @ 279 MAD)
	let selectedTier = $state<'tier_1' | 'tier_2' | 'tier_3'>('tier_1');
	const currentTier = $derived(PRICING_TIERS[selectedTier]);

	function selectTier(tierId: 'tier_1' | 'tier_2' | 'tier_3') {
		selectedTier = tierId;
	}

	function scrollToOffers() {
		if (typeof window !== 'undefined') {
			trackAddToCart(product?.name || 'NOVAVITA Gummies Bundle', currentTier?.price || 279);
		}

		const el =
			document.getElementById('direct-cod-form') ||
			document.getElementById('order') ||
			document.getElementById('product-order-box') ||
			document.getElementById('offers');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			setTimeout(() => {
				fullNameInputEl?.focus();
			}, 350);
		}
	}

	function validatePhone(input: string): boolean {
		const cleaned = input.replace(/[\s\-\(\)]/g, '');
		const regex = /^(?:(?:\+?212)|0)[567]\d{8}$/;
		return regex.test(cleaned);
	}

	function buildUnifiedOrderPayload(withUpsell: boolean) {
		const orderId =
			pendingOrderId || 'NV-' + Math.floor(100000 + Math.random() * 900000);
		const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
		const baseTierBottles = currentTier.units;
		const bundleName =
			baseTierBottles === 4
				? '4 علب'
				: baseTierBottles === 3
					? '3 علب'
					: baseTierBottles === 2
						? 'علبتان'
						: 'علبة واحدة';
		const cleanName = (product?.name || 'NOVAVITA Gummies').replace(/\s*\([^)]*\)/g, '').trim();
		const displayTitle = `${cleanName} (${bundleName})`;

		const items: Array<{
			sku: string;
			slug: string;
			title: string;
			quantity: number;
			unitPrice: number;
			price: number;
			isUpsell: boolean;
		}> = [
			{
				sku: product.sku || 'gummies_collagen',
				slug: product.slug || 'gummies_collagen',
				title: displayTitle,
				quantity: baseTierBottles,
				unitPrice: Math.round((currentTier.price / baseTierBottles) * 100) / 100,
				price: currentTier.price,
				isUpsell: false
			}
		];

		if (withUpsell) {
			items.push({
				sku: 'gummies_biotine',
				slug: 'gummies_biotine',
				title: 'علكات البيوتين والزنك 3000mcg (عرض خاص)',
				quantity: 1,
				unitPrice: UPSELL_PRICE,
				price: UPSELL_PRICE,
				isUpsell: true
			});
		}

		const totalBottles = baseTierBottles + (withUpsell ? 1 : 0);
		const finalTotal = currentTier.price + (withUpsell ? UPSELL_PRICE : 0);

		const fullProductLabel = buildOrderFulfillmentLabel({
			tier: selectedTier,
			mainSku: product.sku || product.slug || 'gummies_collagen',
			mainTitle: displayTitle,
			items,
			hasUpsell: withUpsell
		});

		return {
			orderId,
			fullName: fullName.trim(),
			phone: cleanedPhone,
			phoneNumber: cleanedPhone,
			city: 'تأكيد العنوان عبر الهاتف',
			address: 'تأكيد العنوان عبر الهاتف',
			tier: selectedTier,
			baseTier: selectedTier,
			baseBottles: baseTierBottles,
			tierName:
				selectedTier === 'tier_3'
					? '4 علب • كورس مكثف VIP (الباقة العائلية)'
					: selectedTier === 'tier_2'
						? '3 علب • كورس علاجي كامل'
						: 'علبتان • ثبّتي النتيجة',
			totalBottles,
			quantity: totalBottles,
			qte: totalBottles,
			product: fullProductLabel,
			productTitle: fullProductLabel,
			selectedOfferTitle: fullProductLabel,
			sku: product.sku || 'gummies_collagen',
			mainSku: product.sku || 'gummies_collagen',
			upsellProduct: withUpsell ? 'بيوتين وزنك' : undefined,
			upsellName: withUpsell ? 'بيوتين وزنك' : undefined,
			upsellSku: withUpsell ? 'gummies_biotine' : undefined,
			items,
			subtotal: finalTotal,
			shipping: 0,
			total: finalTotal,
			price: finalTotal,
			totalPrice: finalTotal,
			hasUpsell: withUpsell,
			orderType: withUpsell ? 'upsell' : 'direct',
			createdAt: new Date().toISOString()
		};
	}

	function handleDirectOrderSubmit(e: SubmitEvent) {
		e.preventDefault();
		nameError = '';
		phoneError = '';
		let hasError = false;

		if (!fullName.trim() || fullName.trim().length < 2) {
			nameError = 'يرجى إدخال الاسم الكامل';
			hasError = true;
		}

		const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
		if (!cleanedPhone || !validatePhone(phone)) {
			phoneError = 'يرجى إدخال رقم هاتف مغربي صحيح (06 أو 07 أو 05)';
			hasError = true;
		}

		if (hasError) return;

		// Open Pre-Thank-You Interstitial Upsell Modal instantaneously (0ms) with 10s countdown
		pendingOrderId = 'NV-' + Math.floor(100000 + Math.random() * 900000);
		orderDispatched = false;
		upsellCountdown = 10;
		showUpsellModal = true;

		if (upsellTimerId) clearInterval(upsellTimerId);
		upsellTimerId = setInterval(() => {
			if (upsellCountdown > 0) {
				upsellCountdown -= 1;
			} else if (upsellTimerId) {
				clearInterval(upsellTimerId);
				upsellTimerId = null;
			}
		}, 1000);
	}

	function finalizeOrder(withUpsell: boolean) {
		if (isSubmitting) return;
		isSubmitting = true;
		orderDispatched = true;
		if (upsellTimerId) {
			clearInterval(upsellTimerId);
			upsellTimerId = null;
		}

		const orderPayload = buildUnifiedOrderPayload(withUpsell);
		const jsonStr = JSON.stringify(orderPayload);

		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('latestOrder', jsonStr);
		}
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('latestOrder', jsonStr);
		}

		// Fire-and-forget non-blocking POST with keepalive: true so redirect occurs in <25ms
		try {
			fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: jsonStr,
				keepalive: true
			}).catch((postErr) => {
				console.warn('Checkout API network notice:', postErr);
			});
		} catch {}

		trackPurchase(
			orderPayload.total,
			orderPayload.productTitle,
			orderPayload.orderId,
			orderPayload.phone
		);

		goto(
			`/thank-you?orderId=${encodeURIComponent(orderPayload.orderId)}&total=${orderPayload.total}&fullName=${encodeURIComponent(orderPayload.fullName)}&phone=${encodeURIComponent(orderPayload.phone)}&sku=${encodeURIComponent(orderPayload.sku)}&tier=${encodeURIComponent(orderPayload.tier)}&qte=${orderPayload.qte}&hasUpsell=${withUpsell ? 'true' : 'false'}`
		);
	}

	// Product-specific DTC Hero Content
	const PRODUCT_HERO_DATA = {
		gummies_collagen: {
			tag: '✨ روتين النضارة السريري • حلال 100%',
			h1: 'كتستعملي سيرومات غالية وبشرتك باقا باهتة وناشفة؟',
			sub: 'الكريمات كتزوق من برا فقط.. كولاجين NOVAVITA البحري كيعوض النقص من الداخل لنضارة ولمعة زجاجية طبيعية.',
			reviewCount: '480'
		},
		gummies_biotine: {
			tag: '✨ المكمّل الأساسي للكولاجين • حلال 100%',
			h1: 'كتخافي تمشطي شعرك وتلقاي المشطة عامرة بالخصلات؟',
			sub: 'دعم طبيعي لصحة الشعر والبشرة والأظافر – تركيبة متطورة لتكملة مفعول الكولاجين بالبيوتين (3000mcg) والزنك وفيتامين C لوقف التساقط وإنبات الخلفة.',
			reviewCount: '620'
		},
		gumies_vitamine: {
			tag: '✨ لتسريع الامتصاص وطرد التعب • حلال 100%',
			h1: 'كتفيقي في الصباح عيانة وسخفانة وخا نعستي 8 ساعات؟',
			sub: 'تغذية متكاملة وحيوية يومية – الوقود الأساسي لخلايا البشرة والجسم لطرد الخمول ومضاعفة امتصاص الكولاجين والنضارة.',
			reviewCount: '350'
		}
	} as const;

	const heroData = $derived.by(() => {
		const key = (product.slug || product.sku || '') as string;
		if (key.includes('collagen')) {
			return PRODUCT_HERO_DATA.gummies_collagen;
		}
		if (key.includes('biotine')) {
			return PRODUCT_HERO_DATA.gummies_biotine;
		}
		if (key.includes('vitamine') || key.includes('multivit')) {
			return PRODUCT_HERO_DATA.gumies_vitamine;
		}
		return PRODUCT_HERO_DATA.gummies_collagen;
	});

	const faqs = [
		{
			q: 'إمتى كيبداو يبانو النتائج؟',
			a: 'ترطيب البشرة ونعومة الأظافر تبدأ من أول 14 يوماً من الاستعمال اليومي، بينما توقف تساقط الشعر وبداية إنبات بصيلات البيبي هير تلاحظ بين 4 إلى 6 أسابيع من الالتزام المنتظم.'
		},
		{
			q: 'كيفاش كنستعملها وشحال ناكل في النهار؟',
			a: 'علكتان شهيتان يومياً (2 Gummies) في أي وقت تفضلينه أثناء اليوم، تمضغينها مثل الحلوى اللذيذة بنكهة التوت الطبيعية بدون الحاجة لشرب الماء أو ابتلاع كبسولات.'
		},
		{
			q: 'واش فيها جيلاتين خنزيري أو سكر كيغلظ؟',
			a: 'حلال 100% وخالية تماماً من الجيلاتين الخنزيري. تركيبتنا معتمدة على بكتين الفواكه النباتي النقي وبدون سكر مضاف يسبب زيادة الوزن أو يؤثر على رشاقتك.'
		},
		{
			q: 'كيفاش كيدوز الطلب والتوصيل؟',
			a: 'الطلب فوري وسهل بدون أداء مسبق. التوصيل مجاني وسريع لكافة مدن المغرب خلال 24 إلى 48 ساعة، والدفع نقداً عند الاستلام بعد فتح ومعاينة الطرد بنفسك والتأكد من أمانه.'
		}
	];
</script>

<svelte:head>
	<title>{product.name} | NOVAVITA Clinical</title>
	<meta name="description" content={product.headline} />
</svelte:head>

<!-- Global scroll binding for scroll-triggered sticky mobile CTA -->
<svelte:window bind:scrollY={scrollY} />

<div class="min-h-screen bg-[#FAF8F5] font-body text-[#1F2937] pb-32 sm:pb-20" dir="rtl">
	
	<!-- Top Sub-Bar Announcement -->
	<div class="bg-[#143427] text-stone-200 py-2 px-4 text-center text-xs font-bold border-b border-white/10 flex items-center justify-center gap-2">
		<span>🌿</span>
		<span>مكملات غذائية طبيعية وحلال 100% • مصادق عليها بالمغرب</span>
	</div>

	<!-- Sticky Header with Circular Brand Logo -->
	<Header
		brandName="NOVAVITA"
		bind:searchOpen
		bind:menuOpen
		bind:query
	/>

	<!-- ========================================================================= -->
	<!-- 1. Hero Section & Interactive Buying Box -->
	<!-- ========================================================================= -->
	<main class="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 pt-2 pb-0 sm:py-6">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-1.5 sm:gap-6 lg:gap-10 items-start">
			
			<!-- Left Column (Desktop) / Top (Mobile): Hero Image Container -->
			<div class="lg:col-span-6">
				{#if ((product?.slug || '') + ' ' + (product?.sku || '')).includes('collagen')}
					<div class="w-full max-w-md mx-auto mb-1 sm:mb-4">
						<div class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#FAF8F5]">
							<img 
								src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791999610/%D8%A5%D8%B9%D9%84%D8%A7%D9%86_%D9%86%D9%88%D9%81%D8%A7%D9%81%D9%8A%D8%AA__%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D8%A7%D9%84%D8%B9%D9%86%D8%A7%D9%8A%D8%A9_%D8%A8%D8%A7%D9%84%D8%A8%D8%B4%D8%B1%D8%A9.png" 
								alt="نتائج كولاجين نوفافيتا قبل وبعد - نضارة البشرة والجمال من الداخل" 
								class="w-full max-h-[360px] sm:max-h-none h-auto object-contain block mx-auto"
								loading="eager"
								fetchpriority="high"
								decoding="async"
							/>
						</div>
					</div>
				{:else if ((product?.slug || '') + ' ' + (product?.sku || '')).includes('biotine')}
					<div class="w-full max-w-md mx-auto mb-1 sm:mb-4">
						<div class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#FAF8F5]">
							<img 
								src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748565/%D8%A5%D8%B9%D9%84%D8%A7%D9%86_%D8%B9%D9%86%D8%A7%D9%8A%D8%A9_%D8%A8%D8%A7%D9%84%D8%B4%D8%B9%D8%B1_%D9%85%D8%B9_%D8%B9%D9%84%D9%83%D8%A7%D8%AA_%D8%A7%D9%84%D8%A8%D9%8A%D9%88%D8%AA%D9%8A%D9%86.png" 
								alt="نتائج علكات بيوتين نوفافيتا قبل وبعد - إنبات الشعر وتكثيف الفراغات" 
								class="w-full max-h-[360px] sm:max-h-none h-auto object-contain block mx-auto"
								loading="eager"
								fetchpriority="high"
								decoding="async"
							/>
						</div>
					</div>
				{:else if ((product?.slug || '') + ' ' + (product?.sku || '')).includes('vitamine') || ((product?.slug || '') + ' ' + (product?.sku || '')).includes('multivit')}
					<div class="w-full max-w-md mx-auto mb-1 sm:mb-4">
						<div class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#FAF8F5]">
							<img 
								src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748841/%D8%AA%D8%AD%D9%88%D9%91%D9%84_%D9%85%D8%B4%D8%B1%D9%82_%D9%85%D8%B9_%D8%B9%D9%84%D9%83%D8%A7%D8%AA_%D9%86%D9%88%D9%81%D8%A7%D9%81%D9%8A%D8%AA%D8%A7.png" 
								alt="نتائج علكات ملتي فيتامين نوفافيتا قبل وبعد - التخلص من الخمول والنشاط اليومي" 
								class="w-full max-h-[360px] sm:max-h-none h-auto object-contain block mx-auto"
								loading="eager"
								fetchpriority="high"
								decoding="async"
							/>
						</div>
					</div>
				{:else}
					<div class="w-full max-w-md mx-auto mb-1 sm:mb-4">
						<div class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#FAF8F5]">
							<img
								src={activeImage}
								alt={product.name}
								class="w-full max-h-[360px] sm:max-h-none h-auto object-contain block mx-auto transition-transform duration-500 hover:scale-105"
								onerror={(e: any) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = '/images/products/gummies_collagen.svg';
								}}
								loading="eager"
								fetchpriority="high"
								decoding="async"
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column (Desktop) / Below (Mobile): Emotional Headline, Bundle Selector & Buying Flow -->
			<div id="product-order-box" class="lg:col-span-6 scroll-mt-24">
				<div id="order" class="scroll-mt-24"></div>
				
				<!-- 1. الشارة العلوية (Pill Tag) -->
				<div class="mt-1 sm:mt-0 mb-1.5">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#1B4332]/15 text-[#1B4332] text-xs font-bold">
						<span>{heroData.tag}</span>
					</div>
				</div>

				<!-- 2. العنوان العاطفي الصادم (H1) -->
				<h1 class="font-display text-[21px] sm:text-2xl font-extrabold text-[#1B4332] leading-[1.3] mb-1.5">
					{heroData.h1}
				</h1>

				<!-- 3. النص الفرعي التفسيري (جملة واحدة فقط) -->
				<p class="text-sm text-gray-600 leading-relaxed mb-2 font-medium">
					{heroData.sub}
				</p>

				<!-- 4. صف التقييم والنجوم الذهبية النظيفة -->
				<div class="flex items-center gap-2 mb-3">
					<span class="font-bold text-gray-900 text-sm">4.9</span>
					<div class="flex text-[#F59E0B] gap-0.5" aria-label="تقييم 5 نجوم">
						{#each Array(5) as _}
							<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20" aria-hidden="true">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					<span class="text-xs text-gray-600 font-medium">
						({heroData.reviewCount} تقييم سيدة مغربية • مشتريات مؤكدة)
					</span>
				</div>

				<!-- محدد العروض والطلب (Strict RTL & Right Badges) -->
				<div id="offers" class="space-y-3 scroll-mt-24" dir="rtl">
					<div class="flex items-center justify-between mb-2" dir="rtl">
						<span class="text-base font-bold text-gray-900">اختاري باقتك:</span>
						<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
							✨ نتيجة من العلبة الأولى
						</span>
					</div>

					<!-- Tier 1 (Default Selected - Most Popular: 2 Bottles @ 279 MAD) -->
					<button
						type="button"
						onclick={() => selectTier('tier_1')}
						class={`relative w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_1'
								? 'border-[#1B4332] ring-3 ring-[#1B4332]/20 shadow-md -translate-y-0.5'
								: 'border-[#1B4332]/40 hover:border-[#1B4332]'
						}`}
						dir="rtl"
					>
						<!-- Badge in top right above radio circle -->
						<div class="absolute -top-3 right-4 bg-[#C99738] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
							<span>الأكثر طلباً ⭐</span>
						</div>
						<!-- Right: Radio circle + Title & details -->
						<div class="flex items-center gap-3 text-right">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_1' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_1'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-bold text-sm sm:text-base text-[#1B4332]">علبتان • ثبّتي النتيجة</div>
								<div class="text-xs text-emerald-800 font-bold">شهرين متواصلين + توصيل فابور 🚚</div>
							</div>
						</div>
						<!-- Left: Price & savings -->
						<div class="text-left shrink-0">
							<div class="font-black text-xl text-[#1B4332]" dir="ltr">279 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">وفرّي 119 درهم</div>
						</div>
					</button>

					<!-- Tier 2 (3 Bottles @ 349 MAD) -->
					<button
						type="button"
						onclick={() => selectTier('tier_2')}
						class={`relative w-full p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_2'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
						dir="rtl"
					>
						<!-- Badge in top right above radio circle -->
						<div class="absolute -top-3 right-4 bg-[#1B4332] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs z-10">
							<span>توفير 248 درهم</span>
						</div>
						<!-- Right: Radio circle + Title & details -->
						<div class="flex items-center gap-3 text-right">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_2'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">3 علب • كورس علاجي كامل</div>
								<div class="text-xs text-amber-800 font-bold">كورس 3 أشهر متواصلة + توصيل فابور 🚚</div>
							</div>
						</div>
						<!-- Left: Price & savings -->
						<div class="text-left shrink-0">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">349 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">توفير 248 درهم</div>
						</div>
					</button>

					<!-- Tier 3 (NEW - Biggest Savings: 4 Bottles VIP @ 419 MAD) -->
					<button
						type="button"
						onclick={() => selectTier('tier_3')}
						class={`relative w-full p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_3'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
						dir="rtl"
					>
						<!-- Badge in top right above radio circle -->
						<div class="absolute -top-3 right-4 bg-gradient-to-r from-[#E86A7C] to-[#d946ef] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs z-10">
							<span>أكبر توفير 377 درهم 🔥</span>
						</div>
						<!-- Right: Radio circle + Title & details -->
						<div class="flex items-center gap-3 text-right">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_3'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">4 علب • كورس مكثف VIP (الباقة العائلية)</div>
								<div class="text-xs text-emerald-800 font-bold">كورس 4 أشهر متواصلة لعناية متكاملة + توصيل فابور 🚚</div>
							</div>
						</div>
						<!-- Left: Price & savings -->
						<div class="text-left shrink-0">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">419 MAD</div>
							<div class="text-[11px] text-stone-400 line-through font-bold" dir="ltr">599 MAD</div>
						</div>
					</button>
				</div>


				<!-- نموذج الطلب المباشر عالي التحويل (Direct Inline COD Form) -->
				<form
					bind:this={directFormEl}
					id="direct-cod-form"
					onsubmit={handleDirectOrderSubmit}
					class="bg-white border-2 border-[#065f46]/20 shadow-lg rounded-2xl p-4 sm:p-5 mt-4 scroll-mt-24 space-y-4"
					dir="rtl"
					novalidate
				>
					<h3 class="text-[#064e3b] font-bold text-base sm:text-lg mb-3 text-center">
						⚡ املئي معلوماتك لتأكيد الطلب (الدفع عند الاستلام)
					</h3>

					<!-- Field 1: Full Name -->
					<div class="space-y-1">
						<label for="cod-fullname-input" class="text-sm font-bold text-gray-800 mb-1.5 block text-right">
							الاسم الكامل :
						</label>
						<div class="relative flex items-center">
							<span class="pointer-events-none absolute right-3.5 text-[#065f46]/70" aria-hidden="true">
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
								</svg>
							</span>
							<input
								bind:this={fullNameInputEl}
								bind:value={fullName}
								id="cod-fullname-input"
								name="fullName"
								type="text"
								dir="rtl"
								autocomplete="name"
								required
								placeholder="أدخلي اسمك الكامل هنا..."
								oninput={() => (nameError = '')}
								class="w-full h-13 py-3.5 pr-11 pl-4 rounded-xl bg-white border-2 {nameError ? 'border-red-500 ring-4 ring-red-500/15' : 'border-emerald-700/25'} shadow-sm focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all text-right"
							/>
						</div>
						{#if nameError}
							<p class="text-xs font-bold text-red-600 pr-1">{nameError}</p>
						{/if}
					</div>

					<!-- Field 2: Phone Number -->
					<div class="space-y-1">
						<label for="cod-phone-input" class="text-sm font-bold text-gray-800 mb-1.5 block text-right">
							رقم الهاتف لتأكيد الطلب :
						</label>
						<div class="relative flex items-center">
							<span class="pointer-events-none absolute right-3.5 text-[#065f46]/70" aria-hidden="true">
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
								</svg>
							</span>
							<input
								bind:value={phone}
								id="cod-phone-input"
								name="phone"
								type="tel"
								inputmode="numeric"
								dir="rtl"
								autocomplete="tel"
								required
								placeholder="06XXXXXXXX أو 07XXXXXXXX"
								oninput={() => (phoneError = '')}
								class="w-full h-13 py-3.5 pr-11 pl-4 rounded-xl bg-white border-2 {phoneError ? 'border-red-500 ring-4 ring-red-500/15' : 'border-emerald-700/25'} shadow-sm focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all text-right"
							/>
						</div>
						{#if phoneError}
							<p class="text-xs font-bold text-red-600 pr-1">{phoneError}</p>
						{/if}
					</div>

					<!-- High-CVR Submit CTA Button -->
					<button
						type="submit"
						disabled={isSubmitting}
						class="cta-shake w-full min-h-14 py-4 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#047857] to-[#065f46] hover:from-[#047857] hover:to-[#064e3b] ring-2 ring-[#f59e0b]/40 shadow-xl shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-center text-center font-extrabold text-lg sm:text-xl text-white cursor-pointer disabled:opacity-70"
					>
						{#if isSubmitting}
							<span>جاري تأكيد طلبك...</span>
						{:else}
							<span>✅ أكدي طلبك الآن</span>
						{/if}
					</button>

					<!-- Reassurance Badge directly underneath the CTA button -->
					<div class="text-center pt-0.5">
						<p class="text-xs sm:text-sm font-bold text-[#1B4332] bg-emerald-50/80 py-2.5 px-4 rounded-xl border border-emerald-900/10 inline-block w-full">
							📦 فتحي الكولية وقلبيها عاد تخلصي • التوصيل فابور 24/48h
						</p>
					</div>
				</form>

			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 1. مساحة الصورة الأولى (صورة الواقع / المشكلة) -->
		<!-- ========================================================================= -->
		<div class="relative w-full max-w-md mx-auto aspect-[4/5] bg-[#FAF8F5] rounded-[24px] overflow-hidden shadow-sm border border-black/5 my-6">
			{#if (product.slug || '').includes('biotine')}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748575/%D9%82%D9%84%D9%82_%D8%A3%D9%85%D8%A7%D9%85_%D8%A7%D9%84%D9%85%D8%B1%D8%A2%D8%A9_%D9%88%D8%AA%D8%B3%D8%A7%D9%82%D8%B7_%D8%A7%D9%84%D8%B4%D8%B9%D8%B1_2.png" 
					alt="معاناة تساقط الشعر وظهور الفراغات بسبب الماء الكلسي وضعف البصيلات" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{:else if (product.slug || '').includes('vitamine') || (product.slug || '').includes('multivit')}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748847/%D8%B5%D8%A8%D8%A7%D8%AD_%D9%85%D8%AA%D8%B9%D8%A8_%D8%AD%D9%88%D9%84_%D8%A7%D9%84%D9%82%D9%87%D9%88%D8%A9.png" 
					alt="معاناة الإرهاق الصباحي والسخفة والاعتماد على المنبهات والقهوة" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791747892/%D9%82%D9%84%D9%82_%D8%A3%D9%85%D8%A7%D9%85_%D8%A7%D9%84%D9%85%D8%B1%D8%A2%D8%A9_%D9%88%D8%AA%D8%B3%D8%A7%D9%82%D8%B7_%D8%A7%D9%84%D8%B4%D8%B9%D8%B1_1.png" 
					alt="معاناة تساقط الشعر وشحوب البشرة بسبب الماء الكلسي والتعب" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		</div>

		<!-- ========================================================================= -->
		<!-- 2. قسم تشخيص المشاكل (The Pain Points) -->
		<!-- ========================================================================= -->
		<div class="mt-8 sm:mt-12 space-y-6" dir="rtl">
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<h2 class="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#1B4332]">
					علاش المنتجات العادية ما كتوقفش المشكل؟
				</h2>
				<p class="text-xs sm:text-sm md:text-base text-gray-700 font-medium leading-relaxed">
					90% من الحلول كتزوق المظهر فقط من برا، وكتتجاهل السبب الحقيقي اللي لداخل:
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
				<!-- Card 1 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-rose-200 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-rose-50 text-rose-500 font-bold flex items-center justify-center shrink-0 text-sm">❌</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1F2937]">ملوحة ماء الروبيني (الكالكير)</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							في أغلب مدن المغرب، الماء القاصح كينشف الزغبة وكيقتل حيوية البشرة، وأي شامبوان أو صابون كيبقى تأثيره سطحي.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-rose-600 bg-rose-50/60 py-1 px-2.5 rounded-lg inline-block w-fit">
						تأثير سطحي مؤقت
					</div>
				</div>

				<!-- Card 2 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-rose-200 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-rose-50 text-rose-500 font-bold flex items-center justify-center shrink-0 text-sm">❌</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1F2937]">نقص التغذية الخلوية وضعف الامتصاص</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							ضغوطات اليوم وتغير الهرمونات كيمنعو وصول الفيتامينات لجذور الشعر وطبقات الجلد العميقة.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-rose-600 bg-rose-50/60 py-1 px-2.5 rounded-lg inline-block w-fit">
						جذور ضعيفة ومحرومة
					</div>
				</div>

				<!-- Card 3 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-rose-200 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-rose-50 text-rose-500 font-bold flex items-center justify-center shrink-0 text-sm">❌</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1F2937]">عذاب الأقراص الصيدلانية المرة</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							كبسولات كبار وريحتهم مجهدة كيديرو الغثيان وثقل المعدة، ومعظم السيدات كيقطعو العلاج قبل ما يبدا يعطي مفعول.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-rose-600 bg-rose-50/60 py-1 px-2.5 rounded-lg inline-block w-fit">
						صعوبة الالتزام والاستمرار
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 3. مساحة الصورة الثانية (صورة المنتج بالمميزات) -->
		<!-- ========================================================================= -->
		<div class="relative w-full max-w-md mx-auto aspect-[4/5] bg-[#FAF8F5] rounded-[24px] overflow-hidden shadow-sm border border-black/5 my-6">
			{#if (product.slug || '').includes('biotine')}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748630/%D8%A7%D8%A8%D8%AA%D8%B3%D8%A7%D9%85%D8%A9_%D9%85%D8%B4%D8%B1%D9%82%D8%A9_%D9%85%D8%B9_%D8%B9%D9%86%D8%A7%D9%8A%D8%A9_%D8%A8%D8%A7%D9%84%D8%B4%D8%B9%D8%B1_%D9%81%D9%8A_%D8%A7%D9%84%D8%AD%D9%85%D9%91%D8%A7%D9%85.png" 
					alt="الحل الجذري: شعر كثيف وصحي وتوقف التساقط مع علكات بيوتين نوفافيتا" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{:else if (product.slug || '').includes('vitamine') || (product.slug || '').includes('multivit')}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791748884/%D8%A7%D8%A8%D8%AA%D8%B3%D8%A7%D9%85%D8%A9_%D8%A7%D9%84%D8%B5%D8%A8%D8%A7%D8%AD_%D9%85%D8%B9_%D8%B9%D9%84%D9%83%D8%A7%D8%AA_%D8%A7%D9%84%D9%81%D9%8A%D8%AA%D8%A7%D9%85%D9%8A%D9%86%D8%A7%D8%AA.png" 
					alt="الحل الجذري: طاقة طبيعية ونشاط مستمر مع علكات ملتي فيتامين نوفافيتا" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<img 
					src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791747975/%D8%A7%D8%A8%D8%AA%D8%B3%D8%A7%D9%85%D8%A9_%D9%88%D8%A5%D8%B4%D8%B1%D8%A7%D9%82%D8%A9_%D9%85%D8%B9_%D8%B9%D9%84%D9%83%D8%A7%D8%AA_%D8%A7%D9%84%D9%83%D9%88%D9%84%D8%A7%D8%AC%D9%8A%D9%86.png" 
					alt="الحل الجذري: شعر صحي وبشرة مشرقة بفضل علكات كولاجين نوفافيتا" 
					class="w-full h-full object-cover object-center block"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		</div>

		<!-- ========================================================================= -->
		<!-- 4. قسم الحل الجذري من الداخل (The Root Solution) -->
		<!-- ========================================================================= -->
		<div class="mt-4 sm:mt-8 space-y-6" dir="rtl">
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<h2 class="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#1B4332]">
					الحل الجذري: تغذية مركزة من الجذور للخلايا
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
				<!-- Solution Card 1 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-100/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-[#1B4332]/30 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">✅</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1B4332]">علاج أصل المشكل ماشي الأعراض</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							جرعات سريرية مضبوطة (بيوتين 3000mcg / كولاجين بحري متحلل) كتدخل لمجرى الدم مباشرة وكتغذي البصيلة من الداخل.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block w-fit">
						تغذية خلوية مستمرة
					</div>
				</div>

				<!-- Solution Card 2 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-100/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-[#1B4332]/30 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">✅</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1B4332]">امتصاص أسرع بـ 3 مرات ببكتين الفواكه</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							تركيبة نباتية خفيفة على المعدة كتمتص في دقائق معدودة، بدون مواد كيميائية وبدون أي ثقل هضمي.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block w-fit">
						هضم خفيف وسلس
					</div>
				</div>

				<!-- Solution Card 3 -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-100/80 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-[#1B4332]/30 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">✅</span>
							<h3 class="font-display text-base sm:text-lg font-black text-[#1B4332]">روتين شهي كتعشقي تداومي عليه</h3>
						</div>
						<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
							نكهة فواكه وتوت طبيعية لذيذة وسهلة المضغ، كتحول العناية اليومية من واجب ممل إلى أحسن لحظة في صباحك.
						</p>
					</div>
					<div class="pt-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block w-fit">
						التزام يومي ممتع
					</div>
				</div>
			</div>
		</div>


		<!-- ========================================================================= -->
		<!-- 3. كروت المكونات الفعالة البصرية (Visual Clinical Ingredients Grid) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18 space-y-4">
			<div class="text-center space-y-1">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/10 text-xs font-bold text-[#1B4332]">
					🔬 الدقة السريرية
				</span>
				<h2 class="font-display text-xl sm:text-2xl font-black text-[#1B4332]">
					السرّ في التركيز.. ماشي في كثرة الأسماء
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Ingredient 1: Marine Collagen + HA -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
					<div class="space-y-3">
						<div class="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
							💧
						</div>
						<div>
							<span class="text-[11px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">تركيبة مزدوجة</span>
							<h3 class="font-display text-base sm:text-lg font-bold text-[#1B4332] mt-1.5">
								الكولاجين البحري + حمض الهيالورونيك
							</h3>
						</div>
						<p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
							ببتيدات بحرية دقيقة كتمتص في دقائق لتعويض نقص الكولاجين بعد سن 25 وملء خلايا الجلد.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs font-bold text-blue-800 bg-blue-50/50 p-2.5 rounded-xl">
						✨ رطوبة مائية عميقة ونضارة زجاجية من أول أسبوعين.
					</div>
				</div>

				<!-- Ingredient 2: Biotin 3000mcg + Zinc -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
					<div class="space-y-3">
						<div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
							🌿
						</div>
						<div>
							<span class="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">3000 ميكروغرام</span>
							<h3 class="font-display text-base sm:text-lg font-bold text-[#1B4332] mt-1.5">
								البيوتين المركز 3000mcg + الزنك
							</h3>
						</div>
						<p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
							الجرعة السريرية المضبوطة التي توقف تساقط الشعر الناتج عن التوتر والماء القاصح، وتحفز إنبات البيبي هير.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs font-bold text-emerald-800 bg-emerald-50/50 p-2.5 rounded-xl">
						✨ وقف تساقط الشعر وتصلب الأظافر.
					</div>
				</div>

				<!-- Ingredient 3: Vitamin C & Antioxidants -->
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
					<div class="space-y-3">
						<div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
							🍊
						</div>
						<div>
							<span class="text-[11px] font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">مضادات أكسدة نشطة</span>
							<h3 class="font-display text-base sm:text-lg font-bold text-[#1B4332] mt-1.5">
								فيتامين C ومضادات الأكسدة
							</h3>
						</div>
						<p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
							يحمي الخلايا من الإجهاد التأكسدي ويضاعف قدرة الجسم على تصنيع الكولاجين الطبيعي مرتين.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs font-bold text-amber-900 bg-amber-50/50 p-2.5 rounded-xl">
						✨ حماية خلوية وتفتيح طبيعي.
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 4. شبكة النقاء والشارات الرسمية (Regulatory Trust & Purity Grid) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18">
			<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm space-y-4">
				<div class="text-center space-y-1">
					<span class="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full">
						🛡️ سلامة ونقاء
					</span>
					<h2 class="font-display text-lg sm:text-xl font-black text-[#1B4332]">
						نقاء سريري 100%
					</h2>
				</div>

				<!-- 8 Regulatory & Purity Badges -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm font-bold text-stone-700">
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>بكتين فواكه نباتي حلال</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>بدون جيلاتين خنزيري</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>جودة تصنيع GMP معتمدة</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>فحص مخبري للنقاء</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>خالي من الغلوتين</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>بدون سكر مضاف ضار</span>
					</div>
					<div class="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-700">✓</span>
						<span>بدون مواد حافظة</span>
					</div>
					<div class="p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-center flex items-center justify-center gap-1.5">
						<span class="text-emerald-800">✓</span>
						<span>مطابق لمعايير السلامة</span>
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 5. قسم الاقتباس السريري والعلمي (Clinical Formulation Quote) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16">
			<div class="rounded-3xl bg-[#143427] text-white p-5 sm:p-7 shadow-xl border border-emerald-800/40">
				<blockquote class="text-xs sm:text-sm lg:text-base font-medium leading-relaxed text-stone-100 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10">
					«تركيبة NOVAVITA المعتمدة على البكتين سريع الامتصاص والجرعات السريرية الدقيقة هي الحل العلمي الأنسب للمرأة في المغرب لعلاج مسببات تساقط الشعر وشحوب البشرة الناتجة عن ملوحة المياه والتوتر اليومي، بدون أي أثر سلبي على المعدة.»
				</blockquote>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 6. قسم آراء وتجارب العميلات الموثقة بالمغرب (UGC & Social Proof Section) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18 space-y-4">
			<div class="text-center space-y-1">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/10 text-xs font-bold text-[#1B4332]">
					🌟 إثبات مجتمعي حقيقي
				</span>
				<h2 class="font-display text-xl sm:text-2xl font-black text-[#1B4332]">
					تجارب حقيقية لعميلاتنا في المغرب 🇲🇦
				</h2>
				<p class="text-xs sm:text-sm text-stone-600 font-bold">
					⭐ 4.9/5 بناءً على أكثر من 1,450 طلب مؤكد
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				
				<!-- Review 1: Salma -->
				<div class="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<div class="flex text-[#F59E0B] gap-0.5">
								{#each Array(5) as _}
									<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<span class="text-[11px] text-stone-400">منذ 4 أيام</span>
						</div>

						<p class="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
							«بعد الولادة شعري ولا كيطيح بالخصلات وخلعني، جربت شحال من سيروم والو. مع NOVAVITA دابا كملت شهرين: التساقط حبس تماماً وخلف ليا البيبي هير، والمذاق ديال التوت كيحمق بحال شي حلوى كنسناها كل صباح!»
						</p>
					</div>

					<div class="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
						<div>
							<div class="font-bold text-[#1B4332]">سلمى العلمي</div>
							<div class="text-[11px] text-stone-500">الدار البيضاء</div>
						</div>
						<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
							شراء مؤكد ✓
						</span>
					</div>
				</div>

				<!-- Review 2: Meryem -->
				<div class="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<div class="flex text-[#F59E0B] gap-0.5">
								{#each Array(5) as _}
									<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<span class="text-[11px] text-stone-400">منذ أسبوع</span>
						</div>

						<p class="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
							«أحسن استثمار درتو في راسي هاذ العام. أظافري كانو كيتكسرو غير بوحدهم ودابا ولاو قاصحين، وبشرتي رجعات فيها واحد النضارة واللمعة زوينة بزاف. شكراً على التوصيل السريع لدارنا والمعاملة الراقية.»
						</p>
					</div>

					<div class="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
						<div>
							<div class="font-bold text-[#1B4332]">مريم بنجلون</div>
							<div class="text-[11px] text-stone-500">الرباط</div>
						</div>
						<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
							شراء مؤكد ✓
						</span>
					</div>
				</div>

				<!-- Review 3: Kenza -->
				<div class="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<div class="flex text-[#F59E0B] gap-0.5">
								{#each Array(5) as _}
									<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<span class="text-[11px] text-stone-400">منذ أسبوعين</span>
						</div>

						<p class="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
							«أول مرة كنقدر نستمر على مكمل بلا ما نحبس، حيت الكبسولات العادية كانو كيديرو ليا الحموضة وثقل المعدة. هادو خفاف ولذاذ، وفتحت الكولية فحصتها عاد خلصت الموزع. راحة بال تامة!»
						</p>
					</div>

					<div class="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
						<div>
							<div class="font-bold text-[#1B4332]">كنزة المرابط</div>
							<div class="text-[11px] text-stone-500">مراكش</div>
						</div>
						<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
							شراء مؤكد ✓
						</span>
					</div>
				</div>

			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 7. أكورديون الأسئلة الشائعة (FAQ Accordion) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18 space-y-4">
			<div class="text-center space-y-1">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/10 text-xs font-bold text-[#1B4332]">
					💬 إجابات واضحة
				</span>
				<h2 class="font-display text-xl sm:text-2xl font-black text-[#1B4332]">
					الأسئلة الشائعة
				</h2>
			</div>

			<div class="space-y-2.5 max-w-3xl mx-auto">
				{#each faqs as item, idx}
					<div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs transition-all">
						<button
							type="button"
							onclick={() => toggleFaq(idx)}
							class="w-full p-4 text-start font-bold text-sm sm:text-base text-[#1B4332] flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/50"
						>
							<span>{item.q}</span>
							<span class="text-xs transition-transform duration-300 {openFaq === idx ? 'rotate-180' : ''}">
								▼
							</span>
						</button>
						{#if openFaq === idx}
							<div transition:slide={{ duration: 200 }} class="px-4 pb-4 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100">
								{item.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 8. كارت الحسم والطلب النهائي أسفل الصفحة (Final Bottom Purchase Card) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18">
			<div class="rounded-3xl bg-gradient-to-br from-[#143427] via-[#1B4332] to-[#143427] text-white p-6 sm:p-8 shadow-2xl border border-emerald-800/40 text-center space-y-4">
				
				<div class="space-y-1">
					<span class="text-xs font-black text-[#C99738] bg-[#C99738]/20 px-3 py-1 rounded-full border border-[#C99738]/30 inline-block">
						🚀 ابدئي خطوتك اليوم
					</span>
					<h3 class="font-display text-xl sm:text-2xl font-black text-white">
						جاهزة تبداي روتين التحول الحقيقي؟
					</h3>
					<p class="text-xs sm:text-sm text-stone-300">
						الباقة المحددة: <span class="font-bold text-white">{currentTier.title}</span> • <span class="font-bold text-[#E86A7C]">DH {currentTier.price}</span>
					</p>
				</div>

				<!-- Big Action Button -->
				<div class="max-w-md mx-auto">
					<button
						type="button"
						onclick={scrollToOffers}
						class="w-full min-h-14 rounded-2xl bg-[#E86A7C] hover:bg-[#d45366] active:scale-[0.98] font-black text-white text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
					>
						<span>اطلبي الآن • الدفع عند الاستلام</span>
						<span class="text-lg">←</span>
					</button>
				</div>

				<!-- Triplet Reassurance Badges -->
				<div class="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold text-stone-300">
					<span class="flex items-center gap-1">🚚 توصيل فابور مجاني</span>
					<span class="text-stone-500">•</span>
					<span class="flex items-center gap-1">📦 معاينة الطرد قبل الدفع</span>
					<span class="text-stone-500">•</span>
					<span class="flex items-center gap-1">🛡️ ضمان الرضا 100%</span>
				</div>

			</div>
		</div>

	</main>

	<!-- ========================================================================= -->
	<!-- 9. Sticky Mobile CTA Bar (Dark Green Brand Color, Scroll-Triggered)       -->
	<!-- ========================================================================= -->
	<div
		class="fixed bottom-3.5 inset-x-3.5 z-40 max-w-sm mx-auto sm:hidden pb-[env(safe-area-inset-bottom,0px)] transition-all duration-300 ease-in-out {scrollY > 350 && !isFormVisible && !showUpsellModal ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-full'}"
		dir="rtl"
	>
		<button
			type="button"
			onclick={scrollToOffers}
			class="{scrollY > 350 && !isFormVisible && !showUpsellModal ? 'pointer-events-auto' : 'pointer-events-none'} relative overflow-hidden w-full min-h-[54px] rounded-full bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#143427] text-white px-5 py-2.5 shadow-[0_12px_32px_rgba(20,52,39,0.5),0_2px_8px_rgba(20,52,39,0.2)] border border-emerald-400/35 active:scale-[0.98] transition-all flex items-center justify-between gap-3 cursor-pointer group"
			aria-label="اطلبي الآن والدفع عند الاستلام"
		>
			<!-- Shimmer Light-Beam Streak -->
			<div
				class="shimmer-pill-beam absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
				aria-hidden="true"
			></div>

			<!-- Right Side: Live Pulse Dot + Headline & Trust Micro-Copy -->
			<div class="relative z-10 flex items-center gap-2.5 text-start leading-tight">
				<span class="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
				</span>

				<div class="flex flex-col">
					<div class="flex items-center gap-1.5">
						<span class="font-display font-black text-sm text-white tracking-tight">
							اطلبي الآن • الدفع عند الاستلام
						</span>
						<span class="text-xs">🛍️</span>
					</div>
					<span class="text-[10px] text-emerald-200/90 font-semibold mt-0.5 flex items-center gap-1">
						<span>🚚 توصيل فابور</span>
						<span class="text-emerald-400/50">•</span>
						<span>📦 معاينة عند الباب</span>
					</span>
				</div>
			</div>

			<!-- Left Side: Circular Arrow Badge -->
			<div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white border border-white/25 text-xs font-black transition-transform group-hover:-translate-x-0.5 shadow-inner">
				←
			</div>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- 10. Pre-Thank-You Interstitial Upsell Modal (One-Screen Zero-Scroll 99 DH) -->
	<!-- ========================================================================= -->
	{#if showUpsellModal}
		<div
			class="fixed inset-0 z-50 bg-white sm:bg-black/75 sm:backdrop-blur-xs flex items-center justify-center h-[100dvh] max-h-[100dvh] overflow-hidden p-0 sm:p-4"
			dir="rtl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="upsell-modal-title"
		>
			<div
				class="w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-md bg-white sm:rounded-3xl sm:border-2 sm:border-[#059669] sm:shadow-2xl flex flex-col justify-between p-4 overflow-hidden"
			>
				<!-- 1. Top 10-Second Countdown Timer Bar -->
				<div
					class="shrink-0 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl py-2 px-3 text-center font-bold text-sm flex items-center justify-center gap-2"
				>
					<span>⏳ عرض خاص يختفي خلال:</span>
					<span
						class="bg-[#d97706] text-white font-mono font-black px-2 py-0.5 rounded-lg text-xs sm:text-sm tracking-wider shadow-2xs"
						dir="ltr"
					>
						00:{upsellCountdown < 10 ? `0${upsellCountdown}` : upsellCountdown}
					</span>
					<span class="text-xs font-extrabold text-amber-800">({upsellCountdown} ثواني)</span>
				</div>

				<!-- 2. Simple Title Above Image -->
				<h2
					id="upsell-modal-title"
					class="shrink-0 text-xl font-extrabold text-[#064e3b] text-center leading-tight my-1"
				>
					⚡ سرّعي مفعول الكولاجين 2X مع البيوتين والزنك!
				</h2>

				<!-- 3. Large Centered Hero Product Image with Floating Overlay Badges -->
				<div class="relative flex-1 flex items-center justify-center my-1 min-h-0 w-full max-w-[290px] mx-auto">
					<img
						src={BIOTINE_UPSELL_IMAGE}
						alt="علكات البيوتين والزنك المركز - NOVAVITA"
						class="w-full max-w-[260px] h-[230px] sm:h-[260px] max-h-full object-contain mx-auto drop-shadow-md p-1"
						loading="eager"
						onerror={(e: any) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = '/images/products/gummies_biotine.svg';
						}}
					/>

					<!-- Corner Floating Price Badge -->
					<div
						class="absolute top-1 right-0 z-10 bg-[#059669] text-white font-black px-3 py-1.5 rounded-2xl shadow-lg text-base sm:text-lg border-2 border-white flex flex-col items-center leading-tight"
					>
						<span class="whitespace-nowrap">99 درهم فقط</span>
						<span class="text-[11px] text-emerald-100 line-through font-bold" dir="ltr">199 DH</span>
					</div>

					<!-- Bottom Floating Concentration Badge -->
					<div
						class="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 bg-amber-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-md border border-amber-200 whitespace-nowrap"
					>
						تركيز الزنك + بيوتين 3000mcg • توصيل فابور
					</div>
				</div>

				<!-- 4. Short Subtitle Below Image -->
				<p class="shrink-0 text-sm font-medium text-gray-700 text-center px-2 my-1 leading-snug">
					يثبّت الكولاجين في البشرة، يوقف تساقط الشعر ويقوي الأظافر من الجذور.
				</p>

				<!-- 5. Compact Single-Line Action Buttons -->
				<div class="shrink-0 w-full pt-1">
					<button
						type="button"
						disabled={isSubmitting}
						onclick={() => finalizeOrder(true)}
						class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#065f46] hover:from-[#047857] hover:to-[#064e3b] text-white font-extrabold text-lg shadow-lg cta-shake whitespace-nowrap flex items-center justify-center text-center cursor-pointer disabled:opacity-70"
					>
						✅ أضيفي للطلب • 99 درهم فقط
					</button>

					<button
						type="button"
						disabled={isSubmitting}
						onclick={() => finalizeOrder(false)}
						class="w-full py-2.5 mt-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm text-center cursor-pointer transition-colors disabled:opacity-50"
					>
						لا شكراً
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>

<style>
	@keyframes shimmerSweep {
		0% {
			transform: translateX(-150%) skewX(-20deg);
		}
		35%, 100% {
			transform: translateX(250%) skewX(-20deg);
		}
	}
	.shimmer-pill-beam {
		animation: shimmerSweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes ctaShake {
		0%, 80%, 100% { transform: translateX(0); }
		84% { transform: translateX(-6px); }
		88% { transform: translateX(6px); }
		92% { transform: translateX(-4px); }
		96% { transform: translateX(4px); }
	}
	.cta-shake {
		animation: ctaShake 3s infinite ease-in-out;
	}
	.cta-shake:hover,
	.cta-shake:active,
	.cta-shake:focus,
	.cta-shake:disabled {
		animation: none;
	}
</style>
