<script lang="ts">
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';
	import { cloudinaryUrl, cloudinarySrcset } from '$lib/utils/images';

	let { data } = $props();

	const HERO_IMAGE_URL =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1793014131/Smart_Bathroom_Organizer_Gift_Set.png';

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
