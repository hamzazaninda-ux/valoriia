<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Reactive dashboard state
	let stats = $state(data.dashboardStats);
	let orders = $state(data.recentOrders);
	let isRefreshing = $state(false);
	let isSyncingAll = $state(false);
	let searchQuery = $state('');

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
				stats = json.stats;
				orders = json.orders;
				showToast('تم تحديث بيانات اللوحة والطلبات بنجاح ✅', 'success');
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
				o.upsellName.toLowerCase().includes(q)
			);
		})
	);

	const orderStatusBadges: Record<string, string> = {
		جديد: 'bg-amber-50 text-amber-700 border-amber-200',
		مؤكد: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		'جاري الشحن': 'bg-blue-50 text-blue-700 border-blue-200',
		'تم التسليم': 'bg-teal-50 text-teal-700 border-teal-200',
		ملغي: 'bg-rose-50 text-rose-700 border-rose-200'
	};
</script>

<svelte:head>
	<title>لوحة التحكم - NOVAVITA</title>
</svelte:head>

<!-- Floating Toast -->
{#if toastMessage}
	<div class="fixed top-5 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300">
		<div
			class={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl ${
				toastType === 'success'
					? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
					: 'bg-rose-950 text-rose-200 border border-rose-800'
			}`}
			dir="rtl"
		>
			<span>{toastType === 'success' ? '✓' : '⚠️'}</span>
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}

<div class="space-y-8" dir="rtl">
	<!-- Top Greeting & Control Actions -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<h1 class="text-2xl font-black text-neutral-900 tracking-tight">
					لوحة تحكم NOVAVITA 🌿
				</h1>
				<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
					إدارة حية
				</span>
			</div>
			<p class="text-xs sm:text-sm text-neutral-500 font-medium">
				متابعة فورية للطلبيات، المداخيل، ونسب نجاح الأبسيل (العروض الخاطفة)
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-2.5">
			<button
				type="button"
				onclick={refreshDashboard}
				disabled={isRefreshing}
				class="inline-flex items-center gap-2 rounded-xl border border-neutral-200/90 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
				title="تحديث البيانات فورياً"
			>
				<svg class={`h-4 w-4 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
				</svg>
				<span>{isRefreshing ? 'جاري التحديث...' : 'تحديث فوري'}</span>
			</button>

			<button
				type="button"
				onclick={syncAllToSheets}
				disabled={isSyncingAll}
				class="inline-flex items-center gap-2 rounded-xl bg-[#0f291e] hover:bg-[#163f2e] text-white px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950/20"
				title="مزامنة جميع الطلبات مع Google Sheets"
			>
				<svg class={`h-4 w-4 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
				</svg>
				<span>{isSyncingAll ? 'جاري المزامنة...' : 'مزامنة Sheets 📊'}</span>
			</button>

			<a
				href="/admin/orders"
				class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98] shadow-2xs"
			>
				<span>إدارة الطلبات</span>
				<span>←</span>
			</a>
		</div>
	</div>

	<!-- KPI Summary Cards (Grid) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
		<!-- 1. Today's Orders -->
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
			<div class="flex items-center justify-between mb-3">
				<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
					</svg>
				</span>
				<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
					اليوم
				</span>
			</div>
			<p class="text-3xl font-black text-neutral-900 tracking-tight">{stats.todayOrdersCount}</p>
			<div class="flex items-center justify-between mt-1 text-xs">
				<span class="font-bold text-neutral-600">طلبات اليوم</span>
				<span class="font-bold text-emerald-700">{stats.todayRevenue} {data.currencySymbol}</span>
			</div>
		</div>

		<!-- 2. Total Revenue -->
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
			<div class="flex items-center justify-between mb-3">
				<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</span>
				<span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
					إجمالي
				</span>
			</div>
			<p class="text-3xl font-black text-neutral-900 tracking-tight">
				{stats.totalRevenue.toLocaleString()} <span class="text-sm font-bold text-neutral-500">{data.currencySymbol}</span>
			</p>
			<div class="flex items-center justify-between mt-1 text-xs">
				<span class="font-bold text-neutral-600">إجمالي المداخيل</span>
				<span class="font-bold text-neutral-500">{stats.totalOrdersCount} طلب مسجل</span>
			</div>
		</div>

		<!-- 3. Upsell Conversion Rate -->
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
			<div class="flex items-center justify-between mb-3">
				<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800 shadow-xs">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
					</svg>
				</span>
				<span class="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-black text-purple-800 border border-purple-200">
					العرض الخاطف
				</span>
			</div>
			<p class="text-3xl font-black text-neutral-900 tracking-tight">{stats.upsellConversionRate}%</p>
			<div class="flex items-center justify-between mt-1 text-xs">
				<span class="font-bold text-neutral-600">نسبة تحويل الأبسيل</span>
				<span class="font-bold text-purple-700">{stats.upsellOrdersCount} طلب بأبسيل (+99)</span>
			</div>
		</div>

		<!-- 4. Pending Confirmation -->
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
			<div class="flex items-center justify-between mb-3">
				<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 shadow-xs">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.8-3.04a17.893 17.893 0 01-3.95-.572c-2.454-.672-4.25-2.905-4.25-5.46V10.608c0-.97.616-1.813 1.5-2.097m12 0A17.925 17.925 0 0012 7.5c-2.43 0-4.757.487-6.879 1.365m14.879-.354c-.167-.05-.336-.098-.507-.143m-14.372.497c.17-.045.34-.093.507-.143m0 0A17.93 17.93 0 0112 6c2.43 0 4.757.487 6.879 1.365" />
					</svg>
				</span>
				<span class="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-800 border border-rose-200">
					مكالمة هاتفية
				</span>
			</div>
			<p class="text-3xl font-black text-neutral-900 tracking-tight">{stats.pendingOrders}</p>
			<div class="flex items-center justify-between mt-1 text-xs">
				<span class="font-bold text-neutral-600">بانتظار التأكيد</span>
				<span class="font-bold text-neutral-500">معدل الطلب: {stats.averageOrderValue} {data.currencySymbol}</span>
			</div>
		</div>
	</div>

	<!-- Recent Orders Section -->
	<div class="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
		<!-- Header of Recent Orders Table -->
		<div class="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-l from-white to-neutral-50/50">
			<div>
				<div class="flex items-center gap-2">
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
						🛒
					</span>
					<h2 class="text-lg font-black text-neutral-900">أحدث الطلبيات (Recent Orders)</h2>
				</div>
				<p class="text-xs text-neutral-500 font-medium mt-0.5">
					تفاصيل المشتريات، المنتجات، والأبسيل مع حالة المزامنة اللحظية
				</p>
			</div>

			<!-- Search & Filter Bar -->
			<div class="flex items-center gap-3">
				<div class="relative w-full sm:w-64">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="بحث باسم الزبون أو الهاتف..."
						class="w-full pl-3 pr-9 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
					/>
					<svg class="h-4 w-4 text-neutral-400 absolute right-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<a
					href="/admin/orders"
					class="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 shrink-0"
				>
					<span>عرض الكل ({orders.length})</span>
					<span>←</span>
				</a>
			</div>
		</div>

		<!-- Table: Desktop and Tablet View -->
		{#if filteredOrders.length === 0}
			<div class="p-12 text-center">
				<span class="text-4xl">📦</span>
				<h3 class="text-sm font-bold text-neutral-800 mt-2">لا توجد طلبيات تطابق بحثك</h3>
				<p class="text-xs text-neutral-400 mt-1">تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-right border-collapse">
					<thead>
						<tr class="border-b border-neutral-100 bg-neutral-50/75 text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider">
							<th class="py-3.5 px-4 sm:px-6">التاريخ</th>
							<th class="py-3.5 px-4">الزبونة / الزبون</th>
							<th class="py-3.5 px-4">الهاتف والواتساب</th>
							<th class="py-3.5 px-4">المنتج الرئيسي</th>
							<th class="py-3.5 px-4">الأبسيل المضاف (+99 DH)</th>
							<th class="py-3.5 px-4">المجموع</th>
							<th class="py-3.5 px-4">المزامنة (Sheets / Bot)</th>
							<th class="py-3.5 px-4 sm:px-6">الحالة</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100 text-xs">
						{#each filteredOrders as order}
							<tr class="hover:bg-emerald-50/30 transition-colors group">
								<!-- Date -->
								<td class="py-4 px-4 sm:px-6 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<span class="font-bold text-neutral-800">{order.formattedDate}</span>
										{#if order.isToday}
											<span class="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
												اليوم
											</span>
										{/if}
									</div>
									<span class="text-[10px] font-mono text-neutral-400 block mt-0.5">{order.id}</span>
								</td>

								<!-- Customer Name -->
								<td class="py-4 px-4 font-bold text-neutral-900 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<span class="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs">
											{order.fullName.charAt(0)}
										</span>
										<div>
											<span>{order.fullName}</span>
											<span class="text-[10px] text-neutral-400 font-normal block">{order.city}</span>
										</div>
									</div>
								</td>

								<!-- Phone with 1-click WhatsApp button -->
								<td class="py-4 px-4 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span class="font-mono font-semibold text-neutral-700 dir-ltr">{order.phone}</span>
										<a
											href={getWhatsappLink(order.phone, order.fullName, order.mainProduct)}
											target="_blank"
											rel="noopener noreferrer"
											class="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
											title="تأكيد الطلب مباشرة عبر الواتساب"
										>
											<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
												<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.132 1.233 8.368 3.472 2.235 2.24 3.461 5.218 3.46 8.382-.003 6.526-5.328 11.851-11.859 11.851-2.008-.002-3.98-.513-5.735-1.488L0 24zm6.822-4.108l.385.228c1.398.831 2.978 1.27 4.606 1.271 5.234 0 9.493-4.258 9.495-9.492.001-2.536-.985-4.92-2.777-6.715-1.793-1.796-4.175-2.784-6.711-2.785-5.239 0-9.499 4.26-9.502 9.496-.002 1.705.447 3.37 1.299 4.808l.252.427-.999 3.65 3.753-.984zm11.23-5.385c-.328-.164-1.942-.959-2.242-1.069-.301-.11-.52-.164-.739.164-.219.328-.848 1.069-1.039 1.288-.192.219-.383.246-.711.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.148-.146.328-.383.493-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.739-1.777-1.012-2.435-.267-.641-.539-.553-.739-.563-.19-.01-.41-.01-.628-.01-.219 0-.575.082-.876.411-.301.328-1.15 1.123-1.15 2.738 0 1.615 1.177 3.176 1.34 3.395.164.219 2.316 3.537 5.611 4.96.783.338 1.396.54 1.872.691.787.25 1.5.215 2.066.13.631-.095 1.942-.794 2.216-1.56.273-.767.273-1.423.192-1.56-.082-.137-.3-.219-.628-.383z" />
											</svg>
										</a>
									</div>
								</td>

								<!-- Main Product -->
								<td class="py-4 px-4 whitespace-nowrap">
									<span class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${order.mainProductBadge}`}>
										{order.mainProductTag}
									</span>
								</td>

								<!-- Upsell Product Added -->
								<td class="py-4 px-4 whitespace-nowrap">
									{#if order.hasUpsell}
										<span class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${order.upsellBadge}`}>
											<span>✨</span>
											<span>{order.upsellName}</span>
										</span>
									{:else}
										<span class="text-neutral-400 text-xs font-medium">
											— بدون أبسيل
										</span>
									{/if}
								</td>

								<!-- Total Price -->
								<td class="py-4 px-4 whitespace-nowrap font-black text-sm text-neutral-900">
									{order.totalPrice} <span class="text-xs font-bold text-neutral-500">{data.currencySymbol}</span>
								</td>

								<!-- Sync Status (Sheets & SpaceSeller) -->
								<td class="py-4 px-4 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold" title="تم الإرسال لـ Google Sheets">
											<span>Google Sheets</span>
											<span>✓</span>
										</span>
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold" title="جاهز للربط مع نظام التوصيل">
											<span>SpaceSeller</span>
											<span>📦</span>
										</span>
									</div>
								</td>

								<!-- Status -->
								<td class="py-4 px-4 sm:px-6 whitespace-nowrap">
									<span class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${orderStatusBadges[order.status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
										<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
										<span>{order.status}</span>
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
