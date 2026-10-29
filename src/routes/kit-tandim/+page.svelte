<script lang="ts">
	import { onMount } from 'svelte';
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';
	import DrainUpsellModal from '$lib/components/DrainUpsellModal.svelte';
	import { cloudinaryUrl, cloudinarySrcset } from '$lib/utils/images';

	let { data } = $props();

	let showUpsellModal = $state(false);
	let currentOrderId = $state('');
	let customerPhoneFormatted = $state('');
	let customerNameFormatted = $state('');
	let baseOrderPrice = $state(229);

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

	// Triggered upon successful base order registration
	function handleOrderRegistered(orderInfo: {
		orderId: string;
		baseOrderPrice: number;
		phone: string;
		name: string;
	}) {
		currentOrderId = orderInfo.orderId || String(Date.now());
		baseOrderPrice = Number(orderInfo.baseOrderPrice || 229);
		customerPhoneFormatted = orderInfo.phone || '';
		customerNameFormatted = orderInfo.name || '';
		showUpsellModal = true;
	}

	// Upsell Accepted (+29 MAD)
	async function handleAcceptUpsell() {
		try {
			await fetch('/api/order/upsell', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: currentOrderId,
					upsellItem: 'سدادة وفلتر مصرف الأرضية الذكية',
					upsellPrice: 29,
					totalAmount: baseOrderPrice + 29
				})
			});
		} catch (e) {
			console.warn('Upsell API sync failed, continuing flow:', e);
		}

		if (typeof window !== 'undefined') {
			try {
				const stored = JSON.parse(localStorage.getItem('latestOrder') || '{}');
				stored.hasUpsell = true;
				stored.upsellPrice = 29;
				stored.price = baseOrderPrice + 29;
				stored.total = baseOrderPrice + 29;
				stored.upsellItem = 'سدادة وفلتر مصرف الأرضية الذكية';
				localStorage.setItem('latestOrder', JSON.stringify(stored));
				sessionStorage.setItem('latestOrder', JSON.stringify(stored));
			} catch (e) {}
		}

		// Fire purchase pixel with total amount
		firePurchasePixels(baseOrderPrice + 29, currentOrderId);
		await new Promise((resolve) => setTimeout(resolve, 350));
		window.location.href = `/thank-you?orderId=${encodeURIComponent(currentOrderId)}&upsell=1&total=${baseOrderPrice + 29}&name=${encodeURIComponent(customerNameFormatted)}&phone=${encodeURIComponent(customerPhoneFormatted)}`;
	}

	// Upsell Declined (Base Order Only)
	async function handleDeclineUpsell() {
		showUpsellModal = false;
		firePurchasePixels(baseOrderPrice, currentOrderId);
		await new Promise((resolve) => setTimeout(resolve, 350));
		window.location.href = `/thank-you?orderId=${encodeURIComponent(currentOrderId)}&total=${baseOrderPrice}&name=${encodeURIComponent(customerNameFormatted)}&phone=${encodeURIComponent(customerPhoneFormatted)}`;
	}

	function firePurchasePixels(finalAmount: number, orderId: string) {
		try {
			if (typeof window !== 'undefined' && (window as any).ttq) {
				(window as any).ttq.track('CompletePayment', {
					content_id: 'kit-tandim',
					value: finalAmount,
					currency: 'MAD'
				});
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

	const HERO_IMAGE_URL = 'https://res.cloudinary.com/xqjngk8y/image/upload/v1793292638/Gemini_Generated_Image_ro2ak2ro2ak2ro2a.jpg';

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
	onOrderRegistered={handleOrderRegistered}
/>

<DrainUpsellModal
	bind:isOpen={showUpsellModal}
	orderDetails={{
		orderId: currentOrderId,
		total: baseOrderPrice,
		phone: customerPhoneFormatted,
		name: customerNameFormatted
	}}
	onAcceptUpsell={handleAcceptUpsell}
	onDeclineUpsell={handleDeclineUpsell}
/>
