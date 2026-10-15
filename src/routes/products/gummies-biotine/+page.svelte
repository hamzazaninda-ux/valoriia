<script lang="ts">
	import ProductDetailPage from '$lib/components/product/ProductDetailPage.svelte';
	import { PRODUCTS, getProductBySlug } from '$lib/data/products';

	let { data } = $props();

	const defaultBiotineProduct = PRODUCTS.find((p) => p.sku === 'gummies_biotine') || PRODUCTS[1] || PRODUCTS[0];
	const defaultBrand = {
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000'
	};

	const safeData = $derived({
		product: data?.product || defaultBiotineProduct,
		brand: data?.brand || defaultBrand
	});
</script>

<ProductDetailPage data={safeData} />
