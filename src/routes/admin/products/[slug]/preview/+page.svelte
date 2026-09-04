<script lang="ts">
	import { loadTemplateComponentSync } from '$lib/content/templateLoader';

	let { data } = $props();

	const Template = $derived(loadTemplateComponentSync(data.product.template));
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Preview: {data.product.published.content.title || 'Product'} - Admin</title>
</svelte:head>

<div class="preview-banner">
	<div class="preview-banner-content">
		<span class="preview-badge">Preview Mode</span>
		{#if data.isDraft}
			<span class="preview-info">Viewing draft changes</span>
		{:else}
			<span class="preview-info">Viewing published version</span>
		{/if}
		<a href="/admin/products/{data.product.slug}/edit" class="preview-back-link">
			← Back to Editor
		</a>
	</div>
</div>

<div class="preview-container">
	<Template product={data.product} settings={data.settings} theme={data.theme} />
</div>

<style>
	.preview-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		background: linear-gradient(135deg, #059669, #10b981);
		color: white;
		padding: 8px 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.preview-banner-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 14px;
	}

	.preview-badge {
		background: rgba(255, 255, 255, 0.25);
		padding: 2px 10px;
		border-radius: 12px;
		font-weight: 600;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.preview-info {
		opacity: 0.9;
	}

	.preview-back-link {
		margin-left: auto;
		color: white;
		text-decoration: none;
		font-weight: 500;
		padding: 4px 12px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.15);
		transition: background 0.2s;
	}

	.preview-back-link:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.preview-container {
		padding-top: 52px;
	}
</style>
