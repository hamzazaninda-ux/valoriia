<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { PRODUCTS, type CatalogProduct, buildOrderFulfillmentLabel } from '$lib/data/products';
	import { trackPurchase } from '$lib/utils/checkout';

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

	function getProductMeta(sku: string): CatalogProduct | undefined {
		return PRODUCTS.find((p) => p.sku === sku);
	}

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

	// Ordered items for Step 2 checkout: Main item first, then upsells in exact added order
	const checkoutOrderedItems = $derived.by(() => {
		const main = cart.getMainItem();
		const upsells = cart.getUpsellItems();
		const list: Array<{ item: typeof cart.lines[0]; isUpsell: boolean }> = [];
		if (main) {
			list.push({ item: main, isUpsell: false });
		}
		for (const up of upsells) {
			list.push({ item: up, isUpsell: true });
		}
		return list.length > 0 ? list : cart.lines.map((l) => ({ item: l, isUpsell: Boolean(l.isUpsell) }));
	});

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
			const activeUpsell = upsells[0];

			let upsellName = '';
			if (activeUpsell) {
				const uSku = (activeUpsell.sku || activeUpsell.slug || '').toLowerCase();
				if (uSku.includes('biotin') || activeUpsell.title.includes('بيوتين')) {
					upsellName = 'بيوتين (Biotine)';
				} else if (uSku.includes('vitam') || activeUpsell.title.includes('فيتامين') || uSku.includes('multivit')) {
					upsellName = 'مالتي فيتامين (Multivitamines)';
				} else if (uSku.includes('collagen') || activeUpsell.title.includes('كولاجين')) {
					upsellName = 'كولاجين (Collagène)';
				}
			}

			const items = cart.lines.map((l) => ({
				sku: l.sku,
				slug: l.slug,
				title: l.title,
				quantity: l.qty || 1,
				unitPrice: l.price,
				price: l.price,
				isUpsell: Boolean(l.isUpsell)
			}));

			const mainTier = mainItem?.tier || (cart.count > 1 ? 'tier_2' : 'tier_1');
			const baseTierBottles = mainTier === 'tier_1' ? 1 : mainTier === 'tier_3' ? 3 : 2;
			const totalBottles = baseTierBottles + (upsells.length > 0 ? upsells.length : 0);

			const fullProductLabel = buildOrderFulfillmentLabel({
				tier: mainTier,
				mainSku: mainItem?.sku || mainItem?.slug,
				mainTitle: mainItem?.title,
				items,
				hasUpsell: upsells.length > 0
			});

			const isCollagen =
				(mainItem?.sku || '').toLowerCase().includes('collagen') ||
				(mainItem?.slug || '').toLowerCase().includes('collagen') ||
				(mainItem?.title || '').toLowerCase().includes('كولاجين') ||
				(mainItem?.title || '').toLowerCase().includes('collagen');
			const hasUpsell = upsells.length > 0;
			const isCollagenUpsell = isCollagen && hasUpsell;

			const orderPayload = {
				orderId,
				fullName: fullName.trim(),
				phone: cleanedPhone,
				phoneNumber: cleanedPhone,
				city: 'تحدد عند التأكيد',
				address: '',
				tier: mainTier,
				baseTier: mainTier,
				baseBottles: baseTierBottles,
				tierName: mainTier === 'tier_1' ? 'علبة واحدة (1 علبة)' : mainTier === 'tier_3' ? '3 علب (كورس علاجي)' : 'علبتان (2 علب)',
				upsellProduct: upsellName || undefined,
				upsellName: upsellName || undefined,
				upsellSku: activeUpsell?.sku,
				totalBottles,
				quantity: totalBottles,
				qte: totalBottles,
				product: fullProductLabel,
				productTitle: fullProductLabel,
				selectedOfferTitle: fullProductLabel,
				sku: mainItem?.sku || 'gummies_collagen',
				mainSku: mainItem?.sku || 'gummies_collagen',
				items,
				subtotal,
				shipping: 0,
				total: subtotal,
				price: subtotal,
				totalPrice: subtotal,
				hasUpsell,
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

			// Fire Purchase tracking
			trackPurchase(subtotal, fullProductLabel, orderId, cleanedPhone);

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
					
					<!-- 1. Drawer Header (Clean & Compact) -->
					<div class="flex items-center justify-between border-b border-gray-150 bg-white px-4 py-3 sm:px-5 sm:py-3.5 shrink-0">
						<h2 class="font-display text-base sm:text-lg font-bold text-gray-900">
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
					<div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-8">
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

							<!-- A. Main Selected Cart Item Card -->
							{#if mainItem}
								{@const mainProductMeta = getProductMeta(mainItem.sku)}
								<div class="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-150 shadow-2xs relative flex items-start justify-between gap-3 mb-2.5">
									<!-- Right: Thumbnail -->
									<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
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

									<!-- Center: Title, Subtitle, Headline, Price -->
									<div class="flex-1 text-right min-w-0">
										<div class="flex items-start justify-between gap-2">
											<h4 class="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug">
												{mainItem.title}
											</h4>
											<div class="font-display font-black text-xs sm:text-sm text-[#1B4332] shrink-0" dir="ltr">
												DH {mainItem.price}
											</div>
										</div>

										<!-- Bundle Pill Subtitle -->
										<div class="mt-1">
											<span class="text-[10px] sm:text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
												{mainItemSubtitle}
											</span>
										</div>

										<!-- Natural Readable Description (Secondary, No Ellipses) -->
										{#if mainProductMeta?.headline}
											<p class="text-[11px] text-stone-500 font-medium leading-relaxed mt-1">
												{mainProductMeta.headline}
											</p>
										{/if}
									</div>

									<!-- Left: Fast Delete Button (✕) -->
									<button
										type="button"
										onclick={() => cart.remove(mainItem.key)}
										class="shrink-0 text-gray-400 hover:text-gray-600 p-1 text-base leading-none transition-colors cursor-pointer rounded-lg hover:bg-stone-50"
										aria-label="حذف المنتج من السلة"
									>
										✕
									</button>
								</div>
							{/if}

							<!-- Added Upsell Items in Cart -->
							{#if upsellItems.length > 0}
								<div class="space-y-2 mb-2.5">
									{#each upsellItems as up (up.key)}
										<div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-emerald-200/80 shadow-2xs relative flex items-center justify-between gap-2.5">
											<!-- Right: Thumbnail -->
											<div class="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
												<img
													src={up.image}
													alt={up.title}
													class="w-full h-full object-contain"
												/>
											</div>

											<!-- Center: Title, Price -->
											<div class="flex-1 text-right min-w-0">
												<h4 class="font-display font-bold text-xs text-gray-900 leading-snug truncate">
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
												class="shrink-0 text-gray-400 hover:text-gray-600 p-1 text-sm leading-none transition-colors cursor-pointer"
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
								<div class="pt-0.5">
									<h3 class="font-display text-xs sm:text-sm font-bold text-gray-900 mb-2">
										كمّلي روتينك بهاد المنتجات
									</h3>

									<div class="space-y-2.5">
										{#each remainingUpsellProducts as upProd (upProd.sku)}
											{@const isAdded = cart.isUpsellActive(upProd.sku)}
											{@const info = getUpsellInfo(upProd)}
											<div class="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col gap-2.5">
												
												<!-- Top Part: Thumbnail + Title + Full Readable Benefit Description -->
												<div class="flex items-start gap-3">
													<!-- Right: Product Thumbnail -->
													<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
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

													<!-- Middle: Product Title & Full Unclipped Description -->
													<div class="flex-1 min-w-0 text-right">
														<!-- Product Name -->
														<h4 class="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug">
															{info.shortTitle}
														</h4>

														<!-- Full Unclipped Benefit Description (12–13px, Line Height 1.45, Natural Wrap) -->
														<p class="text-[12px] sm:text-[13px] text-stone-600 leading-[1.45] font-medium mt-1">
															{info.benefitDescription}
														</p>
													</div>
												</div>

												<!-- Bottom Action Row: Price & Star Ratings on Right, Add-to-Cart Button on Left -->
												<div class="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
													
													<!-- Price & Star Rating Group -->
													<div class="flex items-center gap-2.5 flex-wrap">
														<!-- Selling Price & Crossed Out Retail Price -->
														<div class="flex items-baseline gap-1" dir="ltr">
															<span class="font-display font-black text-xs sm:text-sm text-[#1B4332]">DH {info.upsellPrice}</span>
															<span class="text-[10px] text-stone-400 line-through">DH {info.retailPrice}</span>
														</div>

														<!-- Star Rating & Review Count -->
														<div class="flex items-center gap-1">
															<div class="flex text-[#F59E0B] gap-0.5" aria-hidden="true">
																{#each Array(5) as _}
																	<svg class="w-3 h-3 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
																		<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
																	</svg>
																{/each}
															</div>
															<span class="text-[10px] sm:text-[11px] text-stone-500 font-semibold">
																{info.rating} ({info.reviewCount})
															</span>
														</div>
													</div>

													<!-- Compact Green Add-to-Cart Button -->
													<button
														type="button"
														disabled={togglingSku === upProd.sku}
														onclick={() => handleToggleUpsell(upProd)}
														class={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 ${
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

											</div>
										{/each}
									</div>
								</div>
							{/if}

						{/if}
					</div>

					<!-- 3. Ultra-Compact High-Converting Checkout Footer (Step 1 - Target ~100-120px) -->
					{#if cart.count > 0}
						<div class="border-t border-gray-150 bg-white px-4 pt-2.5 pb-3 sm:pb-4 shadow-lg shrink-0 space-y-2">
							<!-- Row 1: Total & Delivery Info -->
							<div class="flex items-center justify-between text-xs sm:text-sm">
								<div class="flex items-center gap-2">
									<span class="font-bold text-gray-700">المجموع:</span>
									<span class="font-display font-black text-base sm:text-lg text-[#1B4332]" dir="ltr">
										DH {subtotal}
									</span>
								</div>
								<span class="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
									توصيل مجاني 🚚
								</span>
							</div>

							<!-- Row 2: Main CTA Button (Ergonomic & Visible) -->
							<button
								type="button"
								onclick={() => (currentStep = 'checkout')}
								class="bg-[#1B4332] text-white py-3 sm:py-3.5 px-4 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#153427] active:scale-[0.98] transition-all w-full cursor-pointer"
							>
								<span>أكملي الطلب ({cart.count})</span>
								<span class="text-sm">←</span>
							</button>

							<!-- Row 3: Security & Trust Note -->
							<p class="text-center text-[10px] sm:text-[11px] text-stone-500 font-medium leading-none">
								الدفع عند الاستلام — ما تخلصي حتى توصلك السلعة وتعاينيها 📦
							</p>
						</div>
					{/if}

				<!-- ======================================================== -->
				<!-- STEP 2: نافذة "تأكيد الطلب" (RESTRUCTURED CHECKOUT VIEW)     -->
				<!-- ======================================================== -->
				{:else if currentStep === 'checkout'}

					<!-- 1. Header (تأكيد الطلب with Back Button & Close) -->
					<div class="flex items-center justify-between border-b border-gray-150 bg-white px-4 py-3 sm:px-5 sm:py-3.5 shrink-0">
						<button
							type="button"
							onclick={() => (currentStep = 'cart')}
							class="flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:text-emerald-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
							aria-label="الرجوع إلى السلة"
						>
							<span class="text-sm">→</span>
							<span>السلة</span>
						</button>

						<h2 class="font-display text-base sm:text-lg font-bold text-gray-900">
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
					<div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-8">
						
						<!-- A. Redesigned Premium Vertically Stacked Order Summary -->
						<div class="space-y-3">
							
							<!-- Summary Heading -->
							<div class="flex items-center justify-between">
								<h3 class="font-display font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
									<span>ملخص الطلب</span>
									<span class="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
										({cart.count} {cart.count === 1 ? 'منتج' : 'منتجات'})
									</span>
								</h3>
								<span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
									توصيل مجاني 🚚
								</span>
							</div>

							<!-- Vertically Stacked Product Rows: Main Product First, Upsells in exact order -->
							<div class="space-y-2.5">
								{#each checkoutOrderedItems as { item, isUpsell } (item.key)}
									{@const meta = getProductMeta(item.sku)}
									{@const upsellInfo = UPSELL_DETAILS[item.sku]}
									{@const itemTitle = isUpsell ? (upsellInfo?.shortTitle || item.title) : item.title}
									{@const itemDesc = isUpsell ? upsellInfo?.benefitDescription : meta?.headline}

									<div class="bg-white rounded-2xl p-3 sm:p-3.5 border border-stone-200/90 shadow-2xs flex items-start gap-3">
										
										<!-- Large, Clear Product Image on the RIGHT (64-80px Square) -->
										<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FAF8F5] border border-stone-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
											<img
												src={item.image}
												alt={itemTitle}
												class="w-full h-full object-contain"
												onerror={(e: any) => {
													e.currentTarget.onerror = null;
													e.currentTarget.src = '/images/products/gummies_collagen.svg';
												}}
											/>
										</div>

										<!-- Product Information next to image, natural RTL alignment -->
										<div class="flex-1 min-w-0 text-right">
											<!-- Title & Individual Price -->
											<div class="flex items-start justify-between gap-2">
												<h4 class="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug">
													{itemTitle}
												</h4>
												<div class="font-display font-black text-xs sm:text-sm text-[#174B38] shrink-0" dir="ltr">
													DH {item.price}
												</div>
											</div>

											<!-- Quantity & Distinctive Variant/Offer Badge -->
											<div class="flex items-center gap-1.5 mt-1 flex-wrap">
												<span class="text-[10px] sm:text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
													الكمية: {item.qty || 1}
												</span>
												{#if !isUpsell}
													<span class="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
														{mainItemSubtitle}
													</span>
												{:else}
													<span class="text-[10px] sm:text-[11px] font-bold text-[#E86A7C] bg-rose-50 px-2 py-0.5 rounded-md">
														عرض سري مخفض 🎁
													</span>
												{/if}
											</div>

											<!-- Short Description (Relevant & Readable, No Ellipses) -->
											{#if itemDesc}
												<p class="text-[11px] sm:text-xs text-stone-500 font-medium leading-relaxed mt-1">
													{itemDesc}
												</p>
											{/if}
										</div>

									</div>
								{/each}
							</div>

							<!-- Price Breakdown & Prominent Final Total -->
							<div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-2xs space-y-2">
								<div class="flex items-center justify-between text-xs sm:text-sm text-gray-600">
									<span class="font-medium">مجموع المنتجات:</span>
									<span class="font-mono font-bold text-gray-900" dir="ltr">DH {subtotal}</span>
								</div>
								<div class="flex items-center justify-between text-xs sm:text-sm text-gray-600">
									<span class="font-medium">التوصيل لكافة المدن المغربية:</span>
									<span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">مجاني (0 DH) 🚚</span>
								</div>
								<div class="border-t border-stone-200/80 pt-2 flex items-center justify-between">
									<span class="font-display font-black text-sm sm:text-base text-gray-900">المجموع النهائي:</span>
									<div class="font-display font-black text-lg sm:text-xl text-[#174B38]" dir="ltr">
										DH {subtotal}
									</div>
								</div>
							</div>

						</div>

						<!-- B. Fast Clean COD Form with Right-Aligned Phone Input -->
						<form onsubmit={handleOrderSubmit} class="space-y-3.5">
							
							<!-- Field 1: الاسم الكامل -->
							<div>
								<label for="checkout-name" class="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 text-right">
									الاسم الكامل <span class="text-rose-500">*</span>
								</label>
								<input
									id="checkout-name"
									type="text"
									bind:value={fullName}
									oninput={() => (nameError = '')}
									placeholder="مثال: مريم العلمي"
									autocomplete="name"
									class={`w-full h-12 rounded-xl sm:rounded-2xl border bg-white px-4 text-sm font-semibold outline-none transition-all text-right ${
										nameError
											? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
											: 'border-stone-200 focus:border-[#174B38] focus:ring-2 focus:ring-[#174B38]/10'
									}`}
								/>
								{#if nameError}
									<p class="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1 text-right">
										<span>⚠️</span>
										<span>{nameError}</span>
									</p>
								{/if}
							</div>

							<!-- Field 2: رقم الهاتف (Fixed RTL Alignment, Natural Number Entry) -->
							<div>
								<label for="checkout-phone" class="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 text-right">
									رقم الهاتف (ضروري لتأكيد الطلب) <span class="text-rose-500">*</span>
								</label>
								<div class="relative">
									<input
										id="checkout-phone"
										type="tel"
										inputmode="tel"
										dir="ltr"
										bind:value={phone}
										oninput={() => (phoneError = '')}
										placeholder="06XXXXXXXX"
										autocomplete="tel"
										style="text-align: right;"
										class={`w-full h-12 rounded-xl sm:rounded-2xl border bg-white px-4 text-sm font-semibold outline-none text-right transition-all font-mono tracking-wider ${
											phoneError
												? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
												: 'border-stone-200 focus:border-[#174B38] focus:ring-2 focus:ring-[#174B38]/10'
										}`}
									/>
								</div>
								{#if phoneError}
									<p class="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1 text-right">
										<span>⚠️</span>
										<span>{phoneError}</span>
									</p>
								{:else}
									<p class="text-[11px] text-stone-500 font-medium mt-1 text-right">
										غادي نتاصلو بيك عبر الواتساب أو اتصال لتأكيد عنوان الإرسال
									</p>
								{/if}
							</div>

							<!-- Final Order Confirmation Button -->
							<button
								type="submit"
								disabled={isSubmitting || cart.count === 0}
								class="w-full h-[52px] rounded-xl sm:rounded-2xl bg-[#174B38] hover:bg-[#123d2e] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#174B38] font-bold text-white text-base sm:text-lg shadow-md shadow-emerald-950/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center mt-4 select-none"
							>
								{#if isSubmitting}
									<span class="inline-flex items-center justify-center gap-2">
										<svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>تأكيد الطلب</span>
									</span>
								{:else}
									<span>تأكيد الطلب</span>
								{/if}
							</button>

							<!-- Short Reassurance Note below Confirmation Button -->
							<p class="text-center text-[11px] text-stone-500 font-medium pt-1 pb-3">
								الدفع عند الاستلام — ما تخلصي حتى توصلك السلعة وتعاينيها 📦
							</p>
						</form>

					</div>

				{/if}

			</aside>
		</div>
	</div>
{/if}
