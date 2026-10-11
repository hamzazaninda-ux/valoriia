<script lang="ts">
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { PRICING_TIERS } from '$lib/constants/pricing';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { slide } from 'svelte/transition';

	let { data } = $props();

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

	// Drawer and Header States
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let query = $state('');

	// Tier Selection (Default to Tier 2 - Most Popular)
	let selectedTier = $state<'tier_1' | 'tier_2' | 'tier_3'>('tier_2');
	const currentTier = $derived(PRICING_TIERS[selectedTier]);

	function handleAddToCartAndOpenDrawer() {
		const bundleName = currentTier.units === 1 ? 'علبة واحدة' : currentTier.units === 2 ? 'علبتان' : '3 علب';
		const bundleSubtitle = currentTier.units === 1
			? 'علبة واحدة • شهر تجريبي'
			: currentTier.units === 2
				? 'علبتان • شهرين متواصلين + توصيل فابور 🚚'
				: '3 علب • كورس علاجي كامل 3 أشهر 🎁';

		const cleanName = product.name.replace(/\s*\([^)]*\)/g, '').trim();
		const displayTitle = currentTier.units === 2
			? `${cleanName} + هدية 🎁`
			: `${cleanName} (${bundleName})`;

		cart.setMainItem({
			slug: product.slug,
			sku: product.sku,
			title: displayTitle,
			subtitle: bundleSubtitle,
			image: product.image,
			price: currentTier.price,
			tier: selectedTier,
			tierTitle: currentTier.title
		});
		cartUi.openDrawer();
	}

	function scrollToOffers() {
		const el = document.getElementById('offers');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
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
			tag: '✨ روتين إنبات الشعر • حلال 100%',
			h1: 'كتخافي تمشطي شعرك وتلقاي المشطة عامرة بالخصلات؟',
			sub: 'الشامبوان كيغسل فقط.. بيوتين NOVAVITA المركز كيعوض النقص ويغذي البصيلات من الداخل لوقف التساقط وإنبات البيبي هير.',
			reviewCount: '620'
		},
		gumies_vitamine: {
			tag: '✨ روتين النشاط والمناعة • حلال 100%',
			h1: 'كتفيقي في الصباح عيانة وسخفانة وخا نعستي 8 ساعات؟',
			sub: 'القهوة كتعطي طاقة مؤقتة.. 13 فيتامين في علكات NOVAVITA كيعوضو النقص الغذائي لطاقة حقيقية ونشاط يدوم نهارك كامل.',
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
		if (key.includes('vitamine')) {
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

<div class="min-h-screen bg-[#FAF8F5] font-body text-[#1F2937] pb-24 md:pb-16" dir="rtl">
	
	<!-- Top Sub-Bar Announcement -->
	<div class="bg-[#143427] text-stone-200 py-2 px-4 text-center text-xs font-bold border-b border-white/10 flex items-center justify-center gap-2">
		<span>🌿</span>
		<span>مكملات غذائية طبيعية وحلال 100% • مصادق عليها بالمغرب</span>
	</div>

	<!-- Sticky Header with Circular Brand Logo -->
	<Header
		brandName="NOVAVITA"
		cartCount={cart.count}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => cartUi.openDrawer()}
	/>

	<!-- ========================================================================= -->
	<!-- 1. Hero Section & Interactive Buying Box -->
	<!-- ========================================================================= -->
	<main class="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
			
			<!-- Left Column (Desktop) / Top (Mobile): Hero Image Container -->
			<div class="lg:col-span-6">
				<!-- Hero Image Container (Full-Width Edge-to-Edge Mobile Container) -->
				<div class="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md mx-auto aspect-[4/4.5] sm:aspect-square bg-[#FAF8F5] rounded-[28px] overflow-hidden shadow-sm border border-black/5 relative mb-4">
					<img
						src={activeImage}
						alt={product.name}
						class="w-full h-full object-cover block transition-transform duration-500 hover:scale-105"
						onerror={(e: any) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = '/images/products/gummies_collagen.svg';
						}}
					/>
				</div>
			</div>

			<!-- Right Column (Desktop) / Below (Mobile): Emotional Headline, Bundle Selector & Buying Flow -->
			<div id="product-order-box" class="lg:col-span-6 scroll-mt-24">
				
				<!-- 1. الشارة العلوية (Pill Tag) -->
				<div>
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#1B4332]/15 text-[#1B4332] text-xs font-bold mb-2">
						<span>{heroData.tag}</span>
					</div>
				</div>

				<!-- 2. العنوان العاطفي الصادم (H1) -->
				<h1 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] leading-snug mb-2">
					{heroData.h1}
				</h1>

				<!-- 3. النص الفرعي التفسيري (جملة واحدة فقط) -->
				<p class="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3 font-medium">
					{heroData.sub}
				</p>

				<!-- 4. صف التقييم والنجوم الذهبية النظيفة -->
				<div class="flex items-center gap-2 mb-4">
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

					<!-- Tier 1 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_1')}
						class={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_1'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
						dir="rtl"
					>
						<!-- Right: Radio circle + Title & details -->
						<div class="flex items-center gap-3 text-right">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_1' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_1'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">علبة واحدة • شهر تجريبي</div>
								<div class="text-xs text-stone-500">بداية استعادة الحيوية والترطيب</div>
							</div>
						</div>
						<!-- Left: Price & savings -->
						<div class="text-left shrink-0">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">199 MAD</div>
							<div class="text-[11px] text-stone-400 line-through" dir="ltr">299 MAD</div>
						</div>
					</button>

					<!-- Tier 2 (Preselected - Most Popular) -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_2')}
						class={`relative w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_2'
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
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_2'}
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
							<div class="text-xs font-bold text-[#E86A7C]">وفّري 119 درهم</div>
						</div>
					</button>

					<!-- Tier 3 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_3')}
						class={`relative w-full p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_3'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
						dir="rtl"
					>
						<!-- Badge in top right above radio circle -->
						<div class="absolute -top-3 right-4 bg-[#1B4332] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs z-10">
							<span>توفير 248 درهم 🎁</span>
						</div>
						<!-- Right: Radio circle + Title & details -->
						<div class="flex items-center gap-3 text-right">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_3'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">3 علب • كورس علاجي كامل</div>
								<div class="text-xs text-amber-800 font-bold">كورس 3 أشهر + هدية 🎁</div>
							</div>
						</div>
						<!-- Left: Price & savings -->
						<div class="text-left shrink-0">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">349 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">وفّري 248 درهم</div>
						</div>
					</button>
				</div>


				<!-- زر الإجراء العريض وشارة الأمان المقتضبة -->
				<div class="space-y-3 pt-3">
					<button
						type="button"
						onclick={handleAddToCartAndOpenDrawer}
						class="bg-[#1B4332] text-white py-4 px-6 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#153427] transition-all w-full cursor-pointer"
					>
						<span>أضيفي العرض للسلة • DH {currentTier.price} 🛒</span>
					</button>

					<!-- شارة أمان واحدة مقتضبة تحت الزر -->
					<div class="text-center pt-1">
						<p class="text-xs sm:text-sm font-bold text-[#1B4332] bg-emerald-50/80 py-2.5 px-4 rounded-xl border border-emerald-900/10 inline-block w-full">
							📦 فتحي الكولية وقلبيها عاد تخلصي • التوصيل فابور 24/48h
						</p>
					</div>
				</div>

			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 1. مساحة الصورة الأولى (صورة الواقع / المشكلة) -->
		<!-- ========================================================================= -->
		<div class="w-full max-w-md mx-auto aspect-[4/3] sm:aspect-video bg-[#FAF8F5] rounded-3xl border-2 border-dashed border-[#1B4332]/20 flex flex-col items-center justify-center p-6 my-6 text-center shadow-sm relative overflow-hidden" dir="rtl">
			<span class="text-3xl mb-2">📸</span>
			<p class="text-sm sm:text-base font-bold text-[#1B4332] mb-1.5">مساحة مخصصة لصورة المشكلة / الواقع اليومي</p>
			<span class="bg-white/80 px-3 py-1 rounded-full text-xs text-gray-500 font-medium shadow-2xs">
				واقع المياه الكلسية وتساقط الشعر بالمغرب
			</span>
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
		<div class="w-full max-w-md mx-auto aspect-[4/3] sm:aspect-video bg-[#FAF8F5] rounded-3xl border-2 border-dashed border-[#1B4332]/20 flex flex-col items-center justify-center p-6 my-6 text-center shadow-sm relative overflow-hidden" dir="rtl">
			<span class="text-3xl mb-2">🌿</span>
			<p class="text-sm sm:text-base font-bold text-[#1B4332] mb-1.5">مساحة مخصصة لصورة المنتج والمميزات البصرية (Feature Callouts)</p>
			<span class="bg-white/80 px-3 py-1 rounded-full text-xs text-[#1B4332] font-semibold shadow-2xs">
				موك-آب وتفاصيل التركيبة الفريدة
			</span>
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
		<!-- 5. قسم السلطة والرأي الطبي المصور (Doctor Endorsement with Photo) -->
		<!-- ========================================================================= -->
		<div class="mt-12 sm:mt-18">
			<div class="rounded-3xl bg-[#143427] text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40 space-y-4">
				
				<div class="flex items-center gap-3">
					<!-- Doctor Avatar Placeholder -->
					<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-900 to-[#C99738]/30 border-2 border-[#C99738]/50 flex items-center justify-center shrink-0 shadow-md">
						<span class="text-2xl sm:text-3xl">🩺</span>
					</div>
					<div>
						<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C99738]/20 text-[#C99738] text-[11px] font-black border border-[#C99738]/30">
							رأي اختصاصي معتمد بالمغرب
						</span>
						<h3 class="font-display text-sm sm:text-base font-bold text-white mt-1">
							د. غيثة التازي • أخصائية تغذية علاجية وصحة البشرة
						</h3>
					</div>
				</div>

				<blockquote class="text-xs sm:text-sm lg:text-base font-medium leading-relaxed text-stone-100 bg-white/5 p-4 rounded-2xl border border-white/10">
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
						onclick={handleAddToCartAndOpenDrawer}
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
	<!-- 9. Sticky Mobile CTA Bar (Luxury Full-Pink, Scroll-Triggered) -->
	<!-- ========================================================================= -->
	{#if scrollY > 350}
		<div
			transition:slide={{ duration: 300 }}
			class="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-[#E86A7C] via-[#e5596e] to-[#d8485e] text-white p-3 sm:hidden shadow-[0_-10px_30px_rgba(232,106,124,0.35)] border-t border-white/25 flex items-center justify-between gap-3 backdrop-blur-md"
			dir="rtl"
		>
			<div class="flex flex-col text-right ps-1 text-white">
				<span class="text-[10px] text-pink-100 font-bold">توصيل فابور مجاني 🚚</span>
				<div class="flex items-baseline gap-1.5" dir="ltr">
					<span class="font-black text-base text-white font-display">DH {currentTier.price}</span>
					{#if selectedTier === 'tier_2'}
						<span class="text-[10px] text-pink-200 line-through">DH 398</span>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={scrollToOffers}
				class="flex-1 min-h-12 rounded-xl bg-white text-[#E86A7C] hover:bg-pink-50 active:scale-95 font-black text-xs sm:text-sm px-4 shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
			>
				<span>اطلبي الآن • الدفع عند الاستلام</span>
				<span class="text-base">←</span>
			</button>
		</div>
	{/if}

	<!-- Slide-Out Cart Drawer & 99 MAD Upsell Funnel -->
	<CartDrawer />

</div>
