<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { PRODUCTS } from '$lib/data/products';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Funnel step: 'cart' (View 1) or 'checkout' (View 2)
	let currentStep = $state<'cart' | 'checkout'>('cart');

	// Sync with cartUi.drawer
	$effect(() => {
		if (open !== cartUi.drawer) {
			open = cartUi.drawer;
		}
		if (cartUi.drawer) {
			// Always reset to Step 1 whenever opened
			currentStep = 'cart';
		}
	});

	function handleClose() {
		open = false;
		cartUi.closeDrawer();
		currentStep = 'cart';
		onClose?.();
	}

	// Dynamic calculations
	const subtotal = $derived(cart.subtotal);
	const mainItem = $derived(cart.getMainItem());
	const upsellItems = $derived(cart.getUpsellItems());

	// Filter out main item to show only the other 2 SKUs
	const remainingUpsellProducts = $derived.by(() => {
		const mainSku = mainItem?.sku || '';
		return PRODUCTS.filter((p) => p.sku !== mainSku);
	});

	// COD Form State (View 2)
	let fullName = $state('');
	let phone = $state('');
	let phoneError = $state('');
	let isSubmitting = $state(false);

	function validatePhone(input: string): boolean {
		const cleaned = input.replace(/[\s\-\(\)]/g, '');
		const regex = /^(?:(?:\+?212)|0)[67]\d{8}$/;
		return regex.test(cleaned);
	}

	async function handleOrderSubmit(e: SubmitEvent) {
		e.preventDefault();
		phoneError = '';

		if (!fullName.trim() || fullName.trim().length < 2) {
			phoneError = 'يرجى إدخال اسمك الكامل بشكل صحيح.';
			return;
		}

		if (!validatePhone(phone)) {
			phoneError = 'يرجى كتابة رقم هاتف مغربي صحيح (مثال: 06XXXXXXXX أو 07XXXXXXXX)';
			return;
		}

		if (cart.lines.length === 0) {
			phoneError = 'سلتك فارغة، يرجى اختيار باقة أولاً.';
			return;
		}

		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const orderId = 'NV-' + Math.floor(100000 + Math.random() * 900000);
			const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
			const upsells = cart.getUpsellItems();

			const items = cart.lines.map((l) => ({
				sku: l.sku,
				title: l.title,
				quantity: l.qty || 1,
				unitPrice: l.price,
				price: l.price
			}));

			const orderPayload = {
				orderId,
				fullName: fullName.trim(),
				phone: cleanPhone,
				tier: mainItem?.tier || (cart.count > 1 ? 'tier_2' : 'tier_1'),
				items,
				subtotal,
				shipping: 0,
				total: subtotal,
				hasUpsell: upsells.length > 0,
				createdAt: new Date().toISOString()
			};

			// Save locally for thank-you page & tracking
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('latestOrder', JSON.stringify(orderPayload));
			}
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('latestOrder', JSON.stringify(orderPayload));
			}

			// Resilient dual dispatch
			try {
				await fetch('/api/orders', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(orderPayload),
					keepalive: true
				});
			} catch (postErr) {
				console.warn('Orders API network notice:', postErr);
			}

			// Close drawer & clear cart
			handleClose();
			cart.clear();

			await goto(
				`/thank-you?orderId=${encodeURIComponent(orderId)}&total=${subtotal}&fullName=${encodeURIComponent(fullName.trim())}&phone=${encodeURIComponent(cleanPhone)}&hasUpsell=${upsells.length > 0}`
			);
		} catch (err) {
			console.error('Order submission error:', err);
			phoneError = 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if open || cartUi.drawer}
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
			onclick={handleClose}
			aria-label="إغلاق السلة"
		></button>

		<!-- Slide-out Drawer Panel -->
		<div class="fixed inset-y-0 start-0 flex max-w-full">
			<aside class="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-e border-emerald-950/10 transform transition-transform duration-300 ease-out font-body">

				<!-- ======================================================== -->
				<!-- VIEW 1: سلة التسوق (CART VIEW)                          -->
				<!-- ======================================================== -->
				{#if currentStep === 'cart'}
					
					<!-- 1. Header (سلة التسوق) -->
					<div class="flex items-center justify-between border-b border-stone-200/80 bg-white px-5 py-4 shrink-0">
						<h2 class="font-display text-base sm:text-lg font-black text-[#1B4332]">
							سلة التسوق
						</h2>
						<button
							type="button"
							onclick={handleClose}
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95 transition-all text-sm font-black cursor-pointer"
							aria-label="إغلاق السلة"
						>
							✕
						</button>
					</div>

					<!-- 2. Scrollable Body -->
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						{#if cart.count === 0}
							<!-- Empty State -->
							<div class="py-16 text-center space-y-3">
								<div class="text-5xl text-stone-300">🛒</div>
								<p class="text-sm font-bold text-stone-600">سلتك فارغة حالياً</p>
								<p class="text-xs text-stone-400">اختاري باقتك المناسبة لبدء روتينك الصحي</p>
								<button
									type="button"
									onclick={handleClose}
									class="inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#1B4332] px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer mt-2"
								>
									<span>تصفحي المنتجات</span>
									<span>←</span>
								</button>
							</div>
						{:else}

							<!-- A. Top Card (Selected Product) -->
							{#if mainItem}
								<div class="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3.5 shadow-2xs flex items-center justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="w-14 h-14 rounded-xl bg-white border border-stone-200/80 p-1 shrink-0 flex items-center justify-center">
											<img
												src={mainItem.image}
												alt={mainItem.title}
												class="w-full h-full object-contain"
												onerror={(e: any) => {
													e.currentTarget.onerror = null;
													e.currentTarget.src = '/images/products/gummies_collagen.svg';
												}}
											/>
										</div>
										<div class="flex flex-col text-start min-w-0">
											<h4 class="text-xs sm:text-sm font-black text-[#1F2937] leading-snug line-clamp-2">
												{mainItem.title}
											</h4>
											<div class="font-mono font-black text-sm sm:text-base text-[#1B4332] mt-1" dir="ltr">
												{mainItem.price} MAD
											</div>
										</div>
									</div>

									<button
										type="button"
										onclick={() => cart.remove(mainItem.key)}
										class="shrink-0 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
										aria-label="حذف المنتج من السلة"
									>
										حذف
									</button>
								</div>
							{/if}

							<!-- Added Upsells in Cart (if active) -->
							{#if upsellItems.length > 0}
								<div class="space-y-2">
									{#each upsellItems as up (up.key)}
										<div class="rounded-2xl bg-[#FAF8F5] border border-rose-200/80 p-3 shadow-2xs flex items-center justify-between gap-3">
											<div class="flex items-center gap-2.5 min-w-0">
												<div class="w-11 h-11 rounded-xl bg-white border border-stone-200/80 p-1 shrink-0 flex items-center justify-center">
													<img
														src={up.image}
														alt={up.title}
														class="w-full h-full object-contain"
													/>
												</div>
												<div class="min-w-0">
													<h4 class="text-xs font-bold text-[#1F2937] truncate">{up.title}</h4>
													<div class="flex items-center gap-1.5 mt-0.5">
														<span class="font-mono font-black text-xs text-[#E86A7C]" dir="ltr">99 MAD</span>
														<span class="text-[10px] text-stone-400 line-through" dir="ltr">199 MAD</span>
													</div>
												</div>
											</div>
											<button
												type="button"
												onclick={() => cart.remove(up.key)}
												class="shrink-0 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
											>
												حذف
											</button>
										</div>
									{/each}
								</div>
							{/if}

							<!-- B. Section: أكملي روتينك (Smart 99 MAD Upsells for the remaining 2 SKUs) -->
							{#if remainingUpsellProducts.length > 0}
								<div class="pt-2 space-y-3">
									<div class="flex items-center justify-between border-b border-stone-100 pb-2">
										<h3 class="font-display text-sm font-black text-[#1B4332]">
											أكملي روتينك:
										</h3>
										<span class="text-[10px] font-black text-[#E86A7C] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
											عرض خاص 99 MAD
										</span>
									</div>

									<div class="space-y-2.5">
										{#each remainingUpsellProducts as upProd (upProd.sku)}
											{@const isAdded = cart.isUpsellActive(upProd.sku)}
											<div class={`rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
												isAdded
													? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/20'
													: 'bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs'
											}`}>
												<!-- Product Info -->
												<div class="flex items-center gap-3 min-w-0 flex-1">
													<div class="w-13 h-13 rounded-xl bg-[#FAF8F5] border border-stone-200/80 p-1 shrink-0 flex items-center justify-center">
														<img
															src={upProd.image}
															alt={upProd.name}
															class="w-full h-full object-contain"
															onerror={(e: any) => {
																e.currentTarget.onerror = null;
																e.currentTarget.src = '/images/products/gummies_collagen.svg';
															}}
														/>
													</div>
													<div class="flex-1 min-w-0 text-start">
														<h4 class="text-xs font-bold text-[#1F2937] truncate">
															{upProd.name}
														</h4>
														<p class="text-[10px] text-stone-500 line-clamp-2 leading-tight mt-0.5 font-medium">
															{upProd.headline}
														</p>
														<div class="flex items-center gap-2 mt-1">
															<span class="text-[11px] text-amber-400 tracking-wider">★★★★★</span>
															<div class="flex items-baseline gap-1">
																<span class="text-xs font-black text-[#E86A7C]" dir="ltr">فقط 99 MAD</span>
																<span class="text-[10px] text-stone-400 line-through" dir="ltr">199 MAD</span>
															</div>
														</div>
													</div>
												</div>

												<!-- Emerald Action Button -->
												<button
													type="button"
													onclick={() => cart.toggleUpsell(upProd)}
													class={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
														isAdded
															? 'bg-emerald-700 hover:bg-emerald-800 text-white'
															: 'bg-[#1B4332] hover:bg-[#143427] text-white'
													}`}
												>
													{#if isAdded}
														<span>تمت الإضافة ✓</span>
													{:else}
														<span>أضيفيه</span>
													{/if}
												</button>
											</div>
										{/each}
									</div>
								</div>
							{/if}

						{/if}
					</div>

					<!-- 3. Fixed Bottom Sticky Bar (View 1) -->
					{#if cart.count > 0}
						<div class="border-t border-stone-200/90 bg-white p-4 space-y-3 shadow-lg shrink-0">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-stone-500">المجموع الإجمالي:</span>
								<span class="font-mono font-black text-xl text-[#1B4332]" dir="ltr">
									{subtotal} MAD
								</span>
							</div>

							<div class="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50/80 rounded-lg py-1">
								<span>🚚</span>
								<span>توصيل فابور مجاني لكافة المدن المغربية</span>
							</div>

							<button
								type="button"
								onclick={() => (currentStep = 'checkout')}
								class="w-full min-h-13 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base shadow-xl shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
							>
								<span>اطلبي الآن (الدفع عند الاستلام) ←</span>
							</button>
						</div>
					{/if}

				<!-- ======================================================== -->
				<!-- VIEW 2: إتمام الطلب (CHECKOUT VIEW)                       -->
				<!-- ======================================================== -->
				{:else if currentStep === 'checkout'}

					<!-- 1. Header (إتمام الطلب with Back Button) -->
					<div class="flex items-center justify-between border-b border-stone-200/80 bg-white px-5 py-4 shrink-0">
						<button
							type="button"
							onclick={() => (currentStep = 'cart')}
							class="flex items-center gap-1 text-xs font-black text-[#1B4332] hover:text-emerald-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
							aria-label="الرجوع إلى سلة التسوق"
						>
							<span class="text-sm">→</span>
							<span>السلة</span>
						</button>

						<h2 class="font-display text-base sm:text-lg font-black text-[#1B4332]">
							إتمام الطلب
						</h2>

						<button
							type="button"
							onclick={handleClose}
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95 transition-all text-sm font-black cursor-pointer"
							aria-label="إغلاق"
						>
							✕
						</button>
					</div>

					<!-- 2. Scrollable Body (Summary + COD Form) -->
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						
						<!-- A. Top Order Summary Card (#FAF8F5) -->
						<div class="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-4 space-y-3 shadow-2xs">
							<div class="space-y-1.5 text-xs font-bold">
								{#if mainItem}
									<div class="flex justify-between items-center text-[#1F2937]">
										<span class="truncate">{mainItem.title}</span>
										<span class="font-mono shrink-0" dir="ltr">{mainItem.price} MAD</span>
									</div>
								{/if}
								{#each upsellItems as up}
									<div class="flex justify-between items-center text-rose-800">
										<span class="truncate">+ {up.title}</span>
										<span class="font-mono shrink-0" dir="ltr">99 MAD</span>
									</div>
								{/each}
							</div>

							<div class="flex justify-between items-center border-t border-stone-200/80 pt-2.5">
								<span class="text-xs font-bold text-stone-600">المجموع النهائي:</span>
								<span class="font-mono font-black text-2xl text-[#1B4332]" dir="ltr">
									{subtotal} MAD
								</span>
							</div>

							<!-- Reassurance Badge -->
							<div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200/60">
								<span>✓</span>
								<span>الدفع عند الاستلام • بدون دفع أونلاين</span>
							</div>
						</div>

						<!-- B. Fast COD Form -->
						{#if phoneError}
							<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
								⚠️ {phoneError}
							</div>
						{/if}

						<form onsubmit={handleOrderSubmit} class="space-y-3.5">
							<div>
								<label for="checkout-name" class="block text-xs font-bold text-stone-700 mb-1">
									الاسم الكامل <span class="text-rose-500">*</span>
								</label>
								<input
									id="checkout-name"
									type="text"
									bind:value={fullName}
									required
									placeholder="مثال: مريم العلمي"
									class="w-full h-12 rounded-xl border border-stone-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition-all"
								/>
							</div>

							<div>
								<label for="checkout-phone" class="block text-xs font-bold text-stone-700 mb-1">
									رقم الهاتف <span class="text-rose-500">*</span>
								</label>
								<input
									id="checkout-phone"
									type="tel"
									bind:value={phone}
									required
									dir="ltr"
									placeholder="06XXXXXXXX"
									class="w-full h-12 rounded-xl border border-stone-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 text-start transition-all"
								/>
								<p class="text-[11px] text-stone-500 font-medium mt-1">
									يرجى إدخال رقم هاتف صحيح لتأكيد التوصيل
								</p>
							</div>

							<!-- Confirmation Submit Button -->
							<button
								type="submit"
								disabled={isSubmitting || cart.count === 0}
								class="w-full min-h-14 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-4"
							>
								{#if isSubmitting}
									<span>جاري تأكيد طلبك... ⏳</span>
								{:else}
									<span>تأكيد الطلب بالدفع عند الاستلام</span>
								{/if}
							</button>

							<!-- Calm Footer Text -->
							<p class="text-center text-[10px] text-stone-400 font-medium pt-1 pb-3">
								بالمتابعة أنت توافقين على الشروط والأحكام و سياسة الخصوصية
							</p>
						</form>

					</div>

				{/if}

			</aside>
		</div>
	</div>
{/if}
