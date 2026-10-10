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

	// Tier Selection
	let selectedTier = $state<'tier_1' | 'tier_2' | 'tier_3'>('tier_2');
	const currentTier = $derived(PRICING_TIERS[selectedTier]);

	function handleAddToCartAndOpenDrawer() {
		cart.setMainItem({
			slug: product.slug,
			sku: product.sku,
			title: `${product.name} (${currentTier.title})`,
			image: product.image,
			price: currentTier.price,
			tier: selectedTier,
			tierTitle: currentTier.title
		});
		cartUi.openDrawer();
	}
</script>

<svelte:head>
	<title>{product.name} | NOVAVITA</title>
	<meta name="description" content={product.headline} />
</svelte:head>

<div class="min-h-screen bg-[#FAF8F5] font-body text-[#1F2937] pb-20 md:pb-12" dir="rtl">
	<!-- 1. Top Announcement Bar -->
	<AnnouncementBar isStatic={false} />

	<!-- 2. Sticky Header -->
	<Header
		brandName="NOVAVITA"
		cartCount={cart.count}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => cartUi.openDrawer()}
	/>

	<!-- 3. Main Product Showcase & Buying Box -->
	<main class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
			
			<!-- Left Column (Desktop): Media & Thumbnail Gallery -->
			<div class="lg:col-span-6 space-y-4">
				<!-- Main Stage Viewport -->
				<div class="relative aspect-square w-full rounded-3xl bg-white p-6 sm:p-10 shadow-xl border-2 border-emerald-950/10 flex items-center justify-center overflow-hidden group">
					<img
						src={activeImage}
						alt={product.name}
						class="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
						onerror={(e: any) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = '/images/products/gummies_collagen.svg';
						}}
					/>
					<div class="absolute top-4 end-4 bg-[#E86A7C] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md">
						{product.badge}
					</div>
				</div>

				<!-- Thumbnails Strip -->
				<div class="flex items-center gap-3 overflow-x-auto pb-2">
					{#each product.gallery as imgUrl}
						<button
							type="button"
							onclick={() => (activeImage = imgUrl)}
							class={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 p-2 shrink-0 transition-all cursor-pointer ${
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

				<!-- Trust Value Micro-grid -->
				<div class="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs font-bold text-stone-700">
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

			<!-- Right Column (Desktop): Pricing, Tier Selector & 1-Step COD Form -->
			<div id="product-order-box" class="lg:col-span-6 space-y-6 scroll-mt-24">
				
				<!-- Heading & Rating -->
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<div class="flex text-[#F59E0B] gap-0.5">
							{#each Array(5) as _}
								<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{/each}
						</div>
						<span class="text-xs sm:text-sm font-bold text-stone-600">
							<strong>{product.rating} / 5</strong> ({product.reviewCount} تقييم مغربية معتمدة)
						</span>
					</div>
					<h1 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
						{product.name}
					</h1>
					<p class="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
						{product.headline}
					</p>
					<div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
						<span>🍓 النكهة:</span>
						<span>{product.flavor}</span>
					</div>
				</div>

				<!-- Interactive 3-Tier Bundle Selector -->
				<div class="space-y-3 pt-2">
					<span class="block text-xs font-black text-stone-700">اختاري باقتك المناسبة:</span>

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
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_1' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_1'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm text-[#1F2937]">باقة التجربة (علبة واحدة)</div>
								<div class="text-[11px] text-stone-500">كورس شهر تجريبي (25 علكة مضغ شهية)</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-lg text-[#1B4332]" dir="ltr">199 MAD</div>
							<div class="text-[10px] text-stone-400 line-through" dir="ltr">299 MAD</div>
						</div>
					</button>

					<!-- Tier 2 (Preselected) -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_2')}
						class={`relative w-full p-4 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_2'
								? 'border-[#1B4332] ring-4 ring-[#1B4332]/20 shadow-xl -translate-y-0.5'
								: 'border-[#1B4332]/50 hover:border-[#1B4332]'
						}`}
					>
						<div class="absolute -top-3 end-4 bg-[#1B4332] text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
							⭐ الأكثر طلباً - توفير 119 درهم
						</div>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_2'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm text-[#1F2937]">باقة الثنائي (علبتان)</div>
								<div class="text-[11px] text-emerald-700 font-bold">كورس شهرين (50 علكة) + توصيل فابور مجاني 🚚</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-xl text-[#1B4332]" dir="ltr">279 MAD</div>
							<div class="text-[10px] text-stone-400 line-through" dir="ltr">398 MAD</div>
						</div>
					</button>

					<!-- Tier 3 -->
					<button
						type="button"
						onclick={() => (selectedTier = 'tier_3')}
						class={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-start transition-all cursor-pointer bg-white ${
							selectedTier === 'tier_3'
								? 'border-[#1B4332] ring-2 ring-[#1B4332]/20 shadow-md'
								: 'border-stone-200 hover:border-stone-300'
						}`}
					>
						<div class="flex items-center gap-3">
							<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
								{#if selectedTier === 'tier_3'}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<div>
								<div class="font-bold text-sm text-[#1F2937]">التحول الشامل (3 علب)</div>
								<div class="text-[11px] text-amber-700 font-bold">كورس 3 أشهر (75 علكة) + هدية فرشاة مساج الفروة 🎁</div>
							</div>
						</div>
						<div class="text-end">
							<div class="font-black text-lg text-[#1B4332]" dir="ltr">349 MAD</div>
							<div class="text-[10px] text-stone-400 line-through" dir="ltr">597 MAD</div>
						</div>
					</button>
				</div>

				<!-- Doorstep Inspection Risk-Reversal Guarantee Card -->
				<div class="rounded-3xl border-2 border-emerald-900/20 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-5 sm:p-6 shadow-md space-y-3">
					<div class="flex items-center gap-3">
						<span class="text-3xl">🛡️</span>
						<div>
							<h4 class="font-display text-base font-black text-[#1B4332]">
								ضمان المعاينة الكاملة عند باب دارك
							</h4>
							<p class="text-[11px] font-bold text-emerald-800">
								حقكِ القانوني والأخلاقي محفوظ بالكامل قبل دفع أي درهم
							</p>
						</div>
					</div>
					<p class="text-xs sm:text-sm font-semibold text-stone-700 leading-relaxed border-t border-emerald-900/10 pt-2.5">
						عند وصول الموزع، افتحي الطرد وعايني علب NOVAVITA وتأكدي من سلامتها وختم الأمان بنفسك قبل دفع أي درهم. ثقتكِ وراحتكِ هي أولويتنا الأولى.
					</p>
					<div class="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] sm:text-xs font-black text-emerald-900">
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">📦 عايني الطرد أولاً</div>
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">💵 الدفع بعد التأكد</div>
						<div class="p-2 rounded-xl bg-white/90 border border-emerald-900/10">🔄 إرجاع فوري مريح</div>
					</div>
				</div>

				<!-- High-Converting Primary Action Box (Alpha Style -> Triggers Cart Drawer) -->
				<div class="rounded-3xl bg-white p-5 sm:p-7 border-2 border-emerald-950/15 shadow-xl space-y-4">
					<div class="flex justify-between items-center border-b border-stone-100 pb-3">
						<div>
							<h3 class="font-bold text-sm sm:text-base text-[#1B4332]">الباقة المختارة</h3>
							<p class="text-[11px] text-stone-500">{currentTier.title}</p>
						</div>
						<div class="text-end">
							<span class="text-xs text-stone-400">المجموع:</span>
							<div class="font-mono font-black text-2xl text-[#E86A7C]">{currentTier.price} MAD</div>
						</div>
					</div>

					<div class="space-y-2.5 pt-1">
						<!-- Primary CTA Button -->
						<button
							type="button"
							onclick={handleAddToCartAndOpenDrawer}
							class="w-full min-h-14 sm:min-h-15 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
						>
							<span>اطلبي الآن • الدفع عند الاستلام 🛍️</span>
							<span class="text-lg transition-transform group-hover:-translate-x-1">←</span>
						</button>

						<!-- Secondary / Upsell Hook Button -->
						<button
							type="button"
							onclick={handleAddToCartAndOpenDrawer}
							class="w-full min-h-11 rounded-xl bg-white border-2 border-[#E86A7C]/40 hover:bg-rose-50/50 active:scale-[0.98] font-black text-[#E86A7C] text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
						>
							<span>+ أضيفي إلى السلة واستفيدي من عرض 99 DH 🛒</span>
						</button>
					</div>

					<div class="flex items-center justify-center gap-4 text-[11px] font-bold text-stone-500 pt-2 border-t border-stone-100">
						<span class="flex items-center gap-1">🚚 توصيل فابور</span>
						<span class="flex items-center gap-1">📦 معاينة قبل الدفع</span>
						<span class="flex items-center gap-1">🌿 بكتين حلال 100%</span>
					</div>
				</div>

			</div>
		</div>

		<!-- 4. Regulatory Proof & Scientific Certifications Bar -->
		<div class="mt-16 sm:mt-24 space-y-12 border-t border-stone-200/80 pt-12">
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-black text-[#1B4332] border border-emerald-900/10">
					🔬 معايير التصنيع والسلامة الدوائية
				</span>
				<h2 class="font-display text-2xl sm:text-3xl font-black text-[#1B4332]">
					أعلى شهادات الجودة والنقاء العالمية
				</h2>
				<p class="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
					تُصنّع منتجات NOVAVITA في مختبرات حاصلة على أعلى الاعتمادات العالمية لضمان سلامتكِ ونتائج ملموسة تبدأ من الخلايا.
				</p>
			</div>

			<!-- 4 Regulatory Badges Grid -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-sm space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-2xl">🔬</span>
						<span class="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">GMP</span>
					</div>
					<h3 class="font-bold text-sm text-[#1B4332]">تصنيع دوائي معتمد</h3>
					<p class="text-[11px] text-stone-500 leading-relaxed">ممارسات تصنيع عالمية دقيقة لضمان أعلى درجات النقاء.</p>
				</div>
				<div class="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-sm space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-2xl">🌿</span>
						<span class="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">100% HALAL</span>
					</div>
					<h3 class="font-bold text-sm text-[#1B4332]">حلال وبكتين فواكه</h3>
					<p class="text-[11px] text-stone-500 leading-relaxed">خالٍ تماماً من الجيلاتين الخنزيري والدهون المشبوهة.</p>
				</div>
				<div class="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-sm space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-2xl">🧪</span>
						<span class="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">LAB TESTED</span>
					</div>
					<h3 class="font-bold text-sm text-[#1B4332]">فحص مخبري للنقاء</h3>
					<p class="text-[11px] text-stone-500 leading-relaxed">خالٍ من المعادن الثقيلة والملونات الصناعية الضارة.</p>
				</div>
				<div class="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-sm space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-2xl">🛡️</span>
						<span class="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">SAFETY</span>
					</div>
					<h3 class="font-bold text-sm text-[#1B4332]">سلامة غذائية مطابقة</h3>
					<p class="text-[11px] text-stone-500 leading-relaxed">مطابقة لمعايير السلامة الصحية المغربية والدولية.</p>
				</div>
			</div>

			<!-- Product-Specific Zig-Zag Deep Dive Card -->
			<div class="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-10 shadow-lg">
				{#if product.sku === 'gummies_biotine'}
					<!-- Biotin Deep Dive: Alternating Layout (Image/Visual Left, Moroccan Angle Right) -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
						<div class="lg:col-span-7 lg:order-1 space-y-4">
							<span class="inline-block text-xs font-black text-[#E86A7C] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
								💧 واقع الشعر بالمغرب وماء الكالكير
							</span>
							<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] leading-tight">
								علاش كيطيح ليك شعرك وخا كاديري الزيوت والشامبوانات الغالية؟
							</h3>
							<p class="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
								الماء القاسي الكلسي ("الكالكير") فمعظم المدن المغربية، السيشوار المتكرر والتوتر كيسد مسام الفروة وكيجفف الزغبة من برا. الزيوت كترطب غير القشرة الخارجية، ولكن البصيلة كتموت من الداخل بسبب نقص الكيراتين والبيوتين.
							</p>
							<div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
								<div class="font-black text-xs sm:text-sm text-[#1B4332]">الحل العلمي لـ NOVAVITA Biotin:</div>
								<p class="text-xs text-stone-700 leading-relaxed">
									جرعة صيدلانية دقيقة (3000 mcg بيوتين + زنك وفيتامين C) كتوصل عبر الدورة الدموية مباشرة لقاع البصيلة، كتوقف التساقط فظرف 3 أسابيع، وكتفرّخ البيبي هير فالفراغات بدون ما تزيد شعر الجسم.
								</p>
							</div>
						</div>
						<div class="lg:col-span-5 lg:order-2 flex justify-center">
							<div class="relative w-full max-w-sm aspect-square rounded-3xl bg-stone-50 p-6 border border-stone-200 flex items-center justify-center">
								<img src="/images/products/gummies_biotine.svg" alt="علكات البيوتين" class="w-4/5 h-4/5 object-contain drop-shadow-xl" />
								<div class="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-stone-200 text-center text-xs font-black text-stone-800 shadow-sm">
									🍓 3000 mcg بيوتين نقي + زنك وفيتامين C
								</div>
							</div>
						</div>
					</div>
				{:else if product.sku === 'gummies_collagen'}
					<!-- Collagen Deep Dive: Alternating Layout (Image/Visual Left, Collagen Loss Angle Right) -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
						<div class="lg:col-span-7 lg:order-1 space-y-4">
							<span class="inline-block text-xs font-black text-[#1B4332] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
								⏳ حقيقة الشيخوخة ونقص الكولاجين بعد سن 25
							</span>
							<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] leading-tight">
								علاش الكريمات السطحية ما كاتعطيكش نضارة دائمة؟
							</h3>
							<p class="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
								ابتداءً من سن 25 سنة، كيفقد جسم المرأة 1% من الكولاجين سنوياً. جزيئات الكريمات كتكون كبيرة بزاف وما كاتقدرش تخترق حاجز الأدمة العميقة، داكشي علاش النتيجة كتبقى مؤقتة والشحوب كيرجع.
							</p>
							<div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
								<div class="font-black text-xs sm:text-sm text-[#1B4332]">الحل العلمي لـ NOVAVITA Collagen:</div>
								<p class="text-xs text-stone-700 leading-relaxed">
									كولاجين بحري متحلل بجزيئات ببتيدية دقيقة كيمتصها الجهاز الهضمي بنسبة 95%، مدمجة بحمض الهيالورونيك باش تحبس الماء داخل خلايا الجلد، تملا الخطوط التعبيرية وتعطيك نضارة ملفتة من الداخل.
								</p>
							</div>
						</div>
						<div class="lg:col-span-5 lg:order-2 flex justify-center">
							<div class="relative w-full max-w-sm aspect-square rounded-3xl bg-stone-50 p-6 border border-stone-200 flex items-center justify-center">
								<img src="/images/products/gummies_collagen.svg" alt="علكات الكولاجين" class="w-4/5 h-4/5 object-contain drop-shadow-xl" />
								<div class="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-stone-200 text-center text-xs font-black text-stone-800 shadow-sm">
									🫐 كولاجين بحري متحلل + حمض الهيالورونيك
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Multivitamin Deep Dive: Alternating Layout -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
						<div class="lg:col-span-7 lg:order-1 space-y-4">
							<span class="inline-block text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
								⚡ وداعاً للإرهاق والكبسولات الصيدلانية الكبيرة
							</span>
							<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] leading-tight">
								كيفاش تحافظي على طاقتك ونشاطك بدون أدوية ثقيلة على المعدة؟
							</h3>
							<p class="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
								الروتين السريع وتغذيتنا اليومية ما كاتغطيش كل الفيتامينات الأساسية. أغلب النساء كيكرهو الكبسولات الصيدلانية الضخمة اللي كتسبب غثيان وحرقة فالمعدة وكيقطعو الكورس من السيمانة الأولى.
							</p>
							<div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
								<div class="font-black text-xs sm:text-sm text-amber-900">الحل العلمي لـ NOVAVITA Multivitamin:</div>
								<p class="text-xs text-stone-700 leading-relaxed">
									13 فيتامين ومعدن أساسي مع مجموعة B-Complex كاملة وحمض الفوليك، فـ 2 علكات فواكه لذيذة كتمضغيهم مع الصباح وكتعطي لجسمك طاقة ومناعة قوية طوال اليوم.
								</p>
							</div>
						</div>
						<div class="lg:col-span-5 lg:order-2 flex justify-center">
							<div class="relative w-full max-w-sm aspect-square rounded-3xl bg-stone-50 p-6 border border-stone-200 flex items-center justify-center">
								<img src="/images/products/gumies_vitamine.svg" alt="علكات الملتي فيتامين" class="w-4/5 h-4/5 object-contain drop-shadow-xl" />
								<div class="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-stone-200 text-center text-xs font-black text-stone-800 shadow-sm">
									🍊 13 فيتامين ومعدن + B-Complex كامل
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Benefits Card -->
				<div class="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/80 shadow-md space-y-4">
					<h3 class="font-bold text-base sm:text-lg text-[#1B4332] flex items-center gap-2">
						<span>✨</span> الفوائد المضمونة لـ {product.name}
					</h3>
					<ul class="space-y-3 text-xs sm:text-sm text-stone-700">
						{#each product.keyBenefits as b}
							<li class="flex items-start gap-2.5">
								<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mt-0.5">✓</span>
								<span class="font-semibold leading-relaxed">{b}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Ingredients Card -->
				<div class="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/80 shadow-md space-y-4">
					<h3 class="font-bold text-base sm:text-lg text-[#1B4332] flex items-center gap-2">
						<span>🔬</span> المكونات الفعالة النشطة
					</h3>
					<div class="flex flex-wrap gap-2 pt-2">
						{#each product.ingredients as ing}
							<span class="px-3.5 py-1.5 rounded-xl bg-emerald-950/5 border border-emerald-900/10 text-xs font-bold text-[#1B4332]">
								{ing}
							</span>
						{/each}
					</div>
					<p class="text-xs text-stone-500 leading-relaxed pt-2">
						خالٍ تماماً من المواد الحافظة الصناعية، الجيلاتين الحيواني الخنزيري، الجلوتين والسكريات المضافة المضرة.
					</p>
				</div>
			</div>
		</div>

		<!-- 5. Product Specific FAQ Accordion -->
		<div class="mt-16 sm:mt-20 max-w-3xl mx-auto space-y-6">
			<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] text-center">
				أسئلة متكررة حول {product.name}
			</h3>
			<div class="space-y-3">
				{#each product.faq as f}
					<details class="group rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
						<summary class="flex cursor-pointer items-center justify-between font-bold text-xs sm:text-sm text-stone-800 select-none">
							<span>{f.question}</span>
							<span class="transition-transform group-open:rotate-180 text-emerald-800 font-bold">▼</span>
						</summary>
						<p class="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3 font-medium">
							{f.answer}
						</p>
					</details>
				{/each}
			</div>
		</div>

		<!-- Footer -->
		<footer class="mt-16 border-t border-stone-200/80 pt-8 pb-16 text-center text-xs text-stone-500">
			<p>جميع الحقوق محفوظة © NOVAVITA {new Date().getFullYear()}</p>
		</footer>

	</main>

	<!-- Sticky Mobile Bottom CTA Bar -->
	<aside
		class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3"
		aria-label="شريط الشراء السريع"
	>
		<div>
			<div class="text-[10px] text-stone-400 font-medium">المجموع (توصيل فابور):</div>
			<div class="font-mono font-black text-lg text-[#1B4332]">{currentTier.price} MAD</div>
		</div>
		<button
			type="button"
			onclick={handleAddToCartAndOpenDrawer}
			class="flex-1 py-3 px-4 rounded-xl bg-[#E86A7C] font-black text-white text-xs shadow-lg active:scale-95 text-center cursor-pointer hover:bg-[#d95366] transition-colors"
		>
			<span>اطلبي الآن كاش 🛍️</span>
		</button>
	</aside>

	<!-- Cart Drawer -->
	<CartDrawer />
</div>
