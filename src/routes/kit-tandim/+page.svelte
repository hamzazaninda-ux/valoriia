<script lang="ts">
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';

	let { data } = $props();

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
