<script lang="ts">
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { PRICING_TIERS } from '$lib/constants/pricing';
	import { cart, cartUi } from '$lib/stores/cart.svelte';

	let { data } = $props();

	const product = $derived(data.product);
	const brand = $derived(data.brand);

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

	// Dynamic Emotional Shock Headline per product
	const emotionalHeadline = $derived.by(() => {
		if (product.sku === 'gummies_collagen') {
			return 'كتستعملي أغلى السيرومات وبشرتك باقا باهتة ومجففة؟';
		}
		if (product.sku === 'gummies_biotine') {
			return 'كتخافي تمشطي شعرك وتلقاي المشطة عامرة بالخصلات؟';
		}
		return 'كتفيقي في الصباح عيانة وسخفانة وخا نعستي 8 ساعات؟';
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

	<!-- 3. Section: Edge-to-Edge Hero Image & Buying Box -->
	<main class="mx-auto max-w-6xl px-0 sm:px-6 lg:px-8 py-0 sm:py-8">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
			
			<!-- Left Column (Desktop) / Top (Mobile): Edge-to-Edge Hero Image -->
			<div class="lg:col-span-6 space-y-3 sm:space-y-4">
				<!-- Hero Image Viewport: Full Width Edge-to-edge on mobile with soft rounded bottom -->
				<div class="relative w-full max-w-full aspect-square bg-[#FAF8F5] rounded-b-3xl shadow-sm sm:rounded-3xl sm:bg-white sm:border-2 sm:border-emerald-950/10 sm:shadow-xl p-6 sm:p-10 flex items-center justify-center overflow-hidden group">
					<img
						src={activeImage}
						alt={product.name}
						class="w-full h-full max-w-full aspect-square object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
						onerror={(e: any) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = '/images/products/gummies_collagen.svg';
						}}
					/>
					<!-- Corner Floating Badge -->
					<div class="absolute top-4 end-4 bg-[#E86A7C] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md">
						{product.badge}
					</div>
					<!-- Clinical Purity Floating Badge -->
					<div class="absolute bottom-4 start-4 bg-white/95 backdrop-blur-xs text-[#1B4332] text-[11px] font-black px-3 py-1 rounded-full shadow-xs border border-emerald-950/10">
						✓ بكتين فواكه نباتي 100% حلال
					</div>
				</div>

				<!-- Thumbnails Strip (Desktop / Tablet) -->
				<div class="flex items-center gap-2.5 overflow-x-auto pb-1 px-4 sm:px-0 justify-center sm:justify-start">
					{#each product.gallery as imgUrl}
						<button
							type="button"
							onclick={() => (activeImage = imgUrl)}
							class={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white border-2 p-2 shrink-0 transition-all cursor-pointer ${
								activeImage === imgUrl ? 'border-[#1B4332] shadow-md ring-2 ring-[#1B4332]/20' : 'border-stone-200 hover:border-stone-300'
							}`}
						>
							<img
								src={imgUrl}
								alt="معاينة"
								class="w-full h-full object-contain"
								onerror={(e: any) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = '/images/products/gummies_collagen.svg';
								}}
							/>
						</button>
					{/each}
				</div>

				<!-- Trust Value Micro-grid (Desktop) -->
				<div class="hidden lg:grid grid-cols-3 gap-2.5 pt-2 text-center text-xs font-bold text-stone-700">
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">🌿</span>
						<span>بكتين نباتي حلال 100%</span>
					</div>
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">🚚</span>
						<span>توصيل مجاني وسريع</span>
					</div>
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">📦</span>
						<span>معاينة قبل الدفع كاش</span>
					</div>
				</div>
			</div>

			<!-- Right Column (Desktop) / Below (Mobile): Emotional Headline, Bundle Selector & Buying Flow -->
			<div id="product-order-box" class="lg:col-span-6 space-y-6 scroll-mt-24 px-4 sm:px-0">
				
				<!-- Heading, Shock Headline & Ratings -->
				<div class="space-y-3">
					
					<!-- Top Eyebrow Tag -->
					<div class="inline-flex items-center gap-1.5 rounded-full bg-[#1B4332]/10 border border-[#1B4332]/20 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
						<span>روتين العناية المركزة • NOVAVITA Clinical</span>
					</div>

					<!-- Emotional Shock Headline (Tailored per SKU) -->
					<h1 class="font-display text-2xl sm:text-3xl lg:text-[2.2rem] font-black text-[#1B4332] leading-snug">
						{emotionalHeadline}
					</h1>

					<!-- Rating Row -->
					<div class="flex items-center gap-2 pt-0.5">
						<div class="flex text-[#F59E0B] gap-0.5">
							{#each Array(5) as _}
								<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{/each}
						</div>
						<span class="text-xs sm:text-sm font-bold text-stone-600">
							<strong>4.9 / 5</strong> (أزيد من 1,450 تقييم سيدة مغربية • مشتريات مؤكدة)
						</span>
					</div>

					<!-- Persuasive Explanatory Copy (2 High-Impact Lines) -->
					<p class="text-base sm:text-lg text-gray-700 font-medium leading-relaxed bg-white/70 p-4 rounded-2xl border border-stone-200/70">
						السبب ماشي من برا. الكريمات والشامبوان كيزوقو المظهر فقط.. الحل الجذري كيبدا من تغذية الخلايا بجرعات سريرية دقيقة وبكتين فواكه كيمتص 3 مرات أسرع وبدون ثقل على المعدة.
					</p>

					<!-- Flavor Badge -->
					<div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-800 border border-emerald-200">
						<span>🍓 النكهة الطبيعية:</span>
						<span>{product.flavor}</span>
					</div>
				</div>

				<!-- 4. Interactive 3-Tier Bundle Selector (Benchmark Match) -->
				<div id="bundle-selector" class="space-y-3.5 pt-2 scroll-mt-24">
					<div class="flex items-center justify-between">
						<span class="text-sm font-black text-stone-900">اختاري العرض:</span>
						<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
							✨ نتيجة من العلبة الأولى
						</span>
					</div>

					<!-- Tier 1 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_1')}
						class={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
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
								<div class="text-xs text-stone-500">25 علكة • كورس شهر تجريبي</div>
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
						class={`relative w-full p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_2'
								? 'border-[#1B4332] ring-4 ring-[#1B4332]/20 shadow-xl -translate-y-0.5'
								: 'border-[#1B4332]/50 hover:border-[#1B4332]'
						}`}
					>
						<!-- Top Gold Badge -->
						<div class="absolute -top-3 end-4 bg-[#C99738] text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
							<span>الأكثر اختياراً ⭐</span>
						</div>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_2'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm sm:text-base text-[#1B4332]">علبتان • ثبّتي النتيجة</div>
								<div class="text-xs text-emerald-800 font-bold">50 علكة • شهرين متواصلين + توصيل فابور مجاني 🚚</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-xl sm:text-2xl text-[#1B4332]" dir="ltr">279 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">وفّري 119 درهم</div>
						</div>
					</button>

					<!-- Tier 3 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_3')}
						class={`relative w-full p-4 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_3'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
					>
						<div class="absolute -top-3 end-4 bg-[#1B4332] text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs">
							الأكثر توفيراً 🏆
						</div>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_3'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm sm:text-base text-[#1F2937]">ثلاث علب • النتيجة الشاملة</div>
								<div class="text-xs text-amber-800 font-bold">75 علكة • 3 أشهر + هدية فرشاة مساج الفروة 🎁</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-lg sm:text-xl text-[#1B4332]" dir="ltr">349 MAD</div>
							<div class="text-xs font-bold text-[#E86A7C]">وفّري 248 درهم</div>
						</div>
					</button>
				</div>

				<!-- Wide Primary Action CTA Button -->
				<div class="space-y-3 pt-2">
					<button
						type="button"
						onclick={handleAddToCartAndOpenDrawer}
						class="w-full min-h-14 sm:min-h-16 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 group"
					>
						<span>ابدئي روتينك الآن • {currentTier.price} MAD</span>
						<span class="text-xl transition-transform group-hover:-translate-x-1.5">←</span>
					</button>

					<!-- Reassurance Under Button -->
					<div class="text-center space-y-1">
						<p class="text-xs sm:text-sm font-bold text-[#1B4332]">
							الدفع عند الاستلام • بدون دفع أونلاين • معاينة الطرد قبل الأداء
						</p>
						<div class="flex items-center justify-center gap-3 text-[11px] font-semibold text-stone-500 pt-0.5">
							<span class="flex items-center gap-1 text-emerald-800">🚚 توصيل فابور مجاني</span>
							<span class="flex items-center gap-1 text-emerald-800">📦 فحص الطرد عند الباب</span>
							<span class="flex items-center gap-1 text-emerald-800">🌿 حلال 100% معتمد</span>
						</div>
					</div>
				</div>

				<!-- Doorstep Inspection Risk-Reversal Guarantee Card -->
				<div class="rounded-3xl border-2 border-emerald-900/20 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-5 sm:p-6 shadow-md space-y-3">
					<div class="flex items-center gap-3">
						<span class="text-3xl">🛡️</span>
						<div>
							<h4 class="font-display text-base font-black text-[#1B4332]">
								ضمان المعاينة الكاملة عند باب دارك
							</h4>
							<p class="text-xs font-bold text-emerald-800">
								حقكِ القانوني والأخلاقي محفوظ بالكامل قبل دفع أي درهم
							</p>
						</div>
					</div>
					<p class="text-sm font-semibold text-gray-700 leading-relaxed border-t border-emerald-900/10 pt-2.5">
						عند وصول الموزع، افتحي الطرد وعايني علب NOVAVITA وتأكدي من سلامتها وختم الأمان بنفسك قبل دفع أي درهم. ثقتكِ وراحتكِ هي أولويتنا الأولى.
					</p>
					<div class="grid grid-cols-3 gap-2 pt-1 text-center text-xs font-black text-emerald-900">
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">📦 عايني أولاً</div>
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">💵 الدفع بعد التأكد</div>
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">🔄 إرجاع فوري مريح</div>
					</div>
				</div>

				<!-- Mobile Trust Micro-grid -->
				<div class="grid grid-cols-3 gap-2.5 pt-1 text-center text-xs font-bold text-stone-700 lg:hidden">
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">🌿</span>
						<span>بكتين نباتي 100%</span>
					</div>
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">🚚</span>
						<span>توصيل مجاني</span>
					</div>
					<div class="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
						<span class="block text-lg mb-1">📦</span>
						<span>معاينة قبل الدفع</span>
					</div>
				</div>

			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 5. Moroccan Pain-Point Banner (كارت إحصائية المعاناة بالمغرب) -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0">
			<div class="relative overflow-hidden rounded-3xl bg-[#143427] text-white shadow-2xl border border-emerald-800/40">
				<!-- Background Lifestyle Layer -->
				<div class="relative h-64 sm:h-80 w-full overflow-hidden bg-gradient-to-r from-emerald-950 via-[#1B4332] to-[#143427] flex items-center justify-center">
					<img
						src="/images/killers/imagewom1.png"
						alt="واقع المرأة المغربية والجمال"
						class="w-full h-full object-cover opacity-35 mix-blend-luminosity filter contrast-125"
						onerror={(e: any) => {
							e.currentTarget.style.display = 'none';
						}}
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-[#143427] via-[#143427]/70 to-transparent"></div>
					<div class="absolute inset-0 bg-gradient-to-r from-[#143427] via-transparent to-[#143427]/90"></div>
					
					<!-- Emotional Header inside Banner -->
					<div class="relative z-10 text-center max-w-xl px-4 space-y-2">
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-stone-200 backdrop-blur-md border border-white/20">
							🇲🇦 واقع صحة وجمال المرأة بالمغرب
						</span>
						<h2 class="font-display text-2xl sm:text-3xl font-black text-white">
							الجمال الحقيقي كيبدا من تغذية الخلايا
						</h2>
					</div>
				</div>

				<!-- Dark Emerald Statistic Strip at Bottom -->
				<div class="p-6 sm:p-8 bg-[#0F281E] border-t border-white/10">
					<div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-start">
						<div class="font-display text-5xl sm:text-6xl font-black text-[#E86A7C] shrink-0 tracking-tight">
							78%
						</div>
						<div class="space-y-1.5">
							<p class="text-base sm:text-lg font-bold text-stone-100 leading-relaxed">
								من النساء بالمغرب يعانين من تساقط الشعر وشحوب البشرة بسبب ملوحة الماء (الكالكير)، نقص المعادن، والتوتر اليومي.
							</p>
							<p class="text-xs font-medium text-stone-400">
								المصدر: دراسة وتغذية وظيفية بالمغرب، 2025/2026
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 6. Decisive Comparison Section (مشاكل كتعرفيها — وحلول من الداخل) -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0 space-y-10">
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332] border border-emerald-900/10">
					⚖️ مقارنة حاسمة
				</span>
				<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
					مشاكل كتعرفيها.. وحلول جذرية من الداخل
				</h2>
				<p class="text-base sm:text-lg text-gray-700 font-medium leading-relaxed">
					علاش الحلول السطحية ما كتكفيش، وكيفاش كتعالج NOVAVITA أصل المشكل؟
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Card 1 -->
				<div class="rounded-3xl border border-stone-200/90 bg-white overflow-hidden shadow-md flex flex-col justify-between">
					<!-- Problem Half (Top) -->
					<div class="p-6 bg-red-50/40 border-b border-red-100/80 space-y-3">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-sm shrink-0">
								✕
							</span>
							<span class="text-xs font-black text-rose-700">المشكلة السطحية اليومية</span>
						</div>
						<p class="text-sm sm:text-base font-semibold text-stone-800 leading-relaxed">
							"بدلت شحال من شامبوان ودرت زيوت غالية ولكن التساقط باقي كيف ما هو."
						</p>
					</div>
					<!-- Solution Half (Bottom) -->
					<div class="p-6 bg-[#FAF8F5] space-y-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-white font-black text-sm shrink-0">
								✓
							</span>
							<span class="text-xs font-black text-[#1B4332]">الحل الجذري لـ NOVAVITA</span>
						</div>
						<p class="text-sm sm:text-base font-medium text-stone-700 leading-relaxed">
							السبب في البصيلة الميتة من الداخل. البيوتين 3000mcg مع الزنك وفيتامين C كيغذي جذر الزغبة ويوقف التساقط وينبت البيبي هير.
						</p>
					</div>
				</div>

				<!-- Card 2 -->
				<div class="rounded-3xl border border-stone-200/90 bg-white overflow-hidden shadow-md flex flex-col justify-between">
					<!-- Problem Half (Top) -->
					<div class="p-6 bg-red-50/40 border-b border-red-100/80 space-y-3">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-sm shrink-0">
								✕
							</span>
							<span class="text-xs font-black text-rose-700">المشكلة السطحية اليومية</span>
						</div>
						<p class="text-sm sm:text-base font-semibold text-stone-800 leading-relaxed">
							"كنغطي بشرتي بالكونسيلر والفاونديشن حيت وجهي باهت وفيه خطوط وعييت نخفي عيوبي."
						</p>
					</div>
					<!-- Solution Half (Bottom) -->
					<div class="p-6 bg-[#FAF8F5] space-y-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-white font-black text-sm shrink-0">
								✓
							</span>
							<span class="text-xs font-black text-[#1B4332]">الحل الجذري لـ NOVAVITA</span>
						</div>
						<p class="text-sm sm:text-base font-medium text-stone-700 leading-relaxed">
							الكولاجين البحري المحلل مع حمض الهيالورونيك كيرجع للبشرة امتلاءها الطبيعي وكيعطيك لمعة ونضارة زجاجية بدون طبقات ماكياج.
						</p>
					</div>
				</div>

				<!-- Card 3 -->
				<div class="rounded-3xl border border-stone-200/90 bg-white overflow-hidden shadow-md flex flex-col justify-between">
					<!-- Problem Half (Top) -->
					<div class="p-6 bg-red-50/40 border-b border-red-100/80 space-y-3">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-sm shrink-0">
								✕
							</span>
							<span class="text-xs font-black text-rose-700">المشكلة السطحية اليومية</span>
						</div>
						<p class="text-sm sm:text-base font-semibold text-stone-800 leading-relaxed">
							"شربت كبسولات صيدلانية كبار وكانو كيروعو ليا المعدة وكيديرو ليا الحموضة وقطعتهم."
						</p>
					</div>
					<!-- Solution Half (Bottom) -->
					<div class="p-6 bg-[#FAF8F5] space-y-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-white font-black text-sm shrink-0">
								✓
							</span>
							<span class="text-xs font-black text-[#1B4332]">الحل الجذري لـ NOVAVITA</span>
						</div>
						<p class="text-sm sm:text-base font-medium text-stone-700 leading-relaxed">
							علكات NOVAVITA مصنوعة ببكتين فواكه طبيعي 100%، لذيذة بنكهة التوت، سريعة الامتصاص وخفيفة تماماً على المعدة.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 7. Section: "ما لن تجديه في علكتك" (Clean Formula Grid) -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0">
			<div class="rounded-3xl bg-white border-2 border-emerald-950/10 p-6 sm:p-10 shadow-lg space-y-8">
				
				<div class="text-center max-w-xl mx-auto space-y-2">
					<div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-[#1B4332] text-2xl mb-1">
						🛡️
					</div>
					<h2 class="font-display text-2xl sm:text-3xl font-black text-[#1B4332]">
						ما لن تجديه في علكتك
					</h2>
					<p class="text-sm sm:text-base text-stone-600 font-medium">
						نقاء سريري 100% بدون أي مساومة على صحتكِ أو مبادئكِ
					</p>
				</div>

				<!-- 8 Clean Formula Badges (2-Cols Grid) -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🌿</span>
						<span>بدون جيلاتين حيواني خنزيري</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🍃</span>
						<span>بدون سكر مضاف ضار</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🧪</span>
						<span>بدون مواد حافظة</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🛡️</span>
						<span>بدون كحول ومشتقاته</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🌾</span>
						<span>بدون غلوتين (Gluten Free)</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🔬</span>
						<span>خالي من الكائنات المعدلة وراثياً (Non-GMO)</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 font-bold text-sm sm:text-base text-stone-800">
						<span class="text-lg">🎨</span>
						<span>بدون ملونات صناعية</span>
					</div>
					<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 font-bold text-sm sm:text-base text-emerald-900">
						<span class="text-lg">🇲🇦</span>
						<span>جيلاتين بقري حلال 100% وبكتين نباتي</span>
					</div>
				</div>

			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 8. Active Ingredients Deep Dive: "السرّ في التركيز، ماشي في كثرة الأسماء" -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0 space-y-10">
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332] border border-emerald-900/10">
					🔬 علم الأدوية والتركيز
				</span>
				<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
					السرّ في التركيز، ماشي في كثرة الأسماء
				</h2>
				<p class="text-base sm:text-lg text-gray-700 font-medium leading-relaxed">
					جرعات سريرية دقيقة مختارة بعناية تعطي مفعولاً حقيقياً يمتصه جسمكِ بالكامل
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Component 1 -->
				<div class="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-md space-y-4 flex flex-col justify-between">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-2xl">🌿</span>
							<span class="text-xs font-black text-[#1B4332] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
								3000 ميكروغرام
							</span>
						</div>
						<h3 class="font-display text-lg sm:text-xl font-bold text-[#1B4332]">
							البيوتين النقي (Biotin B7)
						</h3>
						<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
							الجرعة السريرية الدقيقة التي تخترق بصيلة الشعر. تحفز إنتاج الكيراتين الطبيعي وتوقف التساقط في 14 يوماً.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs sm:text-sm font-bold text-emerald-800">
						✨ إنبات ملحوظ للبيبي هير وتصلب الأظافر.
					</div>
				</div>

				<!-- Component 2 -->
				<div class="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-md space-y-4 flex flex-col justify-between">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-2xl">✨</span>
							<span class="text-xs font-black text-[#1B4332] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
								تركيبة مزدوجة
							</span>
						</div>
						<h3 class="font-display text-lg sm:text-xl font-bold text-[#1B4332]">
							الكولاجين البحري المحلل + حمض الهيالورونيك
						</h3>
						<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
							جزيئات ببتيدية صغيرة جداً سريعة الامتصاص. تعمل بتآزر مع الهيالورونيك لحبس الرطوبة داخل طبقات الجلد وملء الخطوط التعبيرية.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs sm:text-sm font-bold text-emerald-800">
						✨ نضارة وترطيب مائي ملموس من أول أسبوعين.
					</div>
				</div>

				<!-- Component 3 -->
				<div class="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-md space-y-4 flex flex-col justify-between">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-2xl">🍊</span>
							<span class="text-xs font-black text-[#1B4332] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
								مضادات أكسدة نشطة
							</span>
						</div>
						<h3 class="font-display text-lg sm:text-xl font-bold text-[#1B4332]">
							فيتامين C والزنك المخلب
						</h3>
						<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
							بدون فيتامين C، لا يستطيع جسمك تصنيع الكولاجين. يحمي الخلايا من الإجهاد التأكسدي ويضاعف فاعلية التركيبة مرتين.
						</p>
					</div>
					<div class="pt-3 border-t border-stone-100 text-xs sm:text-sm font-bold text-emerald-800">
						✨ تفتيح ونقاء طبيعي للبشرة.
					</div>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- 9. Safety & Regulatory Credentials (تركيبة سريرية، ماشي وعود خاوية) -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0 space-y-10">
			
			<!-- 4 Credentials Grid -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5 text-center sm:text-start">
					<div class="text-2xl">🔬</div>
					<h4 class="font-bold text-sm text-[#1B4332]">GMP</h4>
					<p class="text-xs text-stone-500 leading-relaxed font-medium">تصنيع صيدلاني معتمد عالمياً</p>
				</div>
				<div class="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5 text-center sm:text-start">
					<div class="text-2xl">🌿</div>
					<h4 class="font-bold text-sm text-[#1B4332]">حلال 100%</h4>
					<p class="text-xs text-stone-500 leading-relaxed font-medium">اعتماد رسمي خالي من المشتقات المحرمة</p>
				</div>
				<div class="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5 text-center sm:text-start">
					<div class="text-2xl">🛡️</div>
					<h4 class="font-bold text-sm text-[#1B4332]">ISO 22000</h4>
					<p class="text-xs text-stone-500 leading-relaxed font-medium">سلامة غذائية دولية معتمدة</p>
				</div>
				<div class="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5 text-center sm:text-start">
					<div class="text-2xl">🧪</div>
					<h4 class="font-bold text-sm text-[#1B4332]">Third-Party Tested</h4>
					<p class="text-xs text-stone-500 leading-relaxed font-medium">فحص مخبري مستقل للنقاء التام</p>
				</div>
			</div>

			<!-- Medical Doctor Endorsement Card in Deep Royal Emerald (#1B4332) -->
			<div class="relative overflow-hidden rounded-3xl bg-[#143427] text-white p-7 sm:p-10 shadow-2xl border border-emerald-800">
				<div class="relative z-10 max-w-3xl space-y-4">
					
					<!-- Header Tag & Stethoscope -->
					<div class="flex items-center gap-3">
						<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C99738]/20 text-[#C99738] text-2xl border border-[#C99738]/30">
							🩺
						</span>
						<span class="text-xs font-black tracking-wider text-[#C99738] uppercase">
							رأي اختصاصي معتمد
						</span>
					</div>

					<!-- Quote -->
					<blockquote class="font-display text-base sm:text-lg lg:text-xl font-bold leading-relaxed text-stone-100">
						"تركيبة NOVAVITA تعتمد على التغذية الخلوية الدقيقة بجرعات مدروسة سريرياً وقابلة للامتصاص السريع عبر البكتين النباتي. هذا المفهوم هو الحل الأمثل للمرأة في المغرب التي تعاني من نقص المغذيات وتأثير ملوحة المياه والتوتر اليومي."
					</blockquote>

					<!-- Signature -->
					<div class="pt-2 text-xs sm:text-sm font-semibold text-stone-300">
						د. غيثة التازي • أخصائية تغذية علاجية معتمدة
					</div>

				</div>
			</div>

		</div>

		<!-- ========================================================================= -->
		<!-- 10. Social Proof Numbers (شبكة الأرقام والإثبات الاجتماعي) -->
		<!-- ========================================================================= -->
		<div class="mt-16 sm:mt-24 px-4 sm:px-0">
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				<div class="rounded-3xl bg-white p-6 sm:p-7 border border-stone-200/80 shadow-md text-center space-y-1">
					<div class="font-display text-3xl sm:text-4xl font-black text-[#1B4332]">+1,450</div>
					<div class="text-xs sm:text-sm font-bold text-stone-600">سيدة مغربية راضية</div>
				</div>
				<div class="rounded-3xl bg-white p-6 sm:p-7 border border-stone-200/80 shadow-md text-center space-y-1">
					<div class="font-display text-3xl sm:text-4xl font-black text-[#1B4332]">+40</div>
					<div class="text-xs sm:text-sm font-bold text-stone-600">دراسة سريرية تدعم المكونات</div>
				</div>
				<div class="rounded-3xl bg-white p-6 sm:p-7 border border-stone-200/80 shadow-md text-center space-y-1">
					<div class="font-display text-3xl sm:text-4xl font-black text-[#F59E0B]">4.9 ★</div>
					<div class="text-xs sm:text-sm font-bold text-stone-600">متوسط تقييم العميلات</div>
				</div>
				<div class="rounded-3xl bg-white p-6 sm:p-7 border border-stone-200/80 shadow-md text-center space-y-1">
					<div class="font-display text-3xl sm:text-4xl font-black text-emerald-700">100%</div>
					<div class="text-xs sm:text-sm font-bold text-stone-600">ضمان المعاينة عند الباب</div>
				</div>
			</div>
		</div>

	</main>

	<!-- ========================================================================= -->
	<!-- 11. Sticky Mobile CTA Bar (Fixed Bottom on Mobile) -->
	<!-- ========================================================================= -->
	<div class="fixed bottom-0 inset-x-0 z-40 bg-[#143427] text-white p-3 sm:hidden shadow-2xl border-t border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
		<div class="flex flex-col text-start ps-1">
			<span class="text-[11px] text-stone-300 font-semibold">باقة العناية المختارة</span>
			<span class="font-black text-base text-[#FAF8F5]" dir="ltr">{currentTier.price} MAD</span>
		</div>
		<button
			type="button"
			onclick={handleAddToCartAndOpenDrawer}
			class="flex-1 min-h-12 rounded-xl bg-[#E86A7C] hover:bg-[#d45366] active:scale-95 text-white font-black text-sm px-4 shadow-md flex items-center justify-center gap-1.5 transition-all"
		>
			<span>ابدئي روتينك الآن ⚡</span>
			<span>←</span>
		</button>
	</div>

	<!-- Slide-Out Cart Drawer & 99 MAD Upsell Funnel -->
	<CartDrawer />

</div>
