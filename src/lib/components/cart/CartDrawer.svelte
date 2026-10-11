<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { PRODUCTS } from '$lib/data/products';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Funnel step: 'cart' (Step 1) or 'checkout' (Step 2)
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
		nameError = '';
		phoneError = '';
		onClose?.();
	}

	// Dynamic calculations
	const subtotal = $derived(cart.subtotal);
	const mainItem = $derived(cart.getMainItem());
	const upsellItems = $derived(cart.getUpsellItems());

	// Filter out main item to show only the other 2 SKUs for upsell
	const remainingUpsellProducts = $derived.by(() => {
		const mainSku = mainItem?.sku || '';
		return PRODUCTS.filter((p) => p.sku !== mainSku);
	});

	// Derived subtitle for main item in case not explicitly set
	const mainItemSubtitle = $derived.by(() => {
		if (mainItem?.subtitle) return mainItem.subtitle;
		if (mainItem?.tier === 'tier_3') return '3 علب • كورس علاجي كامل 3 أشهر 🎁';
		if (mainItem?.tier === 'tier_1') return 'علبة واحدة • شهر تجريبي';
		return 'علبتان • شهرين متواصلين + توصيل فابور 🚚';
	});

	// Custom short title for upsell products
	function getUpsellTitle(sku: string, name: string): string {
		if (sku.includes('biotine')) return 'علكات البيوتين: إنبات الشعر ووقف التساقط ✨';
		if (sku.includes('collagen')) return 'علكات الكولاجين: نضارة البشرة والامتلاء ✨';
		if (sku.includes('vitamine')) return 'علكات الملتي فيتامين: طاقة ونشاط يومي ⚡';
		return name;
	}

	// Step 2 COD Form State
	let fullName = $state('');
	let phone = $state('');
	let nameError = $state('');
	let phoneError = $state('');
	let isSubmitting = $state(false);

	function validatePhone(input: string): boolean {
		const cleaned = input.replace(/[\s\-\(\)]/g, '');
		const regex = /^(?:(?:\+?212)|0)[567]\d{8}$/;
		return regex.test(cleaned);
	}

	async function handleOrderSubmit(e: SubmitEvent) {
		e.preventDefault();
		nameError = '';
		phoneError = '';
		let hasError = false;

		if (!fullName.trim() || fullName.trim().length < 2) {
			nameError = 'دخلي الاسم الكامل من فضلك';
			hasError = true;
		}

		const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
		if (!cleanedPhone || !validatePhone(phone)) {
			phoneError = 'دخلي رقم هاتف صحيح لتأكيد التوصيل';
			hasError = true;
		}

		if (cart.lines.length === 0) {
			phoneError = 'سلتك فارغة، يرجى اختيار باقة أولاً';
			hasError = true;
		}

		if (hasError) return;
		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const orderId = 'NV-' + Math.floor(100000 + Math.random() * 900000);
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
				phone: cleanedPhone,
				phoneNumber: cleanedPhone,
				city: 'تحدد عند التأكيد',
				address: '',
				tier: mainItem?.tier || (cart.count > 1 ? 'tier_2' : 'tier_1'),
				items,
				subtotal,
				shipping: 0,
				total: subtotal,
				price: subtotal,
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

			// Resilient dual dispatch to backend
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

			// Clear cart and close drawer
			handleClose();
			cart.clear();

			await goto(
				`/thank-you?orderId=${encodeURIComponent(orderId)}&total=${subtotal}&fullName=${encodeURIComponent(fullName.trim())}&phone=${encodeURIComponent(cleanedPhone)}&hasUpsell=${upsells.length > 0}`
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
			<aside class="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-e border-stone-200 transform transition-transform duration-300 ease-out font-body">

				<!-- ======================================================== -->
				<!-- STEP 1: درج السلة "السلة (X)" (CART VIEW)                  -->
				<!-- ======================================================== -->
				{#if currentStep === 'cart'}
					
					<!-- 1. Drawer Header -->
					<div class="flex items-center justify-between border-b border-gray-150 bg-white px-5 py-4 shrink-0">
						<h2 class="font-display text-lg sm:text-xl font-bold text-gray-900">
							السلة ({cart.count})
						</h2>
						<button
							type="button"
							onclick={handleClose}
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200 active:scale-95 transition-all text-sm font-bold cursor-pointer"
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
								<p class="text-base font-bold text-stone-700">سلتك فارغة حالياً</p>
								<p class="text-xs text-stone-400">اختاري باقتك المناسبة لبدء روتينك الصحي</p>
								<button
									type="button"
									onclick={handleClose}
									class="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1B4332] px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer mt-2"
								>
									<span>تصفحي العروض</span>
									<span>←</span>
								</button>
							</div>
						{:else}

							<!-- A. Cart Item Card (Selected Main Product) -->
							{#if mainItem}
								<div class="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm relative flex items-center justify-between mb-4 gap-3">
									<!-- Right: Thumbnail -->
									<div class="w-16 h-16 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
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

									<!-- Center: Title, Subtitle, Price -->
									<div class="flex-1 text-right min-w-0">
										<h4 class="font-bold text-sm sm:text-base text-gray-900 leading-snug truncate">
											{mainItem.title}
										</h4>
										<p class="text-xs text-gray-500 font-medium mt-0.5 truncate">
											{mainItemSubtitle}
										</p>
										<div class="font-bold text-sm sm:text-base text-[#1B4332] mt-1" dir="ltr">
											DH {mainItem.price}
										</div>
									</div>

									<!-- Left: Fast Delete Button (✕) -->
									<button
										type="button"
										onclick={() => cart.remove(mainItem.key)}
										class="shrink-0 text-gray-400 hover:text-gray-600 p-1 text-lg leading-none transition-colors cursor-pointer"
										aria-label="حذف المنتج من السلة"
									>
										✕
									</button>
								</div>
							{/if}

							<!-- Added Upsell Items (if any currently in cart) -->
							{#if upsellItems.length > 0}
								<div class="space-y-2.5 mb-4">
									{#each upsellItems as up (up.key)}
										<div class="bg-white rounded-2xl p-3.5 border border-emerald-200/80 shadow-xs relative flex items-center justify-between gap-3">
											<!-- Right: Thumbnail -->
											<div class="w-13 h-13 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
												<img
													src={up.image}
													alt={up.title}
													class="w-full h-full object-contain"
												/>
											</div>

											<!-- Center: Title, Price -->
											<div class="flex-1 text-right min-w-0">
												<h4 class="font-bold text-xs sm:text-sm text-gray-900 leading-snug truncate">
													{up.title}
												</h4>
												<div class="flex items-center gap-1.5 mt-0.5" dir="ltr">
													<span class="font-bold text-xs text-[#E86A7C]">DH 99</span>
													<span class="text-[10px] text-gray-400 line-through">DH 199</span>
												</div>
											</div>

											<!-- Left: Remove Button -->
											<button
												type="button"
												onclick={() => cart.remove(up.key)}
												class="shrink-0 text-gray-400 hover:text-gray-600 p-1 text-base leading-none transition-colors cursor-pointer"
												aria-label="حذف المنتج الإضافي"
											>
												✕
											</button>
										</div>
									{/each}
								</div>
							{/if}

							<!-- B. Smart Upsell Section: "كمّلي روتينك بهاد المنتجات" -->
							{#if remainingUpsellProducts.length > 0}
								<div class="pt-1">
									<h3 class="font-display text-sm font-bold text-gray-900 mb-2">
										كمّلي روتينك بهاد المنتجات
									</h3>

									<div class="space-y-2.5">
										{#each remainingUpsellProducts as upProd (upProd.sku)}
											{@const isAdded = cart.isUpsellActive(upProd.sku)}
											<div class="border border-emerald-200 bg-[#FAF8F5]/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all hover:border-emerald-300">
												<!-- Right: Thumbnail -->
												<div class="w-13 h-13 rounded-xl bg-white border border-stone-200/80 p-1 shrink-0 flex items-center justify-center overflow-hidden">
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

												<!-- Center: Title & Exclusive Price -->
												<div class="flex-1 text-right min-w-0">
													<h4 class="font-bold text-xs sm:text-sm text-gray-900 leading-snug truncate">
														{getUpsellTitle(upProd.sku, upProd.name)}
													</h4>
													<div class="flex items-baseline gap-1.5 mt-1" dir="ltr">
														<span class="font-bold text-xs text-[#E86A7C]">DH 99</span>
														<span class="text-[10px] text-stone-400 line-through">DH 199</span>
													</div>
												</div>

												<!-- Left: Interactive Button -->
												<button
													type="button"
													onclick={() => cart.toggleUpsell(upProd)}
													class={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
														isAdded
															? 'bg-emerald-700 hover:bg-emerald-800 text-white'
															: 'bg-[#1B4332] hover:bg-[#153427] text-white'
													}`}
												>
													{#if isAdded}
														<span>تمت الإضافة ✓</span>
													{:else}
														<span>+ زيد</span>
													{/if}
												</button>
											</div>
										{/each}
									</div>
								</div>
							{/if}

						{/if}
					</div>

					<!-- 3. Cart Footer & Summary (Step 1) -->
					{#if cart.count > 0}
						<div class="border-t border-gray-150 bg-white p-4 space-y-3 shadow-lg shrink-0">
							<!-- Calculation Lines -->
							<div class="space-y-1.5 text-sm">
								<div class="flex items-center justify-between text-gray-700">
									<span class="font-medium">التوصيل</span>
									<span class="font-bold text-emerald-700">مجاني</span>
								</div>
								<div class="flex items-center justify-between text-gray-900">
									<span class="font-bold text-base">المجموع</span>
									<span class="font-display font-black text-xl sm:text-2xl text-[#1B4332]" dir="ltr">
										DH {subtotal}
									</span>
								</div>
							</div>

							<!-- Social Proof Line -->
							<div class="text-center py-0.5">
								<p class="text-xs font-bold text-amber-700 flex items-center justify-center gap-1">
									<span>+1450 عميلة راضية بالمغرب</span>
									<span>⭐</span>
								</p>
							</div>

							<!-- Main CTA Button -->
							<button
								type="button"
								onclick={() => (currentStep = 'checkout')}
								class="bg-[#1B4332] text-white py-4 px-6 rounded-2xl text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#153427] active:scale-[0.98] transition-all w-full cursor-pointer"
							>
								<span>أكملي الطلب ({cart.count})</span>
							</button>

							<!-- Trust & Security Note -->
							<p class="text-center text-xs text-stone-500 font-medium">
								الدفع عند الاستلام — ما تخلصي حتى توصلك السلعة وتعاينيها 📦
							</p>
						</div>
					{/if}

				<!-- ======================================================== -->
				<!-- STEP 2: نافذة "تأكيد الطلب" (CHECKOUT VIEW)                -->
				<!-- ======================================================== -->
				{:else if currentStep === 'checkout'}

					<!-- 1. Header (تأكيد الطلب) -->
					<div class="flex items-center justify-between border-b border-gray-150 bg-white px-5 py-4 shrink-0">
						<button
							type="button"
							onclick={() => (currentStep = 'cart')}
							class="flex items-center gap-1 text-xs font-bold text-[#1B4332] hover:text-emerald-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
							aria-label="الرجوع إلى السلة"
						>
							<span class="text-sm">→</span>
							<span>السلة</span>
						</button>

						<h2 class="font-display text-lg sm:text-xl font-bold text-gray-900">
							تأكيد الطلب
						</h2>

						<button
							type="button"
							onclick={handleClose}
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200 active:scale-95 transition-all text-sm font-bold cursor-pointer"
							aria-label="إغلاق"
						>
							✕
						</button>
					</div>

					<!-- 2. Scrollable Body -->
					<div class="flex-1 overflow-y-auto p-4 space-y-4">
						
						<!-- A. Order Summary Card -->
						<div class="bg-[#FAF8F5] rounded-2xl p-4 border border-gray-200 mb-4 space-y-3">
							<!-- Top Line: Title + Cart Items Thumbnails -->
							<div class="flex items-center justify-between">
								<span class="font-bold text-xs sm:text-sm text-gray-800">
									ملخص الطلب ({cart.count})
								</span>
								<div class="flex items-center gap-1.5">
									{#each cart.lines as item (item.key)}
										<div class="w-8 h-8 rounded-lg bg-white border border-stone-200 p-0.5 overflow-hidden shrink-0 flex items-center justify-center" title={item.title}>
											<img
												src={item.image}
												alt={item.title}
												class="w-full h-full object-contain"
											/>
										</div>
									{/each}
								</div>
							</div>

							<!-- Bottom Line: Total with Free Shipping -->
							<div class="flex items-center justify-between border-t border-stone-200/80 pt-2.5">
								<span class="text-xs sm:text-sm font-bold text-gray-700">
									المجموع (التوصيل مجاني)
								</span>
								<span class="font-display font-black text-xl sm:text-2xl text-[#1B4332]" dir="ltr">
									DH {subtotal}
								</span>
							</div>
						</div>

						<!-- B. Fast Clean COD Form -->
						<form onsubmit={handleOrderSubmit} class="space-y-4">
							
							<!-- Field 1: الاسم الكامل -->
							<div>
								<label for="checkout-name" class="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
									الاسم الكامل
								</label>
								<input
									id="checkout-name"
									type="text"
									bind:value={fullName}
									oninput={() => (nameError = '')}
									placeholder="مثال: مريم العلمي"
									class={`w-full h-12 rounded-2xl border bg-white px-4 text-sm font-semibold outline-none transition-all ${
										nameError
											? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
											: 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10'
									}`}
								/>
								{#if nameError}
									<p class="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
										<span>⚠️</span>
										<span>{nameError}</span>
									</p>
								{/if}
							</div>

							<!-- Field 2: رقم الهاتف -->
							<div>
								<label for="checkout-phone" class="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
									رقم الهاتف (غادي نعيطو ليك نأكدو)
								</label>
								<input
									id="checkout-phone"
									type="tel"
									bind:value={phone}
									oninput={() => (phoneError = '')}
									dir="ltr"
									placeholder="06xxxxxxxx"
									class={`w-full h-12 rounded-2xl border bg-white px-4 text-sm font-semibold outline-none text-start transition-all ${
										phoneError
											? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
											: 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10'
									}`}
								/>
								{#if phoneError}
									<p class="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
										<span>⚠️</span>
										<span>{phoneError}</span>
									</p>
								{/if}
							</div>

							<!-- Final Submit Button -->
							<button
								type="submit"
								disabled={isSubmitting || cart.count === 0}
								class="w-full min-h-14 rounded-2xl bg-[#1B4332] hover:bg-[#153427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
							>
								{#if isSubmitting}
									<span class="inline-flex items-center gap-2">
										<svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>جاري تأكيد الطلب... ⏳</span>
									</span>
								{:else}
									<span>أكّدي الطلب — DH {subtotal}</span>
								{/if}
							</button>

							<!-- Trust and Terms Note -->
							<p class="text-center text-[11px] text-stone-400 font-medium pt-1 pb-2">
								الدفع نقداً عند استلام ومعاينة الطلب • التوصيل مجاني وسريع 24/48h
							</p>
						</form>

					</div>

				{/if}

			</aside>
		</div>
	</div>
{/if}
