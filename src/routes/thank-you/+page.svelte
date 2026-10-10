<script lang="ts">
	import { onMount } from 'svelte';

	let { data }: { data?: { whatsappNumber?: string } } = $props();

	interface OrderItemDetail {
		sku?: string;
		title: string;
		quantity: number;
		unitPrice?: number;
		price?: number;
	}

	interface OrderData {
		orderId: string;
		fullName: string;
		phoneNumber: string;
		address: string;
		date: string;
		price: number;
		tier?: string;
		productTitle?: string;
		hasUpsell?: boolean;
		items?: OrderItemDetail[];
	}

	// Order data state
	let order = $state<OrderData | null>(null);
	let copied = $state(false);

	// Phone edit state
	let isEditingPhone = $state(false);
	let newPhone = $state('');
	let phoneUpdateSuccess = $state(false);

	// Time check: daytime (9:00 - 21:00) vs night
	let isDaytime = $state(true);

	const currentTotal = $derived(order?.price || 279);

	onMount(async () => {
		const hour = new Date().getHours();
		isDaytime = hour >= 9 && hour < 21;

		let rawOrder: any = null;

		// 1. Read from localStorage or sessionStorage
		if (typeof window !== 'undefined') {
			try {
				const localData = localStorage.getItem('latestOrder');
				const sessionData =
					sessionStorage.getItem('latestOrder') || sessionStorage.getItem('lastCompletedOrder');
				if (localData) {
					rawOrder = JSON.parse(localData);
				} else if (sessionData) {
					rawOrder = JSON.parse(sessionData);
				}
			} catch (e) {
				console.error('Error parsing stored order:', e);
			}
		}

		// 2. Read query params for fallback/overrides
		const urlParams =
			typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
		const paramName =
			urlParams?.get('name') || urlParams?.get('fullName') || urlParams?.get('client');
		const paramPhone =
			urlParams?.get('phone') || urlParams?.get('phoneNumber') || urlParams?.get('tel');
		const paramCity = urlParams?.get('city') || urlParams?.get('address');
		const paramOrderId = urlParams?.get('orderId') || urlParams?.get('id');
		const paramTotal = urlParams?.get('total') || urlParams?.get('price');
		const paramUpsell = urlParams?.get('hasUpsell') === 'true';

		const orderId =
			rawOrder?.orderId ||
			rawOrder?.id ||
			paramOrderId ||
			'NV-' + Math.floor(100000 + Math.random() * 900000);

		const fullName =
			rawOrder?.fullName ||
			rawOrder?.name ||
			rawOrder?.clientName ||
			paramName ||
			'عميلة NOVAVITA المميزة';

		const phoneNumber =
			rawOrder?.phoneNumber ||
			rawOrder?.phone ||
			rawOrder?.tel ||
			rawOrder?.telephone ||
			paramPhone ||
			'';

		const address =
			rawOrder?.address || rawOrder?.city || paramCity || 'تحدد عند اتصال التأكيد';

		const totalPrice = Number(
			rawOrder?.total || rawOrder?.price || rawOrder?.totalPrice || paramTotal || 279
		);

		let items: OrderItemDetail[] = [];
		if (Array.isArray(rawOrder?.items)) {
			items = rawOrder.items;
		} else if (typeof rawOrder?.items === 'string') {
			try {
				items = JSON.parse(rawOrder.items);
			} catch {
				items = [];
			}
		}

		if (items.length === 0) {
			const tier = rawOrder?.tier || 'tier_2';
			if (tier === 'tier_1') {
				items.push({
					sku: 'gummies_biotine',
					title: 'علكات البيوتين المركزة (علبة واحدة)',
					quantity: 1,
					unitPrice: 199
				});
			} else if (tier === 'tier_3') {
				items.push(
					{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, unitPrice: 116 },
					{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, unitPrice: 116 },
					{ sku: 'gumies_vitamine', title: 'علكات الفيتامينات المتعددة', quantity: 1, unitPrice: 117 }
				);
			} else {
				items.push(
					{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, unitPrice: 139.5 },
					{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, unitPrice: 139.5 }
				);
			}
			if (rawOrder?.hasUpsell || paramUpsell) {
				items.push({
					sku: 'gummies_collagen',
					title: 'علبة إضافية (عرض خاطف)',
					quantity: 1,
					unitPrice: 99
				});
			}
		}

		order = {
			orderId: String(orderId),
			fullName,
			phoneNumber,
			address,
			date: rawOrder?.date || new Date().toLocaleDateString('ar-MA'),
			price: totalPrice,
			productTitle:
				rawOrder?.productTitle || rawOrder?.product || 'باقة حلوى الفيتامينات الطبيعية NOVAVITA',
			hasUpsell: !!(rawOrder?.hasUpsell || paramUpsell),
			tier: rawOrder?.tier || 'tier_2',
			items
		};

		// Keep persistent copy in storage
		if (typeof window !== 'undefined') {
			try {
				sessionStorage.setItem('latestOrder', JSON.stringify(order));
				sessionStorage.setItem('lastCompletedOrder', JSON.stringify(order));
				localStorage.setItem('latestOrder', JSON.stringify(order));
			} catch {}
		}

		// ==========================================
		// TRACKING PIXELS IDEMPOTENT EXECUTION
		// ==========================================
		if (typeof window !== 'undefined' && orderId) {
			const trackingKey = `nv_tracked_${orderId}`;
			const alreadyFired = sessionStorage.getItem(trackingKey);

			if (!alreadyFired) {
				// 1. Google Ads Conversion Firing
				if (typeof (window as any).gtag === 'function') {
					try {
						(window as any).gtag('event', 'conversion', {
							send_to: 'AW-17426876482/SmXBCMqzj5cdEMKQ5PVA',
							value: totalPrice,
							currency: 'MAD',
							transaction_id: orderId
						});
						(window as any).gtag('event', 'purchase', {
							send_to: 'AW-17426876482/SmXBCMqzj5cdEMKQ5PVA',
							transaction_id: orderId,
							value: totalPrice,
							currency: 'MAD',
							items: items.map((it) => ({
								item_id: it.sku,
								item_name: it.title,
								price: it.unitPrice || it.price,
								quantity: it.quantity
							}))
						});
						console.log('✅ [Pixel] Google Ads purchase fired:', { orderId, totalPrice });
					} catch (err) {
						console.warn('⚠️ [Pixel] Google Ads firing error:', err);
					}
				}

				// 2. TikTok Pixel Firing
				if ((window as any).ttq && typeof (window as any).ttq.track === 'function') {
					try {
						(window as any).ttq.track(
							'CompletePayment',
							{
								content_id: items[0]?.sku || 'novavita_bundle',
								content_type: 'product',
								value: totalPrice,
								currency: 'MAD'
							},
							{ event_id: orderId }
						);
						console.log('✅ [Pixel] TikTok CompletePayment fired:', { orderId });
					} catch (err) {
						console.warn('⚠️ [Pixel] TikTok firing error:', err);
					}
				}

				// 3. Snapchat Pixel Firing
				if ((window as any).snaptr && typeof (window as any).snaptr.track === 'function') {
					try {
						const phoneClean = phoneNumber.replace(/[\s\-\(\)]/g, '');
						const formattedPhone = phoneClean.startsWith('+')
							? phoneClean
							: '+212' + phoneClean.replace(/^0/, '');
						if (formattedPhone && formattedPhone !== '+212') {
							(window as any).snaptr('init', '0f0bf0bb-3983-47ea-9a39-90f43b1cf3ce', {
								user_phone_number: formattedPhone
							});
						}
						(window as any).snaptr('track', 'PURCHASE', {
							price: totalPrice,
							currency: 'MAD',
							transaction_id: orderId
						});
						console.log('✅ [Pixel] Snapchat PURCHASE fired:', { orderId });
					} catch (err) {
						console.warn('⚠️ [Pixel] Snapchat firing error:', err);
					}
				}

				sessionStorage.setItem(trackingKey, 'true');
			} else {
				console.log(`🛡️ [Pixel] Conversion already fired for order ${orderId}. Skipping.`);
			}
		}
	});

	function copyOrderId() {
		if (!order?.orderId) return;
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard
				.writeText(order.orderId)
				.then(() => {
					copied = true;
					setTimeout(() => {
						copied = false;
					}, 2500);
				})
				.catch(() => {});
		}
	}

	function startEditPhone() {
		newPhone = order?.phoneNumber || '';
		isEditingPhone = true;
		phoneUpdateSuccess = false;
	}

	async function savePhone() {
		if (!newPhone.trim() || !order) return;
		const clean = newPhone.trim().replace(/[\s\-\(\)]/g, '');
		order.phoneNumber = clean;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('latestOrder', JSON.stringify(order));
		}
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('latestOrder', JSON.stringify(order));
			sessionStorage.setItem('lastCompletedOrder', JSON.stringify(order));
		}
		isEditingPhone = false;
		phoneUpdateSuccess = true;
		setTimeout(() => {
			phoneUpdateSuccess = false;
		}, 4000);
	}

	const whatsappUrl = $derived.by(() => {
		const orderId = order?.orderId || 'NV-000000';
		const waNum = (data?.whatsappNumber || '212600000000').replace(/\D/g, '') || '212600000000';
		const clientName =
			order?.fullName && order.fullName !== 'عميلة NOVAVITA المميزة'
				? order.fullName
				: 'عميلة NOVAVITA';
		const total = order?.price || 279;
		const msg = `سلام عليكم، أنا ${clientName} قمت بطلب حلوى الفيتامينات من NOVAVITA ورقم طلبي هو ${orderId} بمبلغ ${total} درهم، بغيت نأكد الطلب ديالي للاستلام والتوصيل السريع.`;
		return `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
	});

	function handleBackHome() {
		window.location.href = '/';
	}
</script>

<svelte:head>
	<title>تم تأكيد طلبك بنجاح | NOVAVITA Gummies</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Premium High-Converting Container -->
<div
	class="max-w-xl mx-auto bg-[#FAF8F5] text-[#1F2937] shadow-2xl min-h-screen flex flex-col justify-between border-x border-stone-200/60 relative"
	dir="rtl"
>
	<!-- Top Bar -->
	<div
		class="bg-[#1B4332] text-white text-center py-2.5 px-4 text-xs font-black shadow-xs flex items-center justify-center gap-2"
	>
		<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
		<span>تهانينا! تم تسجيل حجزك بنجاح وبداية رحلة إشراقتك الطبيعية ✨</span>
	</div>

	<!-- Main Content Area -->
	<main class="flex-1 px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
		<!-- 1. Header & Brand Icon -->
		<div class="relative flex items-center justify-center mb-4 mt-2">
			<div class="absolute w-20 h-20 bg-emerald-500/15 rounded-full animate-ping duration-1000"></div>
			<div class="absolute w-16 h-16 bg-[#1B4332]/20 rounded-full animate-pulse"></div>
			<div
				class="relative w-14 h-14 bg-gradient-to-tr from-[#1B4332] to-[#2D6A4F] rounded-full flex items-center justify-center shadow-lg text-white font-serif font-black text-2xl border-2 border-emerald-300/40"
			>
				N
			</div>
		</div>

		<h1
			class="text-xl sm:text-2xl font-black font-display text-[#1B4332] text-center mb-1.5 leading-snug"
		>
			شكراً {order?.fullName && order.fullName !== 'عميلة NOVAVITA المميزة'
				? order.fullName
				: 'لثقتك في NOVAVITA'}!
		</h1>
		<p class="text-xs sm:text-sm text-stone-600 text-center max-w-md mb-4 leading-relaxed font-medium">
			تم تسجيل طلبك بنجاح في نظامنا. طاقم التوصيل يجهز الآن علبتك لتصلك طازجة حتى باب منزلك مع حق
			المعاينة قبل الدفع.
		</p>

		<!-- Order ID Badge with 1-click Copy -->
		<div
			class="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2 shadow-xs mb-6 text-xs sm:text-sm"
		>
			<span class="text-stone-500 font-medium">رقم الطلب:</span>
			<span class="font-mono font-black text-[#1B4332] tracking-wider"
				>{order?.orderId || 'NV-000000'}</span
			>
			<button
				type="button"
				onclick={copyOrderId}
				class="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
				title="نسخ رقم الطلب"
			>
				{#if copied}
					<span class="text-emerald-700 font-black">تم النسخ ✓</span>
				{:else}
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9 9 9 0 00-9 9"
						/>
					</svg>
					<span>نسخ</span>
				{/if}
			</button>
		</div>

		<!-- 2. Call Schedule Notice Card -->
		<div
			class="w-full rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-4 sm:p-5 mb-5 shadow-xs"
		>
			<div class="flex items-start gap-3">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/90 text-[#1B4332] mt-0.5 border border-emerald-300"
				>
					<svg
						class="h-6 w-6 text-[#1B4332]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 6.582c0-.71.474-1.356 1.185-1.444L7.5 4.772c.596-.073 1.186.235 1.41.779l1.64 4.002a1.502 1.502 0 01-.32 1.586l-1.897 1.897m0 0a15.023 15.023 0 004.757 4.757l1.897-1.897a1.502 1.502 0 011.586-.32l4.002 1.64c.544.224.852.814.779 1.41l-.366 2.985c-.088.711-.734 1.185-1.444 1.185C11.127 21 2.25 12.127 2.25 1.75c0-.71.474-1.356 1.185-1.444L6.582 2.25"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-sm sm:text-base font-extrabold text-neutral-900 leading-tight">
						{#if isDaytime}
							🟢 خدمة العملاء شغالة دابا
						{:else}
							🌙 استراحة فريق العمل المسائية
						{/if}
					</h3>
					<p class="text-xs sm:text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
						{#if isDaytime}
							سنتصل بك خلال <strong>15 إلى 30 دقيقة</strong> فقط لتأكيد العنوان وموعد التسليم.
						{:else}
							سنتصل بك غداً صباحاً ابتداءً من <strong>9:30 صباحاً</strong> لتأكيد العنوان وموعد التسليم.
						{/if}
					</p>

					<!-- Phone Display & Edit Action -->
					<div
						class="mt-3 pt-2.5 border-t border-emerald-200/70 flex items-center justify-between gap-2 flex-wrap text-xs"
					>
						<div class="flex items-center gap-1.5 font-bold text-neutral-800">
							<span class="text-neutral-500 font-normal">رقم هاتفك المسجل:</span>
							<span dir="ltr" class="font-mono text-[#1B4332] text-sm font-black"
								>{order?.phoneNumber || 'غير مسجل'}</span
							>
						</div>
						{#if !isEditingPhone}
							<button
								type="button"
								onclick={startEditPhone}
								class="text-[11px] font-extrabold text-[#1B4332] hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
							>
								تعديل الرقم ✏️
							</button>
						{/if}
					</div>

					<!-- Inline Edit Phone Form -->
					{#if isEditingPhone}
						<div
							class="mt-3 p-2.5 bg-white rounded-xl border border-emerald-300 shadow-xs flex items-center gap-2"
						>
							<input
								type="tel"
								bind:value={newPhone}
								dir="ltr"
								placeholder="06/07 xxxxxxxx"
								class="flex-1 px-3 py-1.5 text-xs sm:text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
							/>
							<button
								type="button"
								onclick={savePhone}
								class="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg hover:bg-emerald-900 cursor-pointer"
							>
								حفظ
							</button>
							<button
								type="button"
								onclick={() => {
									isEditingPhone = false;
								}}
								class="px-2 py-1.5 text-neutral-500 text-xs hover:text-neutral-700 cursor-pointer"
							>
								إلغاء
							</button>
						</div>
					{/if}

					{#if phoneUpdateSuccess}
						<p class="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
							<span>✓</span> تم تحديث رقم هاتفك بنجاح!
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- 3. WhatsApp 1-Click Action Button (Pulsing Green) -->
		<div class="w-full mb-5">
			<a
				href={whatsappUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="relative w-full py-4 px-4 font-black text-white bg-[#15803D] hover:bg-[#166534] active:scale-[0.98] rounded-2xl shadow-xl shadow-green-600/30 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all duration-300 no-underline text-center select-none cursor-pointer group overflow-hidden"
			>
				<span
					class="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-75 duration-1000 pointer-events-none"
				></span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="shrink-0 text-white animate-bounce"
				>
					<path
						d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.132 1.233 8.368 3.472 2.235 2.24 3.461 5.218 3.46 8.382-.003 6.526-5.328 11.851-11.859 11.851-2.008-.002-3.98-.513-5.735-1.488L0 24zm6.822-4.108l.385.228c1.398.831 2.978 1.27 4.606 1.271 5.234 0 9.493-4.258 9.495-9.492.001-2.536-.985-4.92-2.777-6.715-1.793-1.796-4.175-2.784-6.711-2.785-5.239 0-9.499 4.26-9.502 9.496-.002 1.705.447 3.37 1.299 4.808l.252.427-.999 3.65 3.753-.984zm11.23-5.385c-.328-.164-1.942-.959-2.242-1.069-.301-.11-.52-.164-.739.164-.219.328-.848 1.069-1.039 1.288-.192.219-.383.246-.711.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.148-.146.328-.383.493-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.739-1.777-1.012-2.435-.267-.641-.539-.553-.739-.563-.19-.01-.41-.01-.628-.01-.219 0-.575.082-.876.411-.301.328-1.15 1.123-1.15 2.738 0 1.615 1.177 3.176 1.34 3.395.164.219 2.316 3.537 5.611 4.96.783.338 1.396.54 1.872.691.787.25 1.5.215 2.066.13.631-.095 1.942-.794 2.216-1.56.273-.767.273-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"
					/>
				</svg>
				<span>💬 أكدي طلبك الآن مباشرة عبر الواتساب (توصيل أسرع)</span>
			</a>
		</div>

		<!-- 4. Demystifying the Call (3 Points) -->
		<div class="w-full rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 mb-5 shadow-xs">
			<h4 class="font-extrabold text-xs sm:text-sm text-neutral-900 mb-2.5">
				شنو غايوقع فالمكالمة السريعة؟
			</h4>
			<div class="space-y-2 text-xs sm:text-sm text-stone-700">
				<div class="flex items-start gap-2.5">
					<span class="text-base shrink-0 mt-0.5">⏱️</span>
					<p class="leading-relaxed">
						<strong>مكالمة في أقل من دقيقة:</strong> فقط للتأكد من تفاصيل العنوان والوقت المفضل للتسليم.
					</p>
				</div>
				<div class="flex items-start gap-2.5">
					<span class="text-base shrink-0 mt-0.5">💵</span>
					<p class="leading-relaxed">
						<strong>بدون أداء مسبق:</strong> الخلاص نقداً عند الاستلام فقط وبعد معاينة طلبيتك بيدك.
					</p>
				</div>
				<div class="flex items-start gap-2.5">
					<span class="text-base shrink-0 mt-0.5">🔄</span>
					<p class="leading-relaxed">
						<strong>إلى كنتِ مشغولة:</strong> ما كاين حتى مشكل، كنصيفطو ليك رسالة متابعة في الواتساب.
					</p>
				</div>
			</div>
		</div>

		<!-- 5. Order Summary Card -->
		{#if order}
			<div class="w-full rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 mb-5 shadow-xs">
				<div
					class="flex justify-between items-center text-xs font-bold text-stone-500 pb-3 border-b border-stone-100"
				>
					<span>تفاصيل الطلبية</span>
					<span class="bg-emerald-50 text-[#1B4332] px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-bold"
						>مؤكد بالحجز 🍓</span
					>
				</div>

				<!-- Items breakdown -->
				<div class="py-3 border-b border-stone-100 space-y-2">
					{#if order.items && order.items.length > 0}
						{#each order.items as it}
							<div class="flex justify-between items-center text-xs sm:text-sm">
								<div class="flex items-center gap-2">
									<span class="w-1.5 h-1.5 rounded-full bg-[#E86A7C]"></span>
									<span class="text-stone-800 font-semibold">{it.title}</span>
									<span class="text-stone-400 font-mono text-[11px]">(×{it.quantity})</span>
								</div>
								<span class="font-bold text-[#1B4332]">{it.unitPrice || it.price || 0} MAD</span>
							</div>
						{/each}
					{:else}
						<div class="flex justify-between items-center text-xs sm:text-sm">
							<span class="text-stone-800 font-bold">{order.productTitle}</span>
							<span class="font-bold text-[#1B4332]">{order.price} MAD</span>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-2 gap-y-2 text-xs sm:text-sm py-3 border-b border-stone-100">
					<span class="text-stone-500">الاسم الكامل:</span>
					<span class="text-stone-900 font-bold text-left">{order.fullName}</span>

					<span class="text-stone-500">المدينة / العنوان:</span>
					<span class="text-stone-900 font-bold text-left">{order.address}</span>

					<span class="text-stone-500">مصاريف الشحن:</span>
					<span class="text-emerald-700 font-bold text-left">توصيل مجاني (0 MAD)</span>
				</div>

				<div class="flex justify-between items-center pt-3">
					<span class="font-extrabold text-sm sm:text-base text-neutral-900">المجموع المطلوب عند الاستلام:</span>
					<span class="text-lg sm:text-xl font-black text-[#1B4332] font-mono">{currentTotal} MAD</span>
				</div>
			</div>
		{/if}

		<!-- 6. Order Journey Timeline -->
		<div class="w-full rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 mb-5 shadow-xs">
			<h4 class="font-extrabold text-sm sm:text-base text-[#1B4332] mb-4 text-center">
				رحلة علبة NOVAVITA حتى لباب دارك 🚚
			</h4>
			<div
				class="space-y-4 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200"
			>
				<!-- Step 1 -->
				<div class="flex items-start gap-3 relative">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4332] text-white text-xs font-bold z-10 shadow-xs"
					>
						✓
					</span>
					<div class="flex-1 pt-0.5">
						<div class="flex items-center justify-between">
							<h5 class="text-xs sm:text-sm font-extrabold text-neutral-900">1. تسجيل الطلب (الآن)</h5>
							<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded"
								>تم بنجاح ✅</span
							>
						</div>
						<p class="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
							تم حفظ طلبك بنجاح وجاري تجهيز العلب الطازجة من المستودع.
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex items-start gap-3 relative">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#1B4332] text-xs font-extrabold z-10 border border-emerald-300"
					>
						2
					</span>
					<div class="flex-1 pt-0.5">
						<h5 class="text-xs sm:text-sm font-extrabold text-neutral-900">2. مكالمة التأكيد (اليوم)</h5>
						<p class="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
							مكالمة هاتفية سريعة جداً أو رسالة عبر الواتساب لتأكيد العنوان والمدينة.
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex items-start gap-3 relative">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#1B4332] text-xs font-extrabold z-10 border border-emerald-300"
					>
						3
					</span>
					<div class="flex-1 pt-0.5">
						<h5 class="text-xs sm:text-sm font-extrabold text-neutral-900">3. الشحن السريع (خلال 24 ساعة)</h5>
						<p class="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
							إرسال الطلبية مع شركة التوصيل المعتمدة مباشرة لمدينتك.
						</p>
					</div>
				</div>

				<!-- Step 4 -->
				<div class="flex items-start gap-3 relative">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#1B4332] text-xs font-extrabold z-10 border border-emerald-300"
					>
						4
					</span>
					<div class="flex-1 pt-0.5">
						<h5 class="text-xs sm:text-sm font-extrabold text-neutral-900">
							4. المعاينة والاستلام (خلال 24-48 ساعة)
						</h5>
						<p class="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
							يتصل بك الموزع لتسليم العلبة حتى باب الدار، تفتحين وتتأكدين من طلبيتك عاد كتخلصي نقداً.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 7. Trust & Guarantee Callouts -->
		<div class="grid grid-cols-1 gap-2.5 mb-5 w-full">
			<div
				class="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 text-right"
			>
				<span class="text-2xl shrink-0">✨</span>
				<div>
					<h5 class="font-extrabold text-xs sm:text-sm text-emerald-950 mb-0.5">
						حق المعاينة قبل الدفع مضمون
					</h5>
					<p class="text-[11px] sm:text-xs text-emerald-900/80 leading-relaxed font-medium">
						عند استلامك للطلب، يمكنك فتح الطرد والتأكد من العلب المغلقة وتاريخ الصلاحية قبل دفع أي
						درهم للموزع.
					</p>
				</div>
			</div>

			<div
				class="flex items-start gap-3 p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 text-right"
			>
				<span class="text-2xl shrink-0">🍓</span>
				<div>
					<h5 class="font-extrabold text-xs sm:text-sm text-rose-950 mb-0.5">
						حلوى نباتية 100% بنكهة التوت الطبيعي
					</h5>
					<p class="text-[11px] sm:text-xs text-rose-900/80 leading-relaxed font-medium">
						مصنوعة من البكتين النباتي، حلال، خالية من الجيلاتين الحيواني ومطابقة لأعلى معايير السلامة
						الصحية.
					</p>
				</div>
			</div>
		</div>

		<!-- Back Home Button -->
		<button
			type="button"
			onclick={handleBackHome}
			class="w-full py-3.5 px-4 font-bold text-stone-700 border border-stone-300 hover:bg-stone-100 active:scale-[0.99] rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-center"
		>
			العودة لصفحة المتجر الرئيسية
		</button>
	</main>

	<!-- Footer -->
	<footer class="bg-[#1B4332] py-6 text-center text-xs text-emerald-200/80 px-4 space-y-1.5">
		<p class="font-bold text-white">NOVAVITA - العلامة المغربية الرائدة في حلوى الجمال والفيتامينات الطبيعية</p>
		<p>© {new Date().getFullYear()} NOVAVITA Morocco. جميع الحقوق محفوظة.</p>
	</footer>
</div>
