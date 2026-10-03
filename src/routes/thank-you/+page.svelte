<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { buildOrderPayload, sendOrder, trackPurchase } from '$lib/utils/checkout';

	let { data }: { data?: { sheetsUrl?: string } } = $props();

	interface OrderData {
		orderId: string;
		fullName: string;
		phoneNumber: string;
		address: string;
		date: string;
		qte?: number;
		price?: number;
		offer?: string;
		productTitle?: string;
		sku?: string;
	}

	// Order data state
	let order = $state<OrderData | null>(null);

	// Retrieve order data from localStorage and redirect home on page refresh
	onMount(() => {
		// Check if page was refreshed / reloaded
		const navEntries = performance.getEntriesByType('navigation');
		const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';

		if (isReload) {
			localStorage.removeItem('latestOrder');
			window.location.href = '/';
			return;
		}

		const stored = localStorage.getItem('latestOrder');
		if (stored) {
			try {
				order = JSON.parse(stored);
			} catch (e) {
				console.error('Error parsing stored order:', e);
			}
		}

		// If no order data found (visited page directly), redirect to home page
		if (!order) {
			window.location.href = '/';
			return;
		}
	});

	// Function to clear order and go home manually when user clicks button
	function handleBackHome() {
		localStorage.removeItem('latestOrder');
		window.location.href = '/';
	}

	// Post-order offer state (مسمار لاصق جداري — 20 قطعة بـ 99 DH)
	let offerStatus = $state<'idle' | 'loading' | 'added' | 'error'>('idle');

	async function handleAddOffer() {
		if (!order || offerStatus === 'loading' || offerStatus === 'added') return;
		offerStatus = 'loading';

		const fallbackSheetsUrl =
			'https://script.google.com/macros/s/AKfycbyQVUxZSp39uvD07JYBhuQLChWPwRRyyOhXT9iGoHvoJ1ge_SjPk0rqtIwPcF6_ksO7iQ/exec';
		const targetSheetsUrl = data?.sheetsUrl || fallbackSheetsUrl;

		const payload = buildOrderPayload(
			{ fullName: order.fullName, phoneNumber: order.phoneNumber },
			[
				{
					key: 'mismar-lasik-20pcs',
					slug: 'mismar-lasik',
					title: 'مسمار لاصق جداري — 20 قطعة',
					image: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/mismar-lasik.webp',
					price: 99,
					offerId: 0,
					offerTitle: 'عرض ما بعد الطلب: 20 قطعة',
					qty: 1
				}
			],
			{
				productTitle: 'مسمار لاصق جداري — 20 قطعة',
				sku: 'MISMAR-LASIK-20PCS',
				currency: 'DH',
				pageUrl: typeof window !== 'undefined' ? window.location.href : ''
			},
			'upsell',
			order.orderId
		);

		trackPurchase(99, 'مسمار لاصق جداري — 20 قطعة');

		try {
			await sendOrder(payload as Record<string, unknown>, targetSheetsUrl);
		} catch (e) {
			console.error('Error submitting post-order offer:', e);
		} finally {
			offerStatus = 'added';
		}
	}
</script>

<svelte:head>
	<title>شكراً لك! تم تسجيل طلبك بنجاح</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Premium Direct Response Container -->
<div class="max-w-xl mx-auto bg-background shadow-2xl min-h-screen flex flex-col justify-between border-x border-border/30 relative" dir="rtl">
	
	<!-- Top Success Banner -->
	<div class="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center py-2 px-4 text-xs font-bold shadow-sm">
		تهانينا! لقد تأهلت للحصول على شحن مجاني وسريع لطلبك
	</div>

	<!-- Main Thank You Content -->
	<main class="flex-1 px-5 py-8 flex flex-col items-center">
		
		<!-- Animated Celebratory Checkmark Icon -->
		<div class="relative flex items-center justify-center mb-6 mt-4">
			<div class="absolute w-20 h-20 bg-green-500/10 rounded-full animate-ping duration-1000"></div>
			<div class="absolute w-16 h-16 bg-green-500/20 rounded-full animate-pulse"></div>
			<div class="relative w-12 h-12 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6 text-white">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
			</div>
		</div>

		<!-- Celebratory Headers -->
		<h1 class="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-3">
			تم تسجيل طلبك بنجاح!
		</h1>
		
		<p class="text-sm sm:text-base text-muted-foreground text-center max-w-md mb-6 leading-relaxed px-2">
			شكراً لثقتكم بمنتجاتنا. لقد تم استلام تفاصيل طلبكم بنجاح في نظامنا.
		</p>

		<!-- Phone Confirmation Alert Box -->
		<div class="w-full bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 mb-8 text-right relative overflow-hidden shadow-xs" style="font-family: 'El Messiri', sans-serif;">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 animate-pulse">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 animate-bounce">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.582c0-.71.474-1.356 1.185-1.444L7.5 4.772c.596-.073 1.186.235 1.41.779l1.64 4.002a1.502 1.502 0 0 1-.32 1.586l-1.897 1.897m0 0a15.023 15.023 0 0 0 4.757 4.757l1.897-1.897a1.502 1.502 0 0 1 1.586-.32l4.002 1.64c.544.224.852.814.779 1.41l-.366 2.985c-.088.711-.734 1.185-1.444 1.185C11.127 21 2.25 12.127 2.25 1.75c0-.71.474-1.356 1.185-1.444L6.582 2.25" />
					</svg>
				</div>
				
				<div class="space-y-1.5 flex-1">
					<h4 class="text-sm font-extrabold text-amber-900 flex items-center gap-1">
						<span>⚠️ تنبيه هام: مكالمة الهاتف ضرورية لتأكيد الطلب!</span>
					</h4>
					<p class="text-xs sm:text-sm text-amber-800 leading-relaxed font-semibold">
						يرجى إبقاء هاتفكم مشغلاً وقريباً منكم لانتظار مكالمة فريق التأكيد (Confirmation) الخاص بنا:
					</p>
					<div class="space-y-1.5 pt-1 text-xs sm:text-sm text-amber-800 font-bold">
						<div class="flex items-center gap-2">
							<span>📞</span>
							<p><span>إذا طلبت الآن بالنهار:</span> سنتصل بك في <span class="underline">نفس اليوم</span> لتأكيد عنوان الشحن.</p>
						</div>
						<div class="flex items-center gap-2">
							<span>🌅</span>
							<p><span>إذا طلبت الآن بالليل:</span> سنتصل بك في <span class="underline">صباح الغد</span> مباشرة.</p>
						</div>
					</div>
					<p class="text-[10px] sm:text-[11px] text-amber-700 font-extrabold border-t border-amber-200/50 pt-1.5 mt-1">
						* شحنتك لن تخرج للتوصيل إلا بعد تأكيدها معك هاتفياً. شكراً لتفهمكم.
					</p>
				</div>
			</div>
		</div>

		<!-- Order Summary Card -->
		{#if order}
			<Card.Root class="w-full border border-border/60 shadow-lg overflow-hidden rounded-2xl bg-card mb-8">
				<div class="bg-muted/40 px-5 py-3 border-b border-border/40 flex justify-between items-center text-xs font-bold text-muted-foreground">
					<span>تفاصيل الطلب الخاص بك</span>
					<span class="bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-500/20">قيد المعالجة</span>
				</div>
				
				<Card.Content class="p-5 space-y-4">
					
					<!-- Details Grid -->
					<div class="grid grid-cols-2 gap-y-3.5 gap-x-2 text-sm border-b border-border/40 pb-4">
						{#if order.sku}
							<span class="text-muted-foreground font-medium text-right">رمز المنتج (SKU):</span>
							<span class="text-foreground font-extrabold text-left font-mono">{order.sku}</span>
						{/if}

						<span class="text-muted-foreground font-medium text-right">رقم الطلب:</span>
						<span class="text-foreground font-extrabold text-left font-mono">{order.orderId}</span>

						<span class="text-muted-foreground font-medium text-right">تاريخ الطلب:</span>
						<span class="text-foreground font-bold text-left">{order.date}</span>

						<span class="text-muted-foreground font-medium text-right">الاسم الكامل:</span>
						<span class="text-foreground font-bold text-left">{order.fullName}</span>

						<span class="text-muted-foreground font-medium text-right">رقم الهاتف:</span>
						<span class="text-foreground font-bold text-left font-mono" dir="ltr">{order.phoneNumber}</span>

						<span class="text-muted-foreground font-medium text-right">المدينة / Ville:</span>
						<span class="text-foreground font-bold text-left">{order.address}</span>

						{#if order.offer}
							<span class="text-muted-foreground font-medium text-right">العرض المختار:</span>
							<span class="text-foreground font-bold text-left text-xs">
								{order.offer}
							</span>
						{/if}
					</div>

					<!-- Pricing Summary -->
					<div class="pt-1.5 space-y-2 text-sm">
						<div class="flex justify-between items-center">
							<span class="text-muted-foreground font-medium">سعر الشحن:</span>
							<span class="text-emerald-600 font-bold">مجاني (Free)</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-muted-foreground font-medium">طريقة الدفع:</span>
							<span class="text-foreground font-bold">الدفع عند الاستلام</span>
						</div>
						<div class="flex justify-between items-center pt-2.5 border-t border-border/40">
							<span class="text-base font-extrabold text-foreground">المجموع الإجمالي:</span>
							<span class="text-lg font-extrabold text-emerald-600 font-mono">
								{#if order.price}
									{order.price} DH
								{:else}
									الدفع عند الاستلام
								{/if}
							</span>
						</div>
					</div>

				</Card.Content>
			</Card.Root>
		{:else}
			<div class="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border mb-6 w-full text-xs">
				تم تسجيل طلبك وتأكيده بالنظام.
			</div>
		{/if}

		<!-- Optional Post-Order Offer: مسمار لاصق جداري — 20 قطعة -->
		<Card.Root class="w-full border border-border/80 shadow-lg overflow-hidden rounded-2xl bg-card mb-8">
			<!-- Header Badge -->
			<div class="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 flex items-center justify-between text-white text-xs font-bold">
				<span class="flex items-center gap-1.5">
					<span>🎁</span>
					<span>عرض حصري إضافي لطلبك الحالي</span>
				</span>
				<span class="bg-white/20 px-2 py-0.5 rounded text-[11px] font-extrabold">توصيل مجاني مع طلبك</span>
			</div>

			<Card.Content class="p-5">
				<div class="flex flex-col sm:flex-row items-center gap-4">
					<!-- Clear Product Image -->
					<div class="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center">
						<img
							src="/images/mismar-lasik.webp"
							alt="مسمار لاصق جداري — 20 قطعة"
							class="w-full h-full object-cover"
							loading="lazy"
							onerror={(e) => {
								(e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/mismar-lasik.webp';
							}}
						/>
						<span class="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
							20 قطعة
						</span>
					</div>

					<!-- Product Info & CTA -->
					<div class="flex-1 text-right w-full">
						<h3 class="text-base sm:text-lg font-extrabold text-foreground leading-tight mb-1.5">
							مسمار لاصق جداري — 20 قطعة
						</h3>

						<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">
							تركيب سهل بدون حفر، مناسب للحمام والمطبخ وغرف المنزل.
						</p>

						<!-- Price & Quantity -->
						<div class="flex items-baseline gap-2 mb-3">
							<span class="text-2xl font-black text-emerald-600 font-mono">99 DH</span>
							<span class="text-xs font-bold text-muted-foreground">/ 20 قطعة فقط</span>
						</div>

						<!-- CTA Button / Status -->
						{#if offerStatus === 'added'}
							<div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
								<p class="text-xs sm:text-sm font-bold text-emerald-700 flex items-center justify-center gap-1.5">
									<span>✅</span>
									<span>تم تسجيل طلب إضافة العرض بنجاح!</span>
								</p>
								<p class="text-[11px] text-emerald-600 mt-1 leading-normal">
									سيتم تأكيد 20 قطعة من المسمار اللاصق مع شحنتك هاتفياً (+99 DH عند الاستلام).
								</p>
							</div>
						{:else}
							<Button
								onclick={handleAddOffer}
								disabled={offerStatus === 'loading'}
								class="w-full py-5 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
							>
								{#if offerStatus === 'loading'}
									<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									<span>جاري إرسال طلب الإضافة...</span>
								{:else}
									<span>أضف 20 قطعة لطلبي بـ 99 DH</span>
								{/if}
							</Button>
							<p class="text-[10px] text-muted-foreground text-center mt-1.5 font-medium">
								الدفع عند الاستلام مع باقي طلبيتك • بدون أي مصاريف شحن إضافية
							</p>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Action Callout & WhatsApp Direct Support -->
		<div class="w-full bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-8 text-center" dir="rtl">
			<h4 class="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1.5">هل تحتاج إلى تعديل أو استفسار سريع؟</h4>
			<p class="text-xs text-muted-foreground leading-relaxed mb-4">
				يمكنك التواصل معنا مباشرة عبر واتساب لتعديل العنوان، تغيير المنتج أو لتسريع عملية الشحن.
			</p>
			
			<Button
				href="https://wa.me/?text={encodeURIComponent('مرحباً، أود الاستفسار عن طلبي رقم ' + (order?.orderId || ''))}"
				target="_blank"
				class="w-full py-5 font-bold text-white bg-[#25D366] hover:bg-[#20ba56] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 text-white">
					<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.132 1.233 8.368 3.472 2.235 2.24 3.461 5.218 3.46 8.382-.003 6.526-5.328 11.851-11.859 11.851-2.008-.002-3.98-.513-5.735-1.488L0 24zm6.822-4.108l.385.228c1.398.831 2.978 1.27 4.606 1.271 5.234 0 9.493-4.258 9.495-9.492.001-2.536-.985-4.92-2.777-6.715-1.793-1.796-4.175-2.784-6.711-2.785-5.239 0-9.499 4.26-9.502 9.496-.002 1.705.447 3.37 1.299 4.808l.252.427-.999 3.65 3.753-.984zm11.23-5.385c-.328-.164-1.942-.959-2.242-1.069-.301-.11-.52-.164-.739.164-.219.328-.848 1.069-1.039 1.288-.192.219-.383.246-.711.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.148-.146.328-.383.493-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.739-1.777-1.012-2.435-.267-.641-.539-.553-.739-.563-.19-.01-.41-.01-.628-.01-.219 0-.575.082-.876.411-.301.328-1.15 1.123-1.15 2.738 0 1.615 1.177 3.176 1.34 3.395.164.219 2.316 3.537 5.611 4.96.783.338 1.396.54 1.872.691.787.25 1.5.215 2.066.13.631-.095 1.942-.794 2.216-1.56.273-.767.273-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
				</svg>
				<span>تعديل الطلب عبر واتساب</span>
			</Button>
		</div>

		<!-- Back Home Button -->
		<Button
			onclick={handleBackHome}
			variant="outline"
			class="w-full py-6 font-bold text-foreground border-border hover:bg-muted rounded-xl cursor-pointer"
		>
			العودة لصفحة الشراء الرئيسية
		</Button>

	</main>

	<!-- Footer -->
	<footer class="bg-muted/40 py-6 text-center text-xs text-muted-foreground border-t border-border/20 px-4">
		<p>© {new Date().getFullYear()} Valoriia. جميع الحقوق محفوظة.</p>
	</footer>

</div>
