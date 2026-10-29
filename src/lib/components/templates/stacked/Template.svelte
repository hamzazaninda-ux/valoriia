<script lang="ts">
	import { onMount } from 'svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import CartDrawer from '$lib/components/shared/CartDrawer.svelte';
	import CheckoutModal from '$lib/components/shared/CheckoutModal.svelte';
	import OfferTiers from '$lib/components/OfferTiers.svelte';
	import DrainUpsellModal from '$lib/components/DrainUpsellModal.svelte';
	import { cartUi } from '$lib/stores/cart.svelte';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';
	import { trackSnapPurchase, preserveTrackingParams } from '$lib/utils/tracking';
	import { cloudinaryUrl, cloudinarySrcset } from '$lib/utils/images';

	let { product, settings, theme, others = [] }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('stacked'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	const HERO_IMAGE_URL =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1793014131/Smart_Bathroom_Organizer_Gift_Set.png';

	const defaultOffers: ProductOffer[] = [
		{
			id: 1,
			title: 'قطعة واحدة + رشاش هدية مجانية 🎁',
			subtitle: 'توصيل مجاني لجميع المدن',
			price: 279,
			originalPrice: 399,
			quantity: 1,
			badge: null,
			image:
				'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg',
			isPopular: false
		},
		{
			id: 2,
			title: 'قطعتان + رشاشان هدية مجانية 🎁',
			subtitle: 'توصيل مجاني لجميع المدن',
			price: 449,
			originalPrice: 699,
			quantity: 2,
			badge: '🔥 العرض الأوفر والأكثر طلباً',
			image:
				'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg',
			isPopular: true
		}
	];

	const defaultFaq = [
		{
			question: 'هل يمكن تركيبه على جميع الارتفاعات ومختلف أنواع الأسقف؟',
			answer: 'نعم بكل تأكيد! تم تصميم العمود بتقنية تلسكوبية مبتكرة قابلة للتعديل بسلاسة من 1.10 متر حتى 3.10 أمتار، مما يجعله ملائماً ومناسباً لأي حمام مهما كان ارتفاع السقف.'
		},
		{
			question: 'هل الثبات قوي ويتحمل الأوزان الثقيلة دون أن يسقط؟',
			answer: 'تم تصميمه بأعلى معايير الأمان؛ الحامل مزود بنوابض داخلية قوية وقواعد تثبيت مانعة للانزلاق في الأعلى والأسفل، ويتحمل وزناً يصل إلى 15-20 كيلوغراماً بثبات تام دون أن يتحرك.'
		},
		{
			question: 'ما هي المواد المصنوع منها المنظم؟ وهل هو مقاوم للصدأ؟',
			answer: 'المنظم مصنوع من الفولاذ المقاوم للصدأ عالي الجودة مع رفوف بلاستيكية مقواة من نوع ABS، مصممة خصيصاً لمقاومة الماء والرطوبة الشديدة لسنوات طويلة دون أي صدأ أو تلف.'
		},
		{
			question: 'هل يحق لي فحص ومعاينة المنتج قبل الدفع؟',
			answer: 'بالتأكيد! حق المعاينة مضمون بالكامل. عند وصول مندوب التوصيل، يمكنك فتح الشحنة والتأكد من سلامة وجودة المنتج قبل سداد المبلغ.'
		},
		{
			question: 'كم تستغرق مدة التوصيل؟ وما هي طريقة الدفع؟',
			answer: 'التوصيل سريع ومجاني لجميع المدن. يتم التواصل معك هاتفياً لتأكيد العنوان، ويصلك الطلب خلال 24 إلى 48 ساعة حتى باب منزلك مع الدفع نقداً عند الاستلام.'
		}
	];

	const activeFaq = $derived(
		content.faq && content.faq.length >= 5 ? content.faq : defaultFaq
	);

	const offersList = $derived.by(() => {
		const rawOffers = pricing?.offers && pricing.offers.length > 0 ? pricing.offers : defaultOffers;
		if (rawOffers.length < 2) {
			return defaultOffers;
		}
		return rawOffers;
	});

	let selectedPack = $state<number | null>(1);

	const currentPackId = $derived(
		selectedPack ??
			offersList[0]?.id ??
			1
	);

	const activeOffer = $derived(
		offersList.find((o: ProductOffer) => o.id === currentPackId) ||
			offersList[0] || { title: 'قطعة واحدة + رشاش هدية مجانية 🎁', price: 229, quantity: 1 }
	);

	let showStickyBtn = $state(true);
	let isFormAbove = $state(false);

	const sheetsUrl = $derived(
		(order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim()
	);

	// Canonical definition of Child Safety Lock product (for CartDrawer cross-sell compatibility)
	const childLockProduct = {
		slug: 'qofl-al-aman',
		title: 'قفل أمان ذكي: حماية الأطفال من فتح الثلاجة والخزائن 🔒',
		subtitle: 'قفل عملي وفعال لحماية الأطفال في المنزل',
		heroImage:
			'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp',
		startingPrice: 49
	};

	const cartUpsells = $derived.by(() => {
		const foundLock = others.find(
			(p) => p.slug === 'qofl-al-aman' || p.title.includes('قفل')
		);

		return [
			{
				...childLockProduct,
				...(foundLock || {}),
				title: 'قفل أمان ذكي: حماية الأطفال من فتح الثلاجة والخزائن 🔒',
				subtitle: 'قفل عملي وفعال لحماية الأطفال في المنزل',
				startingPrice: 49,
				heroImage:
					'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp'
			}
		];
	});

	let customerName = $state('');
	let customerPhone = $state('');
	let fullName = $state('');
	let phone = $state('');
	let selectedTier = $state({
		id: 'tier1',
		price: 279,
		title: 'قطعة واحدة + رشاش هدية'
	});
	let nameBlurredInvalid = $state(false);
	let phoneBlurredInvalid = $state(false);
	let submitAttempted = $state(false);
	let formError = $state('');
	let isSubmitting = $state(false);
	let isSubmittingFinal = $state(false);
	let submittedOrderId = $state<string | null>(null);

	let showDrainUpsell = $state(false);
	let pendingOrder = $state<{
		orderId: string;
		date_order: string;
		customerName: string;
		phone: string;
		city_address: string;
		offerSku: string;
		productTitleStr: string;
		quantity: number;
		basePrice: number;
		sheetsUrl: string;
	} | null>(null);

	async function handleAcceptDrainUpsell() {
		if (!pendingOrder || isSubmittingFinal) return;
		isSubmittingFinal = true;

		const currentOrder = pendingOrder;
		const upsellPrice = 29;
		const finalPrice = currentOrder.basePrice + upsellPrice;
		const finalSku = `${currentOrder.offerSku} + سدادة وفلتر مصرف الأرضية`;
		const fullProductLabel = `${currentOrder.productTitleStr} + سدادة وفلتر مصرف الأرضية`;
		const orderNote = 'مع عرض السدادة (+29 درهم)';

		const payload = {
			date_order: currentOrder.date_order,
			order_id: currentOrder.orderId,
			full_name: currentOrder.customerName,
			phone: currentOrder.phone,
			city_address: currentOrder.city_address,
			sku: finalSku,
			qte: currentOrder.quantity,
			price: finalPrice,
			note: orderNote,
			delivery_note: '',
			rowData: [
				currentOrder.date_order,
				currentOrder.orderId,
				currentOrder.customerName,
				currentOrder.phone,
				currentOrder.city_address,
				finalSku,
				currentOrder.quantity,
				finalPrice,
				orderNote,
				''
			],
			orderId: currentOrder.orderId,
			id: currentOrder.orderId,
			fullName: currentOrder.customerName,
			name: currentOrder.customerName,
			phoneNumber: currentOrder.phone,
			city: currentOrder.city_address,
			address: currentOrder.city_address,
			productTitle: fullProductLabel,
			selectedOfferTitle: finalSku,
			offer: finalSku,
			offerSku: finalSku,
			quantity: currentOrder.quantity,
			totalPrice: finalPrice,
			total: finalPrice,
			sheetsUrl: currentOrder.sheetsUrl
		};

		// 1. Dispatch the SINGLE consolidated webhook call
		let checkoutOk = false;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			checkoutOk = res.ok;
			if (!res.ok) console.warn('API checkout non-ok status:', res.status);
		} catch (err) {
			console.error('Checkout error:', err);
		}

		if (!checkoutOk) {
			isSubmitting = false;
			isSubmittingFinal = false;
			showDrainUpsell = false;
			formError = 'تعذر إرسال الطلب، المرجو المحاولة مرة أخرى';
			return;
		}

		// 2. Mark order sent to prevent duplicate session submissions
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(`order_sent_${currentOrder.orderId}`, 'true');

			// 3. Save latestOrder in localStorage & sessionStorage
			const savedOrder = {
				orderId: currentOrder.orderId,
				fullName: currentOrder.customerName,
				phoneNumber: currentOrder.phone,
				city: currentOrder.city_address,
				address: currentOrder.city_address,
				date: new Date().toLocaleDateString('ar-MA'),
				price: finalPrice,
				total: finalPrice,
				productTitle: fullProductLabel,
				offer: finalSku,
				quantity: currentOrder.quantity,
				qte: currentOrder.quantity,
				sku: finalSku,
				hasUpsell: true,
				upsellPrice: 29
			};

			try {
				localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
				sessionStorage.setItem('latestOrder', JSON.stringify(savedOrder));
			} catch (e) {
				console.warn('Storage save error:', e);
			}

			// 4. Fire Single Conversion Tracking
			try {
				if (typeof (window as any).gtag === 'function') {
					(window as any).gtag('event', 'conversion', {
						send_to: 'AW-18405009405',
						value: finalPrice,
						currency: 'MAD',
						transaction_id: currentOrder.orderId
					});
				}
			} catch {}

			try {
				trackSnapPurchase({
					orderId: currentOrder.orderId,
					price: finalPrice,
					currency: 'MAD',
					phone: currentOrder.phone,
					title: fullProductLabel,
					sku: finalSku,
					quantity: currentOrder.quantity
				});
			} catch (snapErr) {
				console.warn('Snap Purchase tracking error:', snapErr);
			}

			// 5. Redirect to Thank You page
			showDrainUpsell = false;
			const finalUrl = preserveTrackingParams(
				`/thank-you?orderId=${currentOrder.orderId}&name=${encodeURIComponent(currentOrder.customerName)}&phone=${encodeURIComponent(currentOrder.phone)}&city=${encodeURIComponent(currentOrder.city_address)}&total=${finalPrice}&upsell=1`
			);
			window.location.href = finalUrl;
		}
	}

	async function handleDeclineDrainUpsell() {
		if (!pendingOrder || isSubmittingFinal) return;
		isSubmittingFinal = true;

		const currentOrder = pendingOrder;
		const finalPrice = currentOrder.basePrice;
		const finalSku = currentOrder.offerSku;
		const fullProductLabel = currentOrder.productTitleStr;

		const payload = {
			date_order: currentOrder.date_order,
			order_id: currentOrder.orderId,
			full_name: currentOrder.customerName,
			phone: currentOrder.phone,
			city_address: currentOrder.city_address,
			sku: finalSku,
			qte: currentOrder.quantity,
			price: finalPrice,
			note: '',
			delivery_note: '',
			rowData: [
				currentOrder.date_order,
				currentOrder.orderId,
				currentOrder.customerName,
				currentOrder.phone,
				currentOrder.city_address,
				finalSku,
				currentOrder.quantity,
				finalPrice,
				'',
				''
			],
			orderId: currentOrder.orderId,
			id: currentOrder.orderId,
			fullName: currentOrder.customerName,
			name: currentOrder.customerName,
			phoneNumber: currentOrder.phone,
			city: currentOrder.city_address,
			address: currentOrder.city_address,
			productTitle: fullProductLabel,
			selectedOfferTitle: finalSku,
			offer: finalSku,
			offerSku: finalSku,
			quantity: currentOrder.quantity,
			totalPrice: finalPrice,
			total: finalPrice,
			sheetsUrl: currentOrder.sheetsUrl
		};

		// 1. Dispatch the SINGLE original order webhook call
		let checkoutOk = false;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			checkoutOk = res.ok;
			if (!res.ok) console.warn('API checkout non-ok status:', res.status);
		} catch (err) {
			console.error('Checkout error:', err);
		}

		if (!checkoutOk) {
			isSubmitting = false;
			isSubmittingFinal = false;
			showDrainUpsell = false;
			formError = 'تعذر إرسال الطلب، المرجو المحاولة مرة أخرى';
			return;
		}

		// 2. Mark order sent to prevent duplicate session submissions
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(`order_sent_${currentOrder.orderId}`, 'true');

			// 3. Save latestOrder in localStorage & sessionStorage
			const savedOrder = {
				orderId: currentOrder.orderId,
				fullName: currentOrder.customerName,
				phoneNumber: currentOrder.phone,
				city: currentOrder.city_address,
				address: currentOrder.city_address,
				date: new Date().toLocaleDateString('ar-MA'),
				price: finalPrice,
				total: finalPrice,
				productTitle: fullProductLabel,
				offer: finalSku,
				quantity: currentOrder.quantity,
				qte: currentOrder.quantity,
				sku: finalSku
			};

			try {
				localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
				sessionStorage.setItem('latestOrder', JSON.stringify(savedOrder));
			} catch (e) {
				console.warn('Storage save error:', e);
			}

			// 4. Fire Single Conversion Tracking
			try {
				if (typeof (window as any).gtag === 'function') {
					(window as any).gtag('event', 'conversion', {
						send_to: 'AW-18405009405',
						value: finalPrice,
						currency: 'MAD',
						transaction_id: currentOrder.orderId
					});
				}
			} catch {}

			try {
				trackSnapPurchase({
					orderId: currentOrder.orderId,
					price: finalPrice,
					currency: 'MAD',
					phone: currentOrder.phone,
					title: fullProductLabel,
					sku: finalSku,
					quantity: currentOrder.quantity
				});
			} catch (snapErr) {
				console.warn('Snap Purchase tracking error:', snapErr);
			}

			// 5. Redirect to Thank You page
			showDrainUpsell = false;
			const finalUrl = preserveTrackingParams(
				`/thank-you?orderId=${currentOrder.orderId}&name=${encodeURIComponent(currentOrder.customerName)}&phone=${encodeURIComponent(currentOrder.phone)}&city=${encodeURIComponent(currentOrder.city_address)}&total=${finalPrice}`
			);
			window.location.href = finalUrl;
		}
	}

	function validateFullName(val: string): boolean {
		return val.replace(/\s+/g, '').length >= 2;
	}

	function validateMoroccanPhone(val: string): boolean {
		const stripped = val.trim().replace(/[\s\-\u200E\u200F\u202A-\u202E\u2066-\u2069]+/g, '');
		return /^(?:(?:\+|00)212|0)[67]\d{8}$/.test(stripped);
	}

	// Normalize Moroccan phone to 10-digit local format starting with '0' (e.g. 0612345678)
	function normalizeMoroccanPhone(rawPhone: string): string {
		const stripped = String(rawPhone || '').trim().replace(/[\s\-\u200E\u200F\u202A-\u202E\u2066-\u2069]+/g, '');
		const match = stripped.match(/^(?:(?:\+|00)212|0)([67]\d{8})$/);
		return match ? `0${match[1]}` : stripped;
	}

	const isNameValid = $derived(validateFullName(fullName || customerName));
	const isPhoneValid = $derived(validateMoroccanPhone(phone || customerPhone));

	$effect(() => {
		if (isNameValid) {
			nameBlurredInvalid = false;
		}
		if (isPhoneValid) {
			phoneBlurredInvalid = false;
		}
		if (isNameValid && isPhoneValid && submitAttempted) {
			submitAttempted = false;
		}
	});

	const showNameError = $derived(!isNameValid && (submitAttempted || nameBlurredInvalid));
	const showPhoneError = $derived(!isPhoneValid && (submitAttempted || phoneBlurredInvalid));

	function scrollAndFocusInvalid(fieldId: string) {
		if (typeof document === 'undefined') return;
		const input = document.getElementById(fieldId) as HTMLElement | null;
		if (!input) return;

		let prefersReduced = false;
		try {
			prefersReduced =
				typeof window !== 'undefined' &&
				typeof window.matchMedia === 'function' &&
				window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		} catch {}

		try {
			input.scrollIntoView({
				behavior: prefersReduced ? 'auto' : 'smooth',
				block: 'center'
			});
		} catch {
			input.scrollIntoView();
		}

		try {
			input.focus({ preventScroll: true });
		} catch {
			input.focus();
		}
	}

	function handleDirectCheckout(event?: Event) {
		event?.preventDefault();

		if (isSubmitting || isSubmittingFinal || showDrainUpsell) return;

		if (
			submittedOrderId &&
			typeof window !== 'undefined' &&
			sessionStorage.getItem(`order_sent_${submittedOrderId}`)
		) {
			window.location.href = `/thank-you?orderId=${submittedOrderId}`;
			return;
		}

		formError = '';
		submitAttempted = true;

		if (!validateFullName(customerName)) {
			nameBlurredInvalid = true;
			scrollAndFocusInvalid('order-fullName');
			return;
		}

		if (!validateMoroccanPhone(customerPhone)) {
			phoneBlurredInvalid = true;
			scrollAndFocusInvalid('order-phone');
			return;
		}

		isSubmitting = true;

		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		submittedOrderId = orderId;

		const activeFullName = (fullName || customerName).trim();
		const normalizedPhone = normalizeMoroccanPhone(phone || customerPhone);
		fullName = activeFullName;
		phone = normalizedPhone;
		customerName = activeFullName;
		customerPhone = normalizedPhone;

		const cleanPrice = selectedTier?.price || (currentPackId === 2 ? 449 : 279);
		const quantity = Number(selectedTier?.id === 'tier2' || currentPackId === 2 ? 2 : 1);
		const offerSku =
			selectedTier?.title ||
			(quantity === 2 ? 'قطعتان + 2 رشاشات هدية 🎁🎁' : 'قطعة واحدة + رشاش هدية 🎁');
		const productTitleStr = (
			content?.title ||
			(product as any)?.title ||
			offerSku ||
			'طقم تنظيم الحمام الذكي'
		).trim();
		const date_order = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const city_address = 'المغرب (سيتم التأكيد هاتفياً)';

		pendingOrder = {
			orderId,
			date_order,
			customerName: customerName.trim(),
			phone: normalizedPhone,
			city_address,
			offerSku,
			productTitleStr,
			quantity,
			basePrice: cleanPrice,
			sheetsUrl
		};

		// Hold in memory & open post-purchase upsell modal before firing single Google Sheet row
		showDrainUpsell = true;
	}

	function scrollToOrderForm(e?: Event) {
		e?.preventDefault();
		try {
			if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
				const itemPrice = Number(selectedTier?.price || (currentPackId === 2 ? 449 : 279));
				const itemName = (product as any)?.title || content?.title || 'طقم تنظيم الحمام الذكي';

				(window as any).gtag('event', 'add_to_cart', {
					currency: 'MAD',
					value: itemPrice,
					items: [
						{
							item_id: (product as any)?.id || 'kit-tandim',
							item_name: itemName,
							price: itemPrice,
							quantity: selectedTier?.id === 'tier2' || currentPackId === 2 ? 2 : 1
						}
					]
				});
			}
		} catch {}

		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const targetEl = document.getElementById('order-form');
		if (targetEl) {
			targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleSubmitOrder(event?: Event) {
		handleDirectCheckout(event);
	}

	onMount(() => {
		const formElement = document.getElementById('order-form');
		let formVisible = false;

		function updateStickyState() {
			showStickyBtn = !formVisible;
			if (formElement) {
				isFormAbove = formElement.getBoundingClientRect().top < 0;
			}
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target.id === 'order-form') {
						formVisible = entry.isIntersecting;
					}
				}
				updateStickyState();
			},
			{ threshold: 0.08, rootMargin: '0px 0px 20px 0px' }
		);

		if (formElement) observer.observe(formElement);
		updateStickyState();
		window.addEventListener('scroll', updateStickyState, { passive: true });

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', updateStickyState);
		};
	});
</script>

<div
	class="kit-page-shell cta-wiggle-scope max-w-xl mx-auto shadow-2xl flex flex-col relative border-x border-stone-200/70 overflow-x-clip"
	style="{buildThemeCssVars(t)}; background-color: #FAF9F6; color: #14231B;"
	dir="rtl"
>
	<!-- 1. Top Announcement Bar -->
	<div
		id="top-announcement-bar"
		class="sticky top-0 z-40 w-full max-w-full bg-[#073824] text-white py-2 px-2.5 text-[12px] font-bold text-center border-b border-white/10 truncate select-none"
		dir="rtl"
	>
		🚚 توصيل مجاني · 📦 الدفع بعد المعاينة
	</div>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 2. HERO IMAGE ATTACHED DIRECTLY BELOW (ZERO TEXT IN BETWEEN)    -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<header
		id="hero-section"
		class="bg-gradient-to-b from-[#073824] via-[#0B2E1E] via-45% to-[#FAF9F6] pb-2"
	>
		<!-- Hero Image Container (Directly attached under the top announcement bar) -->
		<div class="w-full max-w-[380px] mx-auto px-2 pt-1 pb-2">
			<a
				href="#order-form"
				onclick={scrollToOrderForm}
				class="block relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 focus:outline-none"
				aria-label="انتقل إلى استمارة الطلب"
			>
				<img
					src={cloudinaryUrl(HERO_IMAGE_URL, 'f_auto,q_auto,w_720')}
					srcset={cloudinarySrcset(HERO_IMAGE_URL, [480, 720, 960])}
					sizes="(max-width: 400px) calc(100vw - 16px), 364px"
					alt="طقم تنظيم الحمام الذكي مع رشاش تعزيز ضغط الماء هدية مجانية"
					width="940"
					height="1672"
					fetchpriority="high"
					loading="eager"
					decoding="async"
					class="w-full h-auto block object-cover"
				/>
			</a>
		</div>

		<!-- Micro Trust Badges -->
		<div class="px-2.5 sm:px-5 mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
			<div class="flex flex-col sm:flex-row min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-white border border-emerald-900/10 px-2 py-2 text-center shadow-xs">
				<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
				</svg>
				<span class="text-[11px] sm:text-xs font-extrabold text-stone-800 leading-tight">توصيل مجاني لجميع المدن</span>
			</div>

			<div class="flex flex-col sm:flex-row min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-white border border-emerald-900/10 px-2 py-2 text-center shadow-xs">
				<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
				</svg>
				<span class="text-[11px] sm:text-xs font-extrabold text-stone-800 leading-tight">الدفع بعد المعاينة</span>
			</div>

			<div class="flex flex-col sm:flex-row min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-white border border-emerald-900/10 px-2 py-2 text-center shadow-xs">
				<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0112 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 01-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 014.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z" />
				</svg>
				<span class="text-[11px] sm:text-xs font-extrabold text-stone-800 leading-tight">ضمان 14 يوماً</span>
			</div>
		</div>
	</header>

	<!-- =================================================== -->
	<!-- COD CHECKOUT & STREAMLINED OFFERS SECTION -->
	<!-- =================================================== -->
	<section id="order-form" class="scroll-mt-12 sm:scroll-mt-14 w-full max-w-md mx-auto px-3 my-6" dir="rtl">
		<div class="bg-[#0B3B24] rounded-t-3xl pt-5 pb-3 px-4 text-center text-white">
			<h2 class="text-xl sm:text-2xl font-black mb-1">أكمل طلبك الآن</h2>
			<p class="text-xs text-emerald-200 font-medium">الدفع عند الاستلام بعد المعاينة، والتوصيل فابور 🚚</p>
		</div>

		<div class="bg-white rounded-b-3xl p-4 sm:p-5 shadow-xl border border-emerald-900/10 space-y-3">
			<!-- ==================== OFFER 1 (TIER 1) ==================== -->
			<div
				onclick={() => {
					selectedTier = { id: 'tier1', price: 279, title: 'قطعة واحدة + رشاش هدية' };
					selectedPack = 1;
				}}
				class="relative cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex items-center justify-between gap-2.5 {selectedTier?.id === 'tier1' ? 'border-[#0B5E3C] bg-emerald-50/40 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}"
			>
				<!-- RIGHT: Radio Selection Circle -->
				<div class="flex items-center justify-center shrink-0">
					<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center {selectedTier?.id === 'tier1' ? 'border-[#0B5E3C] bg-[#0B5E3C] text-white' : 'border-gray-300 bg-white'}">
						{#if selectedTier?.id === 'tier1'}
							<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</div>
				</div>

				<!-- CENTER: Concise Offer Text + Product Thumbnail -->
				<div class="flex items-center gap-2.5 flex-1 min-w-0">
					<img
						src="https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg"
						alt="1 قطعة"
						class="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
					/>
					<div class="text-right truncate">
						<div class="font-black text-gray-900 text-sm leading-tight">1 قطعة + رشاش هدية 🎁</div>
						<span class="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">
							وفر 120 درهم
						</span>
					</div>
				</div>

				<!-- LEFT: Clean Price -->
				<div class="text-left shrink-0">
					<div class="font-black text-base sm:text-lg text-[#0B5E3C] leading-none">279 درهم</div>
					<div class="text-[11px] text-gray-400 line-through mt-0.5">399 درهم</div>
				</div>
			</div>

			<!-- ==================== OFFER 2 (TIER 2 - BEST VALUE) ==================== -->
			<div
				onclick={() => {
					selectedTier = { id: 'tier2', price: 449, title: 'قطعتان + 2 رشاشات هدية' };
					selectedPack = 2;
				}}
				class="relative cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex items-center justify-between gap-2.5 mt-2 {selectedTier?.id === 'tier2' ? 'border-[#0B5E3C] bg-emerald-50/40 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}"
			>
				<!-- Top Saving Badge -->
				<span class="absolute -top-2.5 right-4 bg-amber-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
					🔥 العرض الأوفر والأكثر طلباً
				</span>

				<!-- RIGHT: Radio Selection Circle -->
				<div class="flex items-center justify-center shrink-0">
					<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center {selectedTier?.id === 'tier2' ? 'border-[#0B5E3C] bg-[#0B5E3C] text-white' : 'border-gray-300 bg-white'}">
						{#if selectedTier?.id === 'tier2'}
							<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</div>
				</div>

				<!-- CENTER: Concise Offer Text + Product Thumbnail -->
				<div class="flex items-center gap-2.5 flex-1 min-w-0">
					<img
						src="https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg"
						alt="2 قطع"
						class="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
					/>
					<div class="text-right truncate">
						<div class="font-black text-gray-900 text-sm leading-tight">2 قطع + 2 رشاشات 🎁🎁</div>
						<span class="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">
							وفر 250 درهم (224 د/قطعة)
						</span>
					</div>
				</div>

				<!-- LEFT: Clean Price -->
				<div class="text-left shrink-0">
					<div class="font-black text-base sm:text-lg text-[#0B5E3C] leading-none">449 درهم</div>
					<div class="text-[11px] text-gray-400 line-through mt-0.5">699 درهم</div>
				</div>
			</div>

			<!-- ==================== FORM INPUTS (ONLY NAME & PHONE) ==================== -->
			<form onsubmit={handleDirectCheckout} novalidate class="pt-3 border-t border-gray-100 space-y-3 text-right">
				<h3 class="font-bold text-gray-800 text-sm">معلومات الاستلام</h3>

				<!-- 1. Full Name -->
				<div>
					<label for="order-fullName" class="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل *</label>
					<input
						id="order-fullName"
						type="text"
						bind:value={fullName}
						onblur={() => {
							if (fullName.trim().length > 0 && !validateFullName(fullName)) {
								nameBlurredInvalid = true;
							}
						}}
						required
						placeholder="اكتب اسمك هنا"
						class="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0B5E3C] focus:ring-1 focus:ring-[#0B5E3C] {showNameError ? 'border-red-500 bg-red-50/20' : 'bg-white'}"
					/>
					{#if showNameError}
						<p class="text-xs text-red-600 font-bold mt-1 text-right">المرجو إدخال الاسم (حرفان على الأقل).</p>
					{/if}
				</div>

				<!-- 2. Phone Number -->
				<div>
					<label for="order-phone" class="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف (واتساب) *</label>
					<input
						id="order-phone"
						type="tel"
						bind:value={phone}
						onblur={() => {
							if (phone.trim().length > 0 && !validateMoroccanPhone(phone)) {
								phoneBlurredInvalid = true;
							}
						}}
						required
						dir="ltr"
						placeholder="06XXXXXXXX أو 07XXXXXXXX"
						class="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm text-right focus:outline-none focus:border-[#0B5E3C] focus:ring-1 focus:ring-[#0B5E3C] {showPhoneError ? 'border-red-500 bg-red-50/20' : 'bg-white'}"
					/>
					{#if showPhoneError}
						<p class="text-xs text-red-600 font-bold mt-1 text-right">المرجو إدخال رقم هاتف مغربي صحيح (مثال: 0612345678).</p>
					{/if}
				</div>

				{#if formError}
					<div class="rounded-xl bg-red-50 border border-red-200 p-2 text-xs text-red-700 font-bold text-center">
						{formError}
					</div>
				{/if}

				<!-- Submit CTA Button -->
				<button
					type="submit"
					disabled={isSubmitting || isSubmittingFinal}
					class="w-full mt-2 py-3.5 px-4 bg-[#D95D0F] hover:bg-[#C24F08] active:scale-[0.99] transition text-white font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
				>
					{#if isSubmitting || isSubmittingFinal}
						<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						<span>جاري الإرسال...</span>
					{:else}
						<span>🚚 تأكيد الطلب الآن • {selectedTier?.price || 279} درهم</span>
					{/if}
				</button>

				<!-- Trust Assurance Note -->
				<p class="text-[11px] text-gray-500 text-center font-medium pt-1">
					🔒 الدفع عند الاستلام بعد المعاينة • توصيل مجاني وسريع لجميع المدن المغربية
				</p>
			</form>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 3–7. PERSUASIVE VISUAL CARDS (IMAGES 2 TO 6 BELOW THE FORM)     -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<div class="px-2.5 sm:px-4 max-w-[560px] mx-auto space-y-6 pt-1 pb-4 below-fold-lazy-section" dir="rtl">
		<!-- Section Transition Header -->
		<div class="text-center pt-1 mb-2">
			<span class="inline-block text-[11px] sm:text-xs font-extrabold tracking-wide text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
				اكتشفي تفاصيل الجودة والعملية
			</span>
			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900 mt-1.5">
				لماذا يفضل عملاؤنا هذا المنظم؟
			</h2>
		</div>

<!-- ========================================== -->
<!-- 1. NO-DRILL / FAST SETUP CARD -->
<!-- ========================================== -->
<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center" dir="rtl">
  <span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
    ⚡ تركيب سريع وسهل في 5 دقائق
  </span>
  <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
    تركيب سهل بدون ثقب أو إتلاف لسيراميك حمامك
  </h2>
  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
    مصمم بتقنية تلسكوبية ذكية قابلة للتعديل بسهولة من 1.10 متر إلى 3.10 أمتار ليناسب أي سقف. نوابض داخلية متينة وقواعد سيليكون تثبت الحامل بإحكام بين الأرض والسقف دون الحاجة لأي براغٍ أو إتلاف للجدران.
  </p>
  <div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
    <img 
      src="https://res.cloudinary.com/xqjngk8y/image/upload/v1792951490/Screenshot_2026-10-25_180133.png" 
      alt="تركيب سهل بدون ثقب أو براغي" 
      loading="lazy"
      decoding="async"
      class="w-full h-auto object-cover block"
    />
  </div>
</div>

<!-- ========================================== -->
<!-- 2. STABILITY & HEAVY LOAD CARD -->
<!-- ========================================== -->
<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center" dir="rtl">
  <span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
    💪 قدرة تحمّل فائقة وثبات استثنائي
  </span>
  <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
    تحمّل عالي لجميع مستلزمات الحمام بثبات وأمان تام
  </h2>
  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
    رفوف واسعة وعميقة مصنوعة من مواد مقاومة للماء والرطوبة مع أعمدة صلبة من الفولاذ المقاوم للصدأ. يتحمل عبوات الشامبو ومستحضرات الاستحمام الثقيلة بثبات كامل دون أي انزلاق أو ميلان.
  </p>
  <div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
    <img 
      src="https://res.cloudinary.com/xqjngk8y/image/upload/v1792951411/Screenshot_2026-10-25_180152.png" 
      alt="ثبات استثنائي وقدرة تحمل عالية" 
      loading="lazy"
      decoding="async"
      class="w-full h-auto object-cover block"
    />
  </div>
</div>

<!-- ========================================== -->
<!-- 3. EXCLUSIVE GIFT (TURBO SHOWER HEAD) CARD -->
<!-- ========================================== -->
<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-100 text-center" dir="rtl">
  <span class="inline-block bg-amber-100 text-amber-900 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
    🎁 هدية حصرية بقيمة 99 درهم مجاناً
  </span>
  <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
    رشاش التوربو المزدوج: تدفق ماء قوي وتوزيع متوازن
  </h2>
  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
    حل مثالي لزيادة تدفق المياه وتوزيعها بانسيابية تامة! يحتوي على 3 أنظمة تدفق مختلفة مع زر إيقاف فوري للتحكم، مما يمنحك تجربة استحمام مريحة مع توفير استهلاك المياه.
  </p>
  <div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
    <img 
      src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793122075/Gemini_Generated_Image_aqu0syaqu0syaqu0.jpg" 
      alt="رشاش التوربو المزدوج هدية مجانية" 
      loading="lazy"
      decoding="async"
      class="w-full h-auto object-cover block"
    />
  </div>
</div>

<!-- ========================================== -->
<!-- 4. BEFORE & AFTER COMPARISON CARD -->
<!-- ========================================== -->
<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center" dir="rtl">
  <span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
    ✨ تحوّل حقيقي قبل وبعد
  </span>
  <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
    شاهدي كيف يتحول حمامك إلى مساحة منظمة وأنيقة
  </h2>
  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
    استغلي زوايا الحمام غير المستغلة وحوّلي الفوضى إلى مساحة مرتبة وواسعة، تسهّل التنظيف اليومي بكل راحة ودون أي عناء.
  </p>
  <div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
    <img 
      src="https://res.cloudinary.com/xqjngk8y/image/upload/v1793121027/Gemini_Generated_Image_6o8y9c6o8y9c6o8y.jpg" 
      alt="مقارنة شكل الحمام قبل وبعد استخدام منظم الزوايا" 
      loading="lazy"
      decoding="async"
      class="w-full h-auto object-cover block"
    />
  </div>
</div>

<!-- ========================================== -->
<!-- 5. MODERN BATHROOM AESTHETICS CARD -->
<!-- ========================================== -->
<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center" dir="rtl">
  <span class="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full mb-3">
    🏡 تصميم عصري يلائم جميع الديكورات
  </span>
  <h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">
    لمسة راقية تمنح حمامك طابعاً فندقياً أنيقاً
  </h2>
  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">
    لون أبيض ناصع مع لمسات من الفولاذ المقاوم للصدأ يمنح مظهراً عصرياً فخماً، يتناسق تماماً مع مختلف ألوان السيراميك والرخام.
  </p>
  <div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
    <img 
      src="https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg" 
      alt="منظم حمام عصري بتصميم فندقي راقٍ" 
      loading="lazy"
      decoding="async"
      class="w-full h-auto object-cover block"
    />
  </div>
</div>
	</div>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 8. CUSTOMER REVIEWS & FAQ BELOW VISUAL CARDS                    -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="px-2.5 sm:px-4 py-5 below-fold-lazy-section" dir="rtl">
		<div class="text-center mb-5">
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold mb-2">
				<svg aria-hidden="true" class="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
				</svg>
				تجارب حقيقية 100%
			</span>
			<h3 class="text-xl sm:text-2xl font-extrabold font-display text-stone-900 tracking-tight">
				آراء زبنائنا الكرام
			</h3>
			<p class="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
				هذا ما يقوله عملاؤنا الكرام بعد تجربة طقم منظم الحمام ورشاش التوربو الهدية
			</p>
		</div>

		<div class="space-y-3.5">
			<!-- Review 1: Fatima Zahra -->
			<div class="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							ف
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900 leading-tight">فاطمة الزهراء</h4>
							<span class="text-[11px] text-stone-500 font-medium">الدار البيضاء</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
						<svg aria-hidden="true" class="h-3 w-3 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg aria-hidden="true" class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed">
					"استلمت الطلب بالأمس وقمت بتركيبه بنفسي بكل سهولة دون الحاجة إلى أدوات أو مساعدة لأنه لا يحتاج لأي ثقب بالجدار. المنتج متين وثابت جداً واتسع لجميع مستلزمات الحمام والشامبو. شكراً لكم على هذا المنتج الرائع".
				</p>
			</div>

			<!-- Review 2: Hicham -->
			<div class="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							هـ
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900 leading-tight">هشام</h4>
							<span class="text-[11px] text-stone-500 font-medium">مراكش</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
						<svg aria-hidden="true" class="h-3 w-3 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg aria-hidden="true" class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed">
					"بصراحة الرشاش الهدية ممتاز جداً وضاعف قوة تدفق الماء بشكل ملحوظ. كما أن المنظم مصنوع من خامات عالية الجودة ومقاوم للصدأ والرطوبة تماماً. تعامل راقٍ وتوصيل سريع جداً".
				</p>
			</div>

			<!-- Review 3: Souad -->
			<div class="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
				<div class="flex items-center justify-between gap-2 mb-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
							س
						</div>
						<div>
							<h4 class="font-extrabold text-sm text-stone-900 leading-tight">سعاد</h4>
							<span class="text-[11px] text-stone-500 font-medium">طنجة</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
						<svg aria-hidden="true" class="h-3 w-3 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						مشتري مؤكد
					</span>
				</div>

				<div class="flex items-center gap-0.5 mb-2" aria-label="5 نجوم">
					{#each Array(5) as _}
						<svg aria-hidden="true" class="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>

				<p class="text-xs sm:text-sm text-stone-700 leading-relaxed">
					"كنت قلقة بشأن المقاس لأن سقف الحمام مرتفع، لكن نظام التعديل التلسكوبي امتد بسلاسة وثبت بإحكام شديد. تخلصت تماماً من فوضى الحمام وأصبح كل شيء مرتباً وأنيقاً".
				</p>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	{#if t.sections.trustBadges.showFAQ && activeFaq && activeFaq.length > 0}
		<section class="px-2.5 sm:px-4 py-5 below-fold-lazy-section" dir="rtl">
			<div class="text-center mb-5">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold mb-2">
					<svg aria-hidden="true" class="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
					</svg>
					كل ما تحتاج معرفته
				</span>
				<h3 class="text-xl sm:text-2xl font-extrabold font-display text-stone-900 tracking-tight">
					{t.sections.trustBadges.faqTitle || 'الأسئلة الشائعة'}
				</h3>
				<p class="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
					إجابات شاملة ومباشرة على أكثر الأسئلة الشائعة من عملائنا
				</p>
			</div>

			<div class="space-y-3">
				{#each activeFaq as item}
					<details class="group rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-stone-300">
						<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
							<span class="flex items-center gap-2.5">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 border border-emerald-200/60">
									؟
								</span>
								<span>{item.question}</span>
							</span>
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-transform duration-300 group-open:rotate-180 group-open:bg-emerald-100 group-open:text-emerald-800">
								<svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
								</svg>
							</span>
						</summary>
						<div class="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/40">
							<p>{item.answer}</p>
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Google Ads Compliant Transparent Footer -->
	<footer class="bg-[#0B1F17] pt-8 pb-24 sm:pb-14 text-center text-xs text-emerald-100/75 px-4 mt-auto border-t border-emerald-900/40" dir="rtl">
		<div class="max-w-4xl mx-auto space-y-4">
			<!-- Store Info -->
			<div class="space-y-1">
				<p class="font-black text-sm sm:text-base text-white">Lhamza Shop</p>
				<p class="text-xs text-emerald-100/70 max-w-lg mx-auto">
					متجر مغربي موثوق متخصص في منتجات التنظيم والراحة المنزلية. توصيل سريع ومجاني لجميع المدن مع الدفع بعد المعاينة عند الاستلام.
				</p>
			</div>

			<!-- Policy Links -->
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

			<!-- Contact Info Bar -->
			<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-emerald-200/80">
				<span>📍 الدار البيضاء، المغرب</span>
				<span>📧 <a href="mailto:contact@lhamza.shop" class="underline hover:text-white">contact@lhamza.shop</a></span>
				<span>📱 <span dir="ltr">+212 626-558375</span></span>
				<span>⏰ 9:00 - 22:00</span>
			</div>

			<!-- Copyright -->
			<p class="text-[11px] text-emerald-400/60 pt-1">
				© {new Date().getFullYear()} Lhamza Shop (lhamza.shop). جميع الحقوق محفوظة.
			</p>
		</div>
	</footer>

	<!-- Floating Sticky CTA Button (Smooth-scrolls directly to #order-form under the hero) -->
	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="sticky-cta-wrap fixed bottom-2.5 inset-x-0 z-50 px-3 sm:px-4 overflow-x-clip pointer-events-none" dir="rtl">
			<button
				type="button"
				onclick={scrollToOrderForm}
				class="cta-wiggle sticky-cta-btn w-full max-w-xl mx-auto flex min-h-[52px] items-center justify-center gap-2 py-3 px-4 text-sm sm:text-base font-black text-white bg-[#D95D0F] hover:bg-[#C24F08] rounded-2xl shadow-2xl active:scale-[0.98] transition-all duration-200 pointer-events-auto cursor-pointer text-center"
			>
				<span>🚚 اطلب الآن • {selectedTier?.price || 279} درهم</span>
				<svg
					aria-hidden="true"
					class="h-4 w-4 shrink-0 transition-transform duration-300 {isFormAbove ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
				</svg>
			</button>
		</div>
	{/if}

	<CartDrawer
		others={cartUpsells}
		currency={settings.commerce.currencySymbol || 'درهم'}
		salesText={t.sections.hero.salesCountText}
		offers={offersList}
		currentSlug={(product as any).slug || 'kit-tandim'}
		currentTitle={content.title}
		currentImage={HERO_IMAGE_URL}
	/>
	<CheckoutModal
		currency={settings.commerce.currencySymbol || 'درهم'}
		sheetsUrl={sheetsUrl}
		productTitle={content.title}
		sku={(product as any).published?.order?.sku || (product as any).draft?.order?.sku || 'kit-tandim'}
		onDone={() => {
			cartUi.resetAll();
			window.location.href = preserveTrackingParams('/thank-you');
		}}
	/>

	<!-- Post-Purchase Drain Filter Upsell Modal (Consolidated Single-Row Google Sheets Merge) -->
	<DrainUpsellModal
		bind:isOpen={showDrainUpsell}
		orderDetails={{
			orderId: pendingOrder?.orderId || '',
			total: pendingOrder?.basePrice || activeOffer?.price || 229,
			phone: pendingOrder?.phone || '',
			name: pendingOrder?.customerName || ''
		}}
		onAcceptUpsell={handleAcceptDrainUpsell}
		onDeclineUpsell={handleDeclineDrainUpsell}
	/>
</div>

<style>
	/* Page shell: safe dvh/svh with vh fallback + iOS text-size-adjust & safe-area inset */
	.kit-page-shell {
		min-height: 100vh;
		min-height: 100svh;
		min-height: 100dvh;
		-webkit-text-size-adjust: 100%;
		text-size-adjust: 100%;
		padding-bottom: 7rem;
		padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px));
	}

	.sticky-cta-wrap {
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.sticky-cta-btn {
		-webkit-appearance: none;
		appearance: none;
	}

	/* ── Order Section Outer & Cream #F5F0E6 Centered 480px Container ── */
	.order-section-outer {
		width: 100%;
		box-sizing: border-box;
		padding: 6px 8px;
		scroll-margin-top: 42px;
	}

	.order-block-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		border-radius: 12px;
		border: 1px solid #D9D4C7;
		background-color: #F5F0E6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		overflow: hidden;
		scroll-margin-top: 42px;
		letter-spacing: 0;
	}

	@media (min-width: 601px) {
		.order-section-outer {
			padding: 12px 16px;
		}
		.order-block-card {
			max-width: 480px;
			margin-left: auto;
			margin-right: auto;
		}
	}

	.order-block-header {
		background-color: #1F5C4B;
		color: #FFFFFF;
		text-align: center;
		padding: 5px 12px;
		margin-bottom: 12px;
	}

	.order-block-title {
		margin: 0;
		font-size: 17px;
		font-size: clamp(1.03125rem, 4.7vw, 1.09375rem);
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: 0;
	}

	.order-block-subtitle {
		margin: 1px 0 0 0;
		font-size: 12px;
		font-size: clamp(0.75rem, 3.3vw, 0.78125rem);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.88);
		line-height: 1.35;
		letter-spacing: 0;
	}

	.order-block-body {
		padding: 0 8px 8px;
	}

	@media (min-width: 400px) {
		.order-block-body {
			padding: 0 12px 10px;
		}
	}

	.order-tiers-divider {
		padding-bottom: 6px;
		margin-bottom: 6px;
		border-bottom: 1px solid rgba(217, 212, 199, 0.85);
	}

	/* ── Calm Airy COD Form (zero layout shift on validation) ── */
	.cod-form-stack {
		display: flex;
		flex-direction: column;
		min-width: 0;
		letter-spacing: 0;
	}

	.cod-form-heading {
		margin: 0 0 4px 0;
		font-size: 15px;
		font-size: clamp(0.90625rem, 4.15vw, 0.96875rem);
		font-weight: 600;
		color: #1A1A1A;
		line-height: 1.35;
		letter-spacing: 0;
		text-align: right;
		text-align: start;
	}

	.cod-field-group {
		min-width: 0;
	}

	.cod-field-label {
		display: block;
		font-size: 13px;
		font-size: clamp(0.8125rem, 3.6vw, 0.84375rem);
		font-weight: 500;
		color: #333333;
		line-height: 1.3;
		letter-spacing: 0;
		margin-bottom: 6px;
		text-align: right;
		text-align: start;
	}

	.cod-input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: 46px;
		height: 46px;
		padding: 0 12px;
		font-size: 16px;
		font-size: max(16px, 1rem);
		font-weight: 400;
		line-height: 1.5;
		letter-spacing: 0;
		color: #1A1A1A;
		background-color: #FFFFFF;
		border: 1px solid #D9D4C7;
		border-radius: 12px;
		-webkit-appearance: none;
		appearance: none;
		scroll-margin-bottom: 96px;
		transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
	}

	.cod-input::placeholder {
		color: #9A9A9A;
		font-weight: 400;
		opacity: 1;
	}

	.cod-input:focus {
		outline: none;
		border-color: #1F5C4B;
		box-shadow: 0 0 0 3px rgba(31, 92, 75, 0.15);
	}

	.cod-input:focus-visible {
		outline: 2px solid #1F5C4B;
		outline-offset: 1px;
	}

	.cod-input.is-invalid {
		border-color: #C0392B;
		background-color: #FFF8F7;
	}

	.cod-input.is-invalid:focus {
		border-color: #C0392B;
		background-color: #FFF8F7;
		box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.14);
	}

	/* Name input: standard RTL alignment, calm regular weight */
	.cod-name-input {
		font-weight: 400;
		text-align: right;
		text-align: start;
	}

	/* Phone input: LTR digit order (+212 / 06XXXXXXXX never scrambled), aligned RIGHT for RTL page */
	.cod-phone-input {
		direction: ltr;
		text-align: right;
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}

	.cod-phone-input::placeholder {
		direction: ltr;
		text-align: right;
		color: #9A9A9A;
		font-weight: 400;
	}

	.cod-phone-input::-webkit-input-placeholder {
		direction: ltr;
		text-align: right;
		color: #9A9A9A;
		font-weight: 400;
	}

	.cod-phone-input::-moz-placeholder {
		direction: ltr;
		text-align: right;
		color: #9A9A9A;
		font-weight: 400;
	}

	/* Reserved error slots: provide 14px field gap & zero layout shift when error appears */
	.cod-error-slot {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.cod-error-slot--between {
		min-height: 15px;
		padding-top: 1px;
	}

	.cod-error-slot--before-btn {
		min-height: 16px;
		padding-top: 1px;
	}

	.cod-inline-error {
		margin: 0;
		font-size: 12px;
		font-weight: 400;
		color: #B3261E;
		line-height: 1.2;
		letter-spacing: 0;
		white-space: nowrap;
		text-align: right;
		text-align: start;
	}

	@media (max-width: 345px) {
		.cod-inline-error {
			word-spacing: -0.5px;
		}
	}

	.cod-submit-alert {
		margin-bottom: 8px;
		padding: 8px 10px;
		border-radius: 12px;
		background-color: #FFF8F7;
		border: 1px solid #C0392B;
		color: #B3261E;
		font-size: 12px;
		font-weight: 400;
		line-height: 1.4;
		text-align: right;
		text-align: start;
	}

	.cod-submit-wrap {
		min-width: 0;
	}

	.cod-submit-btn {
		width: 100%;
		min-height: 52px;
		height: 52px;
		padding: 0 16px;
		border: none;
		border-radius: 12px;
		background-color: #F28C28;
		color: #FFFFFF;
		font-size: 16px;
		font-size: clamp(1rem, 4.4vw, 1.03125rem);
		font-weight: 600;
		line-height: 1.35;
		letter-spacing: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-webkit-appearance: none;
		appearance: none;
		box-shadow: 0 4px 12px rgba(242, 140, 40, 0.3);
		transition: filter 0.15s ease, transform 0.12s ease, opacity 0.15s ease;
	}

	.cod-submit-btn:hover:not(:disabled) {
		filter: brightness(0.97);
	}

	.cod-submit-btn:active:not(:disabled) {
		transform: scale(0.99);
	}

	.cod-submit-btn:focus-visible {
		outline: 2px solid #1F5C4B;
		outline-offset: 2px;
	}

	.cod-submit-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.cod-merged-footer {
		margin: 5px 0 0 0;
		font-size: 12px;
		font-weight: 400;
		color: #6C6C6C;
		line-height: 1.35;
		letter-spacing: 0;
		text-align: center;
		white-space: nowrap;
	}

	/* Allow inputs/buttons/merged line to grow if user sets large system font scale */
	@media (max-width: 319px) {
		.cod-merged-footer,
		.cod-inline-error {
			white-space: normal;
		}
	}

	/* Tall screens (>800px height): subtle extra breathing room while keeping 1-screen fit */
	@media (min-height: 801px) {
		.order-block-header {
			padding: 9px 14px;
		}
		.order-block-body {
			padding: 0 12px 12px;
		}
		.order-tiers-divider {
			padding-bottom: 11px;
			margin-bottom: 11px;
		}
	}

	@keyframes cta-wiggle {
		0% {
			transform: translateX(0);
		}
		3.5% {
			transform: translateX(-6px);
		}
		7% {
			transform: translateX(6px);
		}
		10.5% {
			transform: translateX(-4px);
		}
		14% {
			transform: translateX(4px);
		}
		17.5%,
		100% {
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.cta-wiggle {
			will-change: transform;
			animation: cta-wiggle 4s ease-in-out 2s infinite;
		}

		.cta-wiggle:hover,
		.cta-wiggle:active,
		.cta-wiggle:focus,
		.cta-wiggle:focus-visible,
		.cta-wiggle:disabled,
		form:focus-within .cta-wiggle {
			animation-play-state: paused;
		}

		@supports selector(:has(*)) {
			.cta-wiggle-scope:has(#order-form form:focus-within) .cta-wiggle {
				animation-play-state: paused;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cta-wiggle {
			animation: none !important;
			transform: none !important;
			will-change: auto;
		}
	}
</style>
