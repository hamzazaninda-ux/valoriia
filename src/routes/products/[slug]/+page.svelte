<script lang="ts">
	import ProductDetailPage from '$lib/components/product/ProductDetailPage.svelte';
	let { data } = $props();
</script>

<ProductDetailPage {data} />
