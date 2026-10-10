<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart, cartUi } from '$lib/stores/cart.svelte';
	import { PRODUCTS } from '$lib/data/products';
	import { FREE_SHIPPING_THRESHOLD } from '$lib/constants/pricing';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Sync with cartUi.drawer
	$effect(() => {
		if (open !== cartUi.drawer) {
			open = cartUi.drawer;
		}
	});

	function handleClose() {
		open = false;
		cartUi.closeDrawer();
		onClose?.();
	}

	// Dynamic Free Shipping Progress (Threshold: 250 MAD)
	const subtotal = $derived(cart.subtotal);
	const remainingForFreeShipping = $derived(Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal));
	const progressPercentage = $derived(
		Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
	);
	const shippingFee = $derived(subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 29);
	const grandTotal = $derived(subtotal + shippingFee);

	// Identify main item and remaining SKUs for the 99 MAD Upsell
	const mainItem = $derived(cart.getMainItem());
	const remainingUpsellProducts = $derived.by(() => {
		const mainSku = mainItem?.sku || '';
		return PRODUCTS.filter((p) => p.sku !== mainSku);
	});

	// COD Form State
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
			phoneError = 'يرجى كتابة رقم هاتف مغربي صحيح (يبدأ بـ 06 أو 07)';
			return;
		}

		if (cart.lines.length === 0) {
			phoneError = 'سلتك فارغة، اختاري منتجاً أولاً.';
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
				shipping: shippingFee,
				total: grandTotal,
				hasUpsell: upsells.length > 0,
				createdAt: new Date().toISOString()
			};

			// Save to local storage for thank-you page & pixels
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('latestOrder', JSON.stringify(orderPayload));
			}
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('latestOrder', JSON.stringify(orderPayload));
			}

			// Resilient server dispatch
			try {
				await fetch('/api/orders', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(orderPayload),
					keepalive: true
				});
			} catch (postErr) {
				console.warn('Orders API network notice (proceeding):', postErr);
			}

			// Close drawer & clear cart
			handleClose();
			cart.clear();

			await goto(
				`/thank-you?orderId=${encodeURIComponent(orderId)}&total=${grandTotal}&fullName=${encodeURIComponent(fullName.trim())}&phone=${encodeURIComponent(cleanPhone)}&hasUpsell=${upsells.length > 0}`
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
			<aside class="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-e border-emerald-950/10 transform transition-transform duration-300 ease-out">
				
				<!-- 1. Header -->
				<div class="flex items-center justify-between border-b border-emerald-950/10 bg-white px-5 py-4 shrink-0">
					<div class="flex items-center gap-2">
						<span class="text-xl">🛍️</span>
						<h2 class="font-display text-base sm:text-lg font-black text-[#1B4332]">
							سلة المشتريات ({cart.count})
						</h2>
					</div>
					<button
						type="button"
						onclick={handleClose}
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95 transition-all text-sm font-black cursor-pointer"
						aria-label="إغلاق السلة"
					>
						✕
					</button>
				</div>

				<!-- 2. Dynamic Free Shipping Progress Bar (Threshold: 250 MAD) -->
				<div class="bg-white border-b border-emerald-950/10 p-4 space-y-2 shrink-0">
					<div class="flex items-center justify-between text-xs font-bold">
						{#if remainingForFreeShipping === 0}
							<span class="text-emerald-800 flex items-center gap-1 font-black">
								<span>🎉</span>
								<span>مبروك! طلبيتك مؤهلة للتوصيل المجاني فابور 🚚</span>
							</span>
							<span class="text-emerald-700 font-black">100%</span>
						{:else}
							<span class="text-stone-700 flex items-center gap-1">
								<span>🚚</span>
								<span>باقي ليك فقط <strong class="text-[#E86A7C] font-black">{remainingForFreeShipping} درهم</strong> باش تستفيدي من التوصيل فابور!</span>
							</span>
							<span class="text-[#E86A7C] font-black">{progressPercentage}%</span>
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

				<!-- 3. Scrollable Body: Items + Remaining 2 SKUs Upsell + COD Form -->
				<div class="flex-1 overflow-y-auto p-4 space-y-5">
					
					{#if cart.count === 0}
						<!-- Empty State -->
						<div class="py-16 text-center space-y-3">
							<div class="text-5xl text-stone-300">🛒</div>
							<p class="text-sm font-bold text-stone-600">سلتك فارغة حالياً</p>
							<p class="text-xs text-stone-400">اختاري مكملاً لإضافته وبدء روتينك الصحي</p>
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
						
						<!-- A. Active Cart Items -->
						<div class="space-y-3">
							<span class="block text-xs font-black text-stone-700">المنتجات في سلتك:</span>

							{#each cart.lines as line (line.key)}
								<div class={`flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 border shadow-2xs ${line.isUpsell ? 'border-rose-200 bg-rose-50/20' : 'border-emerald-950/10'}`}>
									<div class="flex items-center gap-3">
										<div class="w-14 h-14 rounded-xl bg-stone-50 border border-stone-200 p-1 flex items-center justify-center shrink-0">
											<img
												src={line.image}
												alt={line.title}
												class="w-full h-full object-contain"
												onerror={(e: any) => {
													e.currentTarget.onerror = null;
													e.currentTarget.src = '/images/products/gummies_collagen.svg';
												}}
											/>
										</div>
										<div class="flex flex-col text-start">
											<div class="flex items-center gap-1.5 flex-wrap">
												<span class="text-xs font-black text-[#1F2937] leading-snug">
													{line.title}
												</span>
												{#if line.isUpsell}
													<span class="text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
														عرض 99 DH
													</span>
												{/if}
											</div>
											{#if line.tierTitle}
												<span class="text-[10px] text-emerald-800 font-bold mt-0.5">
													{line.tierTitle}
												</span>
											{/if}
											<div class="flex items-baseline gap-1.5 mt-1">
												<span class="text-xs font-black text-[#1B4332]" dir="ltr">
													{line.price} MAD
												</span>
												{#if line.isUpsell}
													<span class="text-[10px] text-stone-400 line-through" dir="ltr">
														199 MAD
													</span>
												{/if}
											</div>
										</div>
									</div>

									<button
										type="button"
										onclick={() => cart.remove(line.key)}
										class="text-xs font-bold text-stone-400 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
										title="حذف"
										aria-label="حذف المنتج"
									>
										🗑️
									</button>
								</div>
							{/each}
						</div>

						<!-- B. Smart AOV Upsell Section: Remaining 2 SKUs for ONLY 99 MAD! -->
						{#if remainingUpsellProducts.length > 0}
							<div class="rounded-3xl border-2 border-dashed border-[#E86A7C]/50 bg-gradient-to-br from-rose-50/60 via-white to-rose-50/40 p-4 sm:p-4.5 space-y-3.5">
								<div class="space-y-1">
									<div class="flex items-center justify-between">
										<span class="inline-flex items-center gap-1 rounded-full bg-[#E86A7C] text-white px-2.5 py-0.5 text-[10px] font-black shadow-xs">
											🔥 عرض سري حصري بالسلة
										</span>
										<span class="text-[11px] font-black text-rose-700">وفر 100 DH لكل علبة</span>
									</div>
									<h3 class="font-display text-sm font-black text-[#1B4332] leading-tight pt-1">
										كمّلي روتينك اليومي بـ 99 MAD فقط (بدل 199 MAD)
									</h3>
									<p class="text-[11px] text-stone-600 font-medium">
										نتائج أسرع ومضاعفة عند الجمع بين العناية بالشعر، البشرة والمناعة:
									</p>
								</div>

								<div class="space-y-2.5">
									{#each remainingUpsellProducts as upProd}
										{@const isAdded = cart.isUpsellActive(upProd.sku)}
										<div class={`rounded-2xl p-3 border transition-all ${isAdded ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
											<div class="flex items-center gap-3">
												<div class="w-13 h-13 rounded-xl bg-[#FAF8F5] border border-stone-200/80 p-1 flex items-center justify-center shrink-0">
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
												<div class="flex-1 text-start min-w-0">
													<h4 class="text-xs font-black text-[#1F2937] truncate">{upProd.name}</h4>
													<p class="text-[10px] text-stone-500 line-clamp-1">{upProd.headline}</p>
													<div class="flex items-baseline gap-1.5 mt-0.5">
														<span class="text-xs font-black text-[#1B4332]" dir="ltr">99 MAD</span>
														<span class="text-[10px] text-stone-400 line-through" dir="ltr">199 MAD</span>
														<span class="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">تخفيض 50%</span>
													</div>
												</div>
											</div>

											<!-- 1-Click Toggle Action Button -->
											<button
												type="button"
												onclick={() => cart.toggleUpsell(upProd)}
												class={`mt-2.5 w-full min-h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
													isAdded
														? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
														: 'bg-[#1B4332] hover:bg-[#143427] text-white active:scale-98 shadow-sm'
												}`}
											>
												{#if isAdded}
													<span>✓ مضاف لروتينك (99 MAD) • حذفي</span>
												{:else}
													<span>+ أضيفي لروتينك بـ 99 درهم فقط</span>
												{/if}
											</button>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- C. In-Drawer Streamlined 1-Step COD Checkout Form -->
						<div class="rounded-3xl bg-white border border-emerald-950/15 p-4 sm:p-5 shadow-md space-y-4">
							<div class="border-b border-stone-100 pb-2.5">
								<h3 class="font-display text-sm font-black text-[#1B4332]">
									تأكيد الطلب الفوري (الدفع عند الاستلام)
								</h3>
								<p class="text-[11px] text-stone-500">
									عمّري معلوماتك وبداي روتينك خلال 24 إلى 48 ساعة
								</p>
							</div>

							{#if phoneError}
								<div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
									⚠️ {phoneError}
								</div>
							{/if}

							<form onsubmit={handleOrderSubmit} class="space-y-3">
								<div>
									<label for="drawer-name" class="block text-xs font-bold text-stone-700 mb-1">
										الاسم الكامل <span class="text-rose-500">*</span>
									</label>
									<input
										id="drawer-name"
										type="text"
										bind:value={fullName}
										required
										placeholder="مثال: هاجر العمراني"
										class="w-full h-11 rounded-xl border border-stone-200 bg-[#FAF8F5] px-3.5 text-xs sm:text-sm font-semibold outline-none focus:border-[#1B4332] focus:bg-white transition-all"
									/>
								</div>

								<div>
									<label for="drawer-phone" class="block text-xs font-bold text-stone-700 mb-1">
										رقم الهاتف (للتوصيل) <span class="text-rose-500">*</span>
									</label>
									<input
										id="drawer-phone"
										type="tel"
										bind:value={phone}
										required
										dir="ltr"
										placeholder="06XXXXXXXX أو 07XXXXXXXX"
										class="w-full h-11 rounded-xl border border-stone-200 bg-[#FAF8F5] px-3.5 text-xs sm:text-sm font-semibold outline-none focus:border-[#1B4332] focus:bg-white text-start transition-all"
									/>
								</div>

								<!-- Doorstep Inspection Reassurance Badge -->
								<div class="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-2.5 text-[11px] text-emerald-950 font-semibold space-y-1">
									<div class="flex items-center gap-1.5 font-black text-emerald-900">
										<span>🛡️</span>
										<span>ضمان المعاينة الكاملة عند باب دارك:</span>
									</div>
									<p class="text-[10px] leading-relaxed">
										افحصي علب NOVAVITA وتأكدي من سلامتها وختم الأمان بنفسك قبل دفع أي درهم للموزع.
									</p>
								</div>

								<!-- Order Summary Details -->
								<div class="space-y-1.5 text-xs font-bold text-stone-600 border-t border-stone-100 pt-2.5">
									<div class="flex justify-between">
										<span>المجموع الجزئي:</span>
										<span class="text-[#1F2937]" dir="ltr">{subtotal} MAD</span>
									</div>
									<div class="flex justify-between">
										<span>التوصيل:</span>
										{#if shippingFee === 0}
											<span class="text-emerald-700 font-black">مجاني فابور 🚚</span>
										{:else}
											<span class="text-stone-700" dir="ltr">29 MAD</span>
										{/if}
									</div>
									<div class="flex justify-between text-base font-black text-[#1B4332] pt-2 border-t border-stone-100">
										<span>المجموع النهائي للدفع:</span>
										<span class="text-xl font-black text-[#E86A7C]" dir="ltr">{grandTotal} MAD</span>
									</div>
								</div>

								<!-- Submit Button -->
								<button
									type="submit"
									disabled={isSubmitting || cart.count === 0}
									class="w-full min-h-13 rounded-2xl bg-[#E86A7C] hover:bg-[#d45366] active:scale-[0.98] font-black text-white text-base shadow-xl shadow-rose-900/15 transition-all duration-300 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-2"
								>
									{#if isSubmitting}
										<span>جاري تأكيد طلبك... ⏳</span>
									{:else}
										<span>تأكيد الطلب الآن (الدفع عند الاستلام) 🛍️</span>
									{/if}
								</button>

								<p class="text-center text-[10px] font-bold text-stone-400 pt-0.5">
									🔒 معلوماتك مشفرة ومحمية • التوصيل خلال 24 إلى 48 ساعة
								</p>
							</form>
						</div>

					{/if}
				</div>

			</aside>
		</div>
	</div>
{/if}
