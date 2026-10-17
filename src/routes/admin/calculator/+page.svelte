<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let liveStatsOverride = $state<PageData['dashboardStats'] | null>(null);
	const liveStats = $derived(liveStatsOverride ?? data.dashboardStats);

	// Mode: 'live' (طلبيات المتجر) or 'manual' (تجربة يدوية)
	let mode = $state<'live' | 'manual'>('live');

	// 5 Simple Core Inputs (Persisted in localStorage)
	let spaceSellerFee = $state(65); // خلاص SpaceSeller (التوصيل + التأكيد): Default 65 درهم
	let unitCost = $state(45); // ثمن السلعة بالجملة (للقرعة الوحدة): Default 45 درهم
	let confirmationRate = $state(65); // نسبة الكونفيرماسيون (التأكيد %): Default 65%
	let deliveryRate = $state(75); // نسبة الديليفري (التوصيل %): Default 75%

	// Ad Input: CPA (ثمن الكوموند فالإعلانات) or Total Ad Budget
	let adInputType = $state<'cpa' | 'total'>('cpa');
	let cpaInput = $state(40); // Default 40 درهم للـ Lead
	let totalAdSpendInput = $state(200); // Default 200 درهم

	// Manual simulation simple whole numbers
	let manualLeads = $state(50);
	let manualAOV = $state(279);
	let manualAvgBottles = $state(2);

	let hydrated = $state(false);

	onMount(() => {
		try {
			const raw = localStorage.getItem('nv_cod_calc_simple');
			if (raw) {
				const s = JSON.parse(raw);
				if (s.mode === 'live' || s.mode === 'manual') mode = s.mode;
				if (typeof s.spaceSellerFee === 'number') spaceSellerFee = s.spaceSellerFee;
				if (typeof s.unitCost === 'number') unitCost = s.unitCost;
				if (typeof s.confirmationRate === 'number') confirmationRate = s.confirmationRate;
				if (typeof s.deliveryRate === 'number') deliveryRate = s.deliveryRate;
				if (s.adInputType === 'cpa' || s.adInputType === 'total') adInputType = s.adInputType;
				if (typeof s.cpaInput === 'number') cpaInput = s.cpaInput;
				if (typeof s.totalAdSpendInput === 'number') totalAdSpendInput = s.totalAdSpendInput;
				if (typeof s.manualLeads === 'number') manualLeads = Math.round(s.manualLeads);
				if (typeof s.manualAOV === 'number') manualAOV = Math.round(s.manualAOV);
				if (typeof s.manualAvgBottles === 'number') manualAvgBottles = Math.round(s.manualAvgBottles);
			}
		} catch {}
		hydrated = true;
	});

	$effect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(
				'nv_cod_calc_simple',
				JSON.stringify({
					mode,
					spaceSellerFee,
					unitCost,
					confirmationRate,
					deliveryRate,
					adInputType,
					cpaInput,
					totalAdSpendInput,
					manualLeads,
					manualAOV,
					manualAvgBottles
				})
			);
			// Also sync nv_cod_calc_settings for /admin orders table
			localStorage.setItem(
				'nv_cod_calc_settings',
				JSON.stringify({
					spaceSellerFee,
					unitCost,
					confirmationRate,
					deliveryRate
				})
			);
		} catch {}
	});

	// =========================================================================
	// EXACT BUSINESS FORMULAS
	// =========================================================================
	const totalLeads = $derived(
		mode === 'live' ? Math.max(0, liveStats.totalOrdersCount) : Math.max(1, Math.round(manualLeads))
	);

	const aov = $derived(
		mode === 'live' ? Math.max(0, liveStats.averageOrderValue) : Math.max(0, manualAOV)
	);

	const avgBottlesPerOrder = $derived(
		mode === 'live' ? Math.max(0, liveStats.avgBottlesPerOrder) : Math.max(1, manualAvgBottles)
	);

	const totalPhysicalBottles = $derived(
		mode === 'live'
			? Math.max(0, liveStats.totalPhysicalBottles)
			: totalLeads * avgBottlesPerOrder
	);

	const sumOfOrderTotals = $derived(
		mode === 'live' ? Math.max(0, liveStats.totalRevenue) : totalLeads * aov
	);

	// Effective Delivery Rate (Net Rate) = (confirmationRate / 100) * (deliveryRate / 100)
	const effectiveDeliveryRate = $derived((confirmationRate / 100) * (deliveryRate / 100));
	const netDeliveryPercent = $derived(Math.round(effectiveDeliveryRate * 100));

	// Delivered Orders & Gross Revenue
	const deliveredOrders = $derived(totalLeads * effectiveDeliveryRate);
	const grossRevenue = $derived(sumOfOrderTotals * effectiveDeliveryRate);

	// SpaceSeller Fees & Wholesale Cost (COGS)
	const totalSpaceSellerFees = $derived(deliveredOrders * spaceSellerFee);
	const totalCOGS = $derived(totalPhysicalBottles * effectiveDeliveryRate * unitCost);

	// Net Profit Before Ads
	const netProfitBeforeAds = $derived(grossRevenue - totalSpaceSellerFees - totalCOGS);

	// Ad Spend & Actual CPA
	const totalAdSpend = $derived(
		adInputType === 'cpa' ? Math.max(0, cpaInput * totalLeads) : Math.max(0, totalAdSpendInput)
	);

	// Net Profit After Ads (الربح الصافي فجيبك)
	const netProfitAfterAds = $derived(Math.round(netProfitBeforeAds - totalAdSpend));

	// Margin Per Delivered Order & Break-Even CPA
	const marginPerDeliveredOrder = $derived(
		aov - spaceSellerFee - avgBottlesPerOrder * unitCost
	);

	// Break-Even CPA (الخط الأحمر للإعلان)
	const breakEvenCPA = $derived(
		Number((marginPerDeliveredOrder * effectiveDeliveryRate).toFixed(1))
	);

	const isWinning = $derived(netProfitAfterAds >= 0 && marginPerDeliveredOrder > 0);

	// =========================================================================
	// SECTION 3: ULTRA-SIMPLE OFFERS TABLE (7 OFFERS, 5 CLEAR COLUMNS)
	// =========================================================================
	const OFFERS_LIST = [
		{ name: 'باقة 1 علبة', bottles: 1, price: 199 },
		{ name: 'باقة 1 علبة + أبسيل (2 علب)', bottles: 2, price: 297 },
		{ name: 'باقة علبتين (2 علب)', bottles: 2, price: 279 },
		{ name: 'باقة علبتين + أبسيل (3 علب)', bottles: 3, price: 377 },
		{ name: 'باقة علبتين + 2 أبسيل (4 علب)', bottles: 4, price: 475 },
		{ name: 'باقة 3 علب', bottles: 3, price: 349 },
		{ name: 'باقة 3 علب + أبسيل (4 علب)', bottles: 4, price: 447 }
	];

	const offerRows = $derived(
		OFFERS_LIST.map((o) => {
			const totalCost = Math.round(spaceSellerFee + o.bottles * unitCost);
			const netDeliveredProfit = Math.round(o.price - totalCost);
			const maxAdCPA = Math.round(netDeliveredProfit * effectiveDeliveryRate);
			return {
				...o,
				totalCost,
				netDeliveredProfit,
				maxAdCPA
			};
		})
	);
</script>

<svelte:head>
	<title>حاسبة الأرباح والـ Break-Even — NOVAVITA</title>
</svelte:head>

<div class="space-y-10 bg-white text-gray-900" dir="rtl">
	<!-- Simple Mode Switcher Bar (Live Orders vs Manual Simulation) -->
	<div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-gray-200 rounded-xl p-4 bg-white">
		<div class="text-lg font-bold text-gray-900">
			{#if mode === 'live'}
				📊 الحساب خدام دابا على <span class="underline">{totalLeads} طلبيات حقيقية</span> مسجلة فالمتجر
			{:else}
				🧮 الحساب خدام دابا على <span class="underline">أرقام تجريبية ({totalLeads} كوموند)</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 w-full sm:w-auto">
			<button
				type="button"
				onclick={() => (mode = 'live')}
				class={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-base font-bold border-2 cursor-pointer ${
					mode === 'live'
						? 'bg-gray-900 text-white border-gray-900'
						: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
				}`}
			>
				طلبيات المتجر ({liveStats.totalOrdersCount})
			</button>
			<button
				type="button"
				onclick={() => (mode = 'manual')}
				class={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-base font-bold border-2 cursor-pointer ${
					mode === 'manual'
						? 'bg-gray-900 text-white border-gray-900'
						: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
				}`}
			>
				تجربة يدوية
			</button>
		</div>
	</div>

	<!-- =================================================================== -->
	<!-- SECTION 1: TOP SUMMARY — 4 GIANT CLEAR CARDS                        -->
	<!-- =================================================================== -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
		<!-- Card 1: متوسط سلة الشراء (AOV) -->
		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white flex flex-col justify-between">
			<h2 class="text-xl font-bold text-gray-800">متوسط سلة الشراء (AOV)</h2>
			<p class="text-4xl font-bold text-gray-900 my-3">
				{Math.round(aov)} درهم
			</p>
			<p class="text-base text-gray-600 font-medium">
				شحال كيتقدى الكليان فالمتوسط
			</p>
		</div>

		<!-- Card 2: الخط الأحمر للإعلان (Break-Even CPA) -->
		<div class="border-2 border-orange-400 rounded-xl p-6 bg-white flex flex-col justify-between">
			<h2 class="text-xl font-bold text-gray-800">الخط الأحمر للإعلان (Break-Even CPA)</h2>
			<p class="text-4xl font-bold text-orange-600 my-3">
				{breakEvenCPA} درهم
			</p>
			<p class="text-base text-gray-600 font-medium">
				أقصى ثمن مسموح يطيح بيه الكوموند فـ Ads باش ما تخسرش
			</p>
		</div>

		<!-- Card 3: نسبة الوصول الصافية -->
		<div class="border-2 border-gray-200 rounded-xl p-6 bg-white flex flex-col justify-between">
			<h2 class="text-xl font-bold text-gray-800">نسبة الوصول الصافية</h2>
			<p class="text-4xl font-bold text-blue-700 my-3">
				{netDeliveryPercent}%
			</p>
			<p class="text-base text-gray-600 font-medium">
				النسبة لي كتوصل وتتخلص فعلياً (التأكيد × التوصيل)
			</p>
		</div>

		<!-- Card 4: الربح الصافي فجيبك -->
		<div
			class={`border-2 rounded-xl p-6 bg-white flex flex-col justify-between ${
				isWinning ? 'border-green-500' : 'border-red-500'
			}`}
		>
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-xl font-bold text-gray-800">الربح الصافي فجيبك</h2>
				<span
					class={`px-3 py-1 rounded-lg text-base font-bold ${
						isWinning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{isWinning ? '🟢 رابح' : '🔴 خاسر'}
				</span>
			</div>
			<p
				class={`text-4xl font-bold my-3 ${
					isWinning ? 'text-green-600' : 'text-red-600'
				}`}
				dir="ltr"
				style="text-align: right;"
			>
				{netProfitAfterAds >= 0 ? `+${netProfitAfterAds}` : netProfitAfterAds} درهم
			</p>
			<p class="text-base text-gray-600 font-medium">
				صافي الربح من بعد خلاص SpaceSeller، السلعة، والإعلان
			</p>
		</div>
	</div>

	<!-- =================================================================== -->
	<!-- SECTION 2: SIMPLE INPUT CONTROLS (One Clean White Box)              -->
	<!-- =================================================================== -->
	<div class="border-2 border-gray-200 rounded-xl p-6 sm:p-8 bg-white space-y-6">
		<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 border-b-2 border-gray-100 pb-4">
			1. دخل الأرقام ديالك هنا:
		</h2>

		{#if mode === 'manual'}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
				<div>
					<label for="manual-leads" class="block text-lg font-bold text-gray-900 mb-2">
						عدد الكوموندات (الطلبيات):
					</label>
					<input
						id="manual-leads"
						type="number"
						min="1"
						step="1"
						bind:value={manualLeads}
						class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900"
					/>
				</div>
				<div>
					<label for="manual-aov" class="block text-lg font-bold text-gray-900 mb-2">
						متوسط سلة الشراء (درهم):
					</label>
					<input
						id="manual-aov"
						type="number"
						min="1"
						step="1"
						bind:value={manualAOV}
						class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900"
					/>
				</div>
				<div>
					<label for="manual-bottles" class="block text-lg font-bold text-gray-900 mb-2">
						عدد القراعي فالكوموند:
					</label>
					<input
						id="manual-bottles"
						type="number"
						min="1"
						step="1"
						bind:value={manualAvgBottles}
						class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900"
					/>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Input 1: خلاص SpaceSeller -->
			<div class="border-2 border-gray-200 rounded-xl p-5 bg-white">
				<label for="input-spaceseller" class="block text-lg font-bold text-gray-900 mb-2">
					خلاص SpaceSeller (التوصيل + التأكيد):
				</label>
				<div class="flex items-center gap-3">
					<input
						id="input-spaceseller"
						type="number"
						min="0"
						step="1"
						bind:value={spaceSellerFee}
						class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900 focus:border-blue-600 outline-none"
					/>
					<span class="text-xl font-bold text-gray-700 shrink-0">درهم</span>
				</div>
			</div>

			<!-- Input 2: ثمن السلعة بالجملة -->
			<div class="border-2 border-gray-200 rounded-xl p-5 bg-white">
				<label for="input-cogs" class="block text-lg font-bold text-gray-900 mb-2">
					ثمن السلعة بالجملة (للقرعة الوحدة):
				</label>
				<div class="flex items-center gap-3">
					<input
						id="input-cogs"
						type="number"
						min="0"
						step="1"
						bind:value={unitCost}
						class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900 focus:border-blue-600 outline-none"
					/>
					<span class="text-xl font-bold text-gray-700 shrink-0">درهم</span>
				</div>
			</div>

			<!-- Input 3: نسبة الكونفيرماسيون -->
			<div class="border-2 border-gray-200 rounded-xl p-5 bg-white space-y-3">
				<div class="flex items-center justify-between">
					<label for="input-conf" class="text-lg font-bold text-gray-900">
						نسبة الكونفيرماسيون (التأكيد %):
					</label>
					<div class="flex items-center gap-1">
						<input
							id="input-conf"
							type="number"
							min="10"
							max="100"
							bind:value={confirmationRate}
							class="w-24 h-12 rounded-xl border-2 border-gray-300 bg-white text-center text-2xl font-bold text-gray-900"
						/>
						<span class="text-2xl font-bold text-gray-900">%</span>
					</div>
				</div>
				<input
					type="range"
					min="10"
					max="100"
					step="1"
					bind:value={confirmationRate}
					class="w-full h-3 bg-gray-200 rounded-lg accent-gray-900 cursor-pointer"
				/>
			</div>

			<!-- Input 4: نسبة الديليفري -->
			<div class="border-2 border-gray-200 rounded-xl p-5 bg-white space-y-3">
				<div class="flex items-center justify-between">
					<label for="input-deliv" class="text-lg font-bold text-gray-900">
						نسبة الديليفري (التوصيل %):
					</label>
					<div class="flex items-center gap-1">
						<input
							id="input-deliv"
							type="number"
							min="10"
							max="100"
							bind:value={deliveryRate}
							class="w-24 h-12 rounded-xl border-2 border-gray-300 bg-white text-center text-2xl font-bold text-gray-900"
						/>
						<span class="text-2xl font-bold text-gray-900">%</span>
					</div>
				</div>
				<input
					type="range"
					min="10"
					max="100"
					step="1"
					bind:value={deliveryRate}
					class="w-full h-3 bg-gray-200 rounded-lg accent-gray-900 cursor-pointer"
				/>
			</div>

			<!-- Input 5: ثمن الكوموند فالإعلانات (CPA) أو ميزانية الإعلان -->
			<div class="md:col-span-2 border-2 border-gray-200 rounded-xl p-5 bg-white space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<label for="input-ad-cpa" class="text-lg font-bold text-gray-900">
						ثمن الكوموند فالإعلانات (CPA) أو ميزانية الإعلان:
					</label>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => (adInputType = 'cpa')}
							class={`px-4 py-2 rounded-lg text-base font-bold border-2 cursor-pointer ${
								adInputType === 'cpa'
									? 'bg-gray-900 text-white border-gray-900'
									: 'bg-white text-gray-700 border-gray-300'
							}`}
						>
							ثمن الكوموند الواحد (CPA)
						</button>
						<button
							type="button"
							onclick={() => (adInputType = 'total')}
							class={`px-4 py-2 rounded-lg text-base font-bold border-2 cursor-pointer ${
								adInputType === 'total'
									? 'bg-gray-900 text-white border-gray-900'
									: 'bg-white text-gray-700 border-gray-300'
							}`}
						>
							الميزانية الكلية للإعلان
						</button>
					</div>
				</div>

				{#if adInputType === 'cpa'}
					<div class="flex items-center gap-3">
						<input
							id="input-ad-cpa"
							type="number"
							min="0"
							step="1"
							bind:value={cpaInput}
							class="w-full sm:w-64 h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900 focus:border-blue-600 outline-none"
						/>
						<span class="text-xl font-bold text-gray-700">
							درهم لكل كوموند (المجموع: {Math.round(totalAdSpend)} درهم لـ {totalLeads} كوموند)
						</span>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<input
							id="input-ad-total"
							type="number"
							min="0"
							step="10"
							bind:value={totalAdSpendInput}
							class="w-full sm:w-64 h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-2xl font-bold text-gray-900 focus:border-blue-600 outline-none"
						/>
						<span class="text-xl font-bold text-gray-700">
							درهم فالمجموع ({totalLeads > 0 ? Math.round(totalAdSpendInput / totalLeads) : 0} درهم للكوموند الواحد)
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- =================================================================== -->
	<!-- SECTION 3: ULTRA-SIMPLE OFFERS TABLE (5 Clear Columns, Large Font)  -->
	<!-- =================================================================== -->
	<div class="border-2 border-gray-200 rounded-xl p-6 sm:p-8 bg-white space-y-6">
		<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
			2. شحال كتربح فكل عرض وفكل أبسيل:
		</h2>

		<div class="overflow-x-auto">
			<table class="w-full text-right border-collapse">
				<thead>
					<tr class="border-b-2 border-gray-300 bg-gray-50 text-lg font-bold text-gray-900">
						<th class="py-4 px-4">العرض / الباقة</th>
						<th class="py-4 px-4">ثمن البيع للزبون</th>
						<th class="py-4 px-4">المصاريف (SpaceSeller {spaceSellerFee} DH + السلعة)</th>
						<th class="py-4 px-4">ربحك الصافي فالكولية الموصلة (قبل الإعلان)</th>
						<th class="py-4 px-4 bg-orange-50 text-orange-900">
							الـ Break-Even (أقصى ثمن للـ Lead فـ Ads)
						</th>
					</tr>
				</thead>
				<tbody class="divide-y-2 divide-gray-200 text-lg">
					{#each offerRows as row}
						<tr class="hover:bg-gray-50">
							<!-- 1. العرض / الباقة -->
							<td class="py-5 px-4 font-bold text-gray-900">
								{row.name}
							</td>

							<!-- 2. ثمن البيع للزبون -->
							<td class="py-5 px-4 font-bold text-gray-900">
								{row.price} درهم
							</td>

							<!-- 3. المصاريف (SpaceSeller + السلعة) -->
							<td class="py-5 px-4 font-bold text-red-600">
								{row.totalCost} درهم
							</td>

							<!-- 4. ربحك الصافي فالكولية الموصلة (قبل الإعلان) -->
							<td class="py-5 px-4 font-bold text-green-700" dir="ltr" style="text-align: right;">
								+{row.netDeliveredProfit} درهم
							</td>

							<!-- 5. الـ Break-Even (أقصى ثمن للـ Lead فـ Ads) -->
							<td class="py-5 px-4 bg-orange-50/60 font-bold text-xl text-orange-700">
								{row.maxAdCPA} درهم
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
