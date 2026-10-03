<script lang="ts">
	import { cartUi, type CompletedOrder } from '$lib/stores/cart.svelte';
	import { buildOrderPayload, sendOrder, trackPurchase } from '$lib/utils/checkout';

	export interface UpsellProduct {
		slug: string;
		title: string;
		heroImage?: string;
		startingPrice?: number;
	}

	let {
		order,
		products = [],
		currency = 'درهم',
		sheetsUrl = '',
		sku = 'SKU-GENERAL',
		dealPrices = {},
		seconds = 15,
		onFinish
	}: {
		order: CompletedOrder;
		products?: UpsellProduct[];
		currency?: string;
		sheetsUrl?: string;
		sku?: string;
		dealPrices?: Record<string, number>;
		seconds?: number;
		onFinish: () => void;
	} = $props();

	// Canonical definition of Broom/Mop Wall Holder (UPSELL #1)
	const mopHolderProduct: UpsellProduct = {
		slug: 'hamil-jidari-makanis',
		title: 'حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات',
		heroImage: '', // DO NOT add any image yet
		startingPrice: 99
	};

	// Canonical definition of Child Safety Lock product (UPSELL #2)
	const childLockProduct: UpsellProduct = {
		slug: 'qofl-al-aman',
		title: 'قفل الأمان للأطفال',
		heroImage: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp',
		startingPrice: 50
	};

	// Active upsell list contains EXACTLY TWO products:
	// 1. UPSELL #1: حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات — 99 DH
	// 2. UPSELL #2: قفل الأمان للأطفال — 50 DH
	const activeProducts = $derived.by(() => {
		const foundMop = products.find(
			(p) => p.slug === 'hamil-jidari-makanis' || p.title.includes('حامل') || p.title.includes('مكانس')
		);
		const foundLock = products.find(
			(p) => p.slug === 'qofl-al-aman' || p.title.includes('قفل')
		);

		return [
			{
				...mopHolderProduct,
				...(foundMop || {}),
				title: 'حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات',
				startingPrice: 99,
				heroImage: '' // MUST remain empty per instructions
			},
			{
				...childLockProduct,
				...(foundLock || {}),
				title: 'قفل الأمان للأطفال',
				startingPrice: 50,
				heroImage: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp'
			}
		];
	});

	let currentStep = $state(0);
	let left = $state(seconds);
	let accepting = $state<string | null>(null);
	let done = $state(false);
	let expired = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	const currentProduct = $derived(activeProducts[currentStep] || null);

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
		if (p.slug === 'qofl-al-aman' || p.title.includes('قفل')) return 50;
		return dealPrices[p.slug] ?? p.startingPrice ?? 0;
	}

	function hasDeal(p: UpsellProduct) {
		if (p.slug === 'hamil-jidari-makanis' || p.title.includes('حامل') || p.title.includes('مكانس')) return (p.startingPrice || 0) > 99;
		if (p.slug === 'qofl-al-aman' || p.title.includes('قفل')) return (p.startingPrice || 0) > 50;
		return dealPrices[p.slug] !== undefined && (p.startingPrice || 0) > dealPrices[p.slug];
	}

	function finish() {
		if (done) return;
		done = true;
		stopTimer();
		cartUi.endUpsell();
		onFinish();
	}

	function nextStep() {
		if (currentStep + 1 < activeProducts.length) {
			currentStep += 1;
			resetStepTimer();
		} else {
			finish();
		}
	}

	function skip() {
		if (accepting || done) return;
		nextStep();
	}

	function accept(p: UpsellProduct) {
		if (accepting || done) return;
		accepting = p.slug;
		const finalPrice = priceOf(p);
		const finalImage = p.slug === 'hamil-jidari-makanis' || p.title.includes('حامل') || p.title.includes('مكانس')
			? ''
			: p.heroImage || (p.slug === 'qofl-al-aman' || p.title.includes('قفل') ? 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp' : '');
		const finalSku = p.slug === 'hamil-jidari-makanis' ? 'hamil-jidari-makanis' : p.slug === 'qofl-al-aman' ? 'child-safety-lock' : sku;
		const payload = buildOrderPayload(
			{ fullName: order.fullName, phoneNumber: order.phoneNumber },
			[
				{
					key: `${p.slug}#${currentStep}`,
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
		trackPurchase(finalPrice, p.title);
		sendOrder(payload as Record<string, unknown>, sheetsUrl)
			.then(() => {
				try {
					localStorage.setItem('latestUpsell', JSON.stringify(payload));
				} catch {}
			})
			.finally(() => {
				accepting = null;
				nextStep();
			});
	}

	$effect(() => {
		if (cartUi.upsell) {
			currentStep = 0;
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
	<div class="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="عرض خاص بعد الطلب">
		<div class="absolute inset-0 bg-black/65 backdrop-blur-[2px]"></div>
		<div class="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" dir="rtl">
			<div class="bg-gradient-to-l from-amber-500 to-orange-500 px-5 py-3.5 text-center text-white">
				<p class="text-sm font-black">عرض خاص غير لهاد الطلب!</p>
				<p class="mt-0.5 text-[11px] font-semibold text-white/85">زيد منتج آخر بنفس التوصيل — بلا مصاريف زيادة</p>
				<div class="mx-auto mt-2.5 h-2 max-w-[220px] overflow-hidden rounded-full bg-white/30">
					<div
						class="h-full rounded-full bg-white transition-[width] duration-1000 ease-linear"
						style={`width: ${(left / seconds) * 100}%`}
					></div>
				</div>
				<p class="mt-1 font-display text-2xl font-black tabular-nums" aria-live="polite">0:{String(Math.max(left, 0)).padStart(2, '0')}</p>
			</div>

			<div class="p-4">
				{#if !currentProduct}
					<p class="py-4 text-center text-sm text-neutral-500">شكراً على طلبك! غادي نعيطو ليك للتأكيد.</p>
				{:else}
					{@const p = currentProduct}
					<div class="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3">
						<span class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50">
							{#if p.heroImage}
								<img src={p.heroImage} alt={p.title} class="h-full w-full object-cover" loading="lazy" />
							{:else}
								<svg class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
								</svg>
							{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-extrabold text-neutral-800">{p.title}</span>
							<span class="mt-0.5 flex items-baseline gap-1.5">
								<span class="text-base font-black text-emerald-700">{priceOf(p)} {currency}</span>
								{#if hasDeal(p)}
									<span class="text-[11px] text-neutral-400 line-through">{p.startingPrice} {currency}</span>
								{/if}
							</span>
						</span>
						<button
							type="button"
							disabled={accepting !== null}
							onclick={() => accept(p)}
							class="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-emerald-950 px-4 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60 cursor-pointer"
						>
							{#if accepting === p.slug}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							{:else}
								<span>+ زيد للطلب</span>
							{/if}
						</button>
					</div>
				{/if}
			</div>

			<div class="border-t border-neutral-100 p-3">
				{#if expired}
					<button
						type="button"
						onclick={skip}
						class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-950 font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
					>
						{currentStep < activeProducts.length - 1 ? 'انتهى وقت العرض — العرض الموالي' : 'انتهى وقت العرض — أكمل لصفحة الشكر'}
					</button>
				{:else}
					<button
						type="button"
						onclick={skip}
						class="w-full py-2.5 text-center text-sm font-bold text-neutral-400 underline underline-offset-4 transition-colors hover:text-neutral-600 cursor-pointer"
					>
						{currentStep < activeProducts.length - 1 ? 'لا شكراً، تخطي للعرض الموالي' : 'لا شكراً، كمل لصفحة الشكر'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
