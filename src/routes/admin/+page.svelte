<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Reactive dashboard state
	let statsOverride = $state<PageData['dashboardStats'] | null>(null);
	let ordersOverride = $state<PageData['recentOrders'] | null>(null);

	const stats = $derived(statsOverride ?? data.dashboardStats);
	const orders = $derived(ordersOverride ?? data.recentOrders);

	let isRefreshing = $state(false);
	let isSyncingAll = $state(false);
	let searchQuery = $state('');

	// Financial parameters synced with Calculator localStorage (Defaults: 65 MAD SpaceSeller, 45 MAD COGS)
	let spaceSellerFee = $state(65);
	let unitCost = $state(45);
	let confirmationRate = $state(65);
	let deliveryRate = $state(75);

	onMount(() => {
		try {
			const saved =
				localStorage.getItem('nv_cod_calc_simple') ||
				localStorage.getItem('nv_cod_calc_settings');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (typeof parsed.spaceSellerFee === 'number') spaceSellerFee = parsed.spaceSellerFee;
				if (typeof parsed.unitCost === 'number') unitCost = parsed.unitCost;
				if (typeof parsed.confirmationRate === 'number') confirmationRate = parsed.confirmationRate;
				if (typeof parsed.deliveryRate === 'number') deliveryRate = parsed.deliveryRate;
			}
		} catch {}
	});

	// Toast state
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		if (toastTimeout) clearTimeout(toastTimeout);
		toastMessage = msg;
		toastType = type;
		toastTimeout = setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}

	// Fetch fresh orders from /api/admin/orders
	async function refreshDashboard() {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			const res = await fetch('/api/admin/orders');
			const json = await res.json();
			if (res.ok && json.success) {
				statsOverride = json.stats;
				ordersOverride = json.orders;
				showToast('تم تحديث بيانات الطلبيات والمؤشرات المالية بنجاح ✅', 'success');
			} else {
				showToast(json.error || 'تعذر تحديث البيانات', 'error');
			}
		} catch {
			showToast('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً', 'error');
		} finally {
			isRefreshing = false;
		}
	}

	// Sync all orders to Google Sheets
	async function syncAllToSheets() {
		if (isSyncingAll) return;
		if (!confirm('هل تريد مزامنة جميع الطلبات المسجلة مع Google Sheets الآن؟')) return;
		isSyncingAll = true;
		try {
			const res = await fetch('/api/orders/sync-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ syncAll: true })
			});
			const resJson = await res.json();
			if (!res.ok || !resJson.success) {
				showToast(resJson.error || 'تعذرت مزامنة الطلبات', 'error');
			} else {
				showToast(resJson.message || 'تمت مزامنة جميع الطلبات مع Google Sheets بنجاح ✅', 'success');
			}
		} catch {
			showToast('تعذر الاتصال بالخادم لمزامنة Google Sheets', 'error');
		} finally {
			isSyncingAll = false;
		}
	}

	// WhatsApp direct confirmation link generator
	function getWhatsappLink(phone: string, customerName: string, product: string): string {
		let clean = phone.replace(/\D/g, '');
		if (clean.startsWith('0')) {
			clean = '212' + clean.slice(1);
		} else if (!clean.startsWith('212')) {
			clean = '212' + clean;
		}
		const greeting = encodeURIComponent(
			`السلام عليكم ${customerName}، معكم متجر NOVAVITA بخصوص طلبكم (${product}). بغينا نأكدو معاكم العنوان والتوصيل السريع.`
		);
		return `https://wa.me/${clean}?text=${greeting}`;
	}

	// Calculate exact net profit for a single order if delivered
	function calcOrderDeliveredNetProfit(totalPrice: number, physicalBottles: number): number {
		return Math.round(totalPrice - spaceSellerFee - physicalBottles * unitCost);
	}

	// Quick Live Funnel Preview Metrics
	const effectiveNetRate = $derived((confirmationRate / 100) * (deliveryRate / 100));
	const liveMarginPerDelivered = $derived(
		stats.averageOrderValue > 0
			? stats.averageOrderValue - spaceSellerFee - stats.avgBottlesPerOrder * unitCost
			: 0
	);
	const liveBreakEvenCPA = $derived(liveMarginPerDelivered * effectiveNetRate);

	// Filtered orders list
	const filteredOrders = $derived(
		orders.filter((o) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.trim().toLowerCase();
			return (
				o.fullName.toLowerCase().includes(q) ||
				o.phone.toLowerCase().includes(q) ||
				o.id.toLowerCase().includes(q) ||
				o.mainProduct.toLowerCase().includes(q) ||
				o.baseOfferLabel.toLowerCase().includes(q) ||
				o.upsellName.toLowerCase().includes(q)
			);
		})
	);

	const orderStatusBadges: Record<string, string> = {
		جديد: 'bg-amber-50 text-amber-800 border-amber-200',
		مؤكد: 'bg-emerald-50 text-emerald-800 border-emerald-200',
		'جاري الشحن': 'bg-blue-50 text-blue-800 border-blue-200',
		'تم التسليم': 'bg-teal-50 text-teal-800 border-teal-200',
		ملغي: 'bg-rose-50 text-rose-800 border-rose-200'
	};
</script>

<svelte:head>
	<title>لوحة القيادة والطلبيات - NOVAVITA</title>
</svelte:head>

<!-- Floating Toast -->
{#if toastMessage}
	<div class="fixed top-5 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300">
		<div
			class={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl ${
				toastType === 'success'
					? 'bg-[#065f46] text-amber-200 border border-amber-400/40'
					: 'bg-rose-950 text-rose-200 border border-rose-800'
			}`}
			dir="rtl"
		>
			<span>{toastType === 'success' ? '✓' : '⚠️'}</span>
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}

<div class="space-y-6 sm:space-y-8" dir="rtl">
	<!-- Top Hero Header & Quick Actions -->
	<div
		class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-l from-[#134e4a] via-[#065f46] to-[#0f3d39] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-400/30 relative overflow-hidden"
	>
		<div
			class="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl"
		></div>

		<div class="relative z-10 space-y-1.5">
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 text-[11px] font-black"
				>
					📊 متابعة حية للطلبيات والـ AOV
				</span>
				<span
					class="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-700 text-[11px] font-bold"
				>
					رسوم SpaceSeller: {spaceSellerFee} MAD • تكلفة العلبة: {unitCost} MAD
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
				لوحة القيادة والطلبيات الحية — NOVAVITA
			</h1>
			<p class="text-xs sm:text-sm text-emerald-100/85 font-medium max-w-2xl">
				تتبع لحظي لجميع طلبيات المتجر، متوسط سلة الشراء الحقيقي (Live AOV)، عدد العلب الفعلي لكل طلبية، والربح الصافي بعد احتساب رسوم SpaceSeller وتكلفة الجملة.
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="relative z-10 flex flex-wrap items-center gap-2.5">
			<button
				type="button"
				onclick={refreshDashboard}
				disabled={isRefreshing}
				class="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
			>
				<svg
					class={`h-4 w-4 text-amber-300 ${isRefreshing ? 'animate-spin' : ''}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
				<span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الطلبيات'}</span>
			</button>

			<button
				type="button"
				onclick={syncAllToSheets}
				disabled={isSyncingAll}
				class="inline-flex items-center gap-2 rounded-2xl bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-700/60 text-emerald-100 px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
			>
				<span>{isSyncingAll ? 'جاري المزامنة...' : 'مزامنة Sheets 📊'}</span>
			</button>

			<a
				href="/admin/calculator"
				class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-emerald-950 px-5 py-2.5 text-xs font-black transition-all active:scale-[0.98] shadow-lg shadow-black/20"
			>
				<span>🧮 حاسبة الأرباح والـ Break-Even</span>
				<span>←</span>
			</a>
		</div>
	</div>

	<!-- 4 Real-Time Core KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
		<!-- KPI 1: إجمالي الطلبيات (Total Leads) -->
		<div
			class="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
		>
			<div class="flex items-center justify-between mb-3">
				<span
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#065f46] border border-emerald-200 font-black text-xl"
				>
					📦
				</span>
				<span
					class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-[#065f46] border border-emerald-200"
				>
					اليوم: {stats.todayOrdersCount} طلبية
				</span>
			</div>
			<p class="text-xs font-extrabold text-neutral-500">إجمالي الطلبيات (Total Leads)</p>
			<div class="flex items-baseline gap-2 mt-1">
				<p class="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
					{stats.totalOrdersCount}
				</p>
				<span class="text-xs font-bold text-neutral-400">طلبية مسجلة</span>
			</div>
			<div class="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-500">إجمالي المبيعات الخام:</span>
				<span class="font-black text-[#065f46]" dir="ltr">
					{stats.totalRevenue.toLocaleString()} MAD
				</span>
			</div>
		</div>

		<!-- KPI 2: متوسط سلة الشراء الحقيقي (Live AOV in MAD) -->
		<div
			class="rounded-3xl border border-amber-500/25 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
		>
			<div class="flex items-center justify-between mb-3">
				<span
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black text-xl"
				>
					💰
				</span>
				<span
					class="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-800 border border-amber-200"
				>
					Live AOV
				</span>
			</div>
			<p class="text-xs font-extrabold text-neutral-500">متوسط سلة الشراء الحقيقي (Live AOV)</p>
			<div class="flex items-baseline gap-1.5 mt-1" dir="ltr">
				<p class="text-3xl sm:text-4xl font-black text-[#134e4a] tracking-tight">
					{Math.round(stats.averageOrderValue)}
				</p>
				<span class="text-sm font-black text-amber-600">MAD</span>
			</div>
			<div class="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-500">صافي ربح الطلبية الموصلة:</span>
				<span class="font-black text-emerald-700" dir="ltr">
					+{Math.round(liveMarginPerDelivered)} MAD
				</span>
			</div>
		</div>

		<!-- KPI 3: متوسط عدد العلب لكل طلبية (Avg Bottles / Order) -->
		<div
			class="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
		>
			<div class="flex items-center justify-between mb-3">
				<span
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 font-black text-xl"
				>
					🧪
				</span>
				<span
					class="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black text-teal-800 border border-teal-200"
				>
					مجموع العلب: {stats.totalPhysicalBottles}
				</span>
			</div>
			<p class="text-xs font-extrabold text-neutral-500">
				متوسط عدد العلب لكل طلبية (Avg Bottles)
			</p>
			<div class="flex items-baseline gap-2 mt-1">
				<p class="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight" dir="ltr">
					{stats.avgBottlesPerOrder}
				</p>
				<span class="text-xs font-bold text-teal-700">علبة / طلبية</span>
			</div>
			<div class="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-500">متوسط تكلفة السلعة (COGS):</span>
				<span class="font-black text-neutral-800" dir="ltr">
					{Math.round(stats.avgBottlesPerOrder * unitCost)} MAD
				</span>
			</div>
		</div>

		<!-- KPI 4: نسبة نجاح الأبسيل (Upsell Take Rate %) -->
		<div
			class="rounded-3xl border border-purple-500/20 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
		>
			<div class="flex items-center justify-between mb-3">
				<span
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-800 border border-purple-200 font-black text-xl"
				>
					🔥
				</span>
				<span
					class="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-black text-purple-800 border border-purple-200"
				>
					+99 MAD للعلبة
				</span>
			</div>
			<p class="text-xs font-extrabold text-neutral-500">
				نسبة نجاح الأبسيل (Upsell Take Rate %)
			</p>
			<div class="flex items-baseline gap-2 mt-1">
				<p class="text-3xl sm:text-4xl font-black text-purple-900 tracking-tight" dir="ltr">
					{stats.upsellConversionRate}%
				</p>
				<span class="text-xs font-bold text-purple-700">
					({stats.upsellOrdersCount} من {stats.totalOrdersCount})
				</span>
			</div>
			<div class="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-500">علب أبسيل مباعة (+99 DH):</span>
				<span class="font-black text-purple-800">
					{stats.totalUpsellBottles} علبة إضافية
				</span>
			</div>
		</div>
	</div>

	<!-- Quick Break-Even & Unit Economics Banner -->
	<div
		class="rounded-3xl bg-white border-2 border-[#065f46]/20 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
	>
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#065f46] text-amber-300 font-black text-xl shadow-md"
			>
				🎯
			</div>
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-sm sm:text-base font-black text-neutral-900">
						مؤشر التعادل الإعلاني الحي (Live Break-Even CPA)
					</h2>
					<span
						class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#065f46] border border-emerald-200"
					>
						تأكيد {confirmationRate}% × توصيل {deliveryRate}% = صافي وصول {(effectiveNetRate * 100).toFixed(1)}%
					</span>
				</div>
				<p class="text-xs text-neutral-500 font-medium mt-0.5">
					بناءً على طلبيات متجرك الفعلية، أقصى تكلفة للـ Lead الواحد في الإعلانات بدون خسارة هي
					<strong class="text-[#065f46] font-black" dir="ltr"
						>{liveBreakEvenCPA.toFixed(1)} MAD</strong
					>
				</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
			<div class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-center">
				<span class="block text-[10px] font-bold text-emerald-800">Break-Even CPA</span>
				<span class="block text-base font-black text-[#065f46]" dir="ltr">
					{liveBreakEvenCPA.toFixed(1)} MAD
				</span>
			</div>
			<div class="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-center">
				<span class="block text-[10px] font-bold text-amber-800">صافي ربح الطلبية الموصلة</span>
				<span class="block text-base font-black text-amber-900" dir="ltr">
					+{Math.round(liveMarginPerDelivered)} MAD
				</span>
			</div>
			<a
				href="/admin/calculator"
				class="rounded-2xl bg-[#134e4a] hover:bg-[#065f46] text-white px-4 py-3 text-xs font-extrabold transition-colors shadow-xs"
			>
				تعديل النسب ومحاكاة الإعلانات ←
			</a>
		</div>
	</div>

	<!-- Detailed Orders Table -->
	<div class="rounded-3xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden min-w-0 w-full">
		<!-- Header of Orders Table -->
		<div
			class="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-l from-white to-emerald-50/30"
		>
			<div>
				<div class="flex items-center gap-2.5">
					<span
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#065f46] text-amber-300 font-bold text-base shadow-xs"
					>
						📋
					</span>
					<div>
						<h2 class="text-base sm:text-lg font-black text-neutral-900">
							سجل الطلبيات التفصيلي وتحليل الربحية لكل طلبية
						</h2>
						<p class="text-xs text-neutral-500 font-medium">
							يعرض العرض الأساسي (199 / 279 / 349 MAD)، الأبسيل المضاف (+99 MAD)، عدد العلب الفعلي (qte)، والربح الصافي في حال التسليم
						</p>
					</div>
				</div>
			</div>

			<!-- Search & Filter Bar -->
			<div class="flex items-center gap-3">
				<div class="relative w-full sm:w-72">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="ابحث بالاسم، الهاتف، أو الباقة..."
						class="w-full pl-3 pr-9 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold focus:outline-hidden focus:border-[#065f46] focus:ring-2 focus:ring-emerald-500/15 transition-all"
					/>
					<svg
						class="h-4 w-4 text-neutral-400 absolute right-3 top-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<a
					href="/admin/orders"
					class="text-xs font-extrabold text-[#065f46] hover:underline flex items-center gap-1 shrink-0"
				>
					<span>إدارة الحالات ({orders.length})</span>
					<span>←</span>
				</a>
			</div>
		</div>

		<!-- Table -->
		{#if filteredOrders.length === 0}
			<div class="p-12 text-center">
				<span class="text-4xl">📦</span>
				<h3 class="text-sm font-bold text-neutral-800 mt-2">لا توجد طلبيات تطابق بحثك</h3>
				<p class="text-xs text-neutral-400 mt-1">تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح</p>
			</div>
		{:else}
			<div class="w-full overflow-x-auto">
				<table class="w-full text-right border-collapse">
					<thead>
						<tr
							class="border-b border-neutral-200/80 bg-neutral-50/90 text-[11px] font-black text-neutral-600 uppercase tracking-wider"
						>
							<th class="py-3 px-2.5 sm:px-3">التاريخ</th>
							<th class="py-3 px-2.5 sm:px-3">الزبونة / الاسم</th>
							<th class="py-3 px-2.5 sm:px-3">رقم الهاتف</th>
							<th class="py-3 px-2.5 sm:px-3">العرض الأساسي</th>
							<th class="py-3 px-2.5 sm:px-3">الأبسيل (+99 MAD)</th>
							<th class="py-3 px-2 sm:px-2.5 text-center">العلب (qte)</th>
							<th class="py-3 px-2.5 sm:px-3">المبلغ الإجمالي</th>
							<th class="py-3 px-2.5 sm:px-3">الربح الصافي (عند التسليم)</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100 text-xs">
						{#each filteredOrders as order}
							{@const orderNetProfit = calcOrderDeliveredNetProfit(
								order.totalPrice,
								order.physicalBottles
							)}
							<tr class="hover:bg-emerald-50/40 transition-colors group">
								<!-- 1. Order Date -->
								<td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-neutral-800">{order.formattedDate}</span>
										{#if order.isToday}
											<span
												class="px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#065f46] text-[10px] font-black"
											>
												اليوم
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-1.5 mt-1">
										<span class="text-[10px] font-mono text-neutral-400">{order.id}</span>
										<span
											class={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
												orderStatusBadges[order.status] ||
												'bg-neutral-100 text-neutral-600 border-neutral-200'
											}`}
										>
											{order.status}
										</span>
									</div>
								</td>

								<!-- 2. Customer Name -->
								<td class="py-3.5 px-2.5 sm:px-3 font-bold text-neutral-900 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<span
											class="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-[#065f46] font-black text-xs"
										>
											{order.fullName.charAt(0)}
										</span>
										<div>
											<span class="block font-extrabold text-neutral-900">{order.fullName}</span>
											<span class="text-[10px] text-neutral-400 font-semibold block">
												{order.city}
											</span>
										</div>
									</div>
								</td>

								<!-- 3. Phone with 1-click WhatsApp -->
								<td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span class="font-mono font-bold text-neutral-800" dir="ltr">
											{order.phone}
										</span>
										<a
											href={getWhatsappLink(order.phone, order.fullName, order.product)}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-emerald-100 text-[#065f46] hover:bg-emerald-200 transition-colors text-[10px] font-extrabold"
											title="تأكيد الطلب مباشرة عبر الواتساب"
										>
											<span>واتساب</span>
											<span>↗</span>
										</a>
									</div>
								</td>

								<!-- 4. Base Offer (199 / 279 / 349 MAD) -->
								<td class="py-3.5 px-2.5 sm:px-3">
									<div class="flex flex-col gap-1 items-start">
										<span
											class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${order.baseOfferBadge}`}
										>
											{order.baseOfferLabel}
										</span>
										<span class="text-[10px] font-bold text-neutral-500">
											{order.mainProductTag} ({order.sku})
										</span>
									</div>
								</td>

								<!-- 5. Upsells Added (+99 MAD items) -->
								<td class="py-3.5 px-2.5 sm:px-3">
									{#if order.hasUpsell}
										<span
											class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${order.upsellBadge}`}
										>
											<span>🔥</span>
											<span>{order.upsellName}</span>
										</span>
									{:else}
										<span class="text-neutral-400 text-xs font-semibold"> — بدون أبسيل </span>
									{/if}
								</td>

								<!-- 6. Total Physical Bottles (qte) -->
								<td class="py-3.5 px-2 sm:px-2.5 text-center whitespace-nowrap">
									<span
										class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 text-amber-300 font-black text-xs shadow-2xs"
									>
										<span>{order.physicalBottles}</span>
										<span class="text-[10px] text-white font-bold">
											{order.physicalBottles === 1 ? 'علبة' : 'علب'}
										</span>
									</span>
								</td>

								<!-- 7. Total Price (MAD) -->
								<td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
									<span class="font-black text-sm text-neutral-900" dir="ltr">
										{order.totalPrice} MAD
									</span>
								</td>

								<!-- 8. Estimated Net Profit if Delivered -->
								<td class="py-3.5 px-2.5 sm:px-3 whitespace-nowrap">
									<div class="flex flex-col items-start">
										<span
											class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border ${
												orderNetProfit > 0
													? 'bg-emerald-50 text-emerald-800 border-emerald-200'
													: 'bg-rose-50 text-rose-800 border-rose-200'
											}`}
											dir="ltr"
										>
											{orderNetProfit > 0 ? `+${orderNetProfit}` : orderNetProfit} MAD
										</span>
										<span class="text-[10px] text-neutral-400 font-semibold mt-0.5">
											بعد {spaceSellerFee} شحن و {order.physicalBottles * unitCost} سلعة
										</span>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
