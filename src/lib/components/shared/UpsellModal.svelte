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

	let left = $state(seconds);
	let accepting = $state<string | null>(null);
	let done = $state(false);
	let expired = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function priceOf(p: UpsellProduct) {
		return dealPrices[p.slug] ?? p.startingPrice ?? 0;
	}
	function hasDeal(p: UpsellProduct) {
		return dealPrices[p.slug] !== undefined && (p.startingPrice || 0) > dealPrices[p.slug];
	}

	function finish() {
		if (done) return;
		done = true;
		cartUi.endUpsell();
		onFinish();
	}

	function accept(p: UpsellProduct) {
		if (accepting || done) return;
		accepting = p.slug;
		const payload = buildOrderPayload(
			{ fullName: order.fullName, phoneNumber: order.phoneNumber },
			[
				{
					key: `${p.slug}#0`,
					slug: p.slug,
					title: p.title,
					image: p.heroImage || '',
					price: priceOf(p),
					offerId: 0,
					offerTitle: 'عرض ما بعد الطلب',
					qty: 1
				}
			],
			{
				productTitle: p.title,
				sku,
				currency,
				pageUrl: typeof window !== 'undefined' ? window.location.href : ''
			},
			'upsell',
			order.orderId
		);
		trackPurchase(payload.price as number, p.title);
		sendOrder(payload as Record<string, unknown>, sheetsUrl).then(() => {
			localStorage.setItem('latestUpsell', JSON.stringify(payload));
			finish();
		});
	}

	// Start (and reset) the countdown only while the upsell is the active
	// surface. A page-load timer would already be expired by the time the
	// customer reaches this step.
	$effect(() => {
		if (cartUi.upsell) {
			left = seconds;
			expired = false;
			stopTimer();
			timer = setInterval(() => {
				left -= 1;
				if (left <= 0) {
					stopTimer();
					left = 0;
					expired = true;
				}
			}, 1000);
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

			<div class="max-h-[46dvh] space-y-2 overflow-y-auto p-3">
				{#if products.length === 0}
					<p class="py-4 text-center text-sm text-neutral-500">شكراً على طلبك! غادي نعيطو ليك للتأكيد.</p>
				{/if}
				{#each products.slice(0, 3) as p}
					<div class="flex items-center gap-2.5 rounded-xl border border-neutral-200/70 p-2.5">
						<span class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50">
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
							class="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-emerald-950 px-4 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
						>
							{#if accepting === p.slug}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							{:else}
								<span>+ زيد للطلب</span>
							{/if}
						</button>
					</div>
				{/each}
			</div>

			<div class="border-t border-neutral-100 p-3">
				{#if expired}
					<button
						type="button"
						onclick={finish}
						class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-950 font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
					>
						انتهى وقت العرض — أكمل لصفحة الشكر
					</button>
				{:else}
					<button
						type="button"
						onclick={finish}
						class="w-full py-2.5 text-center text-sm font-bold text-neutral-400 underline underline-offset-4 transition-colors hover:text-neutral-600"
					>
						لا شكراً، كمل لصفحة الشكر
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
