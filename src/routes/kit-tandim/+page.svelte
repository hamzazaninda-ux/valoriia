<script lang="ts">
	import { onMount } from 'svelte';
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';
	import DrainUpsellModal from '$lib/components/DrainUpsellModal.svelte';
	import { cloudinaryUrl, cloudinarySrcset } from '$lib/utils/images';

	let { data } = $props();

	let showUpsellModal = $state(false);
	let isSubmitting = $state(false);

	let pendingOrderData = $state<{
		orderId: string;
		fullName: string;
		phone: string;
		selectedTier: { id: string | number; price: number; title: string };
		quantity: number;
	} | null>(null);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const fireViewContent = () => {
				if ((window as any).ttq && typeof (window as any).ttq.track === 'function') {
					(window as any).ttq.track('ViewContent', {
						content_id: 'kit-tandim',
						content_type: 'product',
						content_name: 'منظم الحمام الزاوي 4 رفوف',
						quantity: 1,
						price: 229,
						value: 229,
						currency: 'MAD'
					});
					console.log('TikTok Event Fired: ViewContent', {
						content_id: 'kit-tandim',
						content_name: 'منظم الحمام الزاوي 4 رفوف',
						value: 229,
						currency: 'MAD'
					});
					return true;
				}
				return false;
			};

			if (!fireViewContent()) {
				const interval = setInterval(() => {
					if (fireViewContent()) clearInterval(interval);
				}, 100);
				setTimeout(() => clearInterval(interval), 3000);
			}
		}
	});

	// Triggered upon clicking "تأكيد الطلب": Save in memory & open Upsell Modal immediately WITHOUT dispatching to Google Sheets yet!
	function handleOrderPending(orderInfo: {
		fullName: string;
		phone: string;
		selectedTier: { id: string | number; price: number; title: string };
		quantity: number;
	}) {
		const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
		pendingOrderData = {
			...orderInfo,
			orderId
		};
		showUpsellModal = true;
	}

	// Upsell Accepted (+29 MAD) -> ONE Single Consolidated Order sent to Google Sheets
	async function handleAcceptUpsell() {
		if (!pendingOrderData || isSubmitting) return;

		const basePrice = Number(pendingOrderData.selectedTier.price || 229);
		const finalPrice = basePrice + 29;
		const baseTitle =
			pendingOrderData.selectedTier.title ||
			(pendingOrderData.quantity === 2
				? 'قطعتان + رشاشان هدية مجانية 🎁'
				: 'قطعة واحدة + رشاش هدية مجانية 🎁');
		const finalProductTitle = `${baseTitle} + سدادة وفلتر مصرف الأرضية (29 درهم)`;

		await finalizeAndSendOrder(finalProductTitle, finalPrice, true);
	}

	// Upsell Declined (Base Order Only) -> ONE Single Consolidated Order sent to Google Sheets
	async function handleDeclineUpsell() {
		if (!pendingOrderData || isSubmitting) return;
		showUpsellModal = false;

		const basePrice = Number(pendingOrderData.selectedTier.price || 229);
		const baseTitle =
			pendingOrderData.selectedTier.title ||
			(pendingOrderData.quantity === 2
				? 'قطعتان + رشاشان هدية مجانية 🎁'
				: 'قطعة واحدة + رشاش هدية مجانية 🎁');

		await finalizeAndSendOrder(baseTitle, basePrice, false);
	}

	// ONE single consolidated dispatch to /api/order (Google Sheets & Git DB)
	async function finalizeAndSendOrder(productTitle: string, totalPrice: number, hasUpsell: boolean) {
		if (!pendingOrderData || isSubmitting) return;
		isSubmitting = true;

		const { orderId, fullName, phone, quantity } = pendingOrderData;
		const note = hasUpsell ? 'مع عرض السدادة (+29 درهم)' : '';

		try {
			// 1. Fire conversion pixels for the full total
			firePurchasePixels(totalPrice, orderId, productTitle, quantity);

			// 2. Dispatch ONE single consolidated payload to /api/order
			const res = await fetch('/api/order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId,
					fullName,
					phone,
					product: productTitle,
					bundle: productTitle,
					productTitle,
					selectedOfferTitle: productTitle,
					price: totalPrice,
					totalPrice,
					total: totalPrice,
					quantity,
					note,
					hasUpsell,
					upsellPrice: hasUpsell ? 29 : 0,
					source: 'kit-tandim'
				})
			});

			const data = await res.json().catch(() => null);
			const returnedOrderId = data?.orderId || orderId;

			// 3. Save latestOrder to localStorage & sessionStorage
			if (typeof window !== 'undefined') {
				sessionStorage.setItem(`order_sent_${returnedOrderId}`, 'true');
				const savedOrder = {
					orderId: returnedOrderId,
					fullName,
					phoneNumber: phone,
					city: 'تأكيد هاتفي',
					address: 'تأكيد هاتفي',
					date: new Date().toLocaleDateString('ar-MA'),
					price: totalPrice,
					total: totalPrice,
					productTitle,
					offer: productTitle,
					quantity,
					hasUpsell,
					upsellPrice: hasUpsell ? 29 : 0
				};
				try {
					localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
					sessionStorage.setItem('latestOrder', JSON.stringify(savedOrder));
				} catch (e) {}
			}

			showUpsellModal = false;

			// 4. Wait 350ms buffer then redirect to thank-you page
			await new Promise((resolve) => setTimeout(resolve, 350));
			const thankYouUrl = `/thank-you?orderId=${encodeURIComponent(returnedOrderId)}${hasUpsell ? '&upsell=1' : ''}&total=${totalPrice}&name=${encodeURIComponent(fullName)}&phone=${encodeURIComponent(phone)}`;
			window.location.href = thankYouUrl;
		} catch (err) {
			console.error('Finalize order error:', err);
			showUpsellModal = false;
			const thankYouUrl = `/thank-you?orderId=${encodeURIComponent(orderId)}${hasUpsell ? '&upsell=1' : ''}&total=${totalPrice}&name=${encodeURIComponent(fullName)}&phone=${encodeURIComponent(phone)}`;
			window.location.href = thankYouUrl;
		} finally {
			isSubmitting = false;
		}
	}

	function firePurchasePixels(finalAmount: number, orderId: string, title?: string, quantity: number = 1) {
		try {
			if (typeof window !== 'undefined' && (window as any).ttq) {
				(window as any).ttq.track(
					'CompletePayment',
					{
						content_id: 'kit-tandim',
						content_name: title || 'باك الحمام الذكي',
						quantity,
						value: finalAmount,
						currency: 'MAD'
					},
					{
						event_id: orderId
					}
				);
			}
			if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
				(window as any).gtag('event', 'conversion', {
					send_to: 'AW-18405009405',
					value: finalAmount,
					currency: 'MAD',
					transaction_id: orderId
				});
			}
		} catch (err) {
			console.warn('Pixel tracking error:', err);
		}
	}

	const HERO_IMAGE_URL =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1793292638/Gemini_Generated_Image_ro2ak2ro2ak2ro2a.jpg';

	const heroPreloadUrl = cloudinaryUrl(HERO_IMAGE_URL, 'f_auto,q_auto,w_720');
	const heroPreloadSrcset = cloudinarySrcset(HERO_IMAGE_URL, [480, 720, 960]);
	const heroSizes = '(max-width: 400px) calc(100vw - 16px), 364px';

	const seo = $derived(
		data.product?.published?.seo || {
			metaTitle: 'طقم تنظيم الحمام الذكي المتكامل (بدون ثقب) + رشاش تعزيز ضغط الماء هدية مجانية | Lhamza Shop',
			metaDescription:
				'طقم تنظيم الحمام الذكي بدون ثقب الجدران + رشاش مضاعفة ضغط الماء هدية مجانية. توصيل مجاني لجميع المدن والدفع عند الاستلام بعد المعاينة.',
			noindex: false
		}
	);
</script>

<svelte:head>
	<title>{seo.metaTitle}</title>
	<meta name="description" content={seo.metaDescription} />
	<meta property="og:title" content={seo.metaTitle} />
	<meta property="og:description" content={seo.metaDescription} />
	<meta property="og:image" content={heroPreloadUrl} />
	<link rel="preconnect" href="https://res.cloudinary.com" crossorigin="" />
	<link
		rel="preload"
		as="image"
		href={heroPreloadUrl}
		imagesrcset={heroPreloadSrcset}
		imagesizes={heroSizes}
		fetchpriority="high"
	/>
	{#if seo.noindex}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<StackedTemplate
	product={data.product}
	settings={data.settings}
	theme={data.theme}
	others={data.others}
	onOrderPending={handleOrderPending}
/>

<DrainUpsellModal
	bind:isOpen={showUpsellModal}
	orderDetails={{
		orderId: pendingOrderData?.orderId || '',
		total: pendingOrderData?.selectedTier?.price || 229,
		phone: pendingOrderData?.phone || '',
		name: pendingOrderData?.fullName || ''
	}}
	onAcceptUpsell={handleAcceptUpsell}
	onDeclineUpsell={handleDeclineUpsell}
/>
