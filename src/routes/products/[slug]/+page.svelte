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
		cart.setMainItem({
			slug: product.slug,
			sku: product.sku,
			title: `${product.name} - ${bundleName}`,
			image: product.image,
			price: currentTier.price,
			tier: selectedTier,
			tierTitle: currentTier.title
		});
		cartUi.openDrawer();
	}

	function scrollToBundleSelector() {
		const el = document.getElementById('bundle-selector');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			handleAddToCartAndOpenDrawer();
		}
	}

	// Product-specific DTC Hero Content (Condensed & Fast CVR)
	const PRODUCT_HERO_DATA = {
		gummies_collagen: {
			tag: '✨ روتين النضارة السريري • حلال 100%',
			h1: 'كتستعملي سيرومات غالية وبشرتك باقا باهتة وناشفة؟',
			sub: 'الكريمات كتزوق من برا فقط.. كولاجين NOVAVITA البحري كيعوض النقص من الداخل لنضارة ولمعة زجاجية طبيعية.',
			reviews: '480 تقييم مؤكد بالمغرب'
		},
		gummies_biotine: {
			tag: '✨ روتين إنبات الشعر • حلال 100%',
			h1: 'كتخافي تمشطي شعرك وتلقاي المشطة عامرة بالخصلات؟',
			sub: 'الشامبوان كيغسل فقط.. بيوتين NOVAVITA المركز كيعوض النقص ويغذي البصيلات من الداخل لوقف التساقط وإنبات البيبي هير.',
			reviews: '620 تقييم مؤكد بالمغرب'
		},
		gumies_vitamine: {
			tag: '✨ روتين النشاط والمناعة • حلال 100%',
			h1: 'كتفيقي في الصباح عيانة وسخفانة وخا نعستي 8 ساعات؟',
			sub: 'القهوة كتعطي طاقة مؤقتة.. 13 فيتامين في علكات NOVAVITA كيعوضو النقص الغذائي لطاقة حقيقية ونشاط يدوم نهارك كامل.',
			reviews: '350 تقييم مؤكد بالمغرب'
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
</script>

<svelte:head>
	<title>{product.name} | NOVAVITA Clinical</title>
	<meta name="description" content={product.headline} />
</svelte:head>

<div class="min-h-screen bg-[#FAF8F5] font-body text-[#1F2937] pb-24 md:pb-16" dir="rtl">
	
	<!-- Top Sub-Bar Announcement -->
	<div class="bg-[#143427] text-stone-200 py-2 px-4 text-center text-xs font-bold border-b border-white/10 flex items-center justify-center gap-2">
		<span>🌿</span>
		<span>مكملات غذائية طبيعية وحلال 100% • مصادق عليها بالمغرب</span>
	</div>

	<!-- 2. Sticky Header with Circular Brand Logo -->
	<Header
		brandName="NOVAVITA"
		cartCount={cart.count}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => cartUi.openDrawer()}
	/>

	<!-- 3. Section: Hero Image & Buying Box -->
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
				<h1 class="text-xl sm:text-2xl font-black text-[#1B4332] leading-snug mb-2">
					{heroData.h1}
				</h1>

				<!-- 3. النص الفرعي التفسيري (جملة واحدة فقط) -->
				<p class="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3 font-medium">
					{heroData.sub}
				</p>

				<!-- 4. صف التقييم والنجوم الذهبية -->
				<div class="flex items-center gap-2 mb-4">
					<span class="font-bold text-gray-900 text-sm">4.9</span>
					<div class="flex text-[#F59E0B] gap-0.5">
						{#each Array(5) as _}
							<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					<span class="text-xs text-gray-600 font-medium">
						({heroData.reviews})
					</span>
				</div>

				<!-- 2. محدد العروض والطلب (Clean & Focused) -->
				<div id="bundle-selector" class="space-y-3 scroll-mt-24">
					<div class="flex items-center justify-between mb-2">
						<span class="text-base font-bold text-gray-900">اختاري باقتك:</span>
						<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
							✨ نتيجة من العلبة الأولى
						</span>
					</div>

					<!-- Tier 1 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_1')}
						class={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_1'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
					>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_1' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_1'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">علبة واحدة</div>
								<div class="text-xs text-stone-500">شهر تجريبي</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">199 MAD</div>
							<div class="text-[11px] text-stone-400 line-through" dir="ltr">299 MAD</div>
						</div>
					</button>

					<!-- Tier 2 (Preselected - Benchmark Elevated) -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_2')}
						class={`relative w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_2'
								? 'border-[#1B4332] ring-3 ring-[#1B4332]/20 shadow-md -translate-y-0.5'
								: 'border-[#1B4332]/40 hover:border-[#1B4332]'
						}`}
					>
						<div class="absolute -top-3 end-4 bg-[#C99738] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
							<span>الأكثر طلباً ⭐</span>
						</div>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_2'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm sm:text-base text-[#1B4332]">علبتان</div>
								<div class="text-xs text-emerald-800 font-bold">شهرين متواصلين + توصيل فابور 🚚</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-xl text-[#1B4332]" dir="ltr">279 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">وفّري 119 درهم</div>
						</div>
					</button>

					<!-- Tier 3 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_3')}
						class={`relative w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_3'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
					>
						<div class="absolute -top-3 end-4 bg-[#1B4332] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
							توفير 248 درهم 🎁
						</div>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_3'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">3 علب</div>
								<div class="text-xs text-amber-800 font-bold">كورس 3 أشهر + هدية 🎁</div>
							</div>
						</div>
						<div class="text-end">
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
						class="w-full min-h-14 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
					>
						<span>اطلبي الآن • الدفع عند الاستلام</span>
						<span class="text-xl transition-transform group-hover:-translate-x-1">←</span>
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
		<!-- 3. شريط المعاناة بالمغرب (Moroccan Pain Stat - بطاقة واحدة) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16">
			<div class="rounded-3xl bg-[#143427] text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40 text-center sm:text-start flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
				<div class="font-display text-5xl sm:text-6xl font-black text-[#E86A7C] shrink-0">
					78%
				</div>
				<p class="text-sm sm:text-base font-bold text-stone-100 leading-relaxed">
					78% من المغربيات كيعانيو من بهتان البشرة وتساقط الشعر بسبب ملوحة الماء (الكالكير) وضغوطات اليوم. الحل ماشي في الزيوت.. الحل في تغذية البصيلة والخلايا من الداخل.
				</p>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 4. قسم المقارنة السريع (3 نقط مقتضبة جداً بدون جرائد) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16 space-y-4">
			<h2 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] text-center">
				علاش الحل السطحي ما كافيش؟
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
				<!-- Card 1 -->
				<div class="rounded-2xl border border-stone-200 bg-white p-4.5 shadow-sm space-y-2.5">
					<div class="text-xs font-bold text-rose-600 flex items-center gap-1.5">
						<span>❌</span>
						<span>شامبوانات وزيوت غالية</span>
					</div>
					<div class="text-sm font-bold text-[#1B4332] flex items-start gap-1.5 pt-1 border-t border-stone-100">
						<span class="text-base shrink-0">✅</span>
						<span>تغذية البصيلة مباشرة بـ 3000mcg بيوتين لوقف التساقط.</span>
					</div>
				</div>

				<!-- Card 2 -->
				<div class="rounded-2xl border border-stone-200 bg-white p-4.5 shadow-sm space-y-2.5">
					<div class="text-xs font-bold text-rose-600 flex items-center gap-1.5">
						<span>❌</span>
						<span>طبقات ماكياج وكونسيلر</span>
					</div>
					<div class="text-sm font-bold text-[#1B4332] flex items-start gap-1.5 pt-1 border-t border-stone-100">
						<span class="text-base shrink-0">✅</span>
						<span>كولاجين وهيالورونيك لترطيب مائي ونضارة طبيعية.</span>
					</div>
				</div>

				<!-- Card 3 -->
				<div class="rounded-2xl border border-stone-200 bg-white p-4.5 shadow-sm space-y-2.5">
					<div class="text-xs font-bold text-rose-600 flex items-center gap-1.5">
						<span>❌</span>
						<span>كبسولات كبار ومرار كيروعو المعدة</span>
					</div>
					<div class="text-sm font-bold text-[#1B4332] flex items-start gap-1.5 pt-1 border-t border-stone-100">
						<span class="text-base shrink-0">✅</span>
						<span>علكات فواكه لذيذة وخفيفة كتمتص 3 مرات أسرع.</span>
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 5. بطاقة النقاء (شبكة مقتضبة 4x2) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16">
			<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm space-y-4">
				<h2 class="font-display text-lg sm:text-xl font-black text-[#1B4332] text-center">
					نقاء سريري 100%
				</h2>

				<!-- 8 Badges Grid (4x2 on tablet/desktop, 2 cols on mobile) -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm font-bold text-stone-700">
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بدون جيلاتين خنزيري
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بدون سكر مضاف
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بدون مواد حافظة
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بدون كحول
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ خالي من الغلوتين
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بكتين نباتي حلال
					</div>
					<div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center">
						✓ بدون ملونات صناعية
					</div>
					<div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-center">
						✓ جودة GMP صيدلانية
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 6. المكونات الأساسية (بطاقات سريعة بدون حشو) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16 space-y-3.5">
			<h2 class="font-display text-lg sm:text-xl font-black text-[#1B4332] text-center">
				المكونات الفعالة والسريرية
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
				<div class="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5">
					<div class="font-bold text-sm text-[#1B4332] flex items-center gap-2">
						<span>✨</span>
						<span>كولاجين بحري + هيالورونيك</span>
					</div>
					<p class="text-xs text-stone-600 leading-relaxed">
						تعويض نقص الكولاجين بعد سن 25 وترطيب الجلد بعمق.
					</p>
				</div>

				<div class="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5">
					<div class="font-bold text-sm text-[#1B4332] flex items-center gap-2">
						<span>🌿</span>
						<span>بيوتين مركز 3000mcg</span>
					</div>
					<p class="text-xs text-stone-600 leading-relaxed">
						إنبات البيبي هير وتقوية الأظافر في 14 يوماً.
					</p>
				</div>

				<div class="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5">
					<div class="font-bold text-sm text-[#1B4332] flex items-center gap-2">
						<span>🍊</span>
						<span>فيتامين C والزنك</span>
					</div>
					<p class="text-xs text-stone-600 leading-relaxed">
						حماية الخلايا ومضاعفة إنتاج الكولاجين الطبيعي مرتين.
					</p>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 7. شهادة الاعتماد والأرقام (مجتمعة في قسم واحد) -->
		<!-- ========================================================================= -->
		<div class="mt-10 sm:mt-16 space-y-4">
			<!-- Doctor quote card -->
			<div class="rounded-3xl bg-[#143427] text-white p-5 sm:p-7 shadow-lg border border-emerald-800/40 space-y-2.5">
				<div class="flex items-center gap-2 text-[#C99738] text-xs font-black">
					<span>🩺</span>
					<span>رأي اختصاصي معتمد</span>
				</div>
				<blockquote class="text-xs sm:text-sm font-semibold leading-relaxed text-stone-100">
					"تركيبة NOVAVITA تعتمد على التغذية الخلوية بالبكتين سريع الامتصاص.. الحل الأنسب لطبيعة مياه ونمط حياة المرأة بالمغرب."
				</blockquote>
				<div class="text-[11px] font-medium text-stone-300">
					— د. غيثة التازي • أخصائية تغذية
				</div>
			</div>

			<!-- Metrics row -->
			<div class="grid grid-cols-3 gap-2.5 text-center">
				<div class="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-0.5">
					<div class="font-black text-lg sm:text-xl text-[#1B4332]">+1,450</div>
					<div class="text-[11px] text-stone-500 font-bold">سيدة راضية</div>
				</div>
				<div class="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-0.5">
					<div class="font-black text-lg sm:text-xl text-[#F59E0B]">4.9 / 5</div>
					<div class="text-[11px] text-stone-500 font-bold">تقييم ممتاز</div>
				</div>
				<div class="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-0.5">
					<div class="font-black text-lg sm:text-xl text-emerald-800">مجاناً</div>
					<div class="text-[11px] text-stone-500 font-bold">معاينة عند الباب</div>
				</div>
			</div>
		</div>

	</main>

	<!-- Window scroll binding for scroll-triggered sticky mobile CTA -->
	<svelte:window bind:scrollY={scrollY} />

	<!-- ========================================================================= -->
	<!-- 8. Sticky Mobile CTA Bar (Luxury Full-Pink, Scroll-Triggered) -->
	<!-- ========================================================================= -->
	{#if scrollY > 350}
		<div
			transition:slide={{ duration: 300 }}
			class="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-[#E86A7C] via-[#e5596e] to-[#d8485e] text-white p-3 sm:hidden shadow-[0_-10px_30px_rgba(232,106,124,0.35)] border-t border-white/25 flex items-center justify-between gap-3 backdrop-blur-md"
		>
			<div class="flex flex-col text-start ps-1 text-white">
				<span class="text-[10px] text-pink-100 font-bold">توصيل فابور مجاني 🚚</span>
				<div class="flex items-baseline gap-1.5">
					<span class="font-black text-base text-white font-display" dir="ltr">{currentTier.price} MAD</span>
					{#if selectedTier === 'tier_2'}
						<span class="text-[10px] text-pink-200 line-through" dir="ltr">398 MAD</span>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={handleAddToCartAndOpenDrawer}
				class="flex-1 min-h-12 rounded-xl bg-white text-[#E86A7C] hover:bg-pink-50 active:scale-95 font-black text-xs sm:text-sm px-4 shadow-lg flex items-center justify-center gap-1.5 transition-all"
			>
				<span>اطلبي الآن • الدفع عند الاستلام</span>
				<span class="text-base">←</span>
			</button>
		</div>
	{/if}

	<!-- Slide-Out Cart Drawer & 99 MAD Upsell Funnel -->
	<CartDrawer />

</div>
