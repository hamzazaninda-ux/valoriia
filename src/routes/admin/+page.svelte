<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let statsOverride = $state<PageData['dashboardStats'] | null>(null);
	let ordersOverride = $state<PageData['recentOrders'] | null>(null);

	const stats = $derived(statsOverride ?? data.dashboardStats);
	const orders = $derived(ordersOverride ?? data.recentOrders);

	let isRefreshing = $state(false);
	let searchQuery = $state('');

	let spaceSellerFee = $state(65);
	let unitCost = $state(45);

	onMount(() => {
		try {
			const saved = localStorage.getItem('nv_cod_calc_simple') || localStorage.getItem('nv_cod_calc_settings');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (typeof parsed.spaceSellerFee === 'number') spaceSellerFee = parsed.spaceSellerFee;
				if (typeof parsed.unitCost === 'number') unitCost = parsed.unitCost;
			}
		} catch {}
	});

	async function refreshDashboard() {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			const res = await fetch('/api/admin/orders');
			const json = await res.json();
			if (res.ok && json.success) {
				statsOverride = json.stats;
				ordersOverride = json.orders;
			}
		} catch {}
		isRefreshing = false;
	}

	function calcOrderDeliveredNetProfit(totalPrice: number, physicalBottles: number): number {
		return Math.round(totalPrice - spaceSellerFee - physicalBottles * unitCost);
	}

	const filteredOrders = $derived(
		orders.filter((o) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.trim().toLowerCase();
			return (
				o.fullName.toLowerCase().includes(q) ||
				o.phone.toLowerCase().includes(q) ||
				o.baseOfferLabel.toLowerCase().includes(q) ||
				o.upsellName.toLowerCase().includes(q)
			);
		})
	);
</script>

<svelte:head>
	<title>الطلبيات — NOVAVITA</title>
</svelte:head>

<div class="space-y-8 bg-white text-gray-900" dir="rtl">
	<!-- 4 Big Pure White Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white">
			<h2 class="text-xl font-bold text-gray-800">مجموع الطلبيات</h2>
			<p class="text-4xl font-bold text-gray-900 my-3">{stats.totalOrdersCount}</p>
			<p class="text-base text-gray-600">طلبيات اليوم: {stats.todayOrdersCount}</p>
		</div>

		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white">
			<h2 class="text-xl font-bold text-gray-800">متوسط سلة الشراء (AOV)</h2>
			<p class="text-4xl font-bold text-gray-900 my-3">{Math.round(stats.averageOrderValue)} درهم</p>
			<p class="text-base text-gray-600">شحال كيتقدى الكليان فالمتوسط</p>
		</div>

		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white">
			<h2 class="text-xl font-bold text-gray-800">مجموع القراعي المطلوبة</h2>
			<p class="text-4xl font-bold text-gray-900 my-3">{stats.totalPhysicalBottles} علبة</p>
			<p class="text-base text-gray-600">الكمية الإجمالية فجميع الطلبيات</p>
		</div>

		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white">
			<h2 class="text-xl font-bold text-gray-800">نسبة نجاح الأبسيل</h2>
			<p class="text-4xl font-bold text-blue-700 my-3">{Math.round(stats.upsellConversionRate)}%</p>
			<p class="text-base text-gray-600">{stats.upsellOrdersCount} طلبيات فيها أبسيل (+99 درهم)</p>
		</div>
	</div>

	<!-- Simple White Orders Table -->
	<div class="border-2 border-gray-200 rounded-xl p-6 bg-white space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">لائحة الطلبيات ({filteredOrders.length})</h2>

			<div class="flex items-center gap-3">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="قلب بالسمية أو التليفون..."
					class="w-full sm:w-72 h-12 px-4 rounded-xl border-2 border-gray-300 text-lg font-bold text-gray-900 outline-none focus:border-gray-900"
				/>
				<button
					type="button"
					onclick={refreshDashboard}
					disabled={isRefreshing}
					class="px-5 h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-100 text-lg font-bold text-gray-900 cursor-pointer shrink-0"
				>
					{isRefreshing ? '...' : 'تحديث'}
				</button>
			</div>
		</div>

		{#if filteredOrders.length === 0}
			<div class="p-10 text-center text-xl font-bold text-gray-500">
				ماكاين حتى طلبية
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-right border-collapse">
					<thead>
						<tr class="border-b-2 border-gray-300 bg-gray-50 text-lg font-bold text-gray-900">
							<th class="py-4 px-4">التاريخ</th>
							<th class="py-4 px-4">الزبون(ة)</th>
							<th class="py-4 px-4">التليفون</th>
							<th class="py-4 px-4">العرض الأساسي</th>
							<th class="py-4 px-4">الأبسيل (+99 درهم)</th>
							<th class="py-4 px-4 text-center">عدد العلب</th>
							<th class="py-4 px-4">الثمن الكامل</th>
							<th class="py-4 px-4">ربحك الصافي (إلا وصلات)</th>
						</tr>
					</thead>
					<tbody class="divide-y-2 divide-gray-200 text-lg">
						{#each filteredOrders as order}
							{@const netProfit = calcOrderDeliveredNetProfit(order.totalPrice, order.physicalBottles)}
							<tr class="hover:bg-gray-50">
								<td class="py-4 px-4 font-medium text-gray-700 whitespace-nowrap">
									{order.formattedDate}
								</td>
								<td class="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">
									{order.fullName}
								</td>
								<td class="py-4 px-4 font-bold text-gray-900 whitespace-nowrap" dir="ltr" style="text-align: right;">
									{order.phone}
								</td>
								<td class="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">
									{order.baseOfferLabel}
								</td>
								<td class="py-4 px-4 font-bold whitespace-nowrap {order.hasUpsell ? 'text-blue-700' : 'text-gray-400'}">
									{order.upsellName}
								</td>
								<td class="py-4 px-4 text-center font-bold text-gray-900 whitespace-nowrap">
									{order.physicalBottles} علب
								</td>
								<td class="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">
									{order.totalPrice} درهم
								</td>
								<td class="py-4 px-4 font-bold text-green-700 whitespace-nowrap" dir="ltr" style="text-align: right;">
									+{netProfit} درهم
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
