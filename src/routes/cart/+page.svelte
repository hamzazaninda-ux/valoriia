<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { PRODUCTS, type CatalogProduct, buildOrderFulfillmentLabel } from '$lib/data/products';
	import { PRICING_TIERS, type PricingTierId } from '$lib/constants/pricing';
	import { fbqTrack } from '$lib/tracking/pixel';
	import { sendOrder, trackPurchase } from '$lib/utils/checkout';

	let { data } = $props();

	const initialProduct = $derived(data.product || PRODUCTS[0]);
	const brand = $derived(data.brand || { name: 'NOVAVITA', tagline: 'العناية بالجمال والصحة من الداخل' });

	// Tier Selection
	let selectedTier = $state<PricingTierId>('tier_2');
	const currentTier = $derived(PRICING_TIERS[selectedTier]);

	// COD Form inputs
	let fullName = $state('');
	let phone = $state('');
	let city = $state('');
	let nameError = $state('');
	let phoneError = $state('');
	let isSubmitting = $state(false);

	// Derived values from cart
	const mainItem = $derived(cart.getMainItem());
	const upsellItems = $derived(cart.getUpsellItems());
	const subtotal = $derived(cart.subtotal);

	// Available upsells (products other than the main item)
	const remainingUpsellProducts = $derived.by(() => {
		const mainSku = mainItem?.sku || initialProduct.sku;
		return PRODUCTS.filter((p) => p.sku !== mainSku);
	});

	function initDefaultCart() {
		if (cart.lines.length === 0) {
			const p = initialProduct;
			const cleanName = p.name.replace(/\s*\([^)]*\)/g, '').trim();
			cart.setMainItem({
				slug: p.slug,
				sku: p.sku,
				title: `${cleanName} (علبتان)`,
				subtitle: 'علبتان • شهرين متواصلين + توصيل فابور 🚚',
				image: p.image,
				price: PRICING_TIERS.tier_2.price,
				tier: 'tier_2',
				tierTitle: PRICING_TIERS.tier_2.title
			});
		} else if (mainItem?.tier) {
			selectedTier = mainItem.tier as PricingTierId;
		}
	}

	function handleTierChange(tierId: PricingTierId) {
		selectedTier = tierId;
		const tier = PRICING_TIERS[tierId];
		const p = PRODUCTS.find((x) => x.sku === mainItem?.sku) || initialProduct;
		const bundleName = tier.units === 1 ? 'علبة واحدة' : tier.units === 2 ? 'علبتان' : '3 علب';
		const bundleSubtitle =
			tier.units === 1
				? 'علبة واحدة • شهر تجريبي'
				: tier.units === 2
					? 'علبتان • شهرين متواصلين + توصيل فابور 🚚'
					: '3 علب • كورس علاجي كامل 3 أشهر متواصلة + توصيل فابور 🚚';

		const cleanName = p.name.replace(/\s*\([^)]*\)/g, '').trim();
		const displayTitle = `${cleanName} (${bundleName})`;

		cart.setMainItem({
			slug: p.slug,
			sku: p.sku,
			title: displayTitle,
			subtitle: bundleSubtitle,
			image: p.image,
			price: tier.price,
			tier: tierId,
			tierTitle: tier.title
		});
	}

	function handleToggleUpsell(p: CatalogProduct) {
		cart.toggleUpsell(p);
	}

	function validatePhone(input: string): boolean {
		const cleaned = input.replace(/[\s\-\(\)]/g, '');
		const regex = /^(?:(?:\+?212)|0)[567]\d{8}$/;
		return regex.test(cleaned);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		nameError = '';
		phoneError = '';

		if (!fullName.trim() || fullName.trim().length < 2) {
			nameError = 'يرجى كتابة الاسم الكامل';
			return;
		}

		const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
		if (!cleanedPhone || !validatePhone(phone)) {
			phoneError = 'يرجى إدخال رقم هاتف مغربي صحيح لتأكيد التوصيل';
			return;
		}

		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const orderId = 'NV-' + Math.floor(100000 + Math.random() * 900000);
			const activeMain = cart.getMainItem() || {
				sku: initialProduct.sku,
				title: initialProduct.name,
				price: currentTier.price
			};

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

			const baseTierBottles = selectedTier === 'tier_1' ? 1 : selectedTier === 'tier_3' ? 3 : 2;
			const totalBottles = baseTierBottles + (upsells.length > 0 ? upsells.length : 0);

			const fullProductLabel = buildOrderFulfillmentLabel({
				tier: selectedTier,
				mainSku: activeMain.sku,
				mainTitle: activeMain.title,
				items,
				hasUpsell: upsells.length > 0
			});

			const isCollagen =
				(activeMain.sku || '').toLowerCase().includes('collagen') ||
				((activeMain as any).slug || '').toLowerCase().includes('collagen') ||
				(activeMain.title || '').toLowerCase().includes('كولاجين') ||
				(activeMain.title || '').toLowerCase().includes('collagen');
			const hasUpsell = upsells.length > 0;
			const isCollagenUpsell = isCollagen && hasUpsell;

			const orderPayload = {
				orderId,
				fullName: fullName.trim(),
				phone: cleanedPhone,
				phoneNumber: cleanedPhone,
				city: city.trim() || 'يُحدد عند التأكيد',
				address: city.trim() || 'يُحدد عند التأكيد',
				tier: selectedTier,
				baseTier: selectedTier,
				baseBottles: baseTierBottles,
				tierName: selectedTier === 'tier_1' ? 'علبة واحدة (1 علبة)' : selectedTier === 'tier_3' ? '3 علب (كورس علاجي)' : 'علبتان (2 علب)',
				upsellProduct: upsellName || undefined,
				upsellName: upsellName || undefined,
				upsellSku: activeUpsell?.sku,
				totalBottles,
				quantity: totalBottles,
				qte: totalBottles,
				items,
				subtotal,
				shipping: 0,
				total: subtotal,
				totalPrice: subtotal,
				price: subtotal,
				hasUpsell,
				createdAt: new Date().toISOString(),
				date: new Date().toLocaleDateString('ar-MA', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				}),
				product: fullProductLabel,
				productTitle: fullProductLabel,
				selectedOfferTitle: fullProductLabel,
				sku: activeMain.sku || 'gummies_collagen',
				mainSku: activeMain.sku || 'gummies_collagen',
				pageUrl: typeof window !== 'undefined' ? window.location.href : 'https://novavita.store/cart',
				orderType: 'cart'
			};

			// Save in local & session storage for thank you page
			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('latestOrder', JSON.stringify(orderPayload));
					sessionStorage.setItem('latestOrder', JSON.stringify(orderPayload));
					sessionStorage.setItem('lastCompletedOrder', JSON.stringify(orderPayload));
				} catch {
					// fallback
				}
			}

			// Submit to server endpoint
			await sendOrder(orderPayload);

			// Fire Purchase tracking strictly upon order success
			trackPurchase(subtotal, fullProductLabel, orderId, cleanedPhone);

			// Clear cart and redirect to thank-you page
			cart.clear();
			await goto('/thank-you', { replaceState: true });
		} catch (err) {
			console.error('[Cart] Order submission failed:', err);
			phoneError = 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.';
			isSubmitting = false;
		}
	}

	onMount(() => {
		initDefaultCart();

		// Trigger Meta Pixel AddToCart event strictly on page load (Deduplicated)
		if (typeof window !== 'undefined') {
			fbqTrack('AddToCart', {
				content_name: initialProduct.name || 'NOVAVITA Gummies Bundle',
				content_type: 'product',
				currency: 'MAD',
				value: currentTier.price || 249
			});
		}
	});
</script>

<svelte:head>
	<title>سلة الطلب وإتمام الشراء | NOVAVITA</title>
	<meta name="description" content="إتمام طلب باقة مكملات نوفافيتا الطبيعية - الدفع عند الاستلام مع توصيل مجاني سريع." />
</svelte:head>

<div class="min-h-screen bg-[#FAF8F5] text-stone-900 pb-16" dir="rtl">
	<!-- Top Bar -->
	<header class="bg-white border-b border-black/5 sticky top-0 z-30 shadow-xs">
		<div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-9 h-9 rounded-full bg-[#1B4332] text-white font-black text-sm flex items-center justify-center shadow-xs">
					N
				</div>
				<span class="font-display font-black text-lg text-[#1B4332] tracking-tight">{brand.name}</span>
			</a>
			<div class="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/50">
				<span>🔒 إتمام الطلب المشفر</span>
				<span>•</span>
				<span>COD</span>
			</div>
		</div>
	</header>

	<!-- Progress / Trust Banner -->
	<div class="bg-[#1B4332] text-white py-2.5 px-4 text-center text-xs font-bold">
		<div class="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
			<span>🚚 توصيل فابور لجميع مدن المغرب (24/48h)</span>
			<span class="text-emerald-400">•</span>
			<span>📦 فتحي الكولية وقلبيها عاد تخلصي</span>
			<span class="text-emerald-400">•</span>
			<span>✓ حلال 100%</span>
		</div>
	</div>

	<main class="max-w-3xl mx-auto px-4 pt-6 space-y-6">
		<!-- Main Item Card -->
		<div class="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-black/5 space-y-5">
			<div class="flex items-center justify-between border-b border-stone-100 pb-3">
				<h2 class="font-display font-black text-base sm:text-lg text-[#1B4332] flex items-center gap-2">
					<span>🛍️ باقة المكملات المختارة</span>
				</h2>
				<span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
					✓ متوفر في المخزون
				</span>
			</div>

			<!-- Product Details & Image -->
			<div class="flex gap-4 items-center">
				<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF8F5] border border-black/5 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
					<img
						src={mainItem?.image || initialProduct.image}
						alt={mainItem?.title || initialProduct.name}
						class="w-full h-full object-contain"
					/>
				</div>
				<div class="space-y-1">
					<h3 class="font-bold text-sm sm:text-base text-stone-900 leading-snug">
						{mainItem?.title || initialProduct.name}
					</h3>
					<p class="text-xs text-stone-500 font-medium">
						{mainItem?.subtitle || 'باقة كولاجين وبيوتين مركزة بالبكتين النباتي الطبيعي'}
					</p>
					<div class="pt-1 flex items-center gap-2">
						<span class="font-black text-lg text-[#1B4332]" dir="ltr">{mainItem?.price || currentTier.price} MAD</span>
						<span class="text-xs text-[#E86A7C] font-bold bg-[#E86A7C]/10 px-2 py-0.5 rounded-md">توصيل مجاني 🚚</span>
					</div>
				</div>
			</div>

			<!-- Bundle Tier Selector -->
			<div class="space-y-2 pt-2">
				<p class="text-xs font-bold text-stone-700">اختاري حجم الباقة المناسبة لكي:</p>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
					<!-- Tier 1 -->
					<button
						type="button"
						onclick={() => handleTierChange('tier_1')}
						class="p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer {selectedTier === 'tier_1' ? 'border-[#1B4332] bg-emerald-50/50 shadow-xs' : 'border-stone-200 hover:border-stone-300'}"
					>
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-stone-800">علبة واحدة</span>
							<span class="text-xs font-black text-[#1B4332]" dir="ltr">199 MAD</span>
						</div>
						<span class="text-[11px] text-stone-500 mt-1">شهر تجريبي</span>
					</button>

					<!-- Tier 2 (Most Popular) -->
					<button
						type="button"
						onclick={() => handleTierChange('tier_2')}
						class="p-3 rounded-2xl border text-right relative transition-all flex flex-col justify-between cursor-pointer {selectedTier === 'tier_2' ? 'border-[#1B4332] bg-emerald-50/70 shadow-xs ring-1 ring-[#1B4332]' : 'border-stone-200 hover:border-stone-300'}"
					>
						<span class="absolute -top-2.5 left-3 bg-[#E86A7C] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
							الأكثر طلباً ⭐
						</span>
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-stone-900">علبتان (شهرين متواصلين)</span>
							<span class="text-xs font-black text-[#1B4332]" dir="ltr">249 MAD</span>
						</div>
						<span class="text-[11px] text-emerald-800 font-semibold mt-1">توصيل فابور مجاني</span>
					</button>

					<!-- Tier 3 -->
					<button
						type="button"
						onclick={() => handleTierChange('tier_3')}
						class="p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer {selectedTier === 'tier_3' ? 'border-[#1B4332] bg-emerald-50/50 shadow-xs' : 'border-stone-200 hover:border-stone-300'}"
					>
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-stone-800">3 علب (كورس كامل)</span>
							<span class="text-xs font-black text-[#1B4332]" dir="ltr">349 MAD</span>
						</div>
						<span class="text-[11px] text-stone-500 mt-1">كورس 3 أشهر متواصلة + توصيل فابور 🚚</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Secret VIP Deals (Add 2nd product for 99 MAD) -->
		{#if remainingUpsellProducts.length > 0}
			<div class="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-xs space-y-3">
				<div class="flex items-center gap-2 text-amber-900">
					<h3 class="font-display font-black text-sm sm:text-base">
						🔥 سرّعي نتيجتك 2X (عرض حصري بـ 99 DH فقط مع طلبك):
					</h3>
				</div>
				<p class="text-xs text-amber-800/90 leading-relaxed">
					استفيدي من خصم 50% على المنتجات التكميلية لتثبيت الكولاجين، طرد الخمول ومضاعفة نضارة البشرة وكثافة الشعر:
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
					{#each remainingUpsellProducts as up (up.sku)}
						{@const isAdded = cart.isUpsellActive(up.sku)}
						<div class="bg-white rounded-2xl p-3 border {isAdded ? 'border-amber-500 ring-1 ring-amber-400 bg-amber-50/20' : 'border-amber-200/60'} flex items-center justify-between gap-3 transition-all">
							<div class="flex items-center gap-2.5">
								<img src={up.image} alt={up.name} class="w-12 h-12 object-contain rounded-xl bg-[#FAF8F5] border border-black/5 p-1 shrink-0" />
								<div>
									<h4 class="font-bold text-xs text-stone-900 line-clamp-1">{up.name}</h4>
									<div class="flex items-center gap-1.5 mt-0.5">
										<span class="font-black text-xs text-[#1B4332]" dir="ltr">+ 99 MAD</span>
										<span class="text-[10px] text-stone-400 line-through" dir="ltr">199 MAD</span>
									</div>
								</div>
							</div>
							<button
								type="button"
								onclick={() => handleToggleUpsell(up)}
								class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer {isAdded ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'}"
							>
								{isAdded ? '✓ مضاف للسلة' : '+ ضيفيه لروتينك (99 DH)'}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Checkout COD Order Form -->
		<div id="order" class="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-black/5 space-y-5">
			<div class="border-b border-stone-100 pb-3">
				<h2 class="font-display font-black text-base sm:text-lg text-[#1B4332] flex items-center gap-2">
					<span>📝 معلومات استلام الطلب</span>
				</h2>
				<p class="text-xs text-stone-500 mt-1">
					الدفع عند الاستلام بعد معاينة الطرد • التوصيل مجاني 100%
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Full Name -->
				<div>
					<label for="fullName" class="block text-xs font-bold text-stone-800 mb-1.5">
						الاسم الكامل <span class="text-[#E86A7C]">*</span>
					</label>
					<input
						id="fullName"
						type="text"
						bind:value={fullName}
						placeholder="مثال: مريم العلمي"
						class="w-full text-sm rounded-xl border border-stone-300 p-3.5 focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] outline-none transition-all bg-[#FAF8F5]/60"
						required
					/>
					{#if nameError}
						<p class="text-xs text-red-600 font-semibold mt-1">{nameError}</p>
					{/if}
				</div>

				<!-- Phone Number -->
				<div>
					<label for="phone" class="block text-xs font-bold text-stone-800 mb-1.5">
						رقم الهاتف (للاتصال والتأكيد) <span class="text-[#E86A7C]">*</span>
					</label>
					<input
						id="phone"
						type="tel"
						dir="ltr"
						bind:value={phone}
						placeholder="06XXXXXXXX / 07XXXXXXXX"
						class="w-full text-sm rounded-xl border border-stone-300 p-3.5 focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] outline-none transition-all bg-[#FAF8F5]/60 text-right"
						required
					/>
					{#if phoneError}
						<p class="text-xs text-red-600 font-semibold mt-1">{phoneError}</p>
					{/if}
				</div>

				<!-- City -->
				<div>
					<label for="city" class="block text-xs font-bold text-stone-800 mb-1.5">
						المدينة والعنوان (اختياري)
					</label>
					<input
						id="city"
						type="text"
						bind:value={city}
						placeholder="مثال: الدار البيضاء، المعاريف"
						class="w-full text-sm rounded-xl border border-stone-300 p-3.5 focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] outline-none transition-all bg-[#FAF8F5]/60"
					/>
				</div>

				<!-- Order Pricing Summary -->
				<div class="bg-[#FAF8F5] rounded-2xl p-4 border border-black/5 space-y-2 mt-4">
					<div class="flex justify-between text-xs text-stone-600">
						<span>مجموع المنتجات:</span>
						<span class="font-bold text-stone-900" dir="ltr">{subtotal} MAD</span>
					</div>
					<div class="flex justify-between text-xs text-emerald-700 font-bold">
						<span>مصاريف التوصيل السريع (24/48h):</span>
						<span>مجاناً فابور 🚚</span>
					</div>
					<div class="border-t border-stone-200/80 pt-2 flex justify-between items-center">
						<span class="font-black text-sm text-stone-900">المبلغ الإجمالي للدفع عند الباب:</span>
						<span class="font-black text-xl text-[#1B4332]" dir="ltr">{subtotal} MAD</span>
					</div>
				</div>

				<!-- Big Submit CTA Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#143427] text-white font-black text-base shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							<span>جاري تسجيل طلبك بأمان...</span>
						{:else}
							<span>تأكيد الطلب الآن • الدفع عند الاستلام 🛍️</span>
							<span class="text-lg">←</span>
						{/if}
					</button>
				</div>
			</form>

			<!-- Triplet Reassurance Badges -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 text-center border-t border-stone-100">
				<div class="bg-[#FAF8F5] p-2.5 rounded-xl border border-black/5">
					<p class="text-xs font-bold text-stone-800">🚚 توصيل فابور</p>
					<p class="text-[10px] text-stone-500 mt-0.5">خلال 24-48 ساعة لجميع المدن</p>
				</div>
				<div class="bg-[#FAF8F5] p-2.5 rounded-xl border border-black/5">
					<p class="text-xs font-bold text-stone-800">📦 معاينة قبل الدفع</p>
					<p class="text-[10px] text-stone-500 mt-0.5">حلي الكولية وشوفيها عاد خلصي</p>
				</div>
				<div class="bg-[#FAF8F5] p-2.5 rounded-xl border border-black/5">
					<p class="text-xs font-bold text-stone-800">🛡️ ضمان الجودة 100%</p>
					<p class="text-[10px] text-stone-500 mt-0.5">بكتين نباتي طبيعي حلال</p>
				</div>
			</div>
		</div>
	</main>
</div>
