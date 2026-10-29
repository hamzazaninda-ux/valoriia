<script lang="ts">
	import { onMount } from 'svelte';
	import { trackSnapPurchase, preserveTrackingParams, normalizePhone, sha256 } from '$lib/utils/tracking';

	let { data } = $props();

	// ============================================================
	// ⚙️ إعدادات المنتج والعروض (قابلة للتبديل بسهولة لأي منتوج جديد)
	// ============================================================
	interface BundleItem {
		id: number;
		qty: number;
		title: string;
		giftText: string;
		price: number;
		oldPrice: number;
		saving: string;
		image: string;
		badge: string | null;
	}

	const PRODUCT_CONFIG = {
		title: 'منظم الحمام الفاخر (إينوكس 3 طبقات)',
		sku: 'inox-organizer',
		image:
			'https://res.cloudinary.com/xqjngk8y/image/upload/v1793288332/Gemini_Generated_Image_laihkwlaihkwlaih.jpg',
		bundles: [
			{
				id: 1,
				qty: 1,
				title: 'قطعة واحدة',
				giftText: 'رشاش هدية',
				price: 279,
				oldPrice: 399,
				saving: 'وفّر 120 درهم',
				image:
					'https://res.cloudinary.com/xqjngk8y/image/upload/v1793304908/%D8%A5%D8%B9%D9%84%D8%A7%D9%86_%D9%85%D9%86%D8%B8%D9%85_%D8%A7%D9%84%D8%AD%D9%85%D8%A7%D9%85_%D9%88%D8%B1%D8%A3%D8%B3_%D8%A7%D9%84%D8%AF%D8%B4_%D8%A7%D9%84%D9%85%D8%AC%D8%A7%D9%86%D9%8A.png',
				badge: null
			},
			{
				id: 2,
				qty: 2,
				title: 'قطعتان',
				giftText: 'رشاشان هدية',
				price: 449,
				oldPrice: 699,
				saving: 'وفّر 250 درهم',
				image:
					'https://res.cloudinary.com/xqjngk8y/image/upload/v1793304933/%D8%B9%D8%B1%D8%B6_%D9%85%D9%86%D8%B8%D9%85%D8%A7%D8%AA_%D8%A7%D9%84%D8%AD%D9%85%D8%A7%D9%85_%D9%88%D8%B1%D8%A4%D9%88%D8%B3_%D8%A7%D9%84%D8%AF%D8%B4_%D8%A7%D9%84%D9%85%D8%AC%D8%A7%D9%86%D9%8A%D8%A9.png',
				badge: 'الأكثر طلبًا'
			}
		] as BundleItem[]
	};

	let selectedBundleId = $state(1);
	const selectedBundle = $derived(
		PRODUCT_CONFIG.bundles.find((b) => b.id === selectedBundleId) || PRODUCT_CONFIG.bundles[0]
	);

	let customerName = $state('');
	let customerPhone = $state('');

	let nameBlurred = $state(false);
	let phoneBlurred = $state(false);

	let isSubmitting = $state(false);
	let formError = $state('');

	function normalizeDigits(str: string): string {
		const eastern = '٠١٢٣٤٥٦٧٨٩';
		return String(str || '').replace(/[٠-٩]/g, (d) => eastern.indexOf(d).toString());
	}

	function cleanPhoneString(val: string): string {
		const converted = normalizeDigits(val);
		return converted.trim().replace(/[\s\-\u200E\u200F\u202A-\u202E\u2066-\u2069()+.]+/g, '');
	}

	function validatePhone(phone: string): boolean {
		const stripped = cleanPhoneString(phone);
		return /^(?:(?:00212|212)|0)[567]\d{8}$/.test(stripped);
	}

	function normalizeMoroccanPhone(raw: string): string {
		const stripped = cleanPhoneString(raw);
		const match = stripped.match(/^(?:(?:00212|212)|0)([567]\d{8})$/);
		return match ? `212${match[1]}` : stripped;
	}

	const isNameValid = $derived(customerName.trim().length >= 2);
	const isPhoneValid = $derived(validatePhone(customerPhone));

	const showNameError = $derived(nameBlurred && !isNameValid);
	const showPhoneError = $derived(phoneBlurred && !isPhoneValid);

	function scrollToOrderSection(e?: Event) {
		e?.preventDefault();
		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
		const topBar = document.querySelector('aside');
		const topBarStyle = topBar ? window.getComputedStyle(topBar) : null;
		const isFixed = topBarStyle && (topBarStyle.position === 'fixed' || topBarStyle.position === 'sticky');
		const fixedTop = isFixed && topBar ? Math.round(topBar.getBoundingClientRect().height) : 0;
		const gap = 6;

		const section = document.getElementById('order-section') || document.getElementById('order-form');
		if (!section) return;

		const sectionRect = section.getBoundingClientRect();
		const sectionHeight = sectionRect.height;

		let targetScrollY = 0;
		if (sectionHeight <= vh - fixedTop - gap) {
			targetScrollY = window.scrollY + sectionRect.top - (fixedTop + gap);
		} else {
			const confirmBtn = document.querySelector('[data-confirm-btn]') || section.querySelector('button[type="submit"]');
			if (confirmBtn) {
				const btnRect = confirmBtn.getBoundingClientRect();
				targetScrollY = window.scrollY + btnRect.bottom - (vh - 12);
			} else {
				targetScrollY = window.scrollY + sectionRect.top - (fixedTop + gap);
			}
		}

		let prefersReduced = false;
		try {
			prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		} catch {}

		const behavior: ScrollBehavior = prefersReduced ? 'auto' : 'smooth';
		window.scrollTo({ top: Math.max(0, targetScrollY), behavior });

		const verifyAdjustment = () => {
			const updatedRect = section.getBoundingClientRect();
			let diff = 0;
			if (sectionHeight <= vh - fixedTop - gap) {
				diff = updatedRect.top - (fixedTop + gap);
			} else {
				const confirmBtn = document.querySelector('[data-confirm-btn]') || section.querySelector('button[type="submit"]');
				if (confirmBtn) {
					diff = confirmBtn.getBoundingClientRect().bottom - (vh - 12);
				}
			}
			if (Math.abs(diff) > 4) {
				window.scrollBy({ top: diff, behavior: 'auto' });
			}
		};

		setTimeout(verifyAdjustment, 700);
	}

	const scrollToOrderForm = scrollToOrderSection;

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		nameBlurred = true;
		phoneBlurred = true;
		formError = '';

		if (!isNameValid) {
			formError = 'يرجى كتابة الاسم الكامل (حرفان على الأقل)';
			return;
		}

		if (!isPhoneValid) {
			formError = 'يرجى كتابة رقم هاتف مغربي صحيح (مثال: 0612345678)';
			return;
		}

		if (isSubmitting) return;
		isSubmitting = true;

		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		const normalizedPhone = normalizeMoroccanPhone(customerPhone);
		const activePrice = selectedBundle.price;
		const activeQty = selectedBundle.qty;
		const activeTitle = `${PRODUCT_CONFIG.title} (${selectedBundle.title})`;
		const bundleTitle = `${selectedBundle.title} + ${selectedBundle.giftText}`;

		// 1. Single Purchase Pixel firing (CompletePayment & Conversion)
		try {
			if (typeof window !== 'undefined' && (window as any).ttq) {
				(window as any).ttq.track('CompletePayment', {
					content_id: 'inox-organizer',
					content_type: 'product',
					content_name: activeTitle,
					value: activePrice,
					currency: 'MAD'
				}, {
					event_id: orderId
				});
			}

			if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
				(window as any).gtag('event', 'conversion', {
					send_to: 'AW-18405009405',
					value: activePrice,
					currency: 'MAD',
					transaction_id: orderId
				});
			}

			trackSnapPurchase({
				orderId,
				price: activePrice,
				currency: 'MAD',
				phone: normalizedPhone,
				title: activeTitle,
				sku: PRODUCT_CONFIG.sku,
				quantity: activeQty
			});
		} catch (pixelErr) {
			console.warn('Pixel tracking error:', pixelErr);
		}

		// 2. Dispatch order to /api/order (Dual storage + Google Sheets)
		try {
			const res = await fetch('/api/order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId,
					fullName: customerName.trim(),
					phone: normalizedPhone,
					product: activeTitle,
					bundle: bundleTitle,
					productTitle: activeTitle,
					selectedOfferTitle: bundleTitle,
					price: activePrice,
					totalPrice: activePrice,
					total: activePrice,
					quantity: activeQty,
					source: 'inox-organizer'
				})
			});

			const data = await res.json().catch(() => null);
			const returnedOrderId = data?.orderId || orderId;

			if (typeof window !== 'undefined') {
				sessionStorage.setItem(`order_sent_${returnedOrderId}`, 'true');
				const savedOrder = {
					orderId: returnedOrderId,
					fullName: customerName.trim(),
					phoneNumber: normalizedPhone,
					city: 'تأكيد هاتفي',
					address: 'تأكيد هاتفي',
					date: new Date().toLocaleDateString('ar-MA'),
					price: activePrice,
					total: activePrice,
					productTitle: activeTitle,
					offer: bundleTitle,
					quantity: activeQty
				};
				try {
					localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
					sessionStorage.setItem('latestOrder', JSON.stringify(savedOrder));
				} catch (e) {}
			}

			await new Promise((resolve) => setTimeout(resolve, 350));
			const thankYouUrl = preserveTrackingParams(
				`/thank-you?orderId=${encodeURIComponent(returnedOrderId)}&name=${encodeURIComponent(customerName.trim())}&phone=${encodeURIComponent(normalizedPhone)}&total=${activePrice}`
			);
			window.location.href = thankYouUrl;
		} catch (err) {
			console.error('Order submit error:', err);
			const thankYouUrl = preserveTrackingParams(
				`/thank-you?orderId=${encodeURIComponent(orderId)}&name=${encodeURIComponent(customerName.trim())}&phone=${encodeURIComponent(normalizedPhone)}&total=${activePrice}`
			);
			window.location.href = thankYouUrl;
		} finally {
			isSubmitting = false;
		}
	}

	let isStickyCtaVisible = $state(true);
	onMount(() => {
		(window as any).scrollToOrderSection = scrollToOrderSection;
		const form = document.getElementById('order-section') || document.getElementById('order-form');
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
		return () => {
			delete (window as any).scrollToOrderSection;
			observer.disconnect();
		};
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
	<link rel="preload" as="image" href="https://res.cloudinary.com/xqjngk8y/image/upload/v1793288332/Gemini_Generated_Image_laihkwlaihkwlaih.jpg" fetchpriority="high" />
</svelte:head>

<main class="min-h-screen bg-[#FAF9F6] text-[#1E293B] font-sans antialiased pb-28 sm:pb-16" dir="rtl">
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
	<header class="pt-2 sm:pt-3 pb-6 sm:pb-8 px-3 sm:px-4 max-w-xl mx-auto mb-1">
		<!-- HERO IMAGE FIRST (PORTRAIT ASPECT RATIO 3:4) -->
		<div class="w-full max-w-[335px] sm:max-w-lg mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-md border border-stone-200/80 bg-white my-1.5 relative">
			<img
				src={PRODUCT_CONFIG.image}
				alt="منظم الحمام الفاخر 3 طبقات إينوكس + رشاش توربو مجاني"
				loading="eager"
				fetchpriority="high"
				class="w-full h-full object-cover object-center rounded-2xl transition-transform duration-300"
			/>
		</div>

		<!-- COMPACT TITLE & RATINGS (BELOW HERO IMAGE - ZERO PRICE FRICTION) -->
		<div class="text-center pt-2 pb-1 space-y-1.5">
			<!-- Title H1 (Refined 16px-17px on mobile, fits in 2 comfortable lines without cut-off) -->
			<h1 class="font-display text-[16.5px] sm:text-2xl font-black text-stone-900 leading-snug tracking-tight px-1 max-w-sm mx-auto">
				منظم الحمام الفاخر (إينوكس 3 طبقات) + رشاش توربو مجاناً
			</h1>

			<!-- Customer Ratings Only (Stars & Review Count) -->
			<div class="flex items-center justify-center gap-1.5 pt-0.5">
				<span class="text-amber-500 font-extrabold text-xs sm:text-sm">★★★★★ (114 تقييم)</span>
			</div>

		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 3. DIRECT COD ORDER FORM WITH 2-TIER PORTRAIT BUNDLE SELECTOR    -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section
		id="order-section"
		class="max-w-[520px] mx-auto px-2 sm:px-3 py-1 sm:py-2 scroll-mt-10"
		dir="rtl"
	>
		<div
			class="order-card-shell rounded-2xl sm:rounded-3xl overflow-hidden border border-[#0B3D24]/80 shadow-xl"
			style="background-color: #FAF7F2;"
		>
			<!-- 1. Header -->
			<div class="bg-[#0B3D24] px-3 py-2 text-center text-white select-none">
				<h2 class="text-[17px] sm:text-[19px] font-black leading-tight tracking-tight text-white m-0">
					أكمل طلبك الآن
				</h2>
				<p class="text-[11px] sm:text-[12px] text-emerald-100/90 font-medium mt-0.5 m-0 leading-tight">
					الدفع عند الاستلام • التوصيل مجاني
				</p>
			</div>

			<!-- 2. Body -->
			<div class="p-2 sm:p-2.5 space-y-2">
				<!-- 2 Offer Cards in a 2-column grid on ALL screen sizes -->
				<div class="grid grid-cols-2 gap-2 items-stretch" role="radiogroup" aria-label="اختر العرض">
					{#each PRODUCT_CONFIG.bundles as b}
						{@const isSelected = selectedBundleId === b.id}
						<label
							class="relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer select-none text-center h-full {isSelected
								? 'border-2 border-[#0B3D24] bg-[#E6F4EC] shadow-xs'
								: 'border border-stone-200 bg-white hover:border-stone-300'}"
						>
							<input
								type="radio"
								name="offer"
								value={b.id}
								checked={isSelected}
								onchange={() => (selectedBundleId = b.id)}
								class="sr-only"
							/>

							{#if b.badge}
								<!-- Ribbon on top of card 2: "الأكثر طلبًا" -->
								<span
									class="absolute -top-2.5 inset-x-0 mx-auto w-fit z-10 bg-[#0B3D24] text-[#C99738] border border-[#C99738]/50 text-[10px] sm:text-[10.5px] font-black px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap leading-tight"
								>
									{b.badge}
								</span>
							{/if}

							<!-- Top Corner Radio Button (top-start in RTL = top-right) -->
							<div class="w-full flex justify-start mb-0.5">
								<div
									class="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all {isSelected
										? 'bg-[#0B3D24] text-white shadow-2xs'
										: 'border border-stone-300 bg-white'}"
								>
									{#if isSelected}
										<svg
											class="w-2.5 h-2.5 sm:w-3 sm:h-3"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3.5"
											aria-hidden="true"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
										</svg>
									{/if}
								</div>
							</div>

							<!-- Thumbnail 52x52px, radius 10px -->
							<div class="relative w-[52px] h-[52px] rounded-[10px] overflow-hidden bg-white border border-stone-200 p-0.5 shadow-2xs mb-1 shrink-0 flex items-center justify-center">
								<img
									src={b.image}
									alt={b.title}
									width="52"
									height="52"
									loading="lazy"
									decoding="async"
									class="w-full h-full object-cover rounded-[8px]"
								/>
								{#if b.qty > 1}
									<!-- Small "2×" badge on bottom corner of image 2 -->
									<span class="absolute bottom-0 end-0 bg-[#0B3D24] text-[#C99738] text-[9.5px] font-black px-1 rounded-tl-md leading-tight">
										2×
									</span>
								{/if}
							</div>

							<!-- Title -->
							<h3 class="text-[14px] sm:text-[15px] font-black text-stone-900 leading-tight m-0">
								{b.title}
							</h3>

							<!-- Gift line with small gift icon -->
							<p class="text-[10.5px] sm:text-[11px] font-bold text-amber-700 leading-tight mt-0.5 m-0 whitespace-nowrap">
								🎁 {b.giftText}
							</p>

							<!-- Price row -->
							<div class="my-0.5 leading-tight text-center">
								<span class="text-[18px] sm:text-[21px] font-black text-[#0B3D24] block leading-tight">
									{b.price} <span class="text-[12px] font-bold">درهم</span>
								</span>
								<span class="text-[10.5px] sm:text-[11px] text-stone-400 line-through font-bold block leading-tight">
									{b.oldPrice} درهم
								</span>
							</div>

							<!-- Savings badge -->
							<span class="inline-block bg-[#D4EDDA] text-[#0B3D24] text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap leading-tight">
								{b.saving}
							</span>
						</label>
					{/each}
				</div>

				<!-- Form Inputs -->
				<form id="order-form" onsubmit={handleSubmit} novalidate class="space-y-2 pt-0.5">
					<!-- Input 1: Full Name -->
					<div>
						<label for="order-fullname" class="block text-[12px] sm:text-[13px] font-bold text-stone-800 mb-0.5 text-right">
							الاسم الكامل <span class="text-red-500">*</span>
						</label>
						<input
							id="order-fullname"
							type="text"
							bind:value={customerName}
							onblur={() => (nameBlurred = true)}
							placeholder="اكتب اسمك الكامل هنا"
							class="w-full h-11 px-3 rounded-xl border border-stone-300 focus:border-[#0B3D24] focus:ring-2 focus:ring-[#0B3D24]/20 text-[16px] font-medium text-stone-900 text-right transition-all {showNameError ? 'border-red-500 bg-red-50/20' : 'bg-white'}"
							required
						/>
						{#if showNameError}
							<p class="text-[11px] text-red-600 font-bold mt-0.5 text-right leading-tight">يرجى كتابة الاسم الكامل (حرفان على الأقل)</p>
						{/if}
					</div>

					<!-- Input 2: Phone Number -->
					<div>
						<label for="order-phone" class="block text-[12px] sm:text-[13px] font-bold text-stone-800 mb-0.5 text-right">
							رقم الهاتف <span class="text-red-500">*</span>
						</label>
						<input
							id="order-phone"
							type="tel"
							inputmode="numeric"
							dir="ltr"
							bind:value={customerPhone}
							onblur={() => (phoneBlurred = true)}
							placeholder="06XXXXXXXX"
							class="w-full h-11 px-3 rounded-xl border border-stone-300 focus:border-[#0B3D24] focus:ring-2 focus:ring-[#0B3D24]/20 text-[16px] font-bold text-stone-900 text-right transition-all {showPhoneError ? 'border-red-500 bg-red-50/20' : 'bg-white'}"
							required
						/>
						{#if showPhoneError}
							<p class="text-[11px] text-red-600 font-bold mt-0.5 text-right leading-tight">يرجى كتابة رقم هاتف مغربي صحيح (مثال: 0612345678)</p>
						{/if}
					</div>

					{#if formError}
						<div class="rounded-xl bg-red-50 border border-red-200 p-1.5 text-xs text-red-700 font-bold text-center">
							{formError}
						</div>
					{/if}

					<!-- Orange Confirm Button -->
					<button
						type="submit"
						disabled={isSubmitting}
						data-confirm-btn
						class="w-full h-12 min-h-12 px-4 rounded-xl bg-[#E0661A] hover:bg-[#C85610] active:scale-[0.98] text-white font-black text-[15.5px] sm:text-[16px] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
					>
						{#if isSubmitting}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							<span>جاري تأكيد طلبك...</span>
						{:else}
							<span>🚚</span>
							<span>تأكيد الطلب الآن • {selectedBundle.price} درهم</span>
						{/if}
					</button>

					<!-- Small gray centered text under the button -->
					<p class="text-center text-[11.5px] sm:text-[12px] font-bold text-stone-500 mt-1.5 mb-0 leading-tight">
						الدفع عند الاستلام 🔒
					</p>
				</form>
			</div>
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
					onclick={scrollToOrderSection}
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
	<!-- 10. DYNAMIC STICKY MOBILE BOTTOM CTA BAR                          -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if isStickyCtaVisible}
		<div
			class="fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-2.5 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-2xl sm:hidden"
			style="padding-bottom: max(0.85rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem));"
			dir="rtl"
		>
			<div class="max-w-md mx-auto flex flex-col items-center justify-center gap-1.5">
				<button
					type="button"
					onclick={scrollToOrderSection}
					class="w-full h-[46px] min-h-[46px] py-2 px-4 rounded-xl bg-[#073824] hover:bg-[#052b1b] text-white font-black text-sm sm:text-base shadow-md shadow-emerald-950/25 border border-emerald-600/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer text-center btn-shake"
				>
					<span>استفد من العرض الآن</span>
				</button>
				<p class="text-center text-[11.5px] font-bold text-stone-600 flex items-center justify-center gap-1.5 leading-normal pt-0.5 pb-0.5">
					<span>التوصيل بالمجان والدفع عند الاستلام</span>
					<span class="text-[12px]">🔒</span>
				</p>
			</div>
		</div>
	{/if}
</main>
<style>
	@keyframes cta-horizontal-shake {
		0%, 100% {
			transform: translateX(0);
		}
		4% {
			transform: translateX(-3px);
		}
		8% {
			transform: translateX(3px);
		}
		12% {
			transform: translateX(-3px);
		}
		16% {
			transform: translateX(3px);
		}
		20% {
			transform: translateX(-1.5px);
		}
		24% {
			transform: translateX(0);
		}
	}

	:global(.btn-shake) {
		will-change: transform;
		animation: cta-horizontal-shake 2.6s ease-in-out infinite;
	}
</style>
