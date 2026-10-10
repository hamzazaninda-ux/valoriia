<script lang="ts">
	import { FREE_SHIPPING_THRESHOLD } from '$lib/constants/pricing';

	interface CartItem {
		id: string;
		title: string;
		subtitle?: string;
		price: number;
		image?: string;
		quantity: number;
	}

	interface Props {
		open?: boolean;
		items?: Record<string, number>;
		onClose?: () => void;
		onProceedToCheckout?: () => void;
	}

	let {
		open = $bindable(false),
		items = $bindable<Record<string, number>>({}),
		onClose,
		onProceedToCheckout
	}: Props = $props();

	// Complementary Cross-Sell item (e.g. Biotin Boost 119 MAD)
	const crossSellItem = {
		id: 'cross_sell_biotin',
		sku: 'gummies_biotine',
		title: 'علكات البيوتين المركزة (Biotin 5000mcg)',
		originalPrice: 199,
		price: 119,
		savings: 80,
		image: '/images/products/biotin-hero.webp'
	};

	const isCrossSellAdded = $derived(crossSellItem.id in items);

	// Compute subtotal dynamically based on base items (199 MAD each) + cross-sell (119 MAD)
	const subtotal = $derived(
		Object.entries(items).reduce((sum, [key, qty]) => {
			if (key === crossSellItem.id) {
				return sum + crossSellItem.price * qty;
			}
			return sum + 199 * qty;
		}, 0)
	);

	const remainingForFreeShipping = $derived(
		Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
	);

	const progressPercentage = $derived(
		Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
	);

	const totalItemsCount = $derived(
		Object.values(items).reduce((sum, qty) => sum + qty, 0)
	);

	function toggleCrossSell() {
		if (isCrossSellAdded) {
			const { [crossSellItem.id]: _, ...rest } = items;
			items = rest;
		} else {
			items = { ...items, [crossSellItem.id]: 1 };
		}
	}

	function removeItem(key: string) {
		const { [key]: _, ...rest } = items;
		items = rest;
	}

	function handleCheckoutClick() {
		open = false;
		if (onProceedToCheckout) {
			onProceedToCheckout();
		} else {
			const el = document.getElementById('order-section');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[100] overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label="سلة التسوق"
		dir="rtl"
	>
		<!-- Backdrop Overlay -->
		<button
			type="button"
			class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
			onclick={() => {
				open = false;
				onClose?.();
			}}
			aria-label="إغلاق السلة"
		></button>

		<!-- Slide-out Drawer Panel -->
		<div class="fixed inset-y-0 start-0 flex max-w-full">
			<aside class="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-e border-emerald-950/10 transform transition-transform duration-300 ease-out">
				
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-emerald-950/10 bg-white px-5 py-4">
					<div class="flex items-center gap-2">
						<span class="text-xl">🛍️</span>
						<h2 class="font-display text-lg font-black text-[#1B4332]">
							سلة المشتريات ({totalItemsCount})
						</h2>
					</div>
					<button
						type="button"
						onclick={() => {
							open = false;
							onClose?.();
						}}
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 active:scale-95 transition-all text-sm font-bold"
						aria-label="إغلاق"
					>
						✕
					</button>
				</div>

				<!-- Dynamic Free Shipping Progress Bar -->
				<div class="bg-white border-b border-emerald-950/10 p-4 space-y-2">
					<div class="flex items-center justify-between text-xs font-bold">
						{#if remainingForFreeShipping === 0}
							<span class="text-emerald-800 flex items-center gap-1">
								<span>🎉</span>
								<span>مبروك! طلبيتك مؤهلة للتوصيل المجاني والسريع</span>
							</span>
							<span class="text-emerald-700 font-extrabold">100%</span>
						{:else}
							<span class="text-stone-700 flex items-center gap-1">
								<span>🚚</span>
								<span>باقي ليك فقط <strong class="text-[#E86A7C] font-black">{remainingForFreeShipping} درهم</strong> باش تستفيدي من التوصيل فابور!</span>
							</span>
							<span class="text-[#E86A7C] font-extrabold">{progressPercentage}%</span>
						{/if}
					</div>

					<div class="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden">
						<div
							class={`h-full rounded-full transition-all duration-500 ${
								remainingForFreeShipping === 0 ? 'bg-[#1B4332]' : 'bg-[#E86A7C]'
							}`}
							style={`width: ${progressPercentage}%`}
						></div>
					</div>
				</div>

				<!-- Items Scrollable Body -->
				<div class="flex-1 overflow-y-auto p-4 space-y-4">
					{#if totalItemsCount === 0}
						<div class="py-16 text-center space-y-3">
							<div class="text-4xl text-stone-300">🛒</div>
							<p class="text-sm font-bold text-stone-500">سلتك فارغة حالياً</p>
							<button
								type="button"
								onclick={() => {
									open = false;
									const el = document.getElementById('bestsellers');
									if (el) el.scrollIntoView({ behavior: 'smooth' });
								}}
								class="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200"
							>
								<span>تصفحي المنتجات</span>
								<span>←</span>
							</button>
						</div>
					{:else}
						<!-- Active Items -->
						<div class="space-y-3">
							{#each Object.entries(items) as [key, qty]}
								<div class="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 border border-emerald-950/10 shadow-2xs">
									<div class="flex items-center gap-3">
										<div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg shrink-0">
											🍓
										</div>
										<div class="flex flex-col text-start">
											<span class="text-xs font-black text-[#1F2937] leading-snug">
												{key === crossSellItem.id ? crossSellItem.title : key}
											</span>
											<span class="text-xs font-extrabold text-[#1B4332] mt-0.5">
												{key === crossSellItem.id ? crossSellItem.price : 199} MAD
											</span>
										</div>
									</div>

									<button
										type="button"
										onclick={() => removeItem(key)}
										class="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
										aria-label="حذف المنتج"
									>
										حذف
									</button>
								</div>
							{/each}
						</div>

						<!-- 1-Click Cross-Sell Card (119 MAD) -->
						<div class="rounded-2xl border-2 border-dashed border-[#E86A7C]/50 bg-rose-50/40 p-4 space-y-3">
							<div class="flex items-center justify-between">
								<span class="inline-flex items-center gap-1 rounded-full bg-[#E86A7C] text-white px-2.5 py-0.5 text-[10px] font-black">
									✨ عرض مكمل خاص
								</span>
								<span class="text-[11px] font-bold text-rose-700">توفير 80 درهم</span>
							</div>

							<div class="flex items-center gap-3">
								<div class="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-xl shrink-0">
									💇‍♀️
								</div>
								<div class="flex-1 text-start">
									<h4 class="text-xs font-black text-[#1F2937]">{crossSellItem.title}</h4>
									<div class="flex items-baseline gap-1.5 mt-0.5">
										<span class="text-xs font-black text-[#1B4332]">{crossSellItem.price} MAD</span>
										<span class="text-[10px] text-stone-400 line-through">{crossSellItem.originalPrice} MAD</span>
									</div>
								</div>
							</div>

							<button
								type="button"
								onclick={toggleCrossSell}
								class={`w-full min-h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
									isCrossSellAdded
										? 'bg-emerald-700 text-white shadow-xs'
										: 'bg-white text-[#1B4332] border border-[#1B4332] hover:bg-emerald-50 active:scale-95'
								}`}
							>
								{#if isCrossSellAdded}
									<span>✓ تمت الإضافة إلى السلة (119 MAD)</span>
								{:else}
									<span>+ أضيفي إلى السلة بـ 119 MAD فقط</span>
								{/if}
							</button>
						</div>
					{/if}
				</div>

				<!-- Footer with Total & Sticky CTA -->
				<div class="border-t border-emerald-950/10 bg-white p-4 sm:p-5 space-y-3">
					<div class="space-y-1.5 text-xs font-bold text-stone-600">
						<div class="flex justify-between">
							<span>المجموع الجزئي:</span>
							<span class="text-[#1F2937]">{subtotal} MAD</span>
						</div>
						<div class="flex justify-between">
							<span>الشحن والتوصيل:</span>
							{#if remainingForFreeShipping === 0}
								<span class="text-emerald-700 font-extrabold">مجاني (فابور) 🚚</span>
							{:else}
								<span class="text-stone-700">29 MAD</span>
							{/if}
						</div>
						<div class="flex justify-between text-sm sm:text-base font-black text-[#1B4332] pt-2 border-t border-stone-100">
							<span>المجموع النهائي:</span>
							<span class="text-lg font-black text-[#1B4332]">
								{subtotal + (remainingForFreeShipping === 0 ? 0 : 29)} MAD
							</span>
						</div>
					</div>

					<button
						type="button"
						onclick={handleCheckoutClick}
						disabled={totalItemsCount === 0}
						class="w-full min-h-13 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base shadow-lg shadow-emerald-950/20 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
					>
						<span>تأكيد الطلب والدفع عند الاستلام 🛍️</span>
						<span>←</span>
					</button>

					<p class="text-[11px] text-center text-stone-400 font-medium">
						🇲🇦 الدفع نقداً بعد استلام ومعاينة طلبيتك بنفسك
					</p>
				</div>

			</aside>
		</div>
	</div>
{/if}
