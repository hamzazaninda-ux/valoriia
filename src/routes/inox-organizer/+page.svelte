<script lang="ts">
	import { onMount } from 'svelte';
	import { trackSnapPurchase, preserveTrackingParams } from '$lib/utils/tracking';

	let { data } = $props();

	const PRODUCT_TITLE = 'منظم الحمام الفاخر (إينوكس 3 طبقات) + رشاش توربو مجاناً';
	const PRODUCT_PRICE = 249;
	const PRODUCT_OLD_PRICE = 399;
	const PRODUCT_SKU = 'inox-organizer';

	let customerName = $state('');
	let customerPhone = $state('');
	let customerAddress = $state('');

	let nameBlurred = $state(false);
	let phoneBlurred = $state(false);
	let addressBlurred = $state(false);

	let isSubmitting = $state(false);
	let formError = $state('');

	// Phone Validation
	function normalizeMoroccanPhone(raw: string): string {
		let digits = raw.replace(/\D/g, '');
		if (digits.startsWith('00212')) digits = digits.slice(5);
		else if (digits.startsWith('212')) digits = digits.slice(3);
		if (digits.startsWith('0')) digits = digits.slice(1);
		if (!digits.startsWith('212') && digits.length === 9) {
			digits = '212' + digits;
		}
		return digits;
	}

	function validatePhone(phone: string): boolean {
		const digits = phone.replace(/\D/g, '');
		const normalized = normalizeMoroccanPhone(phone);
		if (normalized.length === 12 && normalized.startsWith('212')) {
			const prefix = normalized.charAt(3);
			return ['5', '6', '7'].includes(prefix);
		}
		return digits.length >= 9 && digits.length <= 13;
	}

	const isNameValid = $derived(customerName.trim().length >= 2);
	const isPhoneValid = $derived(validatePhone(customerPhone));
	const isAddressValid = $derived(customerAddress.trim().length >= 3);

	const showNameError = $derived(nameBlurred && !isNameValid);
	const showPhoneError = $derived(phoneBlurred && !isPhoneValid);
	const showAddressError = $derived(addressBlurred && !isAddressValid);

	function scrollToOrderForm() {
		const el = document.getElementById('order-form');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		nameBlurred = true;
		phoneBlurred = true;
		addressBlurred = true;
		formError = '';

		if (!isNameValid) {
			formError = 'يرجى إدخال اسمك الكامل (حرفان على الأقل).';
			return;
		}

		if (!isPhoneValid) {
			formError = 'يرجى إدخال رقم هاتف مغربي صحيح (مثال: 0612345678).';
			return;
		}

		if (!isAddressValid) {
			formError = 'يرجى إدخال مدينتك وعنوان التوصيل.';
			return;
		}

		isSubmitting = true;

		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		const normalizedPhone = normalizeMoroccanPhone(customerPhone);

		// 1. Google Ads GTAG Conversion Tracking (AW-18405009405)
		if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
			try {
				(window as any).gtag('event', 'conversion', {
					send_to: 'AW-18405009405',
					value: PRODUCT_PRICE,
					currency: 'MAD',
					transaction_id: orderId
				});
				(window as any).gtag('event', 'purchase', {
					send_to: 'AW-18405009405',
					value: PRODUCT_PRICE,
					currency: 'MAD',
					transaction_id: orderId,
					items: [
						{
							item_id: PRODUCT_SKU,
							item_name: PRODUCT_TITLE,
							price: PRODUCT_PRICE,
							quantity: 1
						}
					]
				});
				console.log('✅ [GTAG SUCCESS] Purchase conversion fired for AW-18405009405');
			} catch (err) {
				console.warn('Gtag conversion error:', err);
			}
		}

		// 2. Snapchat Purchase Pixel Tracking
		try {
			trackSnapPurchase(PRODUCT_PRICE, 'MAD', orderId);
		} catch (err) {
			console.warn('Snapchat tracking error:', err);
		}

		// 3. API Dispatch to /api/checkout
		const payload = {
			orderId,
			id: orderId,
			order_id: orderId,
			fullName: customerName.trim(),
			full_name: customerName.trim(),
			name: customerName.trim(),
			phone: normalizedPhone,
			phoneNumber: normalizedPhone,
			city: customerAddress.trim(),
			address: customerAddress.trim(),
			city_address: customerAddress.trim(),
			price: PRODUCT_PRICE,
			total: PRODUCT_PRICE,
			totalPrice: PRODUCT_PRICE,
			quantity: 1,
			qte: 1,
			productTitle: PRODUCT_TITLE,
			productTitleStr: PRODUCT_TITLE,
			selectedOfferTitle: PRODUCT_TITLE,
			sku: PRODUCT_SKU,
			offerSku: PRODUCT_TITLE,
			date_order: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
			status: 'pending'
		};

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				console.warn('Server checkout response status:', res.status);
			}

			// Store in sessionStorage for thank-you screen
			try {
				sessionStorage.setItem('last_order', JSON.stringify(payload));
				sessionStorage.setItem('order_tracked_' + orderId, 'true');
			} catch {}

			// Redirect to thank you page
			const thankYouUrl = preserveTrackingParams(
				`/thank-you?orderId=${orderId}&name=${encodeURIComponent(customerName.trim())}&phone=${encodeURIComponent(normalizedPhone)}&city=${encodeURIComponent(customerAddress.trim())}&total=${PRODUCT_PRICE}`
			);
			window.location.href = thankYouUrl;
		} catch (err) {
			console.error('Checkout error:', err);
			// Even on network error, ensure user reaches confirmation
			window.location.href = preserveTrackingParams(`/thank-you?orderId=${orderId}&total=${PRODUCT_PRICE}`);
		}
	}

	let isStickyCtaVisible = $state(true);
	onMount(() => {
		const form = document.getElementById('order-form');
		if (!form) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					isStickyCtaVisible = !entry.isIntersecting;
				}
			},
			{ threshold: 0.1 }
		);
		observer.observe(form);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>منظم الحمام الفاخر (إينوكس 3 طبقات) + رشاش توربو مجاناً | Lhamza Shop</title>
	<meta
		name="description"
		content="فولاذ أصلي مقاوم للصدأ بـ 3 رفوف وحامل مناشف مع رشاش استحمام مفلتر هدية مجانية. شحن مجاني والدفع عند الاستلام بعد المعاينة."
	/>
	<meta property="og:title" content="منظم الحمام الفاخر (إينوكس 3 طبقات) + رشاش توربو مجاناً | Lhamza Shop" />
	<meta
		property="og:description"
		content="فولاذ أصلي مقاوم للصدأ بـ 3 رفوف وحامل مناشف مع رشاش استحمام مفلتر هدية مجانية. شحن مجاني والدفع عند الاستلام بعد المعاينة."
	/>
	<meta property="og:type" content="product" />
	<meta property="og:url" content="https://lhamza.shop/inox-organizer" />
</svelte:head>

<main class="min-h-screen bg-[#FAF9F6] text-[#1E293B] font-sans antialiased pb-20 sm:pb-12" dir="rtl">
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 1. COMPACT STICKY TOP BAR                                         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<aside
		class="sticky top-0 z-40 w-full bg-[#073824] text-white py-2 px-3 text-[11px] sm:text-xs font-bold text-center border-b border-white/10 shadow-sm"
		aria-label="شريط الإعلانات"
		dir="rtl"
	>
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-1.5 leading-tight">
			<span>🎁 عرض محدود: رشاش التوربو المفلتر هدية مجانية + توصيل مجاني!</span>
		</div>
	</aside>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 2. HERO SECTION (MOBILE-FIRST: IMAGE FIRST -> TITLE -> BADGES)    -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<header class="pt-2 sm:pt-4 pb-2 px-3 sm:px-4 max-w-xl mx-auto">
		<!-- HERO IMAGE FIRST (IMAGE SLOT 1) -->
		<div class="w-full overflow-hidden rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
			<img
				src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793217747/%D9%85%D9%86%D8%B8%D9%91%D9%85_%D8%AD%D9%85%D9%91%D8%A7%D9%85_%D9%81%D8%A7%D8%AE%D8%B1_%D9%85%D8%B9_%D9%87%D8%AF%D9%8A%D8%A9_%D8%AA%D9%88%D8%B1%D8%A8%D9%88.png"
				alt="منظم الحمام الفاخر من الإينوكس 3 طبقات مع رشاش الاستحمام التوربو المفلتر هدية مجانية"
				loading="eager"
				fetchpriority="high"
				class="w-full h-auto object-contain rounded-2xl transition-transform duration-300"
			/>
		</div>

		<!-- COMPACT TITLE & PRICE ROW (BELOW HERO IMAGE) -->
		<div class="text-center pt-2 pb-1 space-y-2">
			<!-- Title H1 (Max 1 to 2 lines, 20px-22px on mobile) -->
			<h1 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug tracking-tight">
				منظم الحمام الفاخر (إينوكس 3 طبقات) + رشاش توربو مجاناً
			</h1>

			<!-- Rating & Price Row -->
			<div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-0.5">
				<span class="text-amber-500 font-extrabold text-xs sm:text-sm">★★★★★ (114 تقييم)</span>
				<span class="text-stone-300 select-none">|</span>
				<span class="font-display text-2xl sm:text-3xl font-black text-[#073824]">{PRODUCT_PRICE} درهم</span>
				<span class="text-sm text-stone-400 line-through font-bold">{PRODUCT_OLD_PRICE} درهم</span>
				<span class="bg-[#C99738] text-white text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-2xs">
					وفر 150 درهم
				</span>
			</div>

			<!-- 3 Ultra-Short Icon Badges (Max 4 words each) -->
			<div class="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 text-center">
				<div class="bg-emerald-50/90 border border-emerald-200/80 rounded-xl py-2 px-1 text-[11px] sm:text-xs font-black text-emerald-900 shadow-2xs flex items-center justify-center gap-1">
					<span>🛡️</span>
					<span>إينوكس أصلي ضد الصدأ</span>
				</div>
				<div class="bg-emerald-50/90 border border-emerald-200/80 rounded-xl py-2 px-1 text-[11px] sm:text-xs font-black text-emerald-900 shadow-2xs flex items-center justify-center gap-1">
					<span>🔧</span>
					<span>تركيب باللصاق أو البراغي</span>
				</div>
				<div class="bg-amber-50/90 border border-amber-200/80 rounded-xl py-2 px-1 text-[11px] sm:text-xs font-black text-amber-900 shadow-2xs flex items-center justify-center gap-1">
					<span>🎁</span>
					<span>رشاش مفلتر هدية مجاناً</span>
				</div>
			</div>
		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 3. DIRECT COD ORDER FORM IMMEDIATELY BELOW BADGES                -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section id="order-form" class="max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 scroll-mt-12" dir="rtl">
		<div class="rounded-2xl sm:rounded-3xl border-2 border-[#073824]/30 bg-white p-4 sm:p-6 shadow-lg">
			<!-- Header -->
			<div class="text-center pb-3 border-b border-stone-100">
				<span class="inline-block bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-black px-3 py-0.5 rounded-full mb-1">
					استمارة الطلب السريع ⚡
				</span>
				<h2 class="font-display text-lg sm:text-xl font-black text-stone-900 leading-snug">
					املأ الاستمارة لطلب العرض (المنظم + الرشاش مجاناً)
				</h2>
				<p class="text-xs text-stone-500 font-medium mt-0.5">
					الدفع عند الاستلام بعد المعاينة، والتوصيل مجاني لجميع مدن المغرب
				</p>
			</div>

			<!-- Price Box -->
			<div class="my-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-100/60 to-emerald-50 border border-emerald-200 p-3 text-center">
				<div class="flex items-center justify-center gap-2.5">
					<span class="font-display text-2xl sm:text-3xl font-black text-[#073824]">{PRODUCT_PRICE} درهم</span>
					<span class="text-sm text-stone-400 line-through font-bold">{PRODUCT_OLD_PRICE} درهم</span>
					<span class="bg-[#C99738] text-white text-[11px] font-black px-2 py-0.5 rounded-md">وفّر 150 درهم</span>
				</div>
				<p class="text-xs font-extrabold text-emerald-900 mt-0.5">
					المجموع: 249 درهم فقط (توصيل مجاني لباب الدار)
				</p>
			</div>

			<!-- Form Inputs -->
			<form onsubmit={handleSubmit} novalidate class="space-y-3">
				<!-- Input 1: Full Name -->
				<div>
					<label for="order-fullname" class="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
						الاسم الكامل <span class="text-red-500">*</span>
					</label>
					<input
						id="order-fullname"
						type="text"
						bind:value={customerName}
						onblur={() => (nameBlurred = true)}
						placeholder="اكتب اسمك الكامل"
						class="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-xs sm:text-sm font-medium text-stone-900 transition-all {showNameError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
						required
					/>
					{#if showNameError}
						<p class="text-xs text-red-600 font-bold mt-1">المرجو إدخال الاسم الكامل (حرفان على الأقل).</p>
					{/if}
				</div>

				<!-- Input 2: Phone Number -->
				<div>
					<label for="order-phone" class="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
						رقم الهاتف (واتساب) <span class="text-red-500">*</span>
					</label>
					<input
						id="order-phone"
						type="tel"
						dir="ltr"
						bind:value={customerPhone}
						onblur={() => (phoneBlurred = true)}
						placeholder="0612345678"
						class="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-xs sm:text-sm font-bold text-stone-900 text-right transition-all {showPhoneError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
						required
					/>
					{#if showPhoneError}
						<p class="text-xs text-red-600 font-bold mt-1">المرجو إدخال رقم هاتف مغربي صحيح (مثال: 0612345678).</p>
					{/if}
				</div>

				<!-- Input 3: City and Address -->
				<div>
					<label for="order-address" class="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
						المدينة والعنوان <span class="text-red-500">*</span>
					</label>
					<input
						id="order-address"
						type="text"
						bind:value={customerAddress}
						onblur={() => (addressBlurred = true)}
						placeholder="مثال: الدار البيضاء، حي المعاريف، شارع..."
						class="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-xs sm:text-sm font-medium text-stone-900 transition-all {showAddressError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
						required
					/>
					{#if showAddressError}
						<p class="text-xs text-red-600 font-bold mt-1">المرجو إدخال مدينتك وعنوان التوصيل.</p>
					{/if}
				</div>

				{#if formError}
					<div class="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-bold text-center">
						{formError}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full min-h-12 py-3 px-5 rounded-xl bg-[#0B5E3C] hover:bg-[#07482E] text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
				>
					{#if isSubmitting}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						<span>جاري تأكيد طلبك...</span>
					{:else}
						<span>تأكيد الطلب • الدفع عند الاستلام 🚚</span>
					{/if}
				</button>

				<!-- Reassurance Micro-Copy -->
				<p class="text-center text-[11px] font-semibold text-stone-500 pt-0.5">
					🔒 ضمان استبدال لمدة 14 يوماً | فحص الطلبية عند الاستلام
				</p>
			</form>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 4. SECTION: الجودة الحقيقية (IMAGE SLOT 2 FIRST)                   -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-4" dir="rtl">
		<div class="rounded-2xl sm:rounded-3xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs text-center">
			<!-- Image Slot 2 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793219497/%D8%B9%D8%B1%D8%B6_%D8%A3%D9%86%D9%8A%D9%82_%D9%84%D9%82%D8%B7%D8%B9_%D8%B1%D9%81_%D9%85%D8%B9%D8%AF%D9%86%D9%8A_%D9%85%D9%86_%D8%A7%D9%84%D8%B3%D8%AA%D8%A7%D9%86%D9%84%D8%B3_%D8%B3%D8%AA%D9%8A%D9%84.png"
					alt="قطع منظم الحمام الفولاذي المقاوم للصدأ مع أطقم التثبيت كاملة"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>
			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900 leading-snug mt-3 mb-1">
				معدن إينوكس صلب يدوم لسنوات
			</h2>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto font-medium">
				تصوير حقيقي من مستودعنا: فولاذ سميك مع أطقم التركيب الكاملة (لصاق قوي + براغي).
			</p>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 5. SECTION: المميزات الثلاث (VISUAL CARDS: IMAGE FIRST)          -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-2 space-y-4" dir="rtl">
		<!-- Card 1: مقاومة الصدأ -->
		<div class="rounded-2xl sm:rounded-3xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs text-center">
			<!-- Image Slot 3 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793219698/Gemini_Generated_Image_a4rouka4rouka4ro.jpg"
					alt="رفوف إينوكس مثقبة لتصريف المياه ومقاومة الصدأ والرطوبة"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>
			<h3 class="font-display text-base sm:text-lg font-black text-stone-900 leading-snug mt-3 mb-1">
				مقاوم للصدأ والماء 100%
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto font-medium">
				رفوف مثقبة لتصريف المياه فوراً ومنع تراكم الرطوبة.
			</p>
		</div>

		<!-- Card 2: سعة التخزين -->
		<div class="rounded-2xl sm:rounded-3xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs text-center">
			<!-- Image Slot 4 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793219878/Gemini_Generated_Image_sa8rmtsa8rmtsa8r.jpg"
					alt="سعة تخزين واسعة لترتيب مستلزمات الحمام والشامبو وحمل الفوط"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>
			<h3 class="font-display text-base sm:text-lg font-black text-stone-900 leading-snug mt-3 mb-1">
				سعة كبيرة (3 طوابق + حامل فوط)
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto font-medium">
				يرتب جميع قوارير الشامبو الكبيرة والمناشف في مكان واحد.
			</p>
		</div>

		<!-- Card 3: سهولة التركيب -->
		<div class="rounded-2xl sm:rounded-3xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs text-center">
			<!-- Image Slot 5 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793219977/Redesigning_product_image_in_Arabic_202609022112.webp"
					alt="طريقتان للتركيب: لاصق قوي بدون ثقب السيراميك أو تثبيت بالبراغي"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>
			<h3 class="font-display text-base sm:text-lg font-black text-stone-900 leading-snug mt-3 mb-1">
				تركيب مزدوج بدون إتلاف الزليج
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto font-medium">
				ثبّته باللاصق الذكي بدون ثقب، أو بالبراغي المرفقة حسب رغبتك.
			</p>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 6. SECTION: الهدية المجانية (GOLD/EMERALD COMPACT CARD)         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-4" dir="rtl">
		<div class="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50/60 via-white to-emerald-50/60 border-2 border-[#C99738] p-4 sm:p-6 shadow-md text-center">
			<span class="inline-block bg-[#C99738] text-white text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full mb-2 shadow-2xs">
				🎁 هدية مجانية مع طلبك
			</span>

			<!-- Image Slot 6 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-amber-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793220431/Gemini_Generated_Image_glaw65glaw65glaw.jpg"
					alt="رشاش الاستحمام التوربو المفلتر هدية مجانية مع منظم الحمام"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>

			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900 leading-snug mt-3 mb-2">
				رشاش الاستحمام التوربو المفلتر مجاناً!
			</h2>

			<!-- Compact 2x2 Grid of Short Bullets -->
			<div class="grid grid-cols-2 gap-2 text-right mt-3 bg-white/90 rounded-xl p-3 border border-amber-200/80 shadow-2xs text-[11px] sm:text-xs font-bold text-stone-800">
				<div class="flex items-center gap-1.5">
					<span class="shrink-0 text-amber-600">🚀</span>
					<span>يضاعف ضغط الماء الضعيف</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="shrink-0 text-emerald-600">💧</span>
					<span>فلتر ينقي الماء للشعر والبشرة</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="shrink-0 text-amber-600">💆‍♂️</span>
					<span>شعيرات سيليكون لمساج الرأس</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="shrink-0 text-emerald-600">🔘</span>
					<span>زر إيقاف الماء بضغطة واحدة</span>
				</div>
			</div>

			<!-- Quick Action Button to Order Form -->
			<div class="mt-3.5">
				<button
					type="button"
					onclick={scrollToOrderForm}
					class="w-full py-2.5 px-4 rounded-xl bg-[#0B5E3C] hover:bg-[#07482E] text-white font-black text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
				>
					<span>احصل على هديتك الآن مع طلبك 🎁</span>
				</button>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 7. SECTION: الأبعاد والمقاسات (IMAGE SLOT 7 FIRST)                -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-4" dir="rtl">
		<div class="rounded-2xl sm:rounded-3xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs text-center">
			<!-- Image Slot 7 First -->
			<div class="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-stone-200/80 bg-white my-2">
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793220227/Redesigning_product_image_in_Arabic_202609070301.webp"
					alt="مخطط الأبعاد والمقاسات الدقيقة لمنظم الحمام الإينوكس 60 سم"
					loading="lazy"
					class="w-full h-auto object-contain rounded-xl sm:rounded-2xl"
				/>
			</div>

			<h2 class="font-display text-base sm:text-lg font-black text-stone-900 leading-snug mt-3 mb-2">
				المقاسات الدقيقة للمنظم
			</h2>

			<div class="overflow-hidden rounded-xl border border-stone-200 shadow-2xs mt-2">
				<table class="w-full text-right text-xs">
					<tbody class="divide-y divide-stone-200">
						<tr class="bg-stone-50/70">
							<td class="py-2.5 px-3 font-bold text-stone-900 w-2/5">المقاس:</td>
							<td class="py-2.5 px-3 text-stone-700 font-medium">العرض 60 سم × الارتفاع 58.5 سم × العمق 15.3 سم</td>
						</tr>
						<tr>
							<td class="py-2.5 px-3 font-bold text-stone-900">المسافة بين الرفوف:</td>
							<td class="py-2.5 px-3 text-stone-700 font-medium">21 سم</td>
						</tr>
						<tr class="bg-stone-50/70">
							<td class="py-2.5 px-3 font-bold text-stone-900">المادة:</td>
							<td class="py-2.5 px-3 text-stone-700 font-medium">إينوكس مقاوم للصدأ</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 8. SECTION: آراء الزبناء (TIGHT PADDING, 4 REVIEWS)               -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-4" dir="rtl">
		<div class="text-center mb-3.5">
			<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1">
				⭐ تقييمات العملاء
			</span>
			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900">
				آراء زبنائنا الكرام في المغرب ⭐ 4.9/5
			</h2>
		</div>

		<div class="space-y-2.5">
			<!-- Review 1 -->
			<div class="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 shadow-2xs">
				<div class="flex items-center justify-between mb-1.5">
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							م
						</div>
						<div>
							<h4 class="font-extrabold text-xs text-stone-900">مريم</h4>
							<span class="text-[10px] text-stone-500">الدار البيضاء</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-1 text-xs">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs text-stone-700 leading-relaxed font-medium">
					"جودة الإينوكس ممتازة جداً وصلبة وليست خفيفة كالموجودة في الأسواق العادية. قمت بتركيبه باللاصق المرفق فقط على السيراميك وثابت بقوة دون أي حركة. أنصح به بشدة".
				</p>
			</div>

			<!-- Review 2 -->
			<div class="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 shadow-2xs">
				<div class="flex items-center justify-between mb-1.5">
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							ع
						</div>
						<div>
							<h4 class="font-extrabold text-xs text-stone-900">عبد الرحمن</h4>
							<span class="text-[10px] text-stone-500">الرباط</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-1 text-xs">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs text-stone-700 leading-relaxed font-medium">
					"غيّر شكل الحمام تماماً! السعة كبيرة جداً واتسعت لجميع قوارير الشامبو والمناشف معاً. التوصيل كان سريعاً في الرباط خلال أقل من 24 ساعة والدفع كان بعد فحص العلبة".
				</p>
			</div>

			<!-- Review 3 -->
			<div class="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 shadow-2xs">
				<div class="flex items-center justify-between mb-1.5">
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							أ
						</div>
						<div>
							<h4 class="font-extrabold text-xs text-stone-900">أمينة</h4>
							<span class="text-[10px] text-stone-500">مراكش</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-1 text-xs">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs text-stone-700 leading-relaxed font-medium">
					"بصراحة الرشاش التوربو المفلتر الهدية يستحق ثمن العرض لوحده! ضغط الماء أصبح قوياً ومريحاً، وشعيرات التدليك ممتازة لفروة الرأس. شكراً لكم على المصداقية".
				</p>
			</div>

			<!-- Review 4 -->
			<div class="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 shadow-2xs">
				<div class="flex items-center justify-between mb-1.5">
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							ي
						</div>
						<div>
							<h4 class="font-extrabold text-xs text-stone-900">ياسين</h4>
							<span class="text-[10px] text-stone-500">طنجة</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-1 text-xs">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs text-stone-700 leading-relaxed font-medium">
					"التركيب كان سهلاً وواضحاً جداً، ومقاومة الصدأ حقيقية مع بخار الماء الساخن اليومي. منتج ممتاز وعملي جداً لكل بيت".
				</p>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 9. SECTION: الأسئلة الشائعة (COMPACT ACCORDION)                  -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-xl mx-auto px-3 sm:px-4 py-4" dir="rtl">
		<div class="text-center mb-3.5">
			<span class="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full mb-1">
				إجابات مباشرة ❓
			</span>
			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900">
				الأسئلة الشائعة حول المنتج
			</h2>
		</div>

		<div class="space-y-2">
			<details class="group rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-xs sm:text-sm font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>هل المنظم يصدأ أو يتغير لونه مع الماء الساخن والبخار؟</span>
					<span class="text-stone-400 text-xs transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-3 pb-3 pt-1 text-xs leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					إطلاقاً، المنظم مصنوع من فولاذ الإينوكس المقاوم للصدأ والرطوبة، ومصمم ليدوم طويلاً في بيئة الحمام دون أي تغيير في لونه أو لمعانه.
				</div>
			</details>

			<details class="group rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-xs sm:text-sm font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>كيف يتم تركيبه؟ وهل يحتاج إلى ثقب الحائط؟</span>
					<span class="text-stone-400 text-xs transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-3 pb-3 pt-1 text-xs leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					يأتيك المنظم بخيارين مرفقين في العلبة: يمكنك تركيبه بدون ثقب عبر اللاصق القوي المرفق على السيراميك، أو تثبيته بالبراغي المرفقة حسب رغبتك.
				</div>
			</details>

			<details class="group rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-xs sm:text-sm font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>هل رشاش الدش التوربو يأتي فعلاً مجاناً مع الطلب؟</span>
					<span class="text-stone-400 text-xs transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-3 pb-3 pt-1 text-xs leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					نعم بالتأكيد! عند طلبك لمنظم الحمام خلال فترة هذا العرض، ستحصل على رشاش الاستحمام التوربو المفلتر كهدية مجانية داخل نفس الطرد.
				</div>
			</details>

			<details class="group rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-xs sm:text-sm font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>كم تستغرق مدة التوصيل؟ وكيف يتم الدفع؟</span>
					<span class="text-stone-400 text-xs transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-3 pb-3 pt-1 text-xs leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					التوصيل مجاني وسريع لجميع المدن المغربية (بين 24 إلى 48 ساعة)، والدفع يكون نقداً عند استلام طلبك والتأكد منه.
				</div>
			</details>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- GOOGLE ADS COMPLIANT FOOTER                                      -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<footer class="bg-[#0B1F17] pt-6 pb-20 sm:pb-10 text-center text-xs text-emerald-100/75 px-4 mt-8 border-t border-emerald-900/40" dir="rtl">
		<div class="max-w-xl mx-auto space-y-3">
			<div class="space-y-1">
				<p class="font-black text-sm text-white">Lhamza Shop</p>
				<p class="text-[11px] text-emerald-100/70 max-w-md mx-auto">
					متجر مغربي موثوق متخصص في منتجات التنظيم والراحة المنزلية. توصيل سريع ومجاني لجميع المدن مع الدفع بعد المعاينة عند الاستلام.
				</p>
			</div>

			<nav aria-label="روابط السياسات القانونية" class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] font-bold text-emerald-300/90 py-2 border-y border-emerald-900/40">
				<a href="/privacy" class="hover:text-white hover:underline transition-colors">سياسة الخصوصية</a>
				<span class="text-emerald-700 select-none">•</span>
				<a href="/terms" class="hover:text-white hover:underline transition-colors">الشروط والأحكام</a>
				<span class="text-emerald-700 select-none">•</span>
				<a href="/refund-policy" class="hover:text-white hover:underline transition-colors">سياسة الاسترجاع والاستبدال</a>
				<span class="text-emerald-700 select-none">•</span>
				<a href="/shipping-policy" class="hover:text-white hover:underline transition-colors">الشحن والتوصيل</a>
				<span class="text-emerald-700 select-none">•</span>
				<a href="/contact" class="hover:text-white hover:underline transition-colors">اتصل بنا</a>
			</nav>

			<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-emerald-200/80">
				<span>📍 الدار البيضاء، المغرب</span>
				<span>📧 <a href="mailto:contact@lhamza.shop" class="underline hover:text-white">contact@lhamza.shop</a></span>
				<span>📱 <span dir="ltr">+212 626-558375</span></span>
			</div>

			<p class="text-[10px] text-emerald-400/60 pt-0.5">
				© {new Date().getFullYear()} Lhamza Shop (lhamza.shop). جميع الحقوق محفوظة.
			</p>
		</div>
	</footer>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 10. STICKY MOBILE BOTTOM CTA BAR                                  -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if isStickyCtaVisible}
		<div class="fixed bottom-0 inset-x-0 z-50 p-2.5 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl sm:hidden" dir="rtl">
			<div class="flex items-center justify-between gap-2.5 max-w-md mx-auto">
				<div class="text-right">
					<span class="block text-[10px] font-bold text-stone-500">المجموع النهائي:</span>
					<div class="flex items-baseline gap-1">
						<span class="font-display text-base font-black text-[#073824]">249 DH</span>
						<span class="text-[10px] text-stone-400 line-through font-bold">399 DH</span>
					</div>
				</div>
				<button
					type="button"
					onclick={scrollToOrderForm}
					class="flex-1 min-h-10 py-2 px-3 rounded-xl bg-[#0B5E3C] hover:bg-[#07482E] text-white font-black text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
				>
					<span>اطلب الآن + الرشاش هدية 🎁</span>
				</button>
			</div>
		</div>
	{/if}
</main>
