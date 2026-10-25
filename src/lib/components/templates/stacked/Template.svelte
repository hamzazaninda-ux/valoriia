<script lang="ts">
	import { onMount } from 'svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import CartDrawer from '$lib/components/shared/CartDrawer.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import CheckoutModal from '$lib/components/shared/CheckoutModal.svelte';
	import OfferTiers from '$lib/components/OfferTiers.svelte';
	import DrainUpsellModal from '$lib/components/DrainUpsellModal.svelte';
	import { cartUi } from '$lib/stores/cart.svelte';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';
	import { trackSnapPurchase, preserveTrackingParams } from '$lib/utils/tracking';

	let { product, settings, theme, others = [] }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('stacked'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	const HERO_IMAGE_URL =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951366/%D8%A5%D8%B9%D9%84%D8%A7%D9%86_%D8%A8%D8%A7%D9%83_%D8%A7%D9%84%D8%AD%D9%85%D8%A7%D9%85_%D8%A7%D9%84%D8%B0%D9%83%D9%8A_%D9%88%D8%A7%D9%84%D8%B9%D8%B1%D9%88%D8%B6.png';

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
			title: '2 قطع + رشاشين هدية 🎁',
			subtitle: 'توصيل مجاني لجميع المدن',
			price: 349,
			originalPrice: 458,
			quantity: 2,
			badge: 'الأكثر طلباً 🔥',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1791113117/ChatGPT_Image_Sep_3_2026_09_28_10_PM.png',
			isPopular: true
		}
	];

	const visualCards = [
		{
			id: 'no-drill',
			variant: 'ivory',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951490/Screenshot_2026-10-25_180133.png',
			alt: 'تركيب سهل بدون حفر ولا شنيور',
			badge: '⚡ تركيب سهل فـ 5 دقايق',
			headline: 'بلا دريل، بلا شنيور، وبلا ما تضيّعي الزليج ديال دارك',
			body: 'مصمم بتقنية تلسكوبية ذكية قابلة للتعديل بسهولة من 1.10 متر حتى لـ 3.10 أمتار ليناسب أي سقف. نوابض داخلية متينة وجلدات سيليكون تثبت الحامل بإحكام بين الأرض والسقف بدون مسمار واحد.',
			showQuickCta: true
		},
		{
			id: 'heavy-load',
			variant: 'sage',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951411/Screenshot_2026-10-25_180152.png',
			alt: 'قوة تحمل فائقة حتى 20 كيلوغرام',
			badge: '💪 قوة تحمّل فائقة حتى 20 كلغ',
			headline: 'ثبات حديدي: هزي كاع شامبوانات ومستلزمات الدار بلا خوف',
			body: 'رفوف واسعة وعميقة مصنوعة من خامات مقاومة للماء والرطوبة مع أعمدة إينوكس مضادة للصدأ والتآكل. يتحمل أثقل القنينات وبيدونات الصابون بدون ما يتحرك أو يميل مليمتر واحد.',
			showQuickCta: false
		},
		{
			id: 'exclusive-gift',
			variant: 'amber',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951400/Screenshot_2026-10-25_180201.png',
			alt: 'رشاش التوربو المزدوج هدية مجانية',
			badge: '🎁 هدية حصرية بقيمة 99 درهم فابور',
			headline: 'رشاش التوربو المزدوج: ضغط ماء مضاعف 200% مع توفير الاستهلاك',
			body: 'حل سحري إذا كان عندك ضغط الماء ضعيف في الدوش! يحتوي على 3 أنظمة تدفق مختلفة مع زر إيقاف فوري للتحكم، وكيحميك من هدر المياه مع كل استحمام.',
			showQuickCta: false
		},
		{
			id: 'before-after',
			variant: 'ivory',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951400/Screenshot_2026-10-25_180213.png',
			alt: 'تحول الحمام قبل وبعد التنظيم',
			badge: '✨ تحوّل حقيقي قبل وبعد',
			headline: 'شوفي الفرق كيفاش كيرجع الحمام منظم ونظيف',
			body: 'استغلي الزوايا الميتة في حمامك وحولي الفوضى وكركبة الأرضية إلى فضاء مرتب، واسع وسهل في التنظيف اليومي بدون أدنى مجهود.',
			showQuickCta: false
		},
		{
			id: 'modern-aesthetics',
			variant: 'luxury',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1792951367/Gemini_Generated_Image_ikt3wpikt3wpikt3.jpg',
			alt: 'تصميم عصري ولمسة فندقية راقية للحمام',
			badge: '🏡 تصميم عصري يناسب أي ديكور',
			headline: 'لمسة فندقية راقية تزيد حمامك بهاءً وأناقة',
			body: 'لون أبيض ناصع مع تشطيب إينوكس يعطي انطباعاً بالنقاء والفخامة، متناسق تماماً مع مختلف ألوان الزليج والرخام.',
			showQuickCta: false
		}
	] as const;

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
		const rawOffers = pricing?.offers && pricing.offers.length > 0 ? pricing.offers : defaultOffers;
		if (rawOffers.length < 2) {
			return defaultOffers;
		}
		return rawOffers;
	});

	let selectedPack = $state<number | null>(2);

	const currentPackId = $derived(
		selectedPack ??
			offersList.find((o: ProductOffer) => o.isPopular)?.id ??
			offersList[1]?.id ??
			offersList[0]?.id ??
			2
	);

	const activeOffer = $derived(
		offersList.find((o: ProductOffer) => o.id === currentPackId) ||
			offersList[1] ||
			offersList[0] || { title: '', price: 349, quantity: 2 }
	);

	let showStickyBtn = $state(false);

	const sheetsUrl = $derived(
		(order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim()
	);

	// Canonical definition of Child Safety Lock product (for CartDrawer cross-sell compatibility)
	const childLockProduct = {
		slug: 'qofl-al-aman',
		title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
		subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
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
				title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
				subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
				startingPrice: 49,
				heroImage:
					'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp'
			}
		];
	});

	let customerName = $state('');
	let customerPhone = $state('');
	let customerCity = $state('');
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
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) console.warn('API checkout non-ok status:', res.status);
		} catch (err) {
			console.error('Checkout error:', err);
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
						send_to: 'AW-18531557898',
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
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) console.warn('API checkout non-ok status:', res.status);
		} catch (err) {
			console.error('Checkout error:', err);
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
						send_to: 'AW-18531557898',
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

	function validateMoroccanPhone(val: string): boolean {
		const cleaned = val.replace(/[\s\-\(\)\.]/g, '');
		return /^(?:(?:\+|00)212|0)[5-7]\d{8}$/.test(cleaned);
	}

	// Phone Formatter: Always enforce '212' country code without '+' or leading '0'
	function formatMoroccanPhone(rawPhone: string): string {
		if (!rawPhone) return '';
		let clean = String(rawPhone).replace(/[^0-9]/g, '');
		if (clean.startsWith('00212')) {
			clean = clean.substring(2);
		} else if (clean.startsWith('0')) {
			clean = '212' + clean.substring(1);
		} else if (!clean.startsWith('212')) {
			clean = '212' + clean;
		}
		return clean;
	}

	function handleDirectCheckout(event?: Event) {
		event?.preventDefault();

		if (showDrainUpsell || isSubmittingFinal) return;

		if (
			submittedOrderId &&
			typeof window !== 'undefined' &&
			sessionStorage.getItem(`order_sent_${submittedOrderId}`)
		) {
			window.location.href = `/thank-you?orderId=${submittedOrderId}`;
			return;
		}

		formError = '';

		if (!customerName.trim()) {
			formError = 'الرجاء إدخال الاسم الكامل';
			const input = document.getElementById('order-fullName');
			if (input) input.focus();
			return;
		}

		if (!customerPhone.trim()) {
			formError = 'الرجاء إدخال رقم الهاتف';
			const input = document.getElementById('order-phone');
			if (input) input.focus();
			return;
		}

		if (!validateMoroccanPhone(customerPhone)) {
			formError = 'يرجى إدخال رقم هاتف مغربي صحيح يبدأ بـ 06 أو 07 (10 أرقام)';
			const input = document.getElementById('order-phone');
			if (input) input.focus();
			return;
		}

		if (!customerCity.trim()) {
			formError = 'الرجاء إدخال المدينة والعنوان';
			const input = document.getElementById('order-city');
			if (input) input.focus();
			return;
		}

		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		submittedOrderId = orderId;

		const rawPrice = activeOffer?.price || 349;
		const cleanPrice = parseInt(String(rawPrice).replace(/[,.]\d+$/, ''), 10) || 349;
		const quantity = Number(activeOffer?.quantity || (currentPackId === 2 ? 2 : 1));

		const offerSku =
			activeOffer?.title ||
			(currentPackId === 2 ? '2 قطع + رشاشين هدية 🎁' : '1 قطعة + رشاشة هدية 🎁') ||
			'العرض المختار';
		const productTitleStr = (
			content?.title ||
			(product as any)?.title ||
			offerSku ||
			'طقم التنظيم المنزلي'
		).trim();
		const date_order = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const formattedPhone = formatMoroccanPhone(customerPhone);
		const city_address = customerCity.trim();

		pendingOrder = {
			orderId,
			date_order,
			customerName: customerName.trim(),
			phone: formattedPhone,
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
				const itemPrice = Number(activeOffer?.price || 349);
				const itemName = (product as any)?.title || content?.title || 'باك الحمام الذكي';

				(window as any).gtag('event', 'add_to_cart', {
					currency: 'MAD',
					value: itemPrice,
					items: [
						{
							item_id: (product as any)?.id || 'kit-tandim',
							item_name: itemName,
							price: itemPrice,
							quantity: 1
						}
					]
				});
			}
		} catch {}

		document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		const formElement = document.getElementById('order-form');

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					showStickyBtn = !entry.isIntersecting;
				}
			},
			{ threshold: 0.08, rootMargin: '0px 0px 20px 0px' }
		);

		if (formElement) observer.observe(formElement);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div
	class="max-w-xl mx-auto shadow-2xl min-h-screen flex flex-col relative border-x border-stone-200/70 pb-28"
	style="{buildThemeCssVars(t)}; background-color: #FAF9F6; color: #14231B;"
	dir="rtl"
>
	<!-- Top Announcement Bar -->
	<div class="sticky top-0 z-40 w-full">
		<AnnouncementBar isStatic={true} />
	</div>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 1. HERO SECTION (أعلى الصفحة)                                   -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<header class="relative overflow-hidden bg-gradient-to-b from-[#0E291E] via-[#133829] to-[#FAF9F6] pt-5 pb-3 px-3 sm:px-5">
		<!-- Subtle Moroccan 8-point Khatam geometric motif (ambient header texture <= 5% opacity) -->
		<svg
			aria-hidden="true"
			class="pointer-events-none absolute inset-x-0 top-0 h-56 w-full opacity-[0.045] text-amber-200"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id="khatam-hero" width="48" height="48" patternUnits="userSpaceOnUse">
					<path
						d="M24 4L29 19L44 24L29 29L24 44L19 29L4 24L19 19Z"
						fill="none"
						stroke="currentColor"
						stroke-width="1"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#khatam-hero)" />
		</svg>

		<div class="relative z-10 text-center space-y-3">
			<!-- Hero Badge -->
			<div class="inline-flex items-center justify-center">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3.5 py-1 text-xs sm:text-[13px] font-black text-amber-950 shadow-sm">
					🔥 العرض الأكثر طلباً في المغرب
				</span>
			</div>

			<!-- Headline (H1) -->
			<h1 class="font-display text-[22px] sm:text-[27px] font-black leading-[1.35] text-white tracking-tight px-1">
				باك الحمام الذكي: تنظيم شامل بدون حفير + رشاش زيادة ضغط المياه فابور!
			</h1>

			<!-- Sub-headline -->
			<p class="text-xs sm:text-sm leading-relaxed font-medium text-emerald-50/90 max-w-md mx-auto px-1">
				وداعاً لتضييع لافايونس بالمسامير وفوضى القراعي.. رتّبي دوشك فـ 5 دقايق بأناقة وثبات دائم، وخلّصي بعد المعاينة.
			</p>
		</div>

		<!-- Hero Visual Frame (Uncropped natural aspect ratio, clickable to jump to #order-form) -->
		<div class="relative z-10 mt-4 overflow-hidden rounded-3xl border-2 border-white/80 bg-[#F5F2EB] shadow-xl">
			<a
				href="#order-form"
				onclick={scrollToOrderForm}
				class="block w-full focus:outline-none"
				aria-label="انتقل إلى استمارة الطلب"
			>
				<img
					src={HERO_IMAGE_URL}
					alt="باك الحمام الذكي: تنظيم شامل بدون حفير + رشاش زيادة ضغط المياه فابور"
					width="1024"
					height="1536"
					class="block w-full h-auto"
					loading="eager"
					fetchpriority="high"
				/>
			</a>
		</div>

		<!-- Micro Trust Badges -->
		<div class="relative z-10 mt-3.5 grid grid-cols-3 gap-1.5 sm:gap-2">
			<div class="flex flex-col sm:flex-row min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-white border border-emerald-900/10 px-2 py-2 text-center shadow-xs">
				<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
				</svg>
				<span class="text-[11px] sm:text-xs font-extrabold text-stone-800 leading-tight">توصيل فابور لجميع المدن</span>
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

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 2. COD ORDER FORM (مباشرة تحت الهيرو - مكانها الثابت)           -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section id="order-form" class="px-2.5 sm:px-4 pt-3 pb-5 w-full scroll-mt-12" dir="rtl">
		<div
			id="offers"
			data-section="offers"
			class="overflow-hidden rounded-3xl border-2 border-[#0B3B24]/20 bg-white shadow-xl shadow-emerald-950/5"
		>
			<div class="bg-[#0B3B24] px-4 py-3 text-center text-white">
				<h2 class="font-display text-lg sm:text-xl font-black tracking-tight">
					{t.sections.orderForm.title || 'استمارة الطلب المباشر'}
				</h2>
				<p class="text-xs font-medium text-emerald-100/90 mt-0.5">
					عمّري المعلومات ديالك دابا • التوصيل فابور والدفع حتى تشدّي سلعتك
				</p>
			</div>

			<div class="p-3 sm:p-4 space-y-4">
				<!-- Bundle Selectors (1 Piece: 229 MAD vs 2 Pieces: 349 MAD pre-selected) -->
				<div class="pb-3 border-b border-stone-100">
					<OfferTiers
						offers={offersList}
						selectedId={currentPackId}
						onSelect={(offer) => {
							selectedPack = offer.id;
							try {
								if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
									(window as any).gtag('event', 'select_item', {
										item_list_name: 'Offer Tiers',
										items: [
											{
												item_id: String(offer.id),
												item_name: offer.title || 'عرض خاص',
												price: offer.price || 349
											}
										]
									});
								}
							} catch {}
						}}
					/>
				</div>

				<!-- Direct COD Form: Full Name, Phone Number, City/Address -->
				<form onsubmit={handleDirectCheckout} class="space-y-3" dir="rtl">
					<div class="flex items-center gap-2 text-xs font-extrabold text-stone-800">
						<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
						</svg>
						<span>معلومات التوصيل السريع (0 درهم تسبيق):</span>
					</div>

					<!-- Field 1: Full Name -->
					<div>
						<label for="order-fullName" class="block text-xs font-bold text-stone-700 mb-1 text-start">
							الاسم الكامل <span class="text-red-500">*</span>
						</label>
						<input
							id="order-fullName"
							type="text"
							bind:value={customerName}
							placeholder="الاسم الشخصي والعائلي"
							autocomplete="name"
							required
							class="w-full px-3.5 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-stone-50/40 focus:bg-white transition-all text-start font-medium"
						/>
					</div>

					<!-- Field 2: Phone Number -->
					<div>
						<label for="order-phone" class="block text-xs font-bold text-stone-700 mb-1 text-start">
							رقم الهاتف <span class="text-red-500">*</span>
						</label>
						<input
							id="order-phone"
							type="tel"
							dir="ltr"
							bind:value={customerPhone}
							placeholder="06XXXXXXXX / 07XXXXXXXX"
							autocomplete="tel"
							required
							class="w-full px-3.5 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-stone-50/40 focus:bg-white transition-all text-left font-mono font-bold"
						/>
					</div>

					<!-- Field 3: City / Address -->
					<div>
						<label for="order-city" class="block text-xs font-bold text-stone-700 mb-1 text-start">
							المدينة والعنوان <span class="text-red-500">*</span>
						</label>
						<input
							id="order-city"
							type="text"
							bind:value={customerCity}
							placeholder="المدينة والحي / العنوان"
							autocomplete="street-address"
							required
							class="w-full px-3.5 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-stone-50/40 focus:bg-white transition-all text-start font-medium"
						/>
					</div>

					{#if formError}
						<div class="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-start flex items-center gap-2">
							<svg aria-hidden="true" class="h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
							</svg>
							<span>{formError}</span>
						</div>
					{/if}

					<!-- Green Direct Order Submit Button -->
					<button
						type="submit"
						disabled={isSubmitting || isSubmittingFinal}
						class="w-full flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#15803D] hover:bg-[#166534] py-3.5 px-4 text-base sm:text-lg font-black text-white shadow-lg shadow-emerald-900/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
					>
						{#if isSubmitting || isSubmittingFinal}
							<span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
							<span>جاري تأكيد الطلب...</span>
						{:else}
							<svg aria-hidden="true" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>أكّد الطلب الآن • {activeOffer.price} درهم</span>
						{/if}
					</button>

					<!-- Immediate Reassurance Banner Under Submit Button -->
					<div class="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-3 text-center">
						<p class="text-xs sm:text-[13px] font-extrabold text-emerald-950 leading-relaxed">
							🔒 حق المعاينة مضمون: فتح الكولية وتأكد من سلعتك مع الـ Livreur عاد خلّص.
						</p>
					</div>
				</form>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 3–7. PERSUASIVE VISUAL CARDS (IMAGES 2 TO 6 BELOW THE FORM)     -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<div class="px-2.5 sm:px-4 space-y-5 pt-1 pb-4" dir="rtl">
		<!-- Section Transition Header -->
		<div class="text-center pt-1">
			<span class="inline-block text-[11px] sm:text-xs font-extrabold tracking-wide text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
				اكتشفي تفاصيل الجودة والعملية
			</span>
			<h2 class="font-display text-lg sm:text-xl font-black text-stone-900 mt-1.5">
				علاش أكثر من 2,000 عائلة مغربية اختارت هاد الباك؟
			</h2>
		</div>

		{#each visualCards as card (card.id)}
			{#if card.variant === 'luxury'}
				<!-- Card 6: Deep Forest Emerald Luxury Finale Card -->
				<article class="overflow-hidden rounded-3xl bg-[#0E291E] text-white shadow-lg border border-emerald-900/40">
					<div class="overflow-hidden bg-[#F5F2EB]">
						<img
							src={card.image}
							alt={card.alt}
							class="block w-full h-auto"
							loading="lazy"
							decoding="async"
						/>
					</div>
					<div class="p-5 sm:p-6 space-y-3">
						<span class="inline-flex items-center rounded-full bg-amber-400/95 px-3 py-1 text-xs font-black text-amber-950">
							{card.badge}
						</span>
						<h2 class="font-display text-xl sm:text-2xl font-black leading-snug text-white">
							{card.headline}
						</h2>
						<p class="text-sm sm:text-[15px] leading-relaxed text-emerald-50/90">
							{card.body}
						</p>
						<div class="pt-2">
							<a
								href="#order-form"
								onclick={scrollToOrderForm}
								class="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-[#0E291E] font-black text-sm sm:text-base px-4 py-3 shadow-md hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200"
							>
								<span>أطلبي باك الحمام الذكي الآن ↑</span>
							</a>
						</div>
					</div>
				</article>
			{:else}
				<!-- Cards 2, 3, 4, 5 with varied editorial surfaces -->
				<article
					class="overflow-hidden rounded-3xl border shadow-sm transition-all {card.variant === 'amber'
						? 'bg-gradient-to-b from-[#FFFDF5] to-white border-amber-300/80'
						: card.variant === 'sage'
							? 'bg-[#F3F8F5] border-emerald-900/10'
							: 'bg-white border-stone-200/80'}"
				>
					<div class="overflow-hidden bg-white">
						<img
							src={card.image}
							alt={card.alt}
							class="block w-full h-auto"
							loading="lazy"
							decoding="async"
						/>
					</div>

					<div class="p-4 sm:p-6 space-y-2.5">
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold {card.variant === 'amber'
								? 'bg-amber-100 text-amber-950 border border-amber-300/70'
								: 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'}"
						>
							{card.badge}
						</span>

						<h2 class="font-display text-lg sm:text-[22px] font-black leading-snug text-stone-900">
							{card.headline}
						</h2>

						<p class="text-sm sm:text-[15px] leading-relaxed text-stone-700">
							{card.body}
						</p>

						{#if card.showQuickCta}
							<div class="pt-1.5">
								<a
									href="#order-form"
									onclick={scrollToOrderForm}
									class="text-emerald-700 hover:text-emerald-800 font-bold underline underline-offset-4 text-sm inline-flex items-center gap-1"
								>
									أطلب باقتك الآن من الأعلى ↑
								</a>
							</div>
						{/if}
					</div>
				</article>
			{/if}
		{/each}
	</div>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- 8. CUSTOMER REVIEWS & FAQ BELOW VISUAL CARDS                    -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<section class="px-2.5 sm:px-4 py-5" dir="rtl">
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
				هذا ما يقوله زبناؤنا بعد تجربة باك الحمام الذكي والرشاش الهدية
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
					"وصلني الكيت البارح وركبتو راسي بدون ما نحتاج راجلي ولا معلم حيت مكيحتاجش الحفير. صحيح وهز ليا كاع الشامبوانات ديال الدار كاملة. شكراً ليكم".
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
					"الصراحة الرشاشة الهدية واعرة بزاف الجهد ديال الما تبدل عندي فالدوش. المنظم حتى هو إينوكس مكيصداش مع الفوار. تعامل احترافي وتوصيل سريع".
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
					"كنت خايفة من القياس حيت السقف عندي عالي، ولكن التيليسكوب كيتجبد مزيان وكيتبت صحيح بزاف. وليت متهنية من كركبة الحمام".
				</p>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	{#if t.sections.trustBadges.showFAQ && activeFaq && activeFaq.length > 0}
		<section class="px-2.5 sm:px-4 py-5" dir="rtl">
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
					إجابات واضحة على أكثر الأسئلة اللي كيطرحوها زبناؤنا
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

	<footer class="bg-[#0B1F17] py-6 text-center text-xs text-emerald-100/70 px-4 space-y-1.5 mt-auto" dir="rtl">
		<p class="font-bold text-white">Lhamza Shop — متجر مغربي متخصص في منتجات التنظيم والراحة المنزلية</p>
		<p>© {new Date().getFullYear()} Lhamza Shop. جميع الحقوق محفوظة.</p>
	</footer>

	<!-- Floating Sticky CTA Button (Smooth-scrolls directly to #order-form under the hero) -->
	{#if showStickyBtn && t.sections.advanced.showStickyButton}
		<div class="fixed bottom-2.5 inset-x-0 z-50 px-3 sm:px-4 pointer-events-none" dir="rtl">
			<button
				type="button"
				onclick={scrollToOrderForm}
				class="w-full max-w-xl mx-auto flex min-h-[52px] items-center justify-center gap-2 py-3 px-4 text-sm sm:text-base font-black text-white bg-[#15803D] hover:bg-[#166534] rounded-2xl shadow-2xl shadow-emerald-950/30 active:scale-[0.98] transition-all duration-200 pointer-events-auto cursor-pointer text-center"
			>
				<span>أطلب الآن • الدفع عند الاستلام</span>
				<svg aria-hidden="true" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
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
			total: pendingOrder?.basePrice || 349,
			phone: pendingOrder?.phone || '',
			name: pendingOrder?.customerName || ''
		}}
		onAcceptUpsell={handleAcceptDrainUpsell}
		onDeclineUpsell={handleDeclineDrainUpsell}
	/>
</div>
