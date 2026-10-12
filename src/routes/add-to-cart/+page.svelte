<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fbqTrack } from '$lib/tracking/pixel.js';

	onMount(() => {
		// Fire Meta Pixel AddToCart event immediately on page load
		if (typeof window !== 'undefined' && window.fbq) {
			window.fbq('track', 'AddToCart', {
				content_name: 'NOVAVITA Gummies Bundle',
				currency: 'MAD',
				value: 249
			});
		} else {
			fbqTrack('AddToCart', {
				content_name: 'NOVAVITA Gummies Bundle',
				currency: 'MAD',
				value: 249
			});
		}

		const params = new URLSearchParams(window.location.search);
		const product = params.get('product') || 'gummies_collagen';

		// Redirect customer strictly to /cart without pushing back to /products/
		goto(`/cart?product=${product}`, { replaceState: true });
	});
</script>

<div class="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4" dir="rtl">
	<div class="w-10 h-10 border-4 border-[#0B3B24] border-t-transparent rounded-full animate-spin mb-4"></div>
	<p class="text-sm font-bold text-[#0B3B24]">جاري تحويلك لسلة الطلب وتطبيق الخصم...</p>
</div>
