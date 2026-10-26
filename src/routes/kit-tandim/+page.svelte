<script lang="ts">
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';

	let { data } = $props();

	const HERO_IMAGE_URL =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1793011034/Gemini_Generated_Image_ybqshcybqshcybqs.jpg';

	const seo = $derived(
		data.product?.published?.seo || {
			metaTitle: 'باك الحمام الذكي (بدون حفير) + رشاش زيادة الضغط هدية فابور | Lhamza Shop',
			metaDescription:
				'باك الحمام الذكي بدون حفير + رشاش زيادة الضغط هدية فابور. توصيل فابور لجميع المدن والدفع بعد المعاينة.',
			noindex: false
		}
	);
</script>

<svelte:head>
	<title>{seo.metaTitle}</title>
	<meta name="description" content={seo.metaDescription} />
	<meta property="og:image" content={HERO_IMAGE_URL} />
	<link rel="preload" as="image" href={HERO_IMAGE_URL} fetchpriority="high" />
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
