<script lang="ts">
	import { cartUi, type CompletedOrder } from '$lib/stores/cart.svelte';
	import { buildOrderPayload, sendOrder, trackPurchase } from '$lib/utils/checkout';

	export interface UpsellProduct {
		slug: string;
		title: string;
		description?: string;
		heroImage?: string;
		startingPrice?: number;
	}

	export const POST_ORDER_UPSELL_IMAGE =
		'https://res.cloudinary.com/xqjngk8y/image/upload/v1791059605/%D9%85%D9%86%D8%B8%D9%91%D9%85_%D8%A3%D8%AF%D9%88%D8%A7%D8%AA_%D8%A7%D9%84%D8%AA%D9%86%D8%B8%D9%8A%D9%81_%D8%A8%D9%8079_%D8%AF%D8%B1%D9%87%D9%85.png';

	let {
		order,
		products = [],
		currency = 'درهم',
		sheetsUrl = '',
		sku = 'SKU-GENERAL',
		dealPrices = {},
		seconds = 15,
		postOrderImage = '',
		onFinish
	}: {
		order: CompletedOrder;
		products?: UpsellProduct[];
		currency?: string;
		sheetsUrl?: string;
		sku?: string;
		dealPrices?: Record<string, number>;
		seconds?: number;
		postOrderImage?: string;
		onFinish: () => void;
	} = $props();

	// Canonical definition of Broom/Mop Wall Holder (The ONLY post-order upsell product)
	const mopHolderProduct: UpsellProduct = {
		slug: 'hamil-jidari-makanis',
		title: 'حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات',
		heroImage: POST_ORDER_UPSELL_IMAGE,
		startingPrice: 99
	};

	// Active upsell list contains EXACTLY ONE single product:
	// UPSELL: حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات — 99 DH
	const activeProducts = $derived.by(() => {
		const foundMop = products.find(
			(p) => p.slug === 'hamil-jidari-makanis' || p.title.includes('حامل') || p.title.includes('مكانس')
		);

		return [
			{
				...mopHolderProduct,
				...(foundMop || {}),
				title: 'حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات',
				startingPrice: 99,
				heroImage: postOrderImage || foundMop?.heroImage || POST_ORDER_UPSELL_IMAGE
			}
		];
	});

	let left = $state(seconds);
	let accepting = $state<string | null>(null);
	let done = $state(false);
	let expired = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	const currentProduct = $derived(activeProducts[0] || null);

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function resetStepTimer() {
		stopTimer();
		left = seconds;
		expired = false;
		timer = setInterval(() => {
			left -= 1;
			if (left <= 0) {
				stopTimer();
				left = 0;
				expired = true;
			}
		}, 1000);
	}

	function priceOf(p: UpsellProduct) {
		if (p.slug === 'hamil-jidari-makanis' || p.title.includes('حامل') || p.title.includes('مكانس')) return 99;
		return dealPrices[p.slug] ?? p.startingPrice ?? 99;
	}

	function finish() {
		if (done) return;
		done = true;
		stopTimer();
		cartUi.endUpsell();
		cartUi.resetAll();
		onFinish();
	}

	function skip() {
		if (accepting || done) return;
		finish();
	}

	function accept(p: UpsellProduct) {
		if (accepting || done) return;
		accepting = p.slug;
		const finalPrice = priceOf(p);
		const finalImage = postOrderImage || p.heroImage || POST_ORDER_UPSELL_IMAGE;
		const finalSku = p.slug === 'hamil-jidari-makanis' ? 'hamil-jidari-makanis' : sku;
		const payload = buildOrderPayload(
			{ fullName: order.fullName, phoneNumber: order.phoneNumber },
			[
				{
					key: `${p.slug}#0`,
					slug: p.slug,
					title: p.title,
					image: finalImage,
					price: finalPrice,
					offerId: 0,
					offerTitle: 'عرض ما بعد الطلب',
					qty: 1
				}
			],
			{
				productTitle: p.title,
				sku: finalSku,
				currency,
				pageUrl: typeof window !== 'undefined' ? window.location.href : ''
			},
			'upsell',
			order.orderId
		);
		trackPurchase(finalPrice, p.title, `${order.orderId}-U1`);
		sendOrder(payload as Record<string, unknown>, sheetsUrl)
			.then(() => {
				try {
					localStorage.setItem('latestUpsell', JSON.stringify(payload));
				} catch {}
			})
			.finally(() => {
				accepting = null;
				finish();
			});
	}

	$effect(() => {
		if (cartUi.upsell) {
			done = false;
			accepting = null;
			resetStepTimer();
		} else {
			stopTimer();
		}
		return () => {
			stopTimer();
		};
	});
</script>

{#if cartUi.upsell}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
		role="dialog"
		aria-modal="true"
		aria-label="عرض خاص بعد الطلب"
	>
		<div class="fixed inset-0 bg-black/70 backdrop-blur-[2px]"></div>

		<div
			class="relative w-full max-w-sm sm:max-w-md my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-100"
			dir="rtl"
		>
			<!-- 1. Header: OFFER TITLE + SHORT SUBTITLE + COUNTDOWN (UNTOUCHED) -->
			<div class="bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 px-5 py-4 text-center text-white">
				<h3 class="text-base sm:text-lg font-black tracking-tight">عرض خاص غير لهاد الطلب!</h3>
				<p class="mt-0.5 text-xs font-semibold text-white/90">زيد منتج آخر بنفس التوصيل — بلا مصاريف زيادة</p>

				<!-- COUNTDOWN TIMER -->
				<div class="mt-2.5 flex flex-col items-center justify-center gap-1">
					<div class="h-2 w-44 max-w-[200px] overflow-hidden rounded-full bg-white/30">
						<div
							class="h-full rounded-full bg-white transition-[width] duration-1000 ease-linear"
							style={`width: ${(left / seconds) * 100}%`}
						></div>
					</div>
					<div class="flex items-center justify-center gap-1.5 font-display text-2xl font-black tabular-nums tracking-wide text-white" aria-live="polite">
						<svg class="h-4.5 w-4.5 text-white/90 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>0:{String(Math.max(left, 0)).padStart(2, '0')}</span>
					</div>
				</div>
			</div>

			<!-- 2. Middle: Large 1:1 Square Product Image taking full width -->
			{#if !currentProduct}
				<div class="p-6 text-center text-sm font-bold text-neutral-500">
					شكراً على طلبك! غادي نعيطو ليك للتأكيد.
				</div>
			{:else}
				{@const p = currentProduct}

				<!-- [ 1:1 IMAGE SLOT ] — Full width of card, true square, no extra padding, always visible -->
				<div class="relative w-full aspect-square bg-white overflow-hidden flex items-center justify-center">
					<img
						src={p.heroImage || POST_ORDER_UPSELL_IMAGE}
						alt={p.title || 'عرض خاص بعد الطلب'}
						class="w-full h-full aspect-square object-cover"
						loading="eager"
						onerror={(e) => {
							(e.currentTarget as HTMLImageElement).src = POST_ORDER_UPSELL_IMAGE;
						}}
					/>
				</div>

				<!-- 3. Bottom: Decision buttons only (Single Offer: Direct to thank-you) -->
				<div class="p-4 sm:p-5 space-y-2">
					<button
						type="button"
						disabled={accepting !== null}
						onclick={() => accept(p)}
						class="w-full min-h-12 py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
					>
						{#if accepting === p.slug}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							<span>جاري الإضافة...</span>
						{:else}
							<span>+ زيد للطلب</span>
						{/if}
					</button>

					{#if expired}
						<button
							type="button"
							onclick={skip}
							class="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
						>
							انتهى وقت العرض — متابعة لصفحة الشكر
						</button>
					{:else}
						<button
							type="button"
							onclick={skip}
							class="w-full py-1.5 text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
						>
							لا شكراً، متابعة لصفحة الشكر
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
