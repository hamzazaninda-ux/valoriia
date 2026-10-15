<script lang="ts">
	import ProductDetailPage from '$lib/components/product/ProductDetailPage.svelte';
	import { PRODUCTS, getProductBySlug } from '$lib/data/products';

	let { data } = $props();

	const defaultVitaminProduct = PRODUCTS.find((p) => p.sku === 'gumies_vitamine') || PRODUCTS[2] || PRODUCTS[0];
	const defaultBrand = {
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000'
	};

	const safeData = $derived({
		product: data?.product || defaultVitaminProduct,
		brand: data?.brand || defaultBrand
	});
</script>

<ProductDetailPage data={safeData} />
