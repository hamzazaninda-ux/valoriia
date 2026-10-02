<script lang="ts">
	import { cart, cartUi } from '$lib/stores/cart.svelte';

	export interface CrossSell {
		slug: string;
		title: string;
		subtitle?: string;
		heroImage?: string;
		startingPrice?: number;
	}

	export interface DrawerOffer {
		id: number;
		title: string;
		subtitle?: string;
		price: number;
		originalPrice?: number;
		badge?: string | null;
		image?: string;
	}

	let {
		others = [],
		currency = 'درهم',
		salesText = '',
		offers = [],
		currentSlug = '',
		currentTitle = '',
		currentImage = ''
	}: {
		others?: CrossSell[];
		currency?: string;
		salesText?: string;
		offers?: DrawerOffer[];
		currentSlug?: string;
		currentTitle?: string;
		currentImage?: string;
	} = $props();

	const crossSells = $derived(
		others.filter((p) => !cart.lines.some((l) => l.slug === p.slug)).slice(0, 3)
	);

	const moreOffers = $derived(
		(offers || []).filter(
			(o) => currentSlug && !cart.lines.some((l) => l.slug === currentSlug && l.offerId === o.id)
		)
	);

	function addCrossSell(p: CrossSell) {
		cart.add({
			slug: p.slug,
			title: p.title,
			image: p.heroImage || '',
			price: p.startingPrice || 0,
			offerId: 0,
			offerTitle: 'العرض الأساسي'
		});
	}

	function addOffer(o: DrawerOffer) {
		cart.add({
			slug: currentSlug,
			title: currentTitle,
			image: currentImage,
			price: o.price,
			offerId: o.id,
			offerTitle: o.title
		});
	}
</script>

{#if cartUi.drawer}
	<div class="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="سلة التسوق">
		<button
			type="button"
			class="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
			onclick={() => cartUi.closeDrawer()}
			aria-label="سد السلة"
		></button>
		<aside class="absolute bottom-0 left-0 top-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl" dir="rtl">
			<div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
				<h2 class="font-display text-lg font-bold text-neutral-900">السلة ({cart.count})</h2>
				<button
					type="button"
					onclick={() => cartUi.closeDrawer()}
					class="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100"
					aria-label="سد السلة"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if cart.count === 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
					<svg viewBox="0 0 120 100" class="h-20 w-auto text-neutral-200" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
						<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
					</svg>
					<p class="font-bold text-neutral-700">السلة خاوية</p>
					<p class="text-sm text-neutral-400">المنتجات اللي تزيدها غتبان هنا</p>
				</div>
			{:else}
				<div class="flex-1 space-y-3 overflow-y-auto p-4">
					{#each cart.lines as line (line.key)}
						<div class="flex items-center gap-3 rounded-2xl border border-neutral-200/60 p-3">
							<span class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
								{#if line.image}
									<img src={line.image} alt={line.title} class="h-full w-full object-cover" />
								{:else}
									<svg class="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
										<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
									</svg>
								{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-bold text-neutral-800">{line.title}</span>
								{#if line.offerTitle}
									<span class="block truncate text-[11px] text-neutral-400">{line.offerTitle}</span>
								{/if}
								<span class="mt-0.5 block text-xs font-black text-emerald-700">{line.price} {currency}</span>
							</span>
							<span class="flex items-center gap-1">
								<button type="button" onclick={() => cart.setQty(line.key, line.qty - 1)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-lg text-neutral-600 active:scale-95" aria-label="نقص الكمية">−</button>
								<span class="w-5 text-center text-sm font-bold">{line.qty}</span>
								<button type="button" onclick={() => cart.setQty(line.key, line.qty + 1)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-lg text-neutral-600 active:scale-95" aria-label="زيد الكمية">+</button>
							</span>
						</div>
					{/each}

					{#if moreOffers.length > 0}
						<div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
							<p class="px-1 pb-2 text-sm font-extrabold text-neutral-800">
								زيد عرض آخر بنفس التوصيل
							</p>
							<div class="space-y-2">
								{#each moreOffers as o}
									<div class="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-white p-2.5">
										<span class="min-w-0 flex-1 text-right">
											<span class="block truncate text-[13px] font-extrabold text-neutral-800">{o.title}</span>
											<span class="mt-0.5 block text-xs font-black text-emerald-700">{o.price} {currency}</span>
										</span>
										<button
											type="button"
											onclick={() => addOffer(o)}
											class="inline-flex min-h-10 shrink-0 items-center rounded-xl bg-emerald-950 px-3.5 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95"
										>
											+ أضف
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if crossSells.length > 0}
						<div class="pt-1">
							<p class="px-1 pb-2 text-sm font-extrabold text-neutral-800">
								كمّل طلبك بهاد المنتجات
							</p>
							<div class="space-y-2">
								{#each crossSells as p}
									<div class="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-600/30 bg-emerald-50/40 p-2.5">
										<span class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
											{#if p.heroImage}
												<img src={p.heroImage} alt={p.title} class="h-full w-full object-cover" loading="lazy" />
											{:else}
												<svg class="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
													<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
												</svg>
											{/if}
										</span>
										<span class="min-w-0 flex-1">
											<span class="block truncate text-[13px] font-extrabold text-neutral-800">{p.title}</span>
											<span class="block text-xs font-black text-emerald-700">{p.startingPrice || 0} {currency}</span>
										</span>
										<button
											type="button"
											onclick={() => addCrossSell(p)}
											class="inline-flex min-h-10 shrink-0 items-center rounded-xl bg-emerald-950 px-3.5 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95"
										>
											+ زيد
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="space-y-2.5 border-t border-neutral-100 p-4">
					<div class="flex items-center justify-between text-sm text-neutral-500">
						<span>التوصيل</span>
						<span class="font-bold text-emerald-600">مجاني</span>
					</div>
					<div class="flex items-center justify-between text-base font-black text-neutral-900">
						<span>المجموع</span>
						<span>{cart.subtotal} {currency}</span>
					</div>
					{#if salesText}
						<p class="text-center text-[11px] font-bold text-amber-600">{salesText}</p>
					{/if}
					<button
						type="button"
						onclick={() => cartUi.openCheckout()}
						class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-950 font-bold text-white shadow transition-all hover:bg-emerald-900 active:scale-[0.98]"
					>
						أكمل الطلب ({cart.count})
					</button>
					<p class="text-center text-[11px] text-neutral-400">الدفع عند الاستلام — ما تخلص حتى توصلك السلعة</p>
				</div>
			{/if}
		</aside>
	</div>
{/if}
