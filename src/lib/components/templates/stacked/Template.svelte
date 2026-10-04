<script lang="ts">
	import { onMount } from 'svelte';
	import { formatPrice } from '$lib/utils/format';
	import { ShoppingCart } from '@lucide/svelte';
	import CartDrawer from '$lib/components/shared/CartDrawer.svelte';
	import CheckoutModal from '$lib/components/shared/CheckoutModal.svelte';
	import UpsellModal from '$lib/components/shared/UpsellModal.svelte';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';
	import { trackAddToCart } from '$lib/utils/checkout';

	let { product, settings, theme, others = [] }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('stacked'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	const defaultOffers: ProductOffer[] = [
		{
			id: 1,
			title: '1 قطعة + رشاشة هدية 🎁',
			subtitle: 'توصيل مجاني لجميع المدن',
			price: 229,
			originalPrice: 299,
			quantity: 1,
			badge: null,
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1790955108/ChatGPT_Image_Sep_3_2026_09_25_08_PM.png',
			isPopular: false
		},
		{
			id: 2,
			title: '2 منظمات + 2 رشاشات هدية 🎁',
			subtitle: 'توصيل مجاني لجميع المدن',
			price: 349,
			originalPrice: 458,
			quantity: 2,
			badge: '⭐ الأكثر طلباً',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1791113117/ChatGPT_Image_Sep_3_2026_09_28_10_PM.png',
			isPopular: true
		}
	];

	const defaultFaq = [
		{
			question: 'واش كيركب على أي علو ديال السقف؟',
			answer: 'نعم! العمود مصمم بتقنية تلسكوبية قابلة للتعديل بسهولة من 1.10 متر حتى لـ 3.10 أمتار، يعني كيركب في أي حمام كيفما كان علو السقف ديالو.'
		},
		{
			question: 'واش كيقدر يطيح إلى تقلت عليه بالسلعة؟',
			answer: 'أبداً. الحامل مزود بـ Ressort داخلي قوي وجلدات مانعة للانزلاق في الأعلى والأسفل، كيتحمل وزن كيوصل حتى لـ 15-20 كيلوغرام بكل أمان وثبات.'
		},
		{
			question: 'واش كيتصدى مع الما والرطوبة ديال الحمام؟',
			answer: 'المنظم مصنوع من الفولاذ المقاوم للصدأ (Inox) عالي الجودة مع رفوف بلاستيكية متينة من نوع ABS، مصمم خصيصاً ليقاوم الماء والرطوبة وسنوات من الاستعمال بدون صدأ.'
		},
		{
			question: 'واش نقدر نقلب السلعة عاد نخلص؟',
			answer: 'أكيد! حق المعاينة مضمون 100%. ملي يوصلك الموزع، فتح الكولية ديالك وتأكد من السلعة والجودة ديالها عاد خلص ثمن طلبك.'
		},
		{
			question: 'شحال كياخد التوصيل باش يوصلني الطلب؟',
			answer: 'التوصيل سريع وفابور (مجاني) لجميع المدن. كيتم تأكيد الطلب معك عبر الهاتف، وكتوصلك السلعة خلال 24 إلى 48 ساعة حتى لباب دارك.'
		}
	];

	const activeFaq = $derived(
		content.faq && content.faq.length >= 5 ? content.faq : defaultFaq
	);

	const offersList = $derived.by(() => {
		const rawOffers = (pricing?.offers && pricing.offers.length > 0) ? pricing.offers : defaultOffers;
		if (rawOffers.length < 2) {
			return defaultOffers;
		}
		return rawOffers;
	});

	let selectedPack = $state<number | null>(2);

	const currentPackId = $derived(
		selectedPack ?? offersList.find((o: ProductOffer) => o.isPopular)?.id ?? offersList[1]?.id ?? offersList[0]?.id ?? 2
	);

	const activeOffer = $derived(
		offersList.find((o: ProductOffer) => o.id === currentPackId) || offersList[1] || offersList[0] || { title: '', price: 0, quantity: 1 }
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

	const DRAIN_VALVE_IMAGE =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1791060860/%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D9%84%D8%B3%D8%AF%D8%A7%D8%AF%D8%A9_%D9%85%D8%B5%D8%B1%D9%81_%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A%D8%A9.png';

	// Canonical definition of Floor Drain Valve (UPSELL #1)
	const drainValveProduct = {
		slug: 'samam-tasrif',
		title: 'تهنى نهائياً من ريحة المجاري والصراصير 🪳',
		subtitle: 'صمام تصريف ذكي مضاد للروائح والحشرات',
		heroImage: DRAIN_VALVE_IMAGE,
		startingPrice: 35
	};

	// Canonical definition of Child Safety Lock product (UPSELL #2)
	const childLockProduct = {
		slug: 'qofl-al-aman',
		title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
		subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
		heroImage: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp',
		startingPrice: 49
	};

	// Active upsell list contains EXACTLY TWO products:
	// UPSELL #1: تهنى نهائياً من ريحة المجاري والصراصير 🪳 — 35 DH
	// UPSELL #2: قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒 — 49 DH
	const cartUpsells = $derived.by(() => {
		const foundDrain = others.find(
			(p) =>
				p.slug === 'samam-tasrif' ||
				p.slug === 'filter-baloua' ||
				p.title.includes('المجاري') ||
				p.title.includes('صمام') ||
				p.title.includes('البالوعة')
		);
		const foundLock = others.find(
			(p) => p.slug === 'qofl-al-aman' || p.title.includes('قفل')
		);

		return [
			{
				...drainValveProduct,
				...(foundDrain || {}),
				slug: 'samam-tasrif',
				title: 'تهنى نهائياً من ريحة المجاري والصراصير 🪳',
				subtitle: 'صمام تصريف ذكي مضاد للروائح والحشرات',
				startingPrice: 35,
				heroImage: DRAIN_VALVE_IMAGE
			},
			{
				...childLockProduct,
				...(foundLock || {}),
				title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
				subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
				startingPrice: 49,
				heroImage: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp'
			}
		];
	});

	function addSelectedToCart() {
		cart.clear();
		cart.add({
			slug: (product as any).slug || '',
			title: content.title || 'منتج',
			image: slides[0]?.src || '',
			price: activeOffer.price || 0,
			offerId: (activeOffer as ProductOffer).id ?? 0,
			offerTitle: activeOffer.title || ''
		});
		trackAddToCart(
			activeOffer.price || 0,
			content.title || 'طقم التنظيم المنزلي',
			'MAD',
			activeOffer.id ? String(activeOffer.id) : 'kit-tandim'
		);
		cartUi.openDrawer();
	}

	function scrollToOffers() {
		const offersSection = document.getElementById('offers') || document.querySelector('[data-section="offers"]') || document.getElementById('checkout-form');
		if (offersSection) {
			offersSection.scrollIntoView({ behavior: 'smooth' });
		}
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
	class="max-w-xl mx-auto shadow-2xl min-h-screen flex flex-col relative border-x border-border/30 pb-32"
	style="{buildThemeCssVars(t)}; background-color: var(--t-bg, #faf9f6); color: var(--t-text, #1c1917);"
>
	<!-- Trust bar -->
	<div class="text-white text-center py-2.5 px-4 text-xs font-bold shadow-sm z-10 flex items-center justify-center gap-2" dir="rtl" style="background: linear-gradient(135deg, var(--t-primary, #047857), #065f46);">
		<span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
		<span>{settings?.commerce?.freeShippingText || 'توصيل مجاني لجميع المدن'} • {settings?.commerce?.paymentMethod || 'الدفع عند الاستلام'}</span>
	</div>

	<!-- ── Stacked images: first fills 9:16, rest keep natural ratio ── -->
	{#if slides.length > 0}
		<div class="w-full bg-black/5">
			<div class="relative">
				<img
					src={slides[0].src}
					alt={slides[0].alt}
					class="block w-full aspect-[9/16] object-cover"
					loading="eager"
				/>
			</div>
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

	<!-- ── NO-DRILLING INSTALLATION & BEFORE/AFTER SHOWCASE ── -->
	<section class="px-2 sm:px-4 pt-6 pb-2" dir="rtl">
		<div class="rounded-3xl border border-neutral-200/70 bg-white p-4 sm:p-6 shadow-sm">
			<!-- Header -->
			<div class="text-center mb-5">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold mb-2">
					<svg class="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					تثبيت ذكي بدون مسامير وبدون حفير
				</span>
				<h3 class="text-xl sm:text-2xl font-extrabold font-display text-neutral-900 tracking-tight">
					سهولة التركيب في 3 خطوات
				</h3>
				<p class="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
					ركّبو راسك فـ 5 دقايق بلا ما تضيّع لافايونس وبلا ما تحتاج معلم
				</p>
			</div>

			<!-- 3 Steps -->
			<div class="space-y-3">
				<!-- Step 1 -->
				<div class="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3 sm:p-3.5 transition-colors hover:bg-neutral-50">
					<div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
						<svg class="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18m-4-4l4 4m0 0l4-4" />
						</svg>
						<span class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white shadow-xs">
							1
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h4 class="font-extrabold text-sm sm:text-base text-neutral-900">عدّل الارتفاع</h4>
						<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">
							قابل للتعديل بسهولة من 1.10 متر إلى 3 أمتار ليناسب أي سقف.
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3 sm:p-3.5 transition-colors hover:bg-neutral-50">
					<div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
						<svg class="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0112 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 01-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 014.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z" />
						</svg>
						<span class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white shadow-xs">
							2
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h4 class="font-extrabold text-sm sm:text-base text-neutral-900">ثبّت بالضغط</h4>
						<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">
							نوابض داخلية قوية تثبت الحامل بين الأرض والسقف بإحكام بدون مسامير.
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3 sm:p-3.5 transition-colors hover:bg-neutral-50">
					<div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
						<svg class="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 10.5h16.5m-16.5 4.5h16.5" />
						</svg>
						<span class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white shadow-xs">
							3
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h4 class="font-extrabold text-sm sm:text-base text-neutral-900">رتّب مستلزماتك</h4>
						<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">
							4 رفوف واسعة تتسع لأكثر من 15 كلغ من القنينات والصابون.
						</p>
					</div>
				</div>
			</div>

			<!-- Before & After Comparison Box -->
			<div class="mt-6 pt-5 border-t border-neutral-200/70">
				<h4 class="text-center font-display font-extrabold text-base sm:text-lg text-neutral-900 mb-3.5">
					الفرق قبل وبعد استعمال الحامل الذكي
				</h4>
				<div class="grid grid-cols-2 gap-2.5 sm:gap-4">
					<!-- Before (قبل) -->
					<div class="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3 sm:p-4 transition-all">
						<div>
							<div class="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-0.5 text-xs font-black text-red-700 mb-2">
								<svg class="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
								<span>قبل</span>
							</div>
							<p class="text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed">
								حمّام مكركب، قنينات طايحة في الأرض، وتلف مستمر في السيراميك بسبب المسامير.
							</p>
						</div>
					</div>

					<!-- After (بعد) -->
					<div class="flex flex-col justify-between rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 p-3 sm:p-4 shadow-sm transition-all">
						<div>
							<div class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-black text-white mb-2 shadow-xs">
								<svg class="h-3.5 w-3.5 shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
								<span>بعد</span>
							</div>
							<p class="text-xs sm:text-sm font-bold text-neutral-900 leading-relaxed">
								حمّام منظم ومرتب في زاوية أنيقة، استغلال ذكي للمساحة، ونظافة بدون مجهود.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Checkout form -->
	<div id="checkout-form" class="px-2 sm:px-4 py-6">
		<div id="offers" data-section="offers" class="border border-border/60 shadow-lg rounded-3xl bg-white scroll-mt-6" dir="rtl">
			<div class="h-1" style="background-color: var(--t-primary, #047857);"></div>
			<div class="text-center pb-3 pt-5 select-none px-4">
				<h2 class="text-2xl font-extrabold tracking-tight font-display">
					{t.sections.orderForm.title}
				</h2>
				<p class="text-sm font-bold mt-2 px-2 leading-relaxed text-neutral-500">
					عمّر الاستمارة وخلص ملي توصلك السلعة
				</p>
			</div>

			<div class="px-2 sm:px-3.5 pb-5">
				<div class="space-y-3">
					<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
						<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
							اختر العرض المناسب لك:
						</span>

						<div class="grid grid-cols-1 gap-3.5 pt-3">
							{#each offersList as offer}
								<label
									class="relative flex w-full cursor-pointer items-center justify-between gap-1.5 sm:gap-2.5 rounded-xl border-2 px-2.5 py-3 sm:px-3.5 sm:py-3.5 transition-all duration-200 select-none active:scale-[0.99] {currentPackId === offer.id ? 'border-sky-600 bg-sky-50/60 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300'}"
								>
									<input
										type="radio"
										name="selectedPack-stacked"
										value={offer.id}
										checked={currentPackId === offer.id}
										onchange={() => (selectedPack = offer.id)}
										class="sr-only"
									/>
									{#if offer.badge || offer.isPopular || offer.id === 2}
										<span class="absolute -top-3 right-3 z-10 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-3 py-0.5 rounded-full shadow-sm">
											{offer.badge || '⭐ الأكثر طلباً'}
										</span>
									{/if}

									<!-- Right: Radio + Text Info -->
									<div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
										<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 {currentPackId === offer.id ? 'border-sky-600 bg-sky-600' : 'border-neutral-300 bg-white'}">
											{#if currentPackId === offer.id}
												<span class="h-2 w-2 rounded-full bg-white"></span>
											{/if}
										</span>
										<div class="min-w-0 flex-1 text-right">
											{#if offer.id === 2}
												<span class="block text-xs sm:text-sm font-black text-gray-900 leading-tight">2 منظمات + 2 رشاشات هدية 🎁</span>
												<span class="text-[11px] text-sky-800 font-medium mt-1 block">توصيل مجاني لجميع المدن</span>
											{:else if offer.id === 1}
												<span class="block text-xs sm:text-sm font-black text-gray-900 leading-tight">1 قطعة + رشاشة هدية 🎁</span>
												<span class="text-[11px] text-sky-800 font-medium mt-1 block">توصيل مجاني لجميع المدن</span>
											{:else}
												<span class="block text-xs sm:text-sm font-black text-gray-900 leading-tight">{offer.title}</span>
												{#if offer.subtitle}
													<span class="text-[11px] text-sky-800 font-medium mt-1 block truncate">{offer.subtitle}</span>
												{/if}
											{/if}
										</div>
									</div>

									<!-- Center: Offer Image -->
									{#if offer.image}
										<span class="h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border border-gray-100 shrink-0 mx-1.5 sm:mx-2 bg-white shadow-xs">
											<img src={offer.image} alt={offer.title} class="h-full w-full object-cover" loading="lazy" />
										</span>
									{:else}
										<span class="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-100 mx-1.5 sm:mx-2">
											<svg class="h-5 w-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
												<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
											</svg>
										</span>
									{/if}

									<!-- Left: Price & Savings Badge -->
									<div class="shrink-0 text-left flex flex-col items-end">
										<span class="block whitespace-nowrap text-sm sm:text-base font-black text-gray-900 leading-tight">dh {offer.price.toFixed(2)}</span>
										{#if offer.originalPrice && offer.originalPrice > offer.price}
											<span class="text-[11px] text-gray-400 line-through leading-tight">dh {offer.originalPrice.toFixed(2)}</span>
										{/if}
										{#if offer.id === 2 || (offer.originalPrice && offer.originalPrice > offer.price && (offer.badge || offer.isPopular))}
											<span class="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0 whitespace-nowrap mt-1 leading-normal">وفّر {(offer.originalPrice ? offer.originalPrice - offer.price : 109)} درهم</span>
										{/if}
									</div>
								</label>
							{/each}
						</div>
					</div>

					<button
						type="button"
						onclick={addSelectedToCart}
						class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#15803D] py-3.5 text-base font-black text-white shadow-lg transition-all hover:bg-[#166534] active:scale-[0.98]"
					>
						<ShoppingCart class="h-5 w-5 shrink-0" />
						<span>أضف العرض للسلة · {formatPrice(activeOffer.price, settings.commerce.currencySymbol)}</span>
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

	<!-- ── TRUST & ASSURANCE SECTION ── -->
	<section class="px-2 sm:px-4 pb-4" dir="rtl">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
			<!-- Feature 1: Inspection -->
			<div class="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 sm:p-4 transition-all">
				<div class="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 shadow-xs text-emerald-700">
					<svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="font-extrabold text-sm sm:text-base text-neutral-900 leading-snug">حق المعاينة مكفول 📦</h4>
					<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">قلّب سلعتك وتأكد من الجودة والمقاسات عاد خلّص Livreur.</p>
				</div>
			</div>

			<!-- Feature 2: Warranty -->
			<div class="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 sm:p-4 transition-all">
				<div class="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 shadow-xs text-emerald-700">
					<svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0112 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 01-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 014.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="font-extrabold text-sm sm:text-base text-neutral-900 leading-snug">ضمان الاستبدال 14 يوماً 🛡️</h4>
					<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">إلى لقيتي أي عيب مصنعي أو نقص في القطع، نبدلوه ليك فابور.</p>
				</div>
			</div>

			<!-- Feature 3: Free Shipping -->
			<div class="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 sm:p-4 transition-all">
				<div class="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 shadow-xs text-emerald-700">
					<svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="font-extrabold text-sm sm:text-base text-neutral-900 leading-snug">توصيل سريع ومجاني 🚚</h4>
					<p class="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-0.5">التوصيل فابور لجميع مدن وقرى المغرب خلال 24 - 48 ساعة.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ── CUSTOMER REVIEWS & TESTIMONIALS ── -->
	<section class="px-2 sm:px-4 py-6" dir="rtl">
		<!-- Section Header -->
		<div class="text-center mb-5">
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold mb-2">
				<svg class="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
				</svg>
				تجارب حقيقية 100%
			</span>
			<h3 class="text-xl sm:text-2xl font-extrabold font-display text-neutral-900 tracking-tight">
				آراء زبنائنا الكرام
			</h3>
			<p class="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
				هذا ما يقوله زبناؤنا بعد تجربة طقم التنظيم والرشاش الهدية
			</p>
		</div>

		<!-- Reviews Cards List -->
		<div class="space-y-3.5">
			<!-- Review 1: Fatima Zahra -->
			<div class="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-all hover:border-neutral-300">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
							ف
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-neutral-900 leading-tight">فاطمة الزهراء</h4>
							<span class="text-[11px] text-neutral-500 font-medium">الدار البيضاء</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
						<svg class="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد ✅
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
					"وصلني الكيت البارح وركبتو راسي بدون ما نحتاج راجلي ولا معلم حيت مكيحتاجش الحفير. صحيح وهز ليا كاع الشامبوانات ديال الدار كاملة. شكراً ليكم".
				</p>
			</div>

			<!-- Review 2: Hicham -->
			<div class="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-all hover:border-neutral-300">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
							هـ
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-neutral-900 leading-tight">هشام</h4>
							<span class="text-[11px] text-neutral-500 font-medium">مراكش</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
						<svg class="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد ✅
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
					"الصراحة الرشاشة الهدية واعرة بزاف الجهد ديال الما تبدل عندي فالدوش. المنظم حتى هو إينوكس مكيصداش مع الفوار. تعامل احترافي وتوصيل سريع".
				</p>
			</div>

			<!-- Review 3: Souad -->
			<div class="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-all hover:border-neutral-300">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
							س
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-neutral-900 leading-tight">سعاد</h4>
							<span class="text-[11px] text-neutral-500 font-medium">طنجة</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
						<svg class="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد ✅
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
					"كنت خايفة من القياس حيت السقف عندي عالي، ولكن التيليسكوب كيتجبد مزيان وكيتبت صحيح بزاف. وليت متهنية من كركبة الحمام".
				</p>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	{#if t.sections.trustBadges.showFAQ && activeFaq && activeFaq.length > 0}
		<section class="px-2 sm:px-4 py-6" dir="rtl">
			<div class="text-center mb-5">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold mb-2">
					<svg class="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
					</svg>
					كل ما تحتاج معرفته
				</span>
				<h3 class="text-xl sm:text-2xl font-extrabold font-display text-neutral-900 tracking-tight">
					{t.sections.trustBadges.faqTitle || 'الأسئلة الشائعة'}
				</h3>
				<p class="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
					إجابات واضحة على أكثر الأسئلة اللي كيطرحوها زبناؤنا
				</p>
			</div>

			<div class="space-y-3">
				{#each activeFaq as item}
					<details class="group rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-neutral-300">
						<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-4.5 text-sm sm:text-base font-extrabold text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
							<span class="flex items-center gap-2.5">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 border border-emerald-200/60">
									؟
								</span>
								<span>{item.question}</span>
							</span>
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100/70 text-neutral-500 transition-transform duration-300 group-open:rotate-180 group-open:bg-emerald-100 group-open:text-emerald-800">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
								</svg>
							</span>
						</summary>
						<div class="px-4 pb-4 sm:px-4.5 sm:pb-4.5 pt-1 text-xs sm:text-sm leading-relaxed text-neutral-600 border-t border-neutral-100 bg-neutral-50/40">
							<p>{item.answer}</p>
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/if}

	<div id="checkout-form-bottom"></div>

	<footer class="bg-neutral-950 py-6 text-center text-xs text-neutral-400 px-4" dir="rtl">
		<p>{content.footerText || `© ${new Date().getFullYear()} ${settings.brand.name}. جميع الحقوق محفوظة.`}</p>
	</footer>

	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-2 sm:bottom-3 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none" dir="rtl">
			<button
				type="button"
				onclick={scrollToOffers}
				style="background-color: var(--t-cta, #16a34a);"
				class="w-full max-w-xl mx-auto flex items-center justify-center h-11 py-2.5 px-4 text-sm sm:text-base font-bold text-white rounded-xl shadow-lg active:scale-[0.98] transition-all duration-300 pointer-events-auto cursor-pointer text-center"
			>
				{t.sections.pricing.stickyCtaText || t.sections.pricing.ctaText}
			</button>
		</div>
	{/if}

	<CartDrawer others={cartUpsells} currency={settings.commerce.currencySymbol || 'درهم'} salesText={t.sections.hero.salesCountText} offers={offersList} currentSlug={(product as any).slug || ''} currentTitle={content.title} currentImage={slides[0]?.src || ''} />
	<CheckoutModal
		currency={settings.commerce.currencySymbol || 'درهم'}
		sheetsUrl={sheetsUrl}
		productTitle={content.title}
		sku={(product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'SKU-GENERAL'}
		onDone={(order) => cartUi.beginUpsell(order)}
	/>
	<UpsellModal
		order={cartUi.upsell!}
		products={cartUpsells}
		currency={settings.commerce.currencySymbol || 'درهم'}
		sheetsUrl={sheetsUrl}
		sku={(product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'SKU-GENERAL'}
		postOrderImage={settings?.commerce?.postOrderUpsellImage || ''}
		onFinish={() => { cartUi.resetAll(); window.location.href = '/thank-you'; }}
	/>
</div>
