<script lang="ts">
	import StackedTemplate from '$lib/components/templates/stacked/Template.svelte';

	let { data } = $props();

	const seo = $derived(
		data.product?.published?.seo || {
			metaTitle:
				'باك الحمام الذكي: تنظيم شامل بدون حفير + رشاش زيادة ضغط المياه فابور! | Lhamza Shop',
			metaDescription:
				'وداعاً لتضييع لافايونس بالمسامير وفوضى القراعي.. رتّبي دوشك فـ 5 دقايق بأناقة وثبات دائم، وخلّصي بعد المعاينة. توصيل فابور لجميع المدن.',
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
