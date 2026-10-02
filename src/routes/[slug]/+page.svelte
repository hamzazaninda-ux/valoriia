<script lang="ts">
	import { loadTemplateComponentSync } from '$lib/content/templateLoader';

	let { data } = $props();

	const Template = $derived(loadTemplateComponentSync(data.product.template));
</script>

<svelte:head>
	<title>{data.product.published.seo.metaTitle}</title>
	<meta name="description" content={data.product.published.seo.metaDescription} />
	{#if data.product.published.seo.noindex}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<Template product={data.product} settings={data.settings} theme={data.theme} others={data.others} />
