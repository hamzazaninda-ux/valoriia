<script lang="ts">
	import { onMount } from 'svelte';
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';
	import { cloudinaryUrl, cloudinarySrcset } from '$lib/utils/images';

	let { data } = $props();

	onMount(() => {
		if (typeof window !== 'undefined') {
			const fireViewContent = () => {
				if ((window as any).ttq && typeof (window as any).ttq.track === 'function') {
					(window as any).ttq.track('ViewContent', {
						content_id: 'kit-tandim',
						content_type: 'product',
						content_name: 'منظم الحمام الزاوي 4 رفوف',
						quantity: 1,
						price: 279,
						value: 279,
						currency: 'MAD'
					});
					console.log('TikTok Event Fired: ViewContent', {
						content_id: 'kit-tandim',
						content_name: 'منظم الحمام الزاوي 4 رفوف',
						value: 279,
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

	const HERO_IMAGE_URL = 'https://res.cloudinary.com/xqjngk8y/image/upload/ar_3:4,c_pad,b_auto/v1793014131/Smart_Bathroom_Organizer_Gift_Set.png';

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
/>
