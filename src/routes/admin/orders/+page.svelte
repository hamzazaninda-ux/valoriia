<script lang="ts">
	import type { PageData } from './$types';
	import type { StoredOrder, OrderStatus } from '$lib/types/order';
	import { formatPrice } from '$lib/utils/format';

	let { data }: { data: PageData } = $props();

	let orders = $state<StoredOrder[]>(data.orders || []);
	let searchQuery = $state('');
	let selectedStatus = $state<string>('all');
	let updatingOrderId = $state<string | null>(null);
	let isSyncingAll = $state(false);
	let syncingOrderId = $state<string | null>(null);
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

	const STATUS_CONFIG: Record<
		OrderStatus,
		{ label: string; badgeClass: string; dotClass: string; icon: string }
	> = {
		جديد: {
			label: 'جديد',
			badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
			dotClass: 'bg-amber-500',
			icon: '🟡'
		},
		مؤكد: {
			label: 'مؤكد',
			badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
			dotClass: 'bg-emerald-500',
			icon: '🟢'
		},
		'جاري الشحن': {
			label: 'جاري الشحن',
			badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
			dotClass: 'bg-blue-500',
			icon: '🚚'
		},
		'تم التسليم': {
			label: 'تم التسليم',
			badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
			dotClass: 'bg-teal-600',
			icon: '✅'
		},
		ملغي: {
			label: 'ملغي',
			badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
			dotClass: 'bg-rose-500',
			icon: '🔴'
		}
	};

	const ALL_STATUSES: OrderStatus[] = ['جديد', 'مؤكد', 'جاري الشحن', 'تم التسليم', 'ملغي'];

	// Computed counts and stats
	const stats = $derived.by(() => {
		let total = orders.length;
		let pending = 0;
		let confirmed = 0;
		let delivered = 0;
		let cancelled = 0;
		let confirmedRevenue = 0;

		for (const o of orders) {
			const p = Number(o.totalPrice) || 0;
			if (o.status === 'جديد') pending++;
			else if (o.status === 'مؤكد') {
				confirmed++;
				confirmedRevenue += p;
			} else if (o.status === 'جاري الشحن') {
				confirmed++;
				confirmedRevenue += p;
			} else if (o.status === 'تم التسليم') {
				delivered++;
				confirmedRevenue += p;
			} else if (o.status === 'ملغي') {
				cancelled++;
			}
		}

		return { total, pending, confirmed, delivered, cancelled, confirmedRevenue };
	});

	// Filtered orders list
	const filteredOrders = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return orders.filter((o) => {
			const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
			if (!matchesStatus) return false;

			if (!q) return true;
			return (
				o.id.toLowerCase().includes(q) ||
				o.fullName.toLowerCase().includes(q) ||
				o.phone.includes(q) ||
				(o.city && o.city.toLowerCase().includes(q)) ||
				(o.product && o.product.toLowerCase().includes(q))
			);
		});
	});

	// Normalize phone for WhatsApp URL
	function getWhatsappLink(phone: string, customerName: string, product: string): string {
		let clean = phone.replace(/\D/g, '');
		if (clean.startsWith('0')) {
			clean = '212' + clean.slice(1);
		} else if (!clean.startsWith('212')) {
			clean = '212' + clean;
		}

		const greeting = encodeURIComponent(
			`السلام عليكم أخي/أختي ${customerName}، تواصلنا معك من متجر Lhamza Shop بخصوص تأكيد طلبك (${product}). واش مناسب نأكدو معك العنوان والتوصيل؟`
		);
		return `https://wa.me/${clean}?text=${greeting}`;
	}

	function getPhoneCallLink(phone: string): string {
		const clean = phone.replace(/\s+/g, '');
		return `tel:${clean}`;
	}

	function formatDate(iso: string): string {
		try {
			const d = new Date(iso);
			if (isNaN(d.getTime())) return iso;
			return d.toLocaleDateString('ar-MA', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	// Instant status change
	async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
		const previousStatus = orders.find((o) => o.id === orderId)?.status;
		if (previousStatus === newStatus) return;

		// Optimistic UI update
		orders = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
		updatingOrderId = orderId;

		try {
			const res = await fetch('/api/orders', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: orderId, status: newStatus })
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				// Revert on error
				orders = orders.map((o) => (o.id === orderId ? { ...o, status: previousStatus || 'جديد' } : o));
				showToast(json.error || 'فشل تحديث حالة الطلب', 'error');
			} else {
				showToast(`تم تغيير حالة الطلب ${orderId} إلى: ${newStatus}`, 'success');
			}
		} catch (err) {
			orders = orders.map((o) => (o.id === orderId ? { ...o, status: previousStatus || 'جديد' } : o));
			showToast('تعذر الاتصال بالخادم', 'error');
		} finally {
			updatingOrderId = null;
		}
	}

	// Copy details
	async function copyOrderDetails(order: StoredOrder) {
		const text = `طلب: ${order.id}\nالزبون: ${order.fullName}\nالهاتف: ${order.phone}\nالمدينة: ${order.city}\nالعنوان: ${order.address || 'غير محدد'}\nالمنتج: ${order.product}\nالمجموع: ${order.totalPrice} درهم\nالحالة: ${order.status}`;
		try {
			await navigator.clipboard.writeText(text);
			showToast('تم نسخ معلومات الطلب بنجاح', 'success');
		} catch {
			showToast('تعذر نسخ المعلومات', 'error');
		}
	}

	// Delete order
	async function handleDeleteOrder(orderId: string) {
		if (!confirm(`هل أنت متأكد من حذف الطلب ${orderId}؟`)) return;

		const previous = [...orders];
		orders = orders.filter((o) => o.id !== orderId);

		try {
			const res = await fetch('/api/orders', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: orderId })
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				orders = previous;
				showToast(json.error || 'تعذر حذف الطلب', 'error');
			} else {
				showToast(`تم حذف الطلب ${orderId}`, 'success');
			}
		} catch {
			orders = previous;
			showToast('تعذر الاتصال بالخادم', 'error');
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
			const data = await res.json();
			if (!res.ok || !data.success) {
				showToast(data.error || 'تعذرت مزامنة الطلبات', 'error');
			} else {
				showToast(data.message || 'تمت مزامنة الطلبات بنجاح', 'success');
			}
		} catch {
			showToast('تعذر الاتصال بالخادم', 'error');
		} finally {
			isSyncingAll = false;
		}
	}

	// Sync single order to Google Sheets
	async function syncSingleOrderToSheets(orderId: string) {
		if (syncingOrderId === orderId) return;
		syncingOrderId = orderId;
		try {
			const res = await fetch('/api/orders/sync-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId })
			});
			const data = await res.json();
			if (!res.ok || !data.success) {
				showToast(data.error || 'تعذرت مزامنة الطلب', 'error');
			} else {
				showToast(data.message || 'تمت مزامنة الطلب بنجاح', 'success');
			}
		} catch {
			showToast('تعذر الاتصال بالخادم', 'error');
		} finally {
			syncingOrderId = null;
		}
	}
</script>

<svelte:head>
	<title>إدارة الطلبات - Lhamza Shop Admin</title>
</svelte:head>

<!-- Toast Notification -->
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

<div class="space-y-6" dir="rtl">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
					إدارة الطلبات
				</h1>
				<span class="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800">
					{orders.length} طلبية
				</span>
			</div>
			<p class="mt-1 text-xs sm:text-sm text-neutral-500 font-medium">
				متابعة طلبيات المتجر في الوقت الفعلي مع التواصل السريع عبر واتساب وتحديث الحالات
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={syncAllToSheets}
				disabled={isSyncingAll || orders.length === 0}
				class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-950 px-4 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
				title="مزامنة جميع الطلبات المسجلة مع Google Sheets"
			>
				<svg class={`h-4 w-4 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
				</svg>
				{isSyncingAll ? 'جاري المزامنة...' : 'مزامنة جميع الطلبات مع Google Sheets 🔄'}
			</button>
			{#if data.globalSheets}
				<a
					href={data.globalSheets}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs sm:text-sm font-bold text-neutral-700 shadow-2xs transition-all hover:bg-neutral-50 hover:text-emerald-800 active:scale-[0.98]"
				>
					<svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
					</svg>
					فتح Google Sheets
				</a>
			{/if}
		</div>
	</div>

	<!-- Metric Summary Cards -->
	<div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
		<!-- Total Orders -->
		<div class="rounded-3xl border border-neutral-200/70 bg-white p-4 sm:p-5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-bold text-neutral-500">إجمالي الطلبات</span>
				<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z" />
					</svg>
				</span>
			</div>
			<p class="mt-2 text-2xl sm:text-3xl font-black text-neutral-900">{stats.total}</p>
			<p class="mt-0.5 text-[11px] text-neutral-400">جميع الطلبات المسجلة</p>
		</div>

		<!-- Pending Orders -->
		<div class="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-bold text-amber-900">طلبات جديدة</span>
				<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</span>
			</div>
			<p class="mt-2 text-2xl sm:text-3xl font-black text-amber-950">{stats.pending}</p>
			<p class="mt-0.5 text-[11px] text-amber-700">في انتظار التأكيد الهاتفي</p>
		</div>

		<!-- Confirmed Orders -->
		<div class="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-bold text-emerald-900">مؤكدة وشحن</span>
				<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</span>
			</div>
			<p class="mt-2 text-2xl sm:text-3xl font-black text-emerald-950">{stats.confirmed}</p>
			<p class="mt-0.5 text-[11px] text-emerald-700">مؤكدة وجاهزة للإرسال</p>
		</div>

		<!-- Confirmed Revenue -->
		<div class="rounded-3xl border border-neutral-200/70 bg-white p-4 sm:p-5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-bold text-neutral-500">المبيعات المؤكدة</span>
				<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-amber-400">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</span>
			</div>
			<p class="mt-2 text-2xl sm:text-3xl font-black text-emerald-900">
				{stats.confirmedRevenue} <span class="text-sm font-bold text-neutral-500">{data.currencySymbol}</span>
			</p>
			<p class="mt-0.5 text-[11px] text-neutral-400">مجموع المداخيل المؤكدة</p>
		</div>
	</div>

	<!-- Controls: Search & Status Filter Tabs -->
	<div class="flex flex-col gap-3 rounded-3xl border border-neutral-200/70 bg-white p-4 sm:p-5 shadow-2xs">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<!-- Search Bar -->
			<div class="relative flex-1">
				<span class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-neutral-400">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
				</span>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="بحث برقم الهاتف، اسم الزبون، المدينة، أو رقم الطلب..."
					class="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 py-2.5 ps-10 pe-9 text-xs sm:text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400 hover:text-neutral-600"
						aria-label="مسح البحث"
					>
						✕
					</button>
				{/if}
			</div>
		</div>

		<!-- Status Filter Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
			<button
				type="button"
				onclick={() => (selectedStatus = 'all')}
				class={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
					selectedStatus === 'all'
						? 'bg-emerald-950 text-white shadow-2xs'
						: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
				}`}
			>
				الكل ({orders.length})
			</button>
			{#each ALL_STATUSES as st}
				{@const count = orders.filter((o) => o.status === st).length}
				<button
					type="button"
					onclick={() => (selectedStatus = st)}
					class={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
						selectedStatus === st
							? 'bg-emerald-950 text-white shadow-2xs'
							: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
					}`}
				>
					<span>{STATUS_CONFIG[st].icon}</span>
					<span>{st}</span>
					<span class="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{count}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Orders Content -->
	{#if filteredOrders.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center rounded-3xl border border-neutral-200/70 bg-white p-12 text-center shadow-2xs">
			<span class="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-3xl">
				📦
			</span>
			<h3 class="mt-4 font-display text-lg font-bold text-neutral-800">
				لا توجد طلبات مطابقة
			</h3>
			<p class="mt-1 max-w-sm text-xs sm:text-sm text-neutral-500 font-medium">
				{searchQuery || selectedStatus !== 'all'
					? 'جرّب تغيير كلمات البحث أو اختيار فلتر حالة آخر.'
					: 'الطلبيات الجديدة ستظهر هنا تلقائياً فور تسجيل الزبناء لطلباتهم.'}
			</p>
			{#if searchQuery || selectedStatus !== 'all'}
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						selectedStatus = 'all';
					}}
					class="mt-4 rounded-xl bg-emerald-950 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 active:scale-95"
				>
					إعادة ضبط الفلاتر
				</button>
			{/if}
		</div>
	{:else}
		<!-- Desktop / Tablet Table View (hidden on small mobile) -->
		<div class="hidden md:block overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-2xs">
			<div class="overflow-x-auto">
				<table class="w-full text-right text-xs">
					<thead>
						<tr class="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500">
							<th class="py-3.5 ps-5 pe-3 font-extrabold">رقم الطلب</th>
							<th class="py-3.5 px-3 font-extrabold">التاريخ</th>
							<th class="py-3.5 px-3 font-extrabold">الزبون</th>
							<th class="py-3.5 px-3 font-extrabold">الهاتف والتواصل</th>
							<th class="py-3.5 px-3 font-extrabold">المدينة</th>
							<th class="py-3.5 px-3 font-extrabold">المنتج والعرض</th>
							<th class="py-3.5 px-3 font-extrabold">المجموع</th>
							<th class="py-3.5 px-3 font-extrabold">الحالة</th>
							<th class="py-3.5 ps-3 pe-5 text-center font-extrabold">إجراءات</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each filteredOrders as order (order.id)}
							{@const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['جديد']}
							<tr class="hover:bg-neutral-50/60 transition-colors">
								<!-- Order ID -->
								<td class="py-3.5 ps-5 pe-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span>{order.id}</span>
										{#if order.orderType === 'upsell'}
											<span class="rounded bg-purple-50 px-1 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">أبسيل</span>
										{/if}
									</div>
								</td>

								<!-- Date -->
								<td class="py-3.5 px-3 text-neutral-500 whitespace-nowrap">
									{formatDate(order.createdAt)}
								</td>

								<!-- Customer Name & Address -->
								<td class="py-3.5 px-3">
									<p class="font-bold text-neutral-900">{order.fullName}</p>
									{#if order.address && order.address !== order.city}
										<p class="text-[10px] text-neutral-400 truncate max-w-[140px]" title={order.address}>
											{order.address}
										</p>
									{/if}
								</td>

								<!-- Phone & Direct Call / WhatsApp Buttons -->
								<td class="py-3.5 px-3 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<span class="font-mono font-bold text-neutral-800" dir="ltr">{order.phone}</span>
										<!-- Call Button -->
										<a
											href={getPhoneCallLink(order.phone)}
											class="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
											title="اتصال هاتفي مباشر"
											aria-label="اتصال هاتفي"
										>
											<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
											</svg>
										</a>
										<!-- WhatsApp Button -->
										<a
											href={getWhatsappLink(order.phone, order.fullName, order.product)}
											target="_blank"
											rel="noopener"
											class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25 transition-colors"
											title="مراسلة فورية على واتساب"
											aria-label="مراسلة واتساب"
										>
											<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</a>
									</div>
								</td>

								<!-- City -->
								<td class="py-3.5 px-3 whitespace-nowrap">
									<span class="rounded-lg bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-700">
										{order.city}
									</span>
								</td>

								<!-- Product Details -->
								<td class="py-3.5 px-3 max-w-[200px]">
									<p class="font-semibold text-neutral-800 truncate" title={order.product}>
										{order.product}
									</p>
									<p class="text-[10px] text-neutral-400">الكمية: {order.quantity}</p>
								</td>

								<!-- Total Price -->
								<td class="py-3.5 px-3 font-bold text-neutral-900 whitespace-nowrap">
									{order.totalPrice} <span class="text-[10px] text-neutral-400">{data.currencySymbol}</span>
								</td>

								<!-- Status Dropdown -->
								<td class="py-3.5 px-3 whitespace-nowrap">
									<select
										value={order.status}
										disabled={updatingOrderId === order.id}
										onchange={(e) => handleStatusChange(order.id, (e.target as HTMLSelectElement).value as OrderStatus)}
										class={`rounded-xl border px-2.5 py-1 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer ${cfg.badgeClass}`}
									>
										{#each ALL_STATUSES as st}
											<option value={st}>{STATUS_CONFIG[st].icon} {st}</option>
										{/each}
									</select>
								</td>

								<!-- Actions -->
								<td class="py-3.5 ps-3 pe-5 text-center whitespace-nowrap">
									<div class="flex items-center justify-center gap-1.5">
										<!-- Sync to Google Sheets button -->
										<button
											type="button"
											onclick={() => syncSingleOrderToSheets(order.id)}
											disabled={syncingOrderId === order.id}
											class="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
											title="مزامنة هذا الطلب مع Google Sheets"
											aria-label="مزامنة مع Google Sheets"
										>
											<svg class={`h-3.5 w-3.5 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
											</svg>
										</button>
										<!-- Copy button -->
										<button
											type="button"
											onclick={() => copyOrderDetails(order)}
											class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
											title="نسخ تفاصيل الطلب"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9 9 9 0 00-9 9v1.5m18 0a2.25 2.25 0 01-2.25 2.25H16.5" />
											</svg>
										</button>
										<!-- Delete button -->
										<button
											type="button"
											onclick={() => handleDeleteOrder(order.id)}
											class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
											title="حذف الطلب"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Mobile Card View (shown on screens < md) -->
		<div class="space-y-3 md:hidden">
			{#each filteredOrders as order (order.id)}
				{@const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['جديد']}
				<div class="rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-2xs space-y-3">
					<!-- Top Row: ID, Date, Status -->
					<div class="flex items-center justify-between border-b border-neutral-100 pb-2.5">
						<div>
							<span class="font-mono text-xs font-bold text-neutral-900">{order.id}</span>
							<p class="text-[10px] text-neutral-400">{formatDate(order.createdAt)}</p>
						</div>
						<!-- Status Select -->
						<select
							value={order.status}
							disabled={updatingOrderId === order.id}
							onchange={(e) => handleStatusChange(order.id, (e.target as HTMLSelectElement).value as OrderStatus)}
							class={`rounded-xl border px-2.5 py-1 text-xs font-bold transition-all focus:outline-none ${cfg.badgeClass}`}
						>
							{#each ALL_STATUSES as st}
								<option value={st}>{STATUS_CONFIG[st].icon} {st}</option>
							{/each}
						</select>
					</div>

					<!-- Middle: Customer & Product Info -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<p class="text-sm font-bold text-neutral-900">{order.fullName}</p>
							<span class="rounded-lg bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-700">
								{order.city}
							</span>
						</div>
						<p class="text-xs text-neutral-600 line-clamp-1">{order.product}</p>
						<p class="text-xs font-extrabold text-emerald-800">
							{order.totalPrice} {data.currencySymbol}
							<span class="text-[10px] font-normal text-neutral-400">({order.quantity} قطع)</span>
						</p>
					</div>

					<!-- Bottom Row: Big Action Buttons for Call & WhatsApp -->
					<div class="flex items-center gap-2 pt-1 border-t border-neutral-100">
						<!-- WhatsApp -->
						<a
							href={getWhatsappLink(order.phone, order.fullName, order.product)}
							target="_blank"
							rel="noopener"
							class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#20ba56] active:scale-95 transition-all"
						>
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							واتساب
						</a>

						<!-- Call -->
						<a
							href={getPhoneCallLink(order.phone)}
							class="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 active:scale-95 transition-all"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
							</svg>
							اتصال
						</a>

						<!-- Sync to Sheets -->
						<button
							type="button"
							onclick={() => syncSingleOrderToSheets(order.id)}
							disabled={syncingOrderId === order.id}
							class="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
							title="مزامنة مع Google Sheets"
							aria-label="مزامنة مع Google Sheets"
						>
							<svg class={`h-4 w-4 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
						</button>

						<!-- Copy -->
						<button
							type="button"
							onclick={() => copyOrderDetails(order)}
							class="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:scale-95"
							title="نسخ التفاصيل"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9 9 9 0 00-9 9v1.5m18 0a2.25 2.25 0 01-2.25 2.25H16.5" />
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
