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

{#snippet placeholderCard(slotNum: number, label: string, desc?: string, minH: string = 'min-h-[280px] sm:min-h-[340px]')}
	<div
		class="relative w-full {minH} flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#1B4332]/40 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-5 sm:p-6 text-center shadow-inner select-none transition-all duration-300 hover:border-[#1B4332] hover:bg-emerald-50/90 my-3"
	>
		<div class="mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#073824] text-[#C99738] shadow-md">
			<svg class="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
			</svg>
		</div>
		<span class="inline-block bg-[#073824] text-[#C99738] text-[11px] sm:text-xs font-black px-3 py-1 rounded-full mb-2">
			صورة رقم {slotNum}
		</span>
		<h4 class="font-display text-xs sm:text-sm md:text-base font-extrabold text-[#1E293B] max-w-md leading-relaxed">
			{label}
		</h4>
		{#if desc}
			<p class="text-[11px] sm:text-xs text-stone-500 font-medium mt-1.5 max-w-sm leading-normal">
				{desc}
			</p>
		{/if}
	</div>
{/snippet}

<main class="min-h-screen bg-[#FAF9F6] text-[#1E293B] font-sans antialiased pb-20 sm:pb-12" dir="rtl">
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 1: STICKY TOP ANNOUNCEMENT BAR                           -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<aside
		class="sticky top-0 z-40 w-full bg-[#073824] text-white py-2 px-3 text-[11px] sm:text-xs font-bold text-center border-b border-white/10 shadow-sm"
		aria-label="شريط الإعلانات"
		dir="rtl"
	>
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-1.5 leading-tight">
			<span>🎁</span>
			<span>عرض حصري لفترة محدودة: احصل على رشاش الاستحمام التوربو المفلتر مجاناً مع كل طلب! | شحن مجاني والدفع عند الاستلام</span>
		</div>
	</aside>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 2: HERO SECTION (ABOVE THE FOLD)                         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<header class="bg-gradient-to-b from-[#073824] via-[#0B2E1E] via-50% to-[#FAF9F6] pt-5 pb-6 px-4">
		<div class="max-w-2xl mx-auto text-center space-y-4">
			<!-- Top Badge -->
			<div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1 text-xs font-extrabold text-emerald-200">
				<span>🇲🇦</span>
				<span>العرض الأكثر طلباً لتجديد الحمام في المغرب</span>
			</div>

			<!-- Main H1 Headline -->
			<h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
				حوّل حمامك إلى مساحة فندقية منظمة وأنيقة في دقائق – بدون فوضى وبدون صدأ!
			</h1>

			<!-- Subheadline -->
			<p class="text-xs sm:text-sm md:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl mx-auto">
				منظم الحمام الجداري الفاخر (3 طبقات) المصنوع من الإينوكس الأصلي المقاوم للرطوبة + رشاش الدش التوربو المفلتر هدية مجانية مع طلبك.
			</p>

			<!-- Hero Image Slot 1 -->
			<div class="pt-2 max-w-lg mx-auto">
				{@render placeholderCard(
					1,
					'[IMAGE SLOT 1: Hero Image - 3-Tier Inox Bathroom Organizer mounted on wall + Free Turbo Shower Head badge]',
					'صورة الهيرو الأساسية: منظم الحمام الفاخر بـ 3 طبقات مثبت على الجدار مع شارة الرشاش الهدية المجانية'
				)}
			</div>

			<!-- Key Value Bullets -->
			<div class="bg-white/95 rounded-2xl p-4 sm:p-5 border border-emerald-900/10 shadow-lg text-right max-w-lg mx-auto space-y-2.5">
				<div class="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-emerald-700 text-sm shrink-0">✔️</span>
					<span>فولاذ مقاوم للصدأ (إينوكس عالي الجودة) يتحمل الماء والبخار لسنوات.</span>
				</div>
				<div class="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-emerald-700 text-sm shrink-0">✔️</span>
					<span>تصميم ذكي 3 في 1: 3 رفوف واسعة + قضيب سفلي للمناشف + خطافات جانبية.</span>
				</div>
				<div class="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-emerald-700 text-sm shrink-0">✔️</span>
					<span>تركيب مزدوج حسب رغبتك: بدون ثقب (لاصق قوي مرفق) أو بالتثبيت الجداري.</span>
				</div>
				<div class="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-emerald-700 text-sm shrink-0">✔️</span>
					<span>هدية مجانية: رشاش استحمام توربو مفلتر لرفع ضغط الماء وحماية الشعر.</span>
				</div>
			</div>

			<!-- CTA Button -->
			<div class="pt-2">
				<button
					type="button"
					onclick={scrollToOrderForm}
					class="w-full max-w-lg mx-auto min-h-13 py-3.5 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-950/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
				>
					<span>اطلب الباك الآن وادفع عند الاستلام</span>
					<svg class="h-5 w-5 shrink-0 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
					</svg>
				</button>
			</div>

			<!-- Micro Trust Pills -->
			<div class="grid grid-cols-3 gap-2 max-w-lg mx-auto pt-2 text-center">
				<div class="flex items-center justify-center gap-1 bg-white/90 rounded-xl py-2 px-1 text-[11px] font-bold text-stone-800 shadow-2xs border border-stone-200/60">
					<span>🚚</span>
					<span>توصيل مجاني</span>
				</div>
				<div class="flex items-center justify-center gap-1 bg-white/90 rounded-xl py-2 px-1 text-[11px] font-bold text-stone-800 shadow-2xs border border-stone-200/60">
					<span>📦</span>
					<span>الدفع بعد المعاينة</span>
				</div>
				<div class="flex items-center justify-center gap-1 bg-white/90 rounded-xl py-2 px-1 text-[11px] font-bold text-stone-800 shadow-2xs border border-stone-200/60">
					<span>🛡️</span>
					<span>ضمان 14 يوماً</span>
				</div>
			</div>
		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 3: DIRECT COD ORDER FORM (EMBEDDED HIGH UP)              -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section id="order-form" class="max-w-xl mx-auto px-4 py-8 scroll-mt-14" dir="rtl">
		<div class="rounded-3xl border-2 border-emerald-700/30 bg-white p-5 sm:p-7 shadow-xl">
			<!-- Header -->
			<div class="text-center pb-4 border-b border-stone-100">
				<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full mb-2">
					استمارة الطلب السريع ⚡
				</span>
				<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug">
					املأ الاستمارة لطلب العرض (المنظم + الرشاش مجاناً)
				</h2>
				<p class="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
					الدفع عند الاستلام بعد المعاينة، والتوصيل مجاني لجميع مدن المغرب
				</p>
			</div>

			<!-- Price Box -->
			<div class="my-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100/60 to-emerald-50 border border-emerald-200 p-4 text-center">
				<div class="flex items-center justify-center gap-3">
					<span class="font-display text-3xl font-black text-[#073824]">{PRODUCT_PRICE} درهم</span>
					<span class="text-base text-stone-400 line-through font-bold">{PRODUCT_OLD_PRICE} درهم</span>
					<span class="bg-[#C99738] text-white text-xs font-black px-2 py-0.5 rounded-md shadow-2xs">وفّر 150 درهم</span>
				</div>
				<p class="text-xs font-extrabold text-emerald-900 mt-1">
					المجموع: 249 درهم فقط (توصيل مجاني لباب الدار)
				</p>
			</div>

			<!-- Form Inputs -->
			<form onsubmit={handleSubmit} novalidate class="space-y-4">
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
						class="w-full h-12 px-4 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-sm font-medium text-stone-900 transition-all {showNameError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
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
						class="w-full h-12 px-4 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-sm font-bold text-stone-900 text-right transition-all {showPhoneError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
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
						class="w-full h-12 px-4 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-sm font-medium text-stone-900 transition-all {showAddressError ? 'border-red-500 bg-red-50/20' : 'bg-stone-50/50'}"
						required
					/>
					{#if showAddressError}
						<p class="text-xs text-red-600 font-bold mt-1">المرجو إدخال مدينتك وعنوان التوصيل.</p>
					{/if}
				</div>

				{#if formError}
					<div class="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-bold text-center">
						{formError}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full min-h-13 py-3.5 px-6 rounded-2xl bg-[#0B5E3C] hover:bg-[#07482E] text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
				>
					{#if isSubmitting}
						<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						<span>جاري تأكيد طلبك...</span>
					{:else}
						<span>تأكيد الطلب • الدفع عند الاستلام 🚚</span>
					{/if}
				</button>

				<!-- Reassurance Micro-Copy -->
				<p class="text-center text-xs font-semibold text-stone-500 pt-1">
					🔒 ضمان استبدال لمدة 14 يوماً | فحص الطلبية عند الاستلام
				</p>
			</form>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 4: REAL UNBOXING & AUTHENTIC QUALITY                     -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-8" dir="rtl">
		<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm text-center">
			<span class="inline-block bg-amber-100 text-amber-900 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
				جودة حقيقية 100% كما في الواقع
			</span>
			<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-3">
				نصوّر لك المنتج من مستودعنا مباشرة: معدن إينوكس صلب يدوم للعمر
			</h2>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
				لا مجال للمفاجآت عند الاستلام! المنظم مصنوع من صفائح وأنابيب فولاذية سميكة مقاومة للصدأ والتآكل، ويأتيك في العلبة بكامل معدات التركيب (البراغي الجدارية + اللاصق الذكي القوي) لتختار طريقة التثبيت التي تناسب حمامك.
			</p>
			<!-- Slot 2 -->
			{@render placeholderCard(
				2,
				'[IMAGE/VIDEO SLOT 2: Real Unboxing Photo/GIF showing stainless steel plates, rods, screws, and adhesive kit on the floor]',
				'صورة/مقطع فتح الصندوق: صفائح وأنابيب الإينوكس الصلبة، والبراغي، ومجموعة اللصاق القوي لتوضيح الجودة الواقعية للمنتج'
			)}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 5: DEEP-DIVE FEATURES (PROBLEM / SOLUTION STACK)         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-6 space-y-6" dir="rtl">
		<!-- Card 1 -->
		<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm text-center">
			<span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
				💧 مقاومة تامة للماء والرطوبة
			</span>
			<h3 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-2">
				مقاومة تامة للصدأ وتصريف ذكي للمياه
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
				بفضل فتحات التهوية المدمجة في كل رف ومادة الإينوكس المعالجة ضد الرطوبة، لن يتجمع الماء تحت القوارير ولن يظهر الصدأ أبداً حتى مع البخار المستمر.
			</p>
			{@render placeholderCard(
				3,
				'[IMAGE SLOT 3: Close-up on water droplets on the stainless steel ventilated shelves showing anti-rust & drainage holes]',
				'صورة مقربة: قطرات الماء على الرفوف المثقوبة المصنوعة من الإينوكس توضح تصريف الماء الفوري ومقاومة الصدأ'
			)}
		</div>

		<!-- Card 2 -->
		<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm text-center">
			<span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
				📦 سعة تخزين عائلية هائلة
			</span>
			<h3 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-2">
				سعة تخزين عملاقة تجمّع كل أغراض العائلة
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
				مسافة مدروسة بين الرفوف (21 سم لكل طابق) تسمح بوضع العبوات الكبيرة بسهولة، مع حواجز جانبية تمنع سقوط القوارير، بالإضافة إلى حامل فوط سفلي وعلاقات إضافية.
			</p>
			{@render placeholderCard(
				4,
				'[IMAGE SLOT 4: Lifestyle shot of the 3 shelves fully loaded with tall shampoo bottles, towels hanging on the bottom bar, and loofahs on hooks]',
				'صورة توضيحية: الرفوف الثلاثة ممتلئة بعبوات الشامبو الكبيرة مع مناشف معلقة بالأسفل وليف الاستحمام على الخطافات'
			)}
		</div>

		<!-- Card 3 -->
		<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm text-center">
			<span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
				🛠️ تثبيت مزدوج وسهل
			</span>
			<h3 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-2">
				تركيب سهل وثبات فائق بدون إتلاف السيراميك
			</h3>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
				سواء كنت تفضل التركيب السريع بدون ثقب عبر اللاصق القوي المرفق، أو التثبيت الكلاسيكي بالبراغي، فإن المنظم يتحمل الأوزان الثقيلة بثبات تام وأمان كامل.
			</p>
			{@render placeholderCard(
				5,
				'[IMAGE SLOT 5: Split visual showing adhesive no-drill installation vs screw installation on ceramic tiles]',
				'صورة مقارنة: التثبيت السهل باللاصق القوي بدون حفر مقابل التثبيت بالبراغي على جدار السيراميك'
			)}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 6: THE FREE GIFT SPOTLIGHT (VALUE BOOSTER)               -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-8" dir="rtl">
		<div class="rounded-3xl bg-gradient-to-br from-amber-50/60 via-white to-emerald-50/60 border-2 border-[#C99738] p-5 sm:p-7 shadow-lg text-center">
			<span class="inline-block bg-[#C99738] text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full mb-3 shadow-2xs">
				🎁 هدية مجانية مع طلبك اليوم (بقيمة 120 درهم)
			</span>
			<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-2">
				احصل على رشاش الاستحمام التوربو المفلتر مجاناً!
			</h2>
			<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
				لأن راحة حمامك تكتمل بتجربة استحمام منعشة، نهديك هذا الرشاش الذكي المتطور مجاناً مع المنظم:
			</p>

			{@render placeholderCard(
				6,
				'[IMAGE SLOT 6: Turbocharged Filtered Shower Head with silicone massage bristles + replacement cotton filters]',
				'صورة الرشاش الهدية: رشاش الاستحمام التوربو المفلتر بشعيرات السيليكون للتدليك وفلتر القطن المنقي للماء'
			)}

			<div class="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs text-right space-y-3 mt-4">
				<div class="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-base shrink-0">🚀</span>
					<span><strong>تقنية التوربو لمضاعفة ضغط المياه:</strong> حل مثالي للمنازل التي تعاني من ضعف صبيب الماء مع توفير الاستهلاك.</span>
				</div>
				<div class="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-base shrink-0">💧</span>
					<span><strong>نظام فلترة متكامل:</strong> مزود بفلتر قطني (PP) ينقي الماء من الكلور، الصدأ، والشوائب لحماية البشرة والشعر من التساقط.</span>
				</div>
				<div class="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-base shrink-0">💆‍♂️</span>
					<span><strong>شعيرات سيليكون لتدليك فروة الرأس:</strong> تمنحك مساجاً مريحاً أثناء الاستحمام لتخفيف التوتر وتنشيط الدورة الدموية.</span>
				</div>
				<div class="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-stone-800 leading-relaxed">
					<span class="text-base shrink-0">🔘</span>
					<span><strong>زر إيقاف فوري (Stop Button):</strong> تحكم في إيقاف وتشغيل الماء بضغطة واحدة من المقبض مع وضعيات رش متعددة.</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 7: TECHNICAL DIMENSIONS & BOX CONTENTS TABLE             -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-6" dir="rtl">
		<div class="rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm text-center">
			<span class="inline-block bg-stone-100 text-stone-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
				📐 دقة المقاسات والمواصفات
			</span>
			<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-2">
				المواصفات والأبعاد الدقيقة للمنظم
			</h2>
			<p class="text-xs sm:text-sm text-stone-500 font-medium mb-4">
				مقاسات قياسية ومدروسة لتناسب جميع مساحات الحمامات بدقة متناهية
			</p>

			{@render placeholderCard(
				7,
				'[IMAGE SLOT 7: Clean technical diagram showing dimensions: 60cm width, 58.5cm height, 15.3cm depth, 21cm between shelves]',
				'مخطط المقاسات التقني: العرض 60 سم، الارتفاع 58.5 سم، العمق 15.3 سم، المسافة بين الرفوف 21 سم'
			)}

			<div class="overflow-hidden rounded-2xl border border-stone-200 shadow-2xs mt-4">
				<table class="w-full text-right text-xs sm:text-sm">
					<tbody class="divide-y divide-stone-200">
						<tr class="bg-stone-50/70">
							<td class="py-3 px-4 font-bold text-stone-900 w-1/3">المادة الأساسية:</td>
							<td class="py-3 px-4 text-stone-700 font-medium">فولاذ مقاوم للصدأ (إينوكس / كروم عالي الجودة)</td>
						</tr>
						<tr>
							<td class="py-3 px-4 font-bold text-stone-900">الأبعاد الإجمالية:</td>
							<td class="py-3 px-4 text-stone-700 font-medium">العرض 60 سم × الارتفاع 58.5 سم × العمق 15.3 سم</td>
						</tr>
						<tr class="bg-stone-50/70">
							<td class="py-3 px-4 font-bold text-stone-900">المسافة بين الطوابق:</td>
							<td class="py-3 px-4 text-stone-700 font-medium">21 سم (مناسبة للعبوات الطويلة والشامبو)</td>
						</tr>
						<tr>
							<td class="py-3 px-4 font-bold text-stone-900">التصميم العملي:</td>
							<td class="py-3 px-4 text-stone-700 font-medium">3 أرفف مثقبة + قضيب مناشف سفلي + خطافات تعليق</td>
						</tr>
						<tr class="bg-stone-50/70">
							<td class="py-3 px-4 font-bold text-stone-900">محتويات العلبة:</td>
							<td class="py-3 px-4 text-stone-700 font-medium">منظم الحمام الكامل + أطقم التثبيت (لصاق + براغي) + رشاش التوربو المفلتر هدية مجانية</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 8: CUSTOMER REVIEWS (SOCIAL PROOF - PURE ARABIC)         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-8" dir="rtl">
		<div class="text-center mb-6">
			<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
				⭐ تقييمات العملاء الموثقة
			</span>
			<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900">
				آراء زبنائنا الكرام في المغرب ⭐ 4.9/5
			</h2>
			<p class="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
				تجارب حقيقية لعملائنا بعد اقتناء طقم منظم الإينوكس والرشاش الهدية
			</p>
		</div>

		<div class="space-y-4">
			<!-- Review 1 -->
			<div class="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
				<div class="flex items-center justify-between mb-2.5">
					<div class="flex items-center gap-3">
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							م
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900">مريم</h4>
							<span class="text-[11px] text-stone-500">الدار البيضاء</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-2">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
					"جودة الإينوكس ممتازة جداً وصلبة وليست خفيفة كالموجودة في الأسواق العادية. قمت بتركيبه باللاصق المرفق فقط على السيراميك وثابت بقوة دون أي حركة. أنصح به بشدة".
				</p>
			</div>

			<!-- Review 2 -->
			<div class="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
				<div class="flex items-center justify-between mb-2.5">
					<div class="flex items-center gap-3">
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							ع
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900">عبد الرحمن</h4>
							<span class="text-[11px] text-stone-500">الرباط</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-2">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
					"غيّر شكل الحمام تماماً! السعة كبيرة جداً واتسعت لجميع قوارير الشامبو والمناشف معاً. التوصيل كان سريعاً في الرباط خلال أقل من 24 ساعة والدفع كان بعد فحص العلبة".
				</p>
			</div>

			<!-- Review 3 -->
			<div class="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
				<div class="flex items-center justify-between mb-2.5">
					<div class="flex items-center gap-3">
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							أ
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900">أمينة</h4>
							<span class="text-[11px] text-stone-500">مراكش</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-2">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
					"بصراحة الرشاش التوربو المفلتر الهدية يستحق ثمن العرض لوحده! ضغط الماء أصبح قوياً ومريحاً، وشعيرات التدليك ممتازة لفروة الرأس. شكراً لكم على المصداقية".
				</p>
			</div>

			<!-- Review 4 -->
			<div class="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
				<div class="flex items-center justify-between mb-2.5">
					<div class="flex items-center gap-3">
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							ي
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900">ياسين</h4>
							<span class="text-[11px] text-stone-500">طنجة</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
						✓ مشتري مؤكد
					</span>
				</div>
				<div class="flex items-center gap-0.5 text-amber-400 mb-2">
					{'★'.repeat(5)}
				</div>
				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
					"التركيب كان سهلاً وواضحاً جداً، ومقاومة الصدأ حقيقية مع بخار الماء الساخن اليومي. منتج ممتاز وعملي جداً لكل بيت".
				</p>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 9: FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)            -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="max-w-2xl mx-auto px-4 py-8" dir="rtl">
		<div class="text-center mb-6">
			<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full mb-2">
				إجابات مباشرة ❓
			</span>
			<h2 class="font-display text-xl sm:text-2xl font-black text-stone-900">
				الأسئلة الشائعة حول المنتج
			</h2>
			<p class="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
				كل ما تحتاج لمعرفته قبل تأكيد طلبك
			</p>
		</div>

		<div class="space-y-3">
			<details class="group rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>هل المنظم يصدأ أو يتغير لونه مع الماء الساخن والبخار؟</span>
					<span class="text-stone-400 transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					إطلاقاً، المنظم مصنوع من فولاذ الإينوكس المقاوم للصدأ والرطوبة، ومصمم خصيصاً ليدوم طويلاً في بيئة الحمام الرطبة دون أي تغيير في لونه أو لمعانه.
				</div>
			</details>

			<details class="group rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>كيف يتم تركيبه؟ وهل يحتاج إلى ثقب الحائط؟</span>
					<span class="text-stone-400 transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					يأتيك المنظم بخيارين مرفقين في العلبة: يمكنك تركيبه بدون ثقب عبر اللاصق القوي المرفق على السيراميك الأملس، أو تثبيته بالبراغي المرفقة حسب رغبتك.
				</div>
			</details>

			<details class="group rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>هل رشاش الدش التوربو يأتي فعلاً مجاناً مع الطلب؟</span>
					<span class="text-stone-400 transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					نعم بالتأكيد! عند طلبك لمنظم الحمام خلال فترة هذا العرض، ستحصل على رشاش الاستحمام التوربو المفلتر كهدية مجانية داخل نفس الطرد.
				</div>
			</details>

			<details class="group rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all duration-200">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
					<span>كم تستغرق مدة التوصيل؟ وكيف يتم الدفع؟</span>
					<span class="text-stone-400 transition-transform duration-300 group-open:rotate-180">▼</span>
				</summary>
				<div class="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/50">
					التوصيل مجاني وسريع لجميع المدن المغربية (بين 24 إلى 48 ساعة)، والدفع يكون نقداً عند استلام طلبك والتأكد منه.
				</div>
			</details>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- GOOGLE ADS COMPLIANT FOOTER                                      -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<footer class="bg-[#0B1F17] pt-8 pb-20 sm:pb-12 text-center text-xs text-emerald-100/75 px-4 mt-12 border-t border-emerald-900/40" dir="rtl">
		<div class="max-w-4xl mx-auto space-y-4">
			<div class="space-y-1">
				<p class="font-black text-sm sm:text-base text-white">Lhamza Shop</p>
				<p class="text-xs text-emerald-100/70 max-w-lg mx-auto">
					متجر مغربي موثوق متخصص في منتجات التنظيم والراحة المنزلية. توصيل سريع ومجاني لجميع المدن مع الدفع بعد المعاينة عند الاستلام.
				</p>
			</div>

			<nav aria-label="روابط السياسات القانونية" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-emerald-300/90 py-2 border-y border-emerald-900/40">
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

			<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-emerald-200/80">
				<span>📍 الدار البيضاء، المغرب</span>
				<span>📧 <a href="mailto:contact@lhamza.shop" class="underline hover:text-white">contact@lhamza.shop</a></span>
				<span>📱 <span dir="ltr">+212 626-558375</span></span>
				<span>⏰ 9:00 - 22:00</span>
			</div>

			<p class="text-[11px] text-emerald-400/60 pt-1">
				© {new Date().getFullYear()} Lhamza Shop (lhamza.shop). جميع الحقوق محفوظة.
			</p>
		</div>
	</footer>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- SECTION 10: STICKY MOBILE BOTTOM CTA BAR                         -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if isStickyCtaVisible}
		<div class="fixed bottom-0 inset-x-0 z-50 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl sm:hidden" dir="rtl">
			<div class="flex items-center justify-between gap-3 max-w-md mx-auto">
				<div class="text-right">
					<span class="block text-[11px] font-bold text-stone-500">المجموع النهائي:</span>
					<div class="flex items-baseline gap-1.5">
						<span class="font-display text-lg font-black text-[#073824]">249 DH</span>
						<span class="text-[11px] text-stone-400 line-through font-bold">399 DH</span>
					</div>
				</div>
				<button
					type="button"
					onclick={scrollToOrderForm}
					class="flex-1 min-h-11 py-2.5 px-4 rounded-xl bg-[#0B5E3C] hover:bg-[#07482E] text-white font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
				>
					<span>اطلب الآن + الرشاش هدية 🎁</span>
				</button>
			</div>
		</div>
	{/if}
</main>
