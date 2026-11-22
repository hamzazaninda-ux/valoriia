<script lang="ts">
	import { onMount } from 'svelte';
	import type { TemplateProps, ProductOffer } from '$lib/types/templates';
	import type { ProductUpsell } from '$lib/types/product';
	import CartDrawer from '$lib/components/shared/CartDrawer.svelte';
	import CheckoutModal from '$lib/components/shared/CheckoutModal.svelte';
	import PostOrderUpsellModal from '$lib/components/PostOrderUpsellModal.svelte';
	import Logo from '$lib/components/brand/Logo.svelte';
	import { cartUi } from '$lib/stores/cart.svelte';
	import { getDefaultTheme, buildThemeCssVars } from '$lib/types/theme';
	import { trackSnapPurchase, preserveTrackingParams, normalizePhone, sha256 } from '$lib/utils/tracking';

	let { product, settings, theme, others = [], onOrderRegistered, onOrderPending }: TemplateProps = $props();

	let t = $derived(theme || getDefaultTheme('stacked'));

	let version = $derived(product.draft || product.published);
	let content = $derived(version.content);
	let pricing = $derived(version.pricing);
	let order = $derived(version.order);

	const currency = $derived(settings?.commerce?.currencySymbol || 'درهم');
	const productSlug = $derived((product as any)?.slug || '');
	const productName = $derived((content?.title || (product as any)?.title || '').trim());
	const productSku = $derived(((order as any)?.sku || productSlug || 'product').trim());

	// ---------------------------------------------------------------------------
	// Content (everything comes from the product data; empty fields hide sections)
	// ---------------------------------------------------------------------------
	const heroImage = $derived(content?.heroImage || content?.gallery?.[0]?.src || '');

	const cleanTitle = $derived(
		productName
			.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
			.replace(/\s+/g, ' ')
			.trim()
	);

	const productRating = $derived(Number(content?.rating) || 0);
	const productReviewCount = $derived(Number(content?.reviewCount) || 0);

	const announcement = $derived(
		(content as any)?.announcement || 'الدفع عند الاستلام والتوصيل لجميع المدن المغربية'
	);

	/** Feature cards below the form: killers.benefits text, paired with gallery images 2..n. */
	const features = $derived(
		(content?.killers?.benefits ?? [])
			.filter((b) => b && (b.title || b.text))
			.map((b, i) => ({
				title: b.title,
				text: b.text,
				image: content?.gallery?.[i + 1]?.src || '',
				alt: content?.gallery?.[i + 1]?.alt || b.title
			}))
	);

	/** Only real reviews entered in the admin are shown. */
	const reviews = $derived(
		(content?.killers?.gridReviews ?? []).filter((r) => r && r.text && r.name)
	);

	const activeFaq = $derived((content?.faq ?? []).filter((f) => f && f.question && f.answer));

	/** Messages that scroll in the top bar. The product announcement comes first. */
	const tickerItems = $derived([
		announcement,
		'التوصيل لجميع المدن فـ 24 حتى 72 ساعة',
		'استبدال 7 أيام',
		'كنجربو كل جهاز قبل ما يخرج',
		'سولنا فواتساب من 9:00 حتى 22:00'
	]);

	/** Delivery window (24 to 72h), computed in the browser so it uses the visitor's date. */
	let deliveryWindow = $state('');
	$effect(() => {
		try {
			const fmt = new Intl.DateTimeFormat('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' });
			const day = 24 * 60 * 60 * 1000;
			const now = Date.now();
			deliveryWindow = `بين ${fmt.format(new Date(now + day))} و${fmt.format(new Date(now + 3 * day))}`;
		} catch {
			deliveryWindow = '';
		}
	});

	/** "What you get" checklist under the title (killers.bullets). */
	const inBox = $derived((content?.killers?.bullets ?? []).filter((b) => b && b.trim()));
	/** "How it works" steps (killers.usageSteps). */
	const steps = $derived((content?.killers?.usageSteps ?? []).filter((st) => st && st.trim()));
	/** "Why order from Lhamza" promises (killers.guarantees). */
	const promises = $derived((content?.killers?.guarantees ?? []).filter((g) => g && g.title));

	const upsell = $derived.by((): ProductUpsell | null => {
		const u = (content as any)?.upsell as ProductUpsell | undefined;
		return u && u.title && Number(u.price) > 0 ? u : null;
	});

	// ---------------------------------------------------------------------------
	// Offers
	// ---------------------------------------------------------------------------
	const offersList = $derived.by((): ProductOffer[] => {
		const raw = (pricing?.offers ?? []).filter((o) => o && Number(o.price) > 0);
		return raw.length
			? raw
			: [
					{
						id: 1,
						title: productName || 'قطعة واحدة',
						subtitle: '',
						price: 0,
						originalPrice: 0,
						quantity: 1,
						badge: null,
						isPopular: false
					}
				];
	});

	let selectedOfferId = $state<number | null>(null);

	const activeOffer = $derived(
		offersList.find((o) => o.id === selectedOfferId) ?? offersList[0]
	);

	// Meta funnel events: ViewContent (page open) → AddToCart (starts the form) → InitiateCheckout (valid submit) → Purchase.
	const firedMeta = new Set<string>();
	function metaTrack(event: string, once = true) {
		try {
			if (once && firedMeta.has(event)) return;
			const fbq = (window as any).fbq;
			if (typeof fbq !== 'function') return;
			firedMeta.add(event);
			fbq('track', event, {
				value: Number(activeOffer?.price) || 0,
				currency: 'MAD',
				content_name: productName,
				content_type: 'product',
				content_ids: [productSku],
				num_items: Number(activeOffer?.quantity) || 1
			});
		} catch (err) {
			console.warn(`Meta ${event} tracking non-fatal error:`, err);
		}
	}

	function offerSaving(o: ProductOffer): number {
		return o.originalPrice > o.price ? o.originalPrice - o.price : 0;
	}

	function offerPerUnit(o: ProductOffer): number | null {
		// Packs mix different products, so a per-unit price would mislead.
		return o.quantity > 1 && !o.isBundle ? Math.round(o.price / o.quantity) : null;
	}

	const sheetsUrl = $derived(
		(order?.googleSheetsUrl || settings?.commerce?.googleSheetsUrl || '').trim()
	);

	const cartUpsells = $derived(others);

	// ---------------------------------------------------------------------------
	// Form state
	// ---------------------------------------------------------------------------
	let fullName = $state('');
	let phone = $state('');
	let nameBlurredInvalid = $state(false);
	let phoneBlurredInvalid = $state(false);
	let submitAttempted = $state(false);
	let formError = $state('');
	let isSubmitting = $state(false);
	let isSubmittingFinal = $state(false);
	let metaPurchaseFired = false;
	let showStickyBtn = $state(true);
	let showUpsell = $state(false);

	let pendingOrder = $state<{
		orderId: string;
		date_order: string;
		customerName: string;
		phone: string;
		city_address: string;
		offerTitle: string;
		quantity: number;
		basePrice: number;
		sheetsUrl: string;
	} | null>(null);

	function scrollToReviews(e?: Event) {
		e?.preventDefault();
		document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/**
	 * Sends the order (with or without the post-order add-on) to /api/order,
	 * stores it for the thank-you page, fires conversion pixels and redirects.
	 */
	async function finalizeOrder(withUpsell: boolean) {
		if (!pendingOrder || isSubmittingFinal) return;
		isSubmittingFinal = true;

		const current = pendingOrder;
		const addOn = withUpsell && upsell ? upsell : null;
		const finalPrice = current.basePrice + (addOn ? Number(addOn.price) : 0);
		const bundleLabel = addOn ? `${current.offerTitle} + ${addOn.title}` : current.offerTitle;
		const productLabel = addOn ? `${productName} + ${addOn.title}` : productName;
		const note = addOn ? `مع العرض الإضافي: ${addOn.title} (+${addOn.price} درهم)` : '';

		try {
			await fetch('/api/order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: current.orderId,
					fullName: current.customerName,
					phone: current.phone,
					product: productLabel,
					bundle: bundleLabel,
					productTitle: productLabel,
					selectedOfferTitle: bundleLabel,
					price: finalPrice,
					totalPrice: finalPrice,
					quantity: current.quantity,
					note,
					hasUpsell: Boolean(addOn),
					upsellPrice: addOn ? Number(addOn.price) : 0,
					sku: productSku,
					source: productSlug
				})
			});
		} catch (err) {
			console.warn('Order send non-fatal error:', err);
		}

		if (typeof window === 'undefined') return;

		sessionStorage.setItem(`order_sent_${current.orderId}`, 'true');

		const savedOrder = {
			orderId: current.orderId,
			fullName: current.customerName,
			phoneNumber: current.phone,
			city: current.city_address,
			address: current.city_address,
			date: new Date().toLocaleDateString('ar-MA'),
			price: finalPrice,
			total: finalPrice,
			productTitle: productLabel,
			offer: bundleLabel,
			quantity: current.quantity,
			qte: current.quantity,
			sku: bundleLabel,
			hasUpsell: Boolean(addOn),
			upsellPrice: addOn ? Number(addOn.price) : 0
		};
		try {
			localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
			sessionStorage.setItem('latestOrder', JSON.stringify(savedOrder));
		} catch (e) {
			console.warn('Storage save error:', e);
		}

		try {
			if (typeof (window as any).gtag === 'function') {
				(window as any).gtag('event', 'conversion', {
					send_to: 'AW-18405009405',
					value: finalPrice,
					currency: 'MAD',
					transaction_id: current.orderId
				});
			}
		} catch {}

		try {
			trackSnapPurchase({
				orderId: current.orderId,
				price: finalPrice,
				currency: 'MAD',
				phone: current.phone,
				title: productLabel,
				sku: bundleLabel,
				quantity: current.quantity
			});
		} catch (snapErr) {
			console.warn('Snap Purchase tracking error:', snapErr);
		}

		try {
			if ((window as any).ttq) {
				const phoneObj = normalizePhone(current.phone);
				if (phoneObj.digits) {
					(window as any).ttq.identify({
						phone_number: sha256(phoneObj.e164WithPlus || phoneObj.digits)
					});
				}
				(window as any).ttq.track(
					'CompletePayment',
					{
						content_id: productSku,
						content_name: productLabel,
						content_type: 'product',
						quantity: current.quantity,
						currency: 'MAD',
						value: finalPrice
					},
					{ event_id: current.orderId }
				);
			}
		} catch (ttErr) {
			console.warn('TikTok CompletePayment error:', ttErr);
		}

		try {
			const metaKey = `meta_purchase_${current.orderId}`;
			if (
				!metaPurchaseFired &&
				!sessionStorage.getItem(metaKey) &&
				typeof (window as any).fbq === 'function'
			) {
				metaPurchaseFired = true;
				sessionStorage.setItem(metaKey, 'true');
				(window as any).fbq(
					'track',
					'Purchase',
					{
						value: Number(finalPrice),
						currency: 'MAD',
						content_name: productLabel,
						content_type: 'product',
						content_ids: [productSku],
						num_items: current.quantity
					},
					{ eventID: current.orderId }
				);
			}
		} catch (fbErr) {
			console.warn('Meta Purchase tracking non-fatal error:', fbErr);
		}

		showUpsell = false;
		const finalUrl = preserveTrackingParams(
			`/thank-you?orderId=${current.orderId}&name=${encodeURIComponent(current.customerName)}&phone=${encodeURIComponent(current.phone)}&city=${encodeURIComponent(current.city_address)}&total=${finalPrice}${addOn ? '&upsell=1' : ''}`
		);
		await new Promise((resolve) => setTimeout(resolve, 350));
		window.location.href = finalUrl;
	}

	function normalizeDigits(str: string): string {
		const eastern = '٠١٢٣٤٥٦٧٨٩';
		return String(str || '').replace(/[٠-٩]/g, (d) => eastern.indexOf(d).toString());
	}

	function validateFullName(val: string): boolean {
		return String(val || '').trim().replace(/\s+/g, '').length >= 2;
	}

	function cleanPhoneString(val: string): string {
		return normalizeDigits(val)
			.trim()
			.replace(/[\s\-‎‏‪-‮⁦-⁩()+.]+/g, '');
	}

	function validateMoroccanPhone(val: string): boolean {
		return /^(?:(?:00212|212)|0)[567]\d{8}$/.test(cleanPhoneString(val));
	}

	const isNameValid = $derived(validateFullName(fullName));
	const isPhoneValid = $derived(validateMoroccanPhone(phone));

	$effect(() => {
		if (isNameValid) nameBlurredInvalid = false;
		if (isPhoneValid) phoneBlurredInvalid = false;
		if (isNameValid && isPhoneValid && submitAttempted) submitAttempted = false;
	});

	function scrollAndFocusInvalid(fieldId: string) {
		const input = document.getElementById(fieldId) as HTMLElement | null;
		if (!input) return;
		const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		input.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
		input.focus({ preventScroll: true });
	}

	async function handleSubmitOrder(event?: Event) {
		event?.preventDefault();
		if (isSubmitting || isSubmittingFinal) return;
		formError = '';

		const trimmedName = fullName.trim();
		if (!validateFullName(trimmedName)) {
			nameBlurredInvalid = true;
			submitAttempted = true;
			scrollAndFocusInvalid('order-fullName');
			return;
		}
		if (!validateMoroccanPhone(phone)) {
			phoneBlurredInvalid = true;
			submitAttempted = true;
			scrollAndFocusInvalid('order-phone');
			return;
		}

		let cleanPhone = cleanPhoneString(phone).replace(/^00/, '');
		if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
		if (!cleanPhone.startsWith('212')) cleanPhone = '212' + cleanPhone;
		const internationalPhone = '+' + cleanPhone;

		const offer = activeOffer;
		const orderPrice = Number(offer.price) || 0;
		const quantity = Number(offer.quantity) || 1;

		metaTrack('InitiateCheckout');
		try {
			if ((window as any).ttq) {
				(window as any).ttq.identify({ phone_number: internationalPhone });
				(window as any).ttq.track('InitiateCheckout', {
					content_id: productSku,
					content_type: 'product',
					content_name: productName,
					quantity,
					value: orderPrice,
					currency: 'MAD'
				});
			}
		} catch (err) {
			console.warn('InitiateCheckout tracking non-fatal error:', err);
		}

		if (onOrderPending) {
			onOrderPending({
				fullName: trimmedName,
				phone: internationalPhone,
				selectedTier: { id: String(offer.id), price: orderPrice, title: offer.title },
				quantity
			});
			return;
		}

		pendingOrder = {
			orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
			date_order: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
			customerName: trimmedName,
			phone: internationalPhone,
			city_address: 'تأكيد هاتفي',
			offerTitle: offer.title,
			quantity,
			basePrice: orderPrice,
			sheetsUrl
		};

		if (upsell) {
			showUpsell = true;
		} else {
			isSubmitting = true;
			await finalizeOrder(false);
		}
	}

	function scrollToOrderSection(e?: Event) {
		e?.preventDefault();
		try {
			if (typeof (window as any).gtag === 'function') {
				(window as any).gtag('event', 'add_to_cart', {
					currency: 'MAD',
					value: Number(activeOffer.price) || 0,
					items: [
						{
							item_id: productSku,
							item_name: productName,
							price: Number(activeOffer.price) || 0,
							quantity: Number(activeOffer.quantity) || 1
						}
					]
				});
			}
		} catch {}

		const section = document.getElementById('order-form');
		if (!section) return;
		const confirmBtn = section.querySelector('[data-confirm-btn]');
		const bar = document.getElementById('top-announcement-bar');
		const gap = 6;

		function calcTarget() {
			const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
			const fixedTop = bar && ['fixed', 'sticky'].includes(getComputedStyle(bar).position)
				? bar.getBoundingClientRect().height
				: 0;
			const sectionTop = section!.getBoundingClientRect().top + window.scrollY;
			if (section!.offsetHeight <= vh - fixedTop - gap) {
				return Math.max(0, sectionTop - fixedTop - gap);
			}
			if (confirmBtn) {
				const btnBottom = confirmBtn.getBoundingClientRect().bottom + window.scrollY;
				return Math.max(0, btnBottom - vh + 12);
			}
			return Math.max(0, sectionTop - fixedTop - gap);
		}

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: calcTarget(), behavior: reduce ? 'auto' : 'smooth' });
		setTimeout(() => {
			if (Math.abs(window.scrollY - calcTarget()) > 4) {
				window.scrollTo({ top: calcTarget(), behavior: 'auto' });
			}
		}, 700);
	}

	onMount(() => {
		const formElement = document.getElementById('order-form');
		let formVisible = false;

		metaTrack('ViewContent');
		const onFormEngaged = () => metaTrack('AddToCart');
		formElement?.addEventListener('focusin', onFormEngaged, { once: true });

		function updateStickyState() {
			showStickyBtn = window.scrollY < 100 ? true : !formVisible;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target.id === 'order-form') formVisible = entry.isIntersecting;
				}
				updateStickyState();
			},
			{ threshold: 0.15 }
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
	style="{buildThemeCssVars(t)}; background-color: #EEF2F3; color: #17232B;"
	dir="rtl"
>
	<!-- Brand header -->
	<header class="lz-brandbar" dir="rtl">
		<a href="/" class="lz-brandbar-logo" aria-label="Lhamza Shop"><Logo size={28} tone="light" /></a>
		<a
			class="lz-brandbar-wa"
			href={`https://wa.me/${((order as any)?.whatsappNumber || '212626558375').replace(/D/g, '')}?text=${encodeURIComponent('سلام، عندي سؤال على ' + productName)}`}
			target="_blank"
			rel="noopener"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>
			<span>سولنا</span>
		</a>
	</header>

	<!-- 1. Top bar: scrolling trust messages -->
	<aside
		id="top-announcement-bar"
		class="sticky top-0 z-40 w-full max-w-full bg-[#F5A300] text-[#17232B] py-1.5 text-[12px] sm:text-[13px] font-extrabold border-b border-black/10 select-none leading-snug overflow-hidden"
		aria-label="معلومات الطلب"
	>
		<div class="lz-ticker" dir="ltr">
			<div class="lz-ticker-track">
				{#each [0, 1] as copy (copy)}
					<ul class="lz-ticker-list" dir="rtl" aria-hidden={copy === 1}>
						{#each tickerItems as item, i (i)}
							<li>{item}</li>
						{/each}
					</ul>
				{/each}
			</div>
		</div>
	</aside>

	<!-- 2. HERO SECTION (IMAGE FIRST -> TITLE -> RATINGS) -->
	<header id="hero-section" class="pt-0 sm:pt-3 pb-6 sm:pb-8 px-0 sm:px-4 max-w-xl mx-auto mb-1 w-full">
		<div class="w-full sm:max-w-lg mx-auto aspect-[3/4] overflow-hidden sm:rounded-2xl sm:shadow-md sm:border border-stone-200/80 bg-white sm:my-1.5 relative">
			{#if heroImage}
				<img
					src={heroImage}
					alt={productName}
					loading="eager"
					fetchpriority="high"
					class="w-full h-full object-cover object-center sm:rounded-2xl"
				/>
			{:else}
				<div class="lz-img-empty" aria-hidden="true">
					<span class="lz-img-empty-mark">ء</span>
					<span>صورة المنتج</span>
				</div>
			{/if}
		</div>

		<div class="text-center pt-3 pb-1 px-3 sm:px-0 space-y-1.5">
			<h1 class="font-display text-[18px] sm:text-2xl font-black text-[#17232B] leading-snug tracking-tight px-1 max-w-sm mx-auto">
				{cleanTitle}
			</h1>
			{#if content?.subtitle}
				<p class="text-[13.5px] sm:text-base text-[#56687A] leading-relaxed max-w-sm mx-auto">{content.subtitle}</p>
			{/if}
			{#if inBox.length}
				<div class="lz-inbox">
					<p class="lz-inbox-title">شنو كيوصلك</p>
					<ul>
						{#each inBox as item, i (i)}
							<li><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3L15 7" /></svg><span>{item}</span></li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if productReviewCount > 0 && reviews.length > 0}
				<a href="#reviews" onclick={scrollToReviews} class="flex items-center justify-center gap-1.5 pt-0.5">
					<span class="text-amber-500 font-extrabold text-xs sm:text-sm">
						★★★★★ {productRating ? productRating.toFixed(1) : ''} ({productReviewCount} تقييم)
					</span>
				</a>
			{/if}
		</div>
	</header>

	<!-- COD ORDER FORM & OFFER CARDS -->
	<div
		id="order-form"
		data-order-section
		class="w-full max-w-[560px] mx-auto px-2 sm:px-4 my-2 sm:my-6"
		dir="rtl"
		style="--cod-green-dark: #2F4858; --cod-green-light: #E3ECF0; --cod-orange-btn: #F5A300; --cod-beige-bg: #F7F9FA; --cod-gray-old: #7A8A96;"
	>
		<div class="bg-[var(--cod-beige-bg)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#D5DEE2] transition-all">
			<div class="bg-[var(--cod-green-dark)] py-2 px-3 sm:py-4 sm:px-4 text-center text-white order-header">
				<h2 class="text-[19px] sm:text-3xl font-black mb-0.5 text-white tracking-tight leading-tight">كمل الطلب ديالك</h2>
				<p class="text-[11.5px] sm:text-sm text-[#CFDBE2] font-medium leading-none">كتخلص ملي يوصلك الطلب وتشوفو</p>
			</div>

			<div class="p-2 sm:p-5 space-y-1.5">
				{#each offersList as offer, i (offer.id)}
					{@const selected = activeOffer.id === offer.id}
					{@const saving = offerSaving(offer)}
					{@const perUnit = offerPerUnit(offer)}
					<label
						class="offer-card relative cursor-pointer rounded-xl sm:rounded-2xl border-2 transition-all select-none focus-within:ring-2 focus-within:ring-[var(--cod-green-dark)] {i > 0 ? 'offer-card-tier2 mt-2 sm:mt-3' : ''} {selected ? 'border-[var(--cod-green-dark)] bg-[var(--cod-green-light)] shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}"
					>
						{#if offer.badge || offer.isPopular}
							<span class="offer-ribbon absolute -top-2 end-4 bg-[var(--cod-green-dark)] text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md z-10 leading-none">
								{offer.badge || 'الأوفر'}
							</span>
						{/if}

						<input
							type="radio"
							name="product-offer-tier"
							value={offer.id}
							class="sr-only"
							checked={selected}
							onchange={() => (selectedOfferId = offer.id)}
						/>

						<div class="offer-row-identity">
							<div class="offer-media">
								<div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 {selected ? 'border-[var(--cod-green-dark)] bg-[var(--cod-green-dark)] text-white' : 'border-gray-300 bg-white'}">
									{#if selected}
										<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
										</svg>
									{/if}
								</div>
								{#if offer.image}
									<img
										src={offer.image}
										alt={offer.title}
										width="44"
										height="44"
										loading="lazy"
										class="w-10 h-10 sm:w-14 sm:h-14 object-contain rounded-lg border border-gray-100 bg-white shadow-xs shrink-0"
									/>
								{:else}
									<span class="lz-offer-qty" aria-hidden="true">×{offer.quantity}</span>
								{/if}
							</div>

							<div class="offer-title-wrap">
								<div class="offer-title">{offer.title}</div>
								{#if offer.subtitle}
									<div class="text-[11.5px] text-gray-500 font-medium leading-snug">{offer.subtitle}</div>
								{/if}
								{#if saving}
									<div class="offer-savings-desktop">
										<div class="flex items-center gap-1.5">
											<span class="offer-pill">وفّر {saving} {currency}</span>
											{#if perUnit}
												<span class="text-xs font-bold text-gray-700">غير {perUnit} {currency} للوحدة</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						</div>

						<div class="offer-row-bottom">
							<div class="offer-price">
								<div class="offer-price-current">
									{offer.price} <span class="offer-currency">{currency}</span>
								</div>
								{#if offer.originalPrice > offer.price}
									<div class="offer-price-old">{offer.originalPrice} {currency}</div>
								{/if}
							</div>

							{#if saving}
								<div class="offer-savings-mobile">
									<div class="flex flex-col items-end gap-0">
										<span class="offer-pill text-[10px] px-1.5 py-0.5 leading-tight">وفّر {saving} {currency}</span>
										{#if perUnit}
											<span class="offer-per-unit text-[10px] leading-tight">غير {perUnit} {currency} للوحدة</span>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</label>
				{/each}

				<!-- CUSTOMER INPUTS (2 FIELDS) -->
				<form onsubmit={handleSubmitOrder} novalidate class="pt-1 space-y-1 sm:space-y-3.5 text-right">
					<h3 class="font-black text-gray-900 text-[13.5px] sm:text-lg mt-0.5 mb-0">المعلومات ديال التوصيل</h3>

					<div>
						<label for="order-fullName" class="block text-[12px] sm:text-sm font-bold text-gray-800 mb-0.5">الاسم</label>
						<input
							id="order-fullName"
							type="text"
							name="fullName"
							autocomplete="name"
							bind:value={fullName}
							onblur={() => {
								if (fullName.trim().length > 0 && !validateFullName(fullName)) nameBlurredInvalid = true;
							}}
							required
							placeholder="كتب السمية ديالك"
							class="w-full h-11 min-h-[44px] px-3 py-2 bg-white rounded-[10px] border text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--cod-green-dark)] focus:ring-2 focus:ring-[var(--cod-green-dark)]/20 transition-all {nameBlurredInvalid && !isNameValid ? 'border-red-500 bg-red-50/20' : 'border-gray-300'}"
						/>
						{#if nameBlurredInvalid && !isNameValid}
							<p class="text-[11px] text-red-600 font-bold mt-0.5 text-right">كتب السمية ديالك (حرفين على الأقل).</p>
						{/if}
					</div>

					<div>
						<label for="order-phone" class="block text-[12px] sm:text-sm font-bold text-gray-800 mb-0.5">رقم التيليفون (واتساب)</label>
						<input
							id="order-phone"
							type="tel"
							name="phone"
							inputmode="tel"
							autocomplete="tel"
							bind:value={phone}
							onblur={() => {
								if (phone.trim().length > 0 && !validateMoroccanPhone(phone)) phoneBlurredInvalid = true;
							}}
							required
							dir="ltr"
							placeholder="06XXXXXXXX"
							class="w-full h-11 min-h-[44px] px-3 py-2 bg-white rounded-[10px] border text-base text-gray-900 placeholder:text-gray-400 text-right focus:outline-none focus:border-[var(--cod-green-dark)] focus:ring-2 focus:ring-[var(--cod-green-dark)]/20 transition-all {phoneBlurredInvalid && !isPhoneValid ? 'border-red-500 bg-red-50/20' : 'border-gray-300'}"
						/>
						{#if phoneBlurredInvalid && !isPhoneValid}
							<p class="text-[11px] text-red-600 font-bold mt-0.5 text-right">دخل رقم مغربي صحيح (مثلاً 0612345678).</p>
						{/if}
					</div>

					{#if formError}
						<div class="rounded-lg bg-red-50 border border-red-200 p-2 text-xs sm:text-sm text-red-700 font-bold text-center">{formError}</div>
					{/if}

					<button
						type="submit"
						data-confirm-btn
						disabled={isSubmitting || isSubmittingFinal}
						class="w-full h-12 min-h-[48px] mt-1.5 sm:mt-2 py-2.5 px-4 bg-[var(--cod-orange-btn)] hover:bg-[#D98F00] active:scale-[0.99] transition text-[#17232B] font-black text-base sm:text-xl rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F5A300]"
					>
						{#if isSubmitting || isSubmittingFinal}
							<span class="inline-block w-5 h-5 border-2 border-[#17232B]/30 border-t-[#17232B] rounded-full animate-spin me-2"></span>
							<span>كنأكدو الطلب ديالك...</span>
						{:else}
							أكد الطلب • {activeOffer.price} {currency}
						{/if}
					</button>

					<div class="text-[11px] sm:text-xs text-gray-600 text-center font-medium mt-1">
						غادي نتصلو بيك باش نأكدو الطلب • 🔒 المعلومات ديالك محمية
					</div>

						{#if deliveryWindow}
							<p class="lz-eta">
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>
								<span>اطلب دابا ويوصلك <b>{deliveryWindow}</b></span>
							</p>
						{/if}

						<ul class="lz-trust" aria-label="الضمانات">
							<li>
								<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></svg>
								<span>الدفع عند الاستلام</span>
							</li>
							<li>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M8.5 12l2.4 2.4L15.5 9.8" /></svg>
								<span>مجرب قبل ما يخرج</span>
							</li>
							<li>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7" /></svg>
								<span>استبدال 7 أيام</span>
							</li>
						</ul>
				</form>
			</div>
		</div>
	</div>

	<!-- FEATURE CARDS (killers.benefits + gallery images 2..n) -->
	{#if features.length}
		<div class="px-2.5 sm:px-4 max-w-[560px] mx-auto space-y-6 pt-1 pb-4 below-fold-lazy-section w-full" dir="rtl">
			<div class="text-center pt-1 mb-2">
				<h2 class="font-display text-lg sm:text-xl font-black text-[#17232B] mt-1.5">علاش هاد المنتج؟</h2>
			</div>

			{#each features as f, i (i)}
				<div class="my-8 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center" dir="rtl">
					<h2 class="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2">{f.title}</h2>
					{#if f.text}
						<p class="text-[13.5px] sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-4 font-medium">{f.text}</p>
					{/if}
					<div class="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-inner border border-gray-100">
						{#if f.image}
							<img src={f.image} alt={f.alt} loading="lazy" decoding="async" class="w-full h-auto object-cover block" />
						{:else}
							<div class="lz-img-empty lz-img-empty-wide" aria-hidden="true">
								<span class="lz-img-empty-mark">ء</span>
								<span>صورة {i + 2}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- HOW IT WORKS (killers.usageSteps) -->
	{#if steps.length}
		<section class="lz-steps below-fold-lazy-section" aria-labelledby="lz-steps-title" dir="rtl">
			<h2 id="lz-steps-title">كيفاش كيخدم</h2>
			<ol>
				{#each steps as step, i (i)}
					<li><span class="lz-step-n" aria-hidden="true">{i + 1}</span><p>{step}</p></li>
				{/each}
			</ol>
		</section>
	{/if}

	<!-- WHY LHAMZA (killers.guarantees) -->
	{#if promises.length}
		<section class="lz-why below-fold-lazy-section" aria-labelledby="lz-why-title" dir="rtl">
			<h2 id="lz-why-title">علاش تطلب من Lhamza</h2>
			<ul>
				{#each promises as g, i (i)}
					<li>
						<h3>{g.title}</h3>
						{#if g.text}<p>{g.text}</p>{/if}
					</li>
				{/each}
			</ul>
			<a href="#order-form" class="lz-why-cta">اطلب دابا • {activeOffer.price} {currency}</a>
		</section>
	{/if}

	<!-- CUSTOMER REVIEWS (only real reviews from the admin) -->
	{#if reviews.length}
		<section id="reviews" class="scroll-mt-14 px-2.5 sm:px-4 py-5 below-fold-lazy-section" dir="rtl">
			<div class="text-center mb-5">
				<h3 class="text-xl sm:text-2xl font-extrabold font-display text-stone-900 tracking-tight">شنو قالو الكليان</h3>
			</div>
			<div class="space-y-3.5">
				{#each reviews as r, i (i)}
					<div class="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
						<div class="flex items-center gap-2.5 mb-2.5">
							<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3ECF0] text-xs font-black text-[#2F4858]">
								{r.name.trim().charAt(0)}
							</div>
							<h4 class="font-extrabold text-sm text-stone-900 leading-tight">{r.name}</h4>
						</div>
						<p class="text-xs sm:text-sm text-stone-700 leading-relaxed">{r.text}</p>
						{#if r.image}
							<img src={r.image} alt="صورة من {r.name}" loading="lazy" class="mt-3 w-full rounded-xl" />
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- FAQ -->
	{#if t.sections.trustBadges.showFAQ && activeFaq.length > 0}
		<section class="px-2.5 sm:px-4 py-5 below-fold-lazy-section" dir="rtl">
			<div class="text-center mb-5">
				<h3 class="text-xl sm:text-2xl font-extrabold font-display text-stone-900 tracking-tight">
					{t.sections.trustBadges.faqTitle || 'الأسئلة اللي كتتعاود'}
				</h3>
			</div>

			<div class="space-y-3">
				{#each activeFaq as item}
					<details class="group rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-stone-300">
						<summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm sm:text-base font-extrabold text-stone-900 select-none [&::-webkit-details-marker]:hidden">
							<span>{item.question}</span>
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-transform duration-300 group-open:rotate-180 group-open:bg-[#E3ECF0] group-open:text-[#2F4858]">
								<svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
								</svg>
							</span>
						</summary>
						<div class="px-4 pb-4 pt-2 text-[13px] sm:text-sm leading-relaxed text-stone-600 border-t border-stone-100 bg-stone-50/40">
							<p>{item.answer}</p>
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Footer -->
	<footer class="bg-[#24394A] pt-8 pb-24 sm:pb-14 text-center text-xs text-[#C3D0D8] px-4 mt-auto" dir="rtl">
		<div class="max-w-4xl mx-auto space-y-4">
			<div class="space-y-1">
				<p class="font-black text-sm sm:text-base text-white">Lhamza Shop</p>
				<p class="text-xs text-[#AFC0CA] max-w-lg mx-auto">
					إكسسوارات الطوموبيل، مختارة للمغرب. الدفع عند الاستلام والتوصيل لجميع المدن.
				</p>
			</div>

			<nav aria-label="روابط السياسات" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-[#DCE6EB] py-2 border-y border-white/10">
				<a href="/" class="hover:text-white hover:underline">المتجر</a>
				<a href="/privacy" class="hover:text-white hover:underline">الخصوصية</a>
				<a href="/terms" class="hover:text-white hover:underline">الشروط</a>
				<a href="/refund-policy" class="hover:text-white hover:underline">الاستبدال والاسترجاع</a>
				<a href="/shipping-policy" class="hover:text-white hover:underline">الشحن</a>
				<a href="/contact" class="hover:text-white hover:underline">تواصل معنا</a>
			</nav>

			<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-[#AFC0CA]">
				<a href="mailto:contact@lhamza.shop" class="underline hover:text-white">contact@lhamza.shop</a>
				<span dir="ltr">+212 626-558375</span>
				<span>9:00 - 22:00</span>
			</div>

			<p class="text-[11px] text-[#8FA3B0] pt-1">© {new Date().getFullYear()} Lhamza Shop (lhamza.shop)</p>
		</div>
	</footer>

	<!-- Floating Sticky CTA (mobile) -->
	{#if showStickyBtn && (t?.sections?.advanced?.showStickyButton ?? true)}
		<div
			class="fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-2.5 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-2xl sm:hidden"
			style="padding-bottom: max(0.85rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem));"
			dir="rtl"
		>
			<div class="max-w-md mx-auto flex flex-col items-center justify-center gap-1.5">
				<button
					type="button"
					onclick={scrollToOrderSection}
					class="w-full h-[48px] min-h-[48px] py-2 px-4 rounded-xl bg-[#2F4858] hover:bg-[#24394A] text-white font-black text-base shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer text-center btn-shake"
				>
					<span>اطلب دابا • {activeOffer.price} {currency}</span>
				</button>
				<p class="text-center text-[11.5px] font-bold text-stone-600 leading-normal">الدفع عند الاستلام 🔒</p>
			</div>
		</div>
	{/if}

	<CartDrawer
		others={cartUpsells}
		currency={currency}
		salesText={t.sections.hero.salesCountText}
		offers={offersList}
		currentSlug={productSlug}
		currentTitle={productName}
		currentImage={heroImage}
	/>
	<CheckoutModal
		currency={currency}
		sheetsUrl={sheetsUrl}
		productTitle={productName}
		sku={productSku}
		onDone={() => {
			cartUi.resetAll();
			window.location.href = preserveTrackingParams('/thank-you');
		}}
	/>

	{#if upsell}
		<PostOrderUpsellModal
			bind:isOpen={showUpsell}
			{upsell}
			{currency}
			onAcceptUpsell={() => finalizeOrder(true)}
			onDeclineUpsell={() => finalizeOrder(false)}
		/>
	{/if}
</div>

<style>
	/* Brand header + scrolling bar + delivery/trust under the form */
	.lz-brandbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 14px;
		background: #2f4858;
	}
	.lz-brandbar-logo {
		display: inline-flex;
		text-decoration: none;
	}
	.lz-brandbar-wa {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 34px;
		padding: 0 12px;
		border: 1px solid rgb(255 255 255 / 0.25);
		border-radius: 999px;
		font-size: 13px;
		font-weight: 800;
		color: #fff;
		text-decoration: none;
	}
	.lz-brandbar-wa svg {
		width: 16px;
		height: 16px;
	}
	.lz-ticker {
		overflow: hidden;
		mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
	}
	.lz-ticker-track {
		display: flex;
		width: max-content;
		animation: lz-ticker 28s linear infinite;
	}
	.lz-ticker-list {
		display: flex;
		flex: none;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lz-ticker-list li {
		display: flex;
		align-items: center;
		white-space: nowrap;
		padding: 0 14px;
	}
	.lz-ticker-list li::after {
		content: '';
		width: 5px;
		height: 5px;
		margin-inline-start: 28px;
		border-radius: 50%;
		background: #17232b;
		opacity: 0.55;
	}
	@keyframes lz-ticker {
		from {
			transform: translateX(-50%);
		}
		to {
			transform: translateX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lz-ticker-track {
			animation: none;
		}
	}
	.lz-eta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 8px 0 0;
		padding: 8px 10px;
		border-radius: 10px;
		background: #e3ecf0;
		font-size: 12.5px;
		font-weight: 700;
		color: #2f4858;
		text-align: center;
	}
	.lz-eta b {
		color: #17232b;
	}
	.lz-eta svg,
	.lz-trust svg {
		flex: none;
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.lz-trust {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
	}
	.lz-trust li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 4px;
		border: 1px solid #e5ebee;
		border-radius: 10px;
		background: #fff;
		font-size: 11px;
		font-weight: 800;
		line-height: 1.3;
		text-align: center;
		color: #17232b;
	}
	.lz-trust svg {
		width: 22px;
		height: 22px;
		color: #d98f00;
	}

	/* What you get / How it works / Why Lhamza */
	.lz-inbox {
		max-width: 22rem;
		margin: 0.6rem auto 0;
		padding: 0.6rem 0.8rem 0.7rem;
		background: #fff;
		border: 1px solid #d5dee2;
		border-radius: 14px;
		text-align: right;
	}
	.lz-inbox-title {
		margin: 0 0 0.4rem;
		font-size: 12px;
		font-weight: 900;
		color: #2f4858;
	}
	.lz-inbox ul {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lz-inbox li {
		display: flex;
		gap: 0.35rem;
		align-items: flex-start;
		font-size: 12.5px;
		font-weight: 700;
		line-height: 1.4;
		color: #17232b;
	}
	.lz-inbox svg {
		flex: none;
		width: 14px;
		height: 14px;
		margin-top: 2px;
		fill: none;
		stroke: #d98f00;
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.lz-steps,
	.lz-why {
		width: 100%;
		max-width: 560px;
		margin: 0.5rem auto 1.5rem;
		padding: 0 0.625rem;
	}
	.lz-steps h2,
	.lz-why h2 {
		margin: 0 0 0.9rem;
		font-size: 1.25rem;
		font-weight: 900;
		text-align: center;
		color: #17232b;
	}
	.lz-steps ol {
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lz-steps li {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.8rem 0.9rem;
		background: #fff;
		border: 1px solid #e5ebee;
		border-radius: 16px;
	}
	.lz-steps p {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		line-height: 1.5;
		color: #17232b;
	}
	.lz-step-n {
		display: grid;
		flex: none;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		background: #f5a300;
		font-weight: 900;
		color: #17232b;
	}
	.lz-why {
		padding: 1.4rem 1rem 1.2rem;
		background: #2f4858;
		border-radius: 24px;
	}
	.lz-why h2 {
		color: #fff;
	}
	.lz-why ul {
		display: grid;
		gap: 0.7rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lz-why li {
		padding: 0.75rem 0.9rem;
		background: rgb(255 255 255 / 0.07);
		border-inline-start: 3px solid #f5a300;
		border-radius: 12px;
	}
	.lz-why h3 {
		margin: 0 0 0.2rem;
		font-size: 15px;
		font-weight: 900;
		color: #fff;
	}
	.lz-why p {
		margin: 0;
		font-size: 13px;
		line-height: 1.6;
		color: #cfdbe2;
	}
	.lz-why-cta {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 48px;
		margin-top: 1rem;
		border-radius: 14px;
		background: #f5a300;
		font-weight: 900;
		color: #17232b;
		text-decoration: none;
	}
	.lz-why-cta:hover {
		background: #d98f00;
	}
	@media (min-width: 640px) {
		.lz-why ul {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* Lhamza brand additions: empty image placeholders, mini logo, offer quantity chip */
	.lz-img-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		height: 100%;
		background: repeating-linear-gradient(-45deg, #eef2f3 0 14px, #e6ecee 14px 28px);
		color: #56687a;
		font-size: 13px;
		font-weight: 600;
	}

	.lz-img-empty-wide {
		aspect-ratio: 4 / 3;
		height: auto;
	}

	.lz-img-empty-mark {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 13px;
		background: #f5a300;
		color: #17232b;
		font-size: 38px;
		font-weight: 700;
		line-height: 1;
	}

	.lz-mini-logo {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border-radius: 6px;
		background: #f5a300;
		color: #17232b;
		font-size: 16px;
		font-weight: 700;
		line-height: 1;
	}

	.lz-offer-qty {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #fff;
		border: 1px solid #d5dee2;
		color: #2f4858;
		font-size: 14px;
		font-weight: 800;
	}

	@media (min-width: 640px) {
		.lz-offer-qty {
			width: 56px;
			height: 56px;
			font-size: 16px;
		}
	}

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

	.btn-shake,
	:global(.btn-shake) {
		will-change: transform;
		animation: cta-horizontal-shake 2.6s ease-in-out infinite !important;
	}


	/* ═══════════════════════════════════════════════════════════
	   OFFER CARDS: COMPACT MOBILE-FIRST (<= 480px) & DESKTOP (>= 481px)
	   ═══════════════════════════════════════════════════════════ */
	.offer-card {
		box-sizing: border-box;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 5px 8px;
	}

	.offer-card-tier2 {
		padding-top: 7px;
	}

	.offer-row-identity {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
	}

	.offer-media {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.offer-title-wrap {
		flex: 1 1 0%;
		min-width: 0;
		text-align: right;
	}

	.offer-title {
		font-size: 13.5px;
		line-height: 1.35;
		font-weight: 700;
		color: #111827;
		text-wrap: balance;
		word-break: normal;
		overflow-wrap: normal;
	}

	.offer-savings-desktop {
		display: none;
	}

	.offer-row-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 4px;
		width: 100%;
		padding-top: 3px;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		margin-top: 1px;
	}

	.offer-price {
		display: flex;
		align-items: baseline;
		gap: 4px;
		text-align: right;
	}

	.offer-price-current {
		font-size: 20px;
		font-weight: 900;
		color: var(--cod-green-dark, #1F5C4A);
		line-height: 1;
	}

	.offer-currency {
		font-size: 12px;
		font-weight: 700;
	}

	.offer-price-old {
		font-size: 12px;
		color: var(--cod-gray-old, #777777);
		text-decoration: line-through;
	}

	.offer-savings-mobile {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.offer-pill {
		display: inline-block;
		background-color: #ddf2e5;
		color: var(--cod-green-dark, #1F5C4A);
		font-size: 11px;
		font-weight: 900;
		padding: 2px 7px;
		border-radius: 9999px;
		border: 1px solid #bfe7cf;
		white-space: nowrap;
		line-height: 1.2;
	}

	.offer-per-unit {
		font-size: 11px;
		font-weight: 700;
		color: #374151;
		white-space: nowrap;
	}

	/* Short screen optimization (<= 480px width AND <= 600px height) */
	@media (max-width: 480px) {
		.order-header {
			padding: 6px 10px !important;
		}
		#order-form input {
			height: 42px !important;
			min-height: 42px !important;
		}
		#order-form button[type="submit"] {
			height: 44px !important;
			min-height: 44px !important;
		}
	}

	/* Desktop layout: >= 481px */
	@media (min-width: 481px) {
		.offer-card {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 16px;
		}

		.offer-card-tier2 {
			padding-top: 16px;
		}

		.offer-row-identity {
			flex: 1 1 0%;
			min-width: 0;
			gap: 12px;
		}

		.offer-media {
			gap: 10px;
		}

		.offer-title {
			font-size: 16px;
			font-weight: 800;
		}

		.offer-savings-desktop {
			display: block;
			margin-top: 6px;
		}

		.offer-row-bottom {
			display: block;
			width: auto;
			border-top: none;
			padding-top: 0;
			margin-top: 0;
			flex-shrink: 0;
			text-align: left;
		}

		.offer-price {
			display: block;
			text-align: left;
		}

		.offer-price-current {
			font-size: 24px;
		}

		.offer-price-old {
			margin-top: 4px;
		}

		.offer-savings-mobile {
			display: none;
		}
	}
</style>
