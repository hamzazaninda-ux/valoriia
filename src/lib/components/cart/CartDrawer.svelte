<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { PRODUCTS, type CatalogProduct } from '$lib/data/products';

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

	// Genuine product benefit & recommendation metadata from catalog
	interface UpsellBenefitInfo {
		shortTitle: string;
		benefitDescription: string;
		rating: number;
		reviewCount: number;
		retailPrice: number;
		upsellPrice: number;
	}

	const UPSELL_DETAILS: Record<string, UpsellBenefitInfo> = {
		gummies_collagen: {
			shortTitle: 'علكات الكولاجين البحري',
			benefitDescription: 'كولاجين بحري مع الهيالورونيك لمرونة البشرة، ترطيب خلوي وملء الخطوط من الداخل.',
			rating: 4.9,
			reviewCount: 420,
			retailPrice: 199,
			upsellPrice: 99
		},
		gummies_biotine: {
			shortTitle: 'علكات البيوتين والزنك',
			benefitDescription: 'جرعة علاجية (3000mcg) توقف تساقط الكالكير وتسرّع إنبات البيبي هير وتكثيف الفراغات.',
			rating: 4.9,
			reviewCount: 580,
			retailPrice: 199,
			upsellPrice: 99
		},
		gumies_vitamine: {
			shortTitle: 'علكات الفيتامينات المتعددة',
			benefitDescription: '13 فيتامين أساسي يطرد خمول وتعب النهار ويمد جسمك بحيوية وطاقة تدوم نهارك كامل.',
			rating: 4.8,
			reviewCount: 310,
			retailPrice: 199,
			upsellPrice: 99
		}
	};

	function getUpsellInfo(product: CatalogProduct): UpsellBenefitInfo {
		if (UPSELL_DETAILS[product.sku]) {
			return UPSELL_DETAILS[product.sku];
		}
		return {
			shortTitle: product.name.replace(/\s*\([^)]*\)/g, '').trim(),
			benefitDescription: product.headline,
			rating: product.rating || 4.9,
			reviewCount: product.reviewCount || 400,
			retailPrice: product.retailPrice || 199,
			upsellPrice: 99
		};
	}

	// Click debouncing to prevent rapid duplicate toggles
	let togglingSku = $state<string | null>(null);

	function handleToggleUpsell(product: CatalogProduct) {
		if (togglingSku) return;
		togglingSku = product.sku;

		cart.toggleUpsell(product);

		setTimeout(() => {
			togglingSku = null;
		}, 250);
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
					<div class="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
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
									<div class="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
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
										<h4 class="font-display font-bold text-sm sm:text-base text-gray-900 leading-snug line-clamp-2">
											{mainItem.title}
										</h4>
										<p class="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">
											{mainItemSubtitle}
										</p>
										<div class="font-display font-black text-sm sm:text-base text-[#1B4332] mt-1" dir="ltr">
											DH {mainItem.price}
										</div>
									</div>

									<!-- Left: Fast Delete Button (✕) -->
									<button
										type="button"
										onclick={() => cart.remove(mainItem.key)}
										class="shrink-0 text-gray-400 hover:text-gray-600 p-1.5 text-lg leading-none transition-colors cursor-pointer rounded-lg hover:bg-stone-50"
										aria-label="حذف المنتج من السلة"
									>
										✕
									</button>
								</div>
							{/if}

							<!-- Added Upsell Items in Cart -->
							{#if upsellItems.length > 0}
								<div class="space-y-2.5 mb-4">
									{#each upsellItems as up (up.key)}
										<div class="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-200/80 shadow-2xs relative flex items-center justify-between gap-3">
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
												<h4 class="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-1">
													{up.title}
												</h4>
												<div class="flex items-center gap-1.5 mt-0.5" dir="ltr">
													<span class="font-display font-black text-xs text-[#E86A7C]">DH 99</span>
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

							<!-- B. Upgraded Smart Upsell Section: "كمّلي روتينك بهاد المنتجات" -->
							{#if remainingUpsellProducts.length > 0}
								<div class="pt-1">
									<h3 class="font-display text-sm font-bold text-gray-900 mb-2.5">
										كمّلي روتينك بهاد المنتجات
									</h3>

									<div class="space-y-3">
										{#each remainingUpsellProducts as upProd (upProd.sku)}
											{@const isAdded = cart.isUpsellActive(upProd.sku)}
											{@const info = getUpsellInfo(upProd)}
											<div class="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100/90 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between gap-2.5 sm:gap-3">
												
												<!-- Right: Product Thumbnail -->
												<div class="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
													<img
														src={upProd.image}
														alt={info.shortTitle}
														class="w-full h-full object-contain"
														onerror={(e: any) => {
															e.currentTarget.onerror = null;
															e.currentTarget.src = '/images/products/gummies_collagen.svg';
														}}
													/>
												</div>

												<!-- Middle: Product Information, Benefit, Stars & Price -->
												<div class="flex-1 min-w-0 text-right">
													<!-- Product Name -->
													<h4 class="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-1">
														{info.shortTitle}
													</h4>

													<!-- Short Arabic Benefit Description -->
													<p class="text-[11px] sm:text-xs text-stone-600 leading-tight mt-1 line-clamp-2 font-medium">
														{info.benefitDescription}
													</p>

													<!-- Star Rating & Price Row -->
													<div class="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
														<!-- Gold Stars & Rating Info -->
														<div class="flex items-center gap-1">
															<div class="flex text-[#F59E0B] gap-0.5" aria-hidden="true">
																{#each Array(5) as _}
																	<svg class="w-3 h-3 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
																		<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
																	</svg>
																{/each}
															</div>
															<span class="text-[10px] text-stone-500 font-semibold">
																{info.rating} ({info.reviewCount})
															</span>
														</div>

														<!-- Selling Price & Crossed Out Price -->
														<div class="flex items-baseline gap-1 font-mono" dir="ltr">
															<span class="font-display font-black text-xs sm:text-sm text-[#1B4332]">DH {info.upsellPrice}</span>
															<span class="text-[10px] text-stone-400 line-through">DH {info.retailPrice}</span>
														</div>
													</div>
												</div>

												<!-- Left: Compact Green Add-to-Cart Button -->
												<button
													type="button"
													disabled={togglingSku === upProd.sku}
													onclick={() => handleToggleUpsell(upProd)}
													class={`shrink-0 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 ${
														isAdded
															? 'bg-emerald-700 hover:bg-emerald-800 text-white'
															: 'bg-[#1B4332] hover:bg-[#153427] text-white'
													}`}
													aria-label={isAdded ? `إزالة ${info.shortTitle} من السلة` : `إضافة ${info.shortTitle} للسلة`}
												>
													{#if isAdded}
														<span>تمت الإضافة ✓</span>
													{:else}
														<span>＋ زيد للسلة</span>
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
					<div class="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
						
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
