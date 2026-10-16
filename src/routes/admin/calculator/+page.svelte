<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { CanonicalSku } from '$lib/server/adminOrders';

	let { data }: { data: PageData } = $props();

	// Live data state (refreshable from /api/admin/orders)
	let liveStatsOverride = $state<PageData['dashboardStats'] | null>(null);
	const liveStats = $derived(liveStatsOverride ?? data.dashboardStats);

	let isRefreshingLive = $state(false);
	let toastMsg = $state<string | null>(null);

	function notify(msg: string) {
		toastMsg = msg;
		setTimeout(() => {
			toastMsg = null;
		}, 2800);
	}

	async function refreshLiveOrders() {
		if (isRefreshingLive) return;
		isRefreshingLive = true;
		try {
			const res = await fetch('/api/admin/orders');
			const json = await res.json();
			if (res.ok && json.success) {
				liveStatsOverride = json.stats;
				notify('تم تحديث بيانات المتجر الحقيقية بنجاح ✅');
			}
		} catch {}
		isRefreshingLive = false;
	}

	// =========================================================================
	// 1. CALCULATOR MODE & ADJUSTABLE INPUTS (Persisted in localStorage)
	// =========================================================================
	let mode = $state<'live' | 'manual'>('live');

	// Core Cost & Funnel Sliders
	let spaceSellerFee = $state(65); // Default 65 MAD per delivered order
	let returnFee = $state(0); // Default 0 MAD per returned/canceled order
	let unitCost = $state(45); // Default 45 MAD per physical bottle
	let useCustomSkuCosts = $state(false);
	let skuCosts = $state<Record<CanonicalSku, number>>({
		gummies_collagen: 45,
		'gumies-vitamine': 45,
		gummies_melato: 45,
		gummies_biotine: 45
	});

	let confirmationRate = $state(65); // Default 65%
	let deliveryRate = $state(75); // Default 75%

	// Ad Spend Controls
	let adInputType = $state<'total' | 'cpa'>('total');
	let totalAdSpend = $state(200); // Default ad spend in MAD
	let manualCPAInput = $state(40); // Used when adInputType === 'cpa'

	// Manual Simulation Inputs
	let manualLeads = $state(50);
	let manualAOV = $state(279);
	let manualAvgBottles = $state(2);

	let hydrated = $state(false);

	onMount(() => {
		try {
			const raw = localStorage.getItem('nv_cod_calc_settings');
			if (raw) {
				const s = JSON.parse(raw);
				if (s.mode === 'live' || s.mode === 'manual') mode = s.mode;
				if (typeof s.spaceSellerFee === 'number') spaceSellerFee = s.spaceSellerFee;
				if (typeof s.returnFee === 'number') returnFee = s.returnFee;
				if (typeof s.unitCost === 'number') unitCost = s.unitCost;
				if (typeof s.useCustomSkuCosts === 'boolean') useCustomSkuCosts = s.useCustomSkuCosts;
				if (s.skuCosts && typeof s.skuCosts === 'object') {
					skuCosts = {
						gummies_collagen: Number(s.skuCosts.gummies_collagen ?? 45),
						'gumies-vitamine': Number(s.skuCosts['gumies-vitamine'] ?? 45),
						gummies_melato: Number(s.skuCosts.gummies_melato ?? 45),
						gummies_biotine: Number(s.skuCosts.gummies_biotine ?? 45)
					};
				}
				if (typeof s.confirmationRate === 'number') confirmationRate = s.confirmationRate;
				if (typeof s.deliveryRate === 'number') deliveryRate = s.deliveryRate;
				if (typeof s.totalAdSpend === 'number') totalAdSpend = s.totalAdSpend;
				if (typeof s.manualCPAInput === 'number') manualCPAInput = s.manualCPAInput;
				if (s.adInputType === 'total' || s.adInputType === 'cpa') adInputType = s.adInputType;
				if (typeof s.manualLeads === 'number') manualLeads = s.manualLeads;
				if (typeof s.manualAOV === 'number') manualAOV = s.manualAOV;
				if (typeof s.manualAvgBottles === 'number') manualAvgBottles = s.manualAvgBottles;
			}
		} catch {}
		hydrated = true;
	});

	// Persist changes to localStorage
	$effect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(
				'nv_cod_calc_settings',
				JSON.stringify({
					mode,
					spaceSellerFee,
					returnFee,
					unitCost,
					useCustomSkuCosts,
					skuCosts,
					confirmationRate,
					deliveryRate,
					adInputType,
					totalAdSpend,
					manualCPAInput,
					manualLeads,
					manualAOV,
					manualAvgBottles
				})
			);
		} catch {}
	});

	function handleUnitCostChange(val: number) {
		unitCost = val;
		if (!useCustomSkuCosts) {
			skuCosts = {
				gummies_collagen: val,
				'gumies-vitamine': val,
				gummies_melato: val,
				gummies_biotine: val
			};
		}
	}

	function resetDefaults() {
		spaceSellerFee = 65;
		returnFee = 0;
		unitCost = 45;
		useCustomSkuCosts = false;
		skuCosts = {
			gummies_collagen: 45,
			'gumies-vitamine': 45,
			gummies_melato: 45,
			gummies_biotine: 45
		};
		confirmationRate = 65;
		deliveryRate = 75;
		totalAdSpend = mode === 'live' ? 200 : 1500;
		manualCPAInput = 35;
		manualLeads = 50;
		manualAOV = 279;
		manualAvgBottles = 2;
		notify('تمت استعادة الإعدادات الافتراضية (SpaceSeller 65 DH / COGS 45 DH)');
	}

	// =========================================================================
	// 2. EXACT FUNNEL & FINANCIAL EQUATIONS (ZERO MATH ERRORS)
	// =========================================================================

	// Active Funnel Inputs based on selected mode
	const totalLeads = $derived(
		mode === 'live' ? Math.max(0, liveStats.totalOrdersCount) : Math.max(0, manualLeads)
	);

	const aov = $derived(
		mode === 'live' ? Math.max(0, liveStats.averageOrderValue) : Math.max(0, manualAOV)
	);

	const avgBottlesPerOrder = $derived(
		mode === 'live' ? Math.max(0, liveStats.avgBottlesPerOrder) : Math.max(0, manualAvgBottles)
	);

	const totalPhysicalBottles = $derived(
		mode === 'live'
			? Math.max(0, liveStats.totalPhysicalBottles)
			: totalLeads * avgBottlesPerOrder
	);

	const sumOfOrderTotals = $derived(
		mode === 'live' ? Math.max(0, liveStats.totalRevenue) : totalLeads * aov
	);

	// Effective unit cost (supports per-SKU custom wholesale costs)
	const effectiveUnitCost = $derived.by(() => {
		if (!useCustomSkuCosts) return unitCost;
		if (mode === 'live' && liveStats.totalPhysicalBottles > 0) {
			const c = liveStats.skuBottleCounts;
			const totalWeighted =
				c.gummies_collagen * skuCosts.gummies_collagen +
				c['gumies-vitamine'] * skuCosts['gumies-vitamine'] +
				c.gummies_melato * skuCosts.gummies_melato +
				c.gummies_biotine * skuCosts.gummies_biotine;
			return totalWeighted / liveStats.totalPhysicalBottles;
		}
		// Average across the 4 SKUs in manual mode if custom SKU costs are toggled
		return (
			(skuCosts.gummies_collagen +
				skuCosts['gumies-vitamine'] +
				skuCosts.gummies_melato +
				skuCosts.gummies_biotine) /
			4
		);
	});

	// Effective Delivery Rate (Net Rate) = (confirmationRate / 100) * (deliveryRate / 100)
	const effectiveDeliveryRate = $derived((confirmationRate / 100) * (deliveryRate / 100));

	// Confirmed & Delivered Orders
	const confirmedOrders = $derived(totalLeads * (confirmationRate / 100));
	const deliveredOrders = $derived(totalLeads * effectiveDeliveryRate);
	const returnedOrders = $derived(Math.max(0, confirmedOrders - deliveredOrders));

	// Gross Revenue (Collected Cash) = Sum of Order Totals * Effective Delivery Rate
	const grossRevenue = $derived(sumOfOrderTotals * effectiveDeliveryRate);

	// Total SpaceSeller Fees = Delivered Orders * spaceSellerFee (+ optional returnFee on returned orders)
	const totalSpaceSellerFees = $derived(
		deliveredOrders * spaceSellerFee + returnedOrders * returnFee
	);

	// Total COGS (Wholesale Cost) = (Total Physical Bottles Across Orders * Effective Delivery Rate) * unitCost
	const totalCOGS = $derived(totalPhysicalBottles * effectiveDeliveryRate * effectiveUnitCost);

	// Net Profit Before Ads = Gross Revenue - Total SpaceSeller Fees - Total COGS
	const netProfitBeforeAds = $derived(grossRevenue - totalSpaceSellerFees - totalCOGS);

	// Effective Ad Spend & Actual CPA
	const effectiveAdSpend = $derived(
		adInputType === 'total' ? Math.max(0, totalAdSpend) : Math.max(0, manualCPAInput * totalLeads)
	);

	// Actual CPA = totalAdSpend / Total Leads
	const actualCPA = $derived(
		adInputType === 'cpa'
			? Math.max(0, manualCPAInput)
			: totalLeads > 0
				? effectiveAdSpend / totalLeads
				: 0
	);

	// Net Profit After Ads = Net Profit Before Ads - totalAdSpend
	const netProfitAfterAds = $derived(netProfitBeforeAds - effectiveAdSpend);

	// Margin Per Delivered Order = AOV - spaceSellerFee - (Avg Bottles Per Order * unitCost)
	const marginPerDeliveredOrder = $derived(
		aov - spaceSellerFee - avgBottlesPerOrder * effectiveUnitCost
	);

	// Break-Even CPA (Max Cost Per Lead in Ads) = Margin Per Delivered Order * Effective Delivery Rate
	const breakEvenCPA = $derived(marginPerDeliveredOrder * effectiveDeliveryRate);

	// Break-Even ROAS = AOV / Margin Per Delivered Order
	const breakEvenROAS = $derived(
		marginPerDeliveredOrder > 0 ? aov / marginPerDeliveredOrder : 0
	);

	// Profit Per Lead = Break-Even CPA - Actual CPA
	const profitPerLead = $derived(breakEvenCPA - actualCPA);

	// Profitability Status
	const isProfitable = $derived(netProfitAfterAds > 0 && marginPerDeliveredOrder > 0);
	const isBreakEven = $derived(Math.abs(netProfitAfterAds) < 0.5 && marginPerDeliveredOrder > 0);

	// =========================================================================
	// 3. UNIT ECONOMICS BREAKDOWN TABLE BY OFFER TIER (7 TIERS)
	// =========================================================================
	interface OfferTierRow {
		id: string;
		name: string;
		subtitle: string;
		bottles: number;
		revenue: number;
		badge?: string;
		isHighlight?: boolean;
	}

	const OFFER_TIER_ROWS: OfferTierTier[] = [
		{
			id: 'tier_1',
			name: 'باقة 1 علبة (199 DH)',
			subtitle: 'علبة واحدة • كورس تجريبي',
			bottles: 1,
			revenue: 199
		},
		{
			id: 'tier_1_up1',
			name: 'باقة 1 علبة + أبسيل (298 DH)',
			subtitle: 'علبة أساسية + علبة أبسيل (99 DH)',
			bottles: 2,
			revenue: 298,
			badge: '+1 أبسيل'
		},
		{
			id: 'tier_2',
			name: 'باقة علبتين (279 DH)',
			subtitle: 'علبتان • الأكثر طلباً',
			bottles: 2,
			revenue: 279,
			badge: 'الأكثر طلباً ⭐',
			isHighlight: true
		},
		{
			id: 'tier_2_up1',
			name: 'باقة علبتين + أبسيل (378 DH)',
			subtitle: 'علبتان أساسيتان + علبة أبسيل (99 DH)',
			bottles: 3,
			revenue: 378,
			badge: 'أعلى تحويل 🔥',
			isHighlight: true
		},
		{
			id: 'tier_2_up2',
			name: 'باقة علبتين + 2 أبسيل (477 DH)',
			subtitle: 'علبتان أساسيتان + علبتان أبسيل (198 DH)',
			bottles: 4,
			revenue: 477,
			badge: '+2 أبسيل'
		},
		{
			id: 'tier_3',
			name: 'باقة 3 علب (349 DH)',
			subtitle: '3 علب • كورس علاجي كامل 3 أشهر',
			bottles: 3,
			revenue: 349
		},
		{
			id: 'tier_3_up1',
			name: 'باقة 3 علب + أبسيل (448 DH)',
			subtitle: '3 علب أساسية + علبة أبسيل (99 DH)',
			bottles: 4,
			revenue: 448,
			badge: 'VIP AOV 👑',
			isHighlight: true
		}
	];

	type OfferTierTier = OfferTierRow;

	const tierEconomicsRows = $derived(
		OFFER_TIER_ROWS.map((row) => {
			const cogs = row.bottles * effectiveUnitCost;
			const netMarginDelivered = row.revenue - spaceSellerFee - cogs;
			const rowBreakEvenCPA = netMarginDelivered * effectiveDeliveryRate;
			const rowBreakEvenROAS = netMarginDelivered > 0 ? row.revenue / netMarginDelivered : 0;
			const rowProfitPerLead = rowBreakEvenCPA - actualCPA;
			return {
				...row,
				spaceSellerFee,
				cogs,
				netMarginDelivered,
				rowBreakEvenCPA,
				rowBreakEvenROAS,
				rowProfitPerLead
			};
		})
	);

	// Helper to load a tier directly into Manual Simulation
	function simulateSpecificTier(row: OfferTierRow) {
		mode = 'manual';
		manualAOV = row.revenue;
		manualAvgBottles = row.bottles;
		notify(`تم تطبيق محاكاة: ${row.name}`);
	}
</script>

<svelte:head>
	<title>حاسبة الأرباح والـ Break-Even — NOVAVITA</title>
</svelte:head>

{#if toastMsg}
	<div class="fixed top-5 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300">
		<div
			class="flex items-center gap-2 rounded-2xl bg-[#065f46] text-amber-200 border border-amber-400/40 px-5 py-3 text-xs sm:text-sm font-black shadow-xl"
			dir="rtl"
		>
			<span>✓</span>
			<span>{toastMsg}</span>
		</div>
	</div>
{/if}

<div class="space-y-6 sm:space-y-8" dir="rtl">
	<!-- Top Header & Mode Switcher -->
	<div
		class="rounded-3xl bg-gradient-to-l from-[#134e4a] via-[#065f46] to-[#0b352c] text-white p-6 sm:p-7 shadow-xl border border-amber-400/30 relative overflow-hidden"
	>
		<div
			class="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl"
		></div>

		<div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
			<div class="space-y-1.5">
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 text-[11px] font-black"
					>
						🧮 محرك الحسابات المالية والـ Break-Even (COD Engine)
					</span>
					<span
						class="px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-200 border border-emerald-700 text-[11px] font-bold"
					>
						SpaceSeller + COGS + Media Buying
					</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
					حاسبة الأرباح الصافية ونقطة التعادل الإعلاني (Break-Even CPA)
				</h1>
				<p class="text-xs sm:text-sm text-emerald-100/85 font-medium max-w-2xl">
					حساب دقيق 100% لصافي الربح بعد رسوم SpaceSeller (65 DH للطلبية الموصلة)، تكلفة السلعة (COGS)، نسب التأكيد والتوصيل، وميزانية الإعلانات.
				</p>
			</div>

			<!-- Mode Switcher Toggle -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
				<div
					class="inline-flex rounded-2xl bg-black/30 p-1.5 border border-white/15 backdrop-blur-md"
				>
					<button
						type="button"
						onclick={() => (mode = 'live')}
						class={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
							mode === 'live'
								? 'bg-amber-400 text-emerald-950 shadow-md'
								: 'text-emerald-100 hover:text-white'
						}`}
					>
						<span>🟢 بيانات المتجر الحقيقية</span>
						<span
							class={`px-1.5 py-0.2 rounded-full text-[10px] ${
								mode === 'live' ? 'bg-emerald-950 text-amber-300' : 'bg-white/15 text-white'
							}`}
						>
							{liveStats.totalOrdersCount}
						</span>
					</button>
					<button
						type="button"
						onclick={() => (mode = 'manual')}
						class={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
							mode === 'manual'
								? 'bg-amber-400 text-emerald-950 shadow-md'
								: 'text-emerald-100 hover:text-white'
						}`}
					>
						<span>🎛️ محاكاة يدوية (Simulation)</span>
					</button>
				</div>

				{#if mode === 'live'}
					<button
						type="button"
						onclick={refreshLiveOrders}
						disabled={isRefreshingLive}
						class="rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-extrabold text-white transition-all cursor-pointer"
						title="تحديث الطلبيات الحية"
					>
						{isRefreshingLive ? 'جاري التحديث...' : '🔄 تحديث'}
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- ======================================================================= -->
	<!-- STATUS BANNER (GREEN FOR PROFITABLE / RED FOR LOSING MONEY)             -->
	<!-- ======================================================================= -->
	<div
		class={`rounded-3xl p-5 sm:p-6 border-2 shadow-lg transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
			isProfitable
				? 'bg-gradient-to-l from-emerald-900 via-[#065f46] to-teal-900 text-white border-emerald-400/50'
				: isBreakEven
					? 'bg-gradient-to-l from-amber-800 to-amber-900 text-white border-amber-400/50'
					: 'bg-gradient-to-l from-rose-900 via-red-900 to-rose-950 text-white border-rose-400/60'
		}`}
	>
		<div class="flex items-center gap-4">
			<div
				class={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black shadow-md border ${
					isProfitable
						? 'bg-emerald-400/20 border-emerald-300/40 text-emerald-200'
						: isBreakEven
							? 'bg-amber-400/20 border-amber-300/40 text-amber-200'
							: 'bg-rose-400/20 border-rose-300/40 text-rose-200'
				}`}
			>
				{isProfitable ? '🟢' : isBreakEven ? '🟡' : '🔴'}
			</div>
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
							isProfitable
								? 'bg-emerald-400 text-emerald-950'
								: isBreakEven
									? 'bg-amber-300 text-amber-950'
									: 'bg-rose-400 text-rose-950'
						}`}
					>
						{isProfitable
							? '🟢 رابح (Profitable Campaign)'
							: isBreakEven
								? '🟡 نقطة التعادل (Break-Even)'
								: '🔴 خاسر (Losing Money)'}
					</span>
					<span class="text-xs font-bold text-white/80">
						{mode === 'live'
							? `بناءً على ${totalLeads} طلبية حقيقية في المتجر`
							: `بناءً على محاكاة ${totalLeads} طلبية`}
					</span>
				</div>
				<h2 class="text-xl sm:text-2xl font-black mt-1">
					{#if isProfitable}
						صافي ربحك بعد الإعلانات ورسوم SpaceSeller والسلعة هو
						<span class="text-amber-300 underline decoration-amber-400/50" dir="ltr">
							+{Math.round(netProfitAfterAds).toLocaleString()} MAD
						</span>
					{:else if isBreakEven}
						أنت في نقطة التعادل تماماً (0 درهم ربح / خسارة)
					{:else}
						انتبه! الحملة تسجل خسارة صافية بقيمة
						<span class="text-rose-200 underline" dir="ltr">
							{Math.round(netProfitAfterAds).toLocaleString()} MAD
						</span>
						(تكلفة الـ CPA الحالي {actualCPA.toFixed(1)} DH أعلى من نقطة التعادل {breakEvenCPA.toFixed(1)} DH)
					{/if}
				</h2>
			</div>
		</div>

		<!-- Quick Pill Summary on Right of Banner -->
		<div class="flex flex-wrap items-center gap-3 shrink-0">
			<div class="rounded-2xl bg-black/25 border border-white/15 px-4 py-2.5 text-center">
				<span class="block text-[10px] font-bold text-white/75">الربح الصافي لكل Lead</span>
				<span
					class={`block text-base sm:text-lg font-black ${
						profitPerLead >= 0 ? 'text-amber-300' : 'text-rose-300'
					}`}
					dir="ltr"
				>
					{profitPerLead >= 0 ? `+${profitPerLead.toFixed(1)}` : profitPerLead.toFixed(1)} MAD
				</span>
			</div>
			<div class="rounded-2xl bg-black/25 border border-white/15 px-4 py-2.5 text-center">
				<span class="block text-[10px] font-bold text-white/75">تكلفة Lead الفعلية (Actual CPA)</span>
				<span class="block text-base sm:text-lg font-black text-white" dir="ltr">
					{actualCPA.toFixed(1)} MAD
				</span>
			</div>
		</div>
	</div>

	<!-- ======================================================================= -->
	<!-- MAIN GRID: LEFT = CONTROLS, RIGHT = OUTPUT KPI CARDS & FUNNEL BREAKDOWN -->
	<!-- ======================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- RIGHT COLUMN IN RTL (5 cols): INTERACTIVE CONTROLS & SLIDERS -->
		<div class="lg:col-span-5 space-y-5 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs">
			<div class="flex items-center justify-between border-b border-neutral-100 pb-4">
				<div class="flex items-center gap-2.5">
					<span
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#065f46] text-amber-300 font-black text-base"
					>
						⚙️
					</span>
					<div>
						<h3 class="text-base font-black text-neutral-900">إعدادات التكاليف ونسب التحويل</h3>
						<p class="text-[11px] text-neutral-500 font-semibold">
							يتم حفظ تعديلاتك تلقائياً في المتصفح
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={resetDefaults}
					class="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
				>
					إعادة ضبط (65 / 45)
				</button>
			</div>

			<!-- Manual Mode Simulation Inputs (Visible when mode === 'manual', or summary when mode === 'live') -->
			{#if mode === 'manual'}
				<div class="rounded-2xl bg-amber-50/70 border border-amber-200/90 p-4 space-y-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-black text-amber-950 flex items-center gap-1.5">
							<span>🎛️</span>
							<span>مدخلات المحاكاة اليدوية (Manual Simulation)</span>
						</span>
						<span class="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
							وضع المحاكاة
						</span>
					</div>

					<div class="grid grid-cols-3 gap-2.5">
						<div>
							<label for="sim-leads" class="block text-[11px] font-bold text-neutral-700 mb-1">
								عدد الطلبيات (Leads)
							</label>
							<input
								id="sim-leads"
								type="number"
								min="1"
								step="1"
								bind:value={manualLeads}
								class="w-full h-10 rounded-xl border border-amber-300 bg-white px-2.5 text-center font-black text-sm text-neutral-900 focus:border-[#065f46] outline-none"
								dir="ltr"
							/>
						</div>
						<div>
							<label for="sim-aov" class="block text-[11px] font-bold text-neutral-700 mb-1">
								متوسط السلة (AOV)
							</label>
							<input
								id="sim-aov"
								type="number"
								min="1"
								step="1"
								bind:value={manualAOV}
								class="w-full h-10 rounded-xl border border-amber-300 bg-white px-2.5 text-center font-black text-sm text-[#065f46] focus:border-[#065f46] outline-none"
								dir="ltr"
							/>
						</div>
						<div>
							<label for="sim-bottles" class="block text-[11px] font-bold text-neutral-700 mb-1">
								العلب / طلبية
							</label>
							<input
								id="sim-bottles"
								type="number"
								min="1"
								max="10"
								step="0.1"
								bind:value={manualAvgBottles}
								class="w-full h-10 rounded-xl border border-amber-300 bg-white px-2.5 text-center font-black text-sm text-neutral-900 focus:border-[#065f46] outline-none"
								dir="ltr"
							/>
						</div>
					</div>

					<!-- Quick Preset Buttons -->
					<div class="flex flex-wrap gap-1.5 pt-1">
						{#each OFFER_TIER_ROWS as preset}
							<button
								type="button"
								onclick={() => {
									manualAOV = preset.revenue;
									manualAvgBottles = preset.bottles;
								}}
								class={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
									manualAOV === preset.revenue && manualAvgBottles === preset.bottles
										? 'bg-[#065f46] text-white border-[#065f46]'
										: 'bg-white text-neutral-700 border-amber-200 hover:border-[#065f46]'
								}`}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Live Mode Summary Box -->
				<div class="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-black text-[#065f46] flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							<span>بيانات المتجر الحقيقية النشطة</span>
						</span>
						<button
							type="button"
							onclick={() => (mode = 'manual')}
							class="text-[10px] font-extrabold text-[#065f46] underline cursor-pointer"
						>
							التبديل للمحاكاة اليدوية
						</button>
					</div>
					<div class="grid grid-cols-3 gap-2 text-center">
						<div class="bg-white rounded-xl p-2 border border-emerald-100">
							<span class="block text-[10px] font-bold text-neutral-500">إجمالي الطلبيات</span>
							<span class="block text-sm font-black text-neutral-900" dir="ltr">
								{liveStats.totalOrdersCount} Leads
							</span>
						</div>
						<div class="bg-white rounded-xl p-2 border border-emerald-100">
							<span class="block text-[10px] font-bold text-neutral-500">Live AOV</span>
							<span class="block text-sm font-black text-[#065f46]" dir="ltr">
								{liveStats.averageOrderValue} MAD
							</span>
						</div>
						<div class="bg-white rounded-xl p-2 border border-emerald-100">
							<span class="block text-[10px] font-bold text-neutral-500">متوسط العلب</span>
							<span class="block text-sm font-black text-neutral-900" dir="ltr">
								{liveStats.avgBottlesPerOrder} / طلبية
							</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Control 1: SpaceSeller All-In Fee & Optional Return Fee -->
			<div class="space-y-3 pt-1">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="sm:col-span-2">
						<label
							for="input-spaceseller-fee"
							class="block text-xs font-extrabold text-neutral-800 mb-1"
						>
							📦 رسوم SpaceSeller الشاملة (للطلبية الموصلة)
						</label>
						<div class="relative">
							<input
								id="input-spaceseller-fee"
								type="number"
								min="0"
								step="1"
								bind:value={spaceSellerFee}
								class="w-full h-11 rounded-xl border-2 border-neutral-200 bg-neutral-50 px-3.5 font-black text-sm text-[#134e4a] outline-none focus:border-[#065f46] focus:bg-white"
								dir="ltr"
							/>
							<span
								class="absolute left-3 top-3 text-xs font-black text-neutral-400 pointer-events-none"
							>
								MAD
							</span>
						</div>
						<p class="text-[10px] text-neutral-400 font-semibold mt-1">
							تشمل التأكيد + التغليف + الفلفيلمنت + الشحن (الافتراضي: 65 MAD)
						</p>
					</div>

					<div>
						<label for="input-return-fee" class="block text-xs font-extrabold text-neutral-800 mb-1">
							↩️ رسوم المرتجع (Return)
						</label>
						<div class="relative">
							<input
								id="input-return-fee"
								type="number"
								min="0"
								step="1"
								bind:value={returnFee}
								class="w-full h-11 rounded-xl border-2 border-neutral-200 bg-neutral-50 px-3 font-black text-sm text-neutral-700 outline-none focus:border-[#065f46] focus:bg-white"
								dir="ltr"
							/>
							<span
								class="absolute left-2.5 top-3 text-xs font-black text-neutral-400 pointer-events-none"
							>
								MAD
							</span>
						</div>
						<p class="text-[10px] text-emerald-700 font-bold mt-1">SpaceSeller = 0 DH</p>
					</div>
				</div>
			</div>

			<!-- Control 2: Wholesale Product Cost (COGS) + Per-SKU Cost Option -->
			<div class="space-y-2.5 pt-2 border-t border-neutral-100">
				<div class="flex items-center justify-between">
					<label for="input-unit-cost" class="block text-xs font-extrabold text-neutral-800">
						🧪 ثمن الجملة للعلبة الواحدة (Wholesale COGS)
					</label>
					<button
						type="button"
						onclick={() => (useCustomSkuCosts = !useCustomSkuCosts)}
						class="text-[11px] font-extrabold text-[#065f46] hover:underline cursor-pointer"
					>
						{useCustomSkuCosts ? 'إخفاء تخصيص الـ SKUs ▲' : 'تخصيص التكلفة لكل SKU ▼'}
					</button>
				</div>

				<div class="relative">
					<input
						id="input-unit-cost"
						type="number"
						min="0"
						step="1"
						value={unitCost}
						oninput={(e) => handleUnitCostChange(Number((e.target as HTMLInputElement).value))}
						class="w-full h-11 rounded-xl border-2 border-neutral-200 bg-neutral-50 px-3.5 font-black text-sm text-[#134e4a] outline-none focus:border-[#065f46] focus:bg-white"
						dir="ltr"
					/>
					<span class="absolute left-3 top-3 text-xs font-black text-neutral-400 pointer-events-none">
						MAD / للعلبة
					</span>
				</div>

				{#if useCustomSkuCosts}
					<div class="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200 grid grid-cols-2 gap-2.5">
						<div>
							<label for="sku-collagen" class="block text-[10px] font-bold text-neutral-600 mb-1">
								كولاجين (gummies_collagen)
							</label>
							<input
								id="sku-collagen"
								type="number"
								min="0"
								bind:value={skuCosts.gummies_collagen}
								class="w-full h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-black text-neutral-800"
								dir="ltr"
							/>
						</div>
						<div>
							<label for="sku-biotine" class="block text-[10px] font-bold text-neutral-600 mb-1">
								بيوتين (gummies_biotine)
							</label>
							<input
								id="sku-biotine"
								type="number"
								min="0"
								bind:value={skuCosts.gummies_biotine}
								class="w-full h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-black text-neutral-800"
								dir="ltr"
							/>
						</div>
						<div>
							<label for="sku-vitamine" class="block text-[10px] font-bold text-neutral-600 mb-1">
								مالتي فيتامين (gumies-vitamine)
							</label>
							<input
								id="sku-vitamine"
								type="number"
								min="0"
								bind:value={skuCosts['gumies-vitamine']}
								class="w-full h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-black text-neutral-800"
								dir="ltr"
							/>
						</div>
						<div>
							<label for="sku-melato" class="block text-[10px] font-bold text-neutral-600 mb-1">
								ميلاتونين (gummies_melato)
							</label>
							<input
								id="sku-melato"
								type="number"
								min="0"
								bind:value={skuCosts.gummies_melato}
								class="w-full h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-black text-neutral-800"
								dir="ltr"
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Control 3: Confirmation Rate Slider (10% to 100%) -->
			<div class="space-y-2 pt-2 border-t border-neutral-100">
				<div class="flex items-center justify-between">
					<label for="slider-conf" class="text-xs font-extrabold text-neutral-800">
						📞 نسبة التأكيد (Confirmation Rate %)
					</label>
					<div class="flex items-center gap-1" dir="ltr">
						<input
							type="number"
							min="10"
							max="100"
							bind:value={confirmationRate}
							class="w-16 h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-center font-black text-xs text-[#065f46]"
						/>
						<span class="text-xs font-black text-[#065f46]">%</span>
					</div>
				</div>
				<input
					id="slider-conf"
					type="range"
					min="10"
					max="100"
					step="1"
					bind:value={confirmationRate}
					class="w-full accent-[#065f46] cursor-pointer h-2 rounded-lg bg-neutral-200"
				/>
				<div class="flex justify-between text-[10px] font-bold text-neutral-400" dir="ltr">
					<span>10%</span>
					<span>50%</span>
					<span>65% (Default)</span>
					<span>80%</span>
					<span>100%</span>
				</div>
			</div>

			<!-- Control 4: Delivery Rate Slider (10% to 100%) -->
			<div class="space-y-2 pt-2 border-t border-neutral-100">
				<div class="flex items-center justify-between">
					<label for="slider-deliv" class="text-xs font-extrabold text-neutral-800">
						🚚 نسبة التوصيل (Delivery Rate %)
					</label>
					<div class="flex items-center gap-1" dir="ltr">
						<input
							type="number"
							min="10"
							max="100"
							bind:value={deliveryRate}
							class="w-16 h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-center font-black text-xs text-[#065f46]"
						/>
						<span class="text-xs font-black text-[#065f46]">%</span>
					</div>
				</div>
				<input
					id="slider-deliv"
					type="range"
					min="10"
					max="100"
					step="1"
					bind:value={deliveryRate}
					class="w-full accent-[#065f46] cursor-pointer h-2 rounded-lg bg-neutral-200"
				/>
				<div class="flex justify-between text-[10px] font-bold text-neutral-400" dir="ltr">
					<span>10%</span>
					<span>50%</span>
					<span>75% (Default)</span>
					<span>85%</span>
					<span>100%</span>
				</div>
			</div>

			<!-- Control 5: Ad Spend / Actual CPA -->
			<div class="space-y-3 pt-3 border-t border-neutral-100">
				<div class="flex items-center justify-between">
					<span class="text-xs font-extrabold text-neutral-800">
						📢 ميزانية الإعلانات (Ad Spend / CPA)
					</span>
					<div class="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
						<button
							type="button"
							onclick={() => (adInputType = 'total')}
							class={`px-2.5 py-1 rounded-md text-[10px] font-extrabold cursor-pointer ${
								adInputType === 'total'
									? 'bg-[#065f46] text-white'
									: 'text-neutral-600 hover:text-neutral-900'
							}`}
						>
							الميزانية الكلية
						</button>
						<button
							type="button"
							onclick={() => (adInputType = 'cpa')}
							class={`px-2.5 py-1 rounded-md text-[10px] font-extrabold cursor-pointer ${
								adInputType === 'cpa'
									? 'bg-[#065f46] text-white'
									: 'text-neutral-600 hover:text-neutral-900'
							}`}
						>
							تكلفة الـ Lead (CPA)
						</button>
					</div>
				</div>

				{#if adInputType === 'total'}
					<div>
						<label
							for="input-ad-spend"
							class="block text-[11px] font-bold text-neutral-600 mb-1"
						>
							إجمالي مصاريف الإعلانات (Total Ad Spend MAD)
						</label>
						<div class="relative">
							<input
								id="input-ad-spend"
								type="number"
								min="0"
								step="10"
								bind:value={totalAdSpend}
								class="w-full h-11 rounded-xl border-2 border-amber-300 bg-amber-50/40 px-3.5 font-black text-sm text-neutral-900 outline-none focus:border-[#065f46] focus:bg-white"
								dir="ltr"
							/>
							<span
								class="absolute left-3 top-3 text-xs font-black text-neutral-500 pointer-events-none"
							>
								MAD
							</span>
						</div>
						<p class="text-[11px] text-neutral-500 font-semibold mt-1">
							يعادل تكلفة مبيعة (Actual CPA):
							<strong class="text-neutral-900 font-black" dir="ltr"
								>{actualCPA.toFixed(2)} MAD / Lead</strong
							>
						</p>
					</div>
				{:else}
					<div>
						<label
							for="input-manual-cpa"
							class="block text-[11px] font-bold text-neutral-600 mb-1"
						>
							تكلفة المبيعة في الإعلانات (Actual CPA per Lead MAD)
						</label>
						<div class="relative">
							<input
								id="input-manual-cpa"
								type="number"
								min="0"
								step="1"
								bind:value={manualCPAInput}
								class="w-full h-11 rounded-xl border-2 border-amber-300 bg-amber-50/40 px-3.5 font-black text-sm text-neutral-900 outline-none focus:border-[#065f46] focus:bg-white"
								dir="ltr"
							/>
							<span
								class="absolute left-3 top-3 text-xs font-black text-neutral-500 pointer-events-none"
							>
								MAD / Lead
							</span>
						</div>
						<p class="text-[11px] text-neutral-500 font-semibold mt-1">
							إجمالي ميزانية الإعلانات لـ {totalLeads} طلبية:
							<strong class="text-neutral-900 font-black" dir="ltr"
								>{Math.round(effectiveAdSpend).toLocaleString()} MAD</strong
							>
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- LEFT COLUMN IN RTL (7 cols): OUTPUT DASHBOARD CARDS & WATERFALL -->
		<div class="lg:col-span-7 space-y-5">
			<!-- Primary 3 Output Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- CARD 1: Break-Even CPA (أقصى ثمن للـ Lead باش تعادل) -->
				<div
					class="rounded-3xl bg-gradient-to-b from-[#134e4a] to-[#065f46] text-white p-5 sm:p-6 shadow-lg border-2 border-amber-400/50 relative overflow-hidden"
				>
					<div class="flex items-center justify-between mb-2">
						<span
							class="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black"
						>
							أهم مؤشر للميديا باير 🎯
						</span>
						<span class="text-lg">🛑</span>
					</div>
					<p class="text-xs font-extrabold text-amber-200">
						Break-Even CPA (أقصى ثمن للـ Lead باش تعادل)
					</p>
					<div class="flex items-baseline gap-1.5 mt-2" dir="ltr">
						<span class="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
							{breakEvenCPA.toFixed(1)}
						</span>
						<span class="text-sm font-black text-white">MAD</span>
					</div>
					<div class="mt-4 pt-3 border-t border-white/15 space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<span class="text-emerald-100/80 font-medium">Break-Even ROAS:</span>
							<span class="font-black text-amber-300" dir="ltr">
								{breakEvenROAS.toFixed(2)}x
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-emerald-100/80 font-medium">هامش الطلبية الموصلة:</span>
							<span class="font-black text-white" dir="ltr">
								+{Math.round(marginPerDeliveredOrder)} MAD
							</span>
						</div>
					</div>
				</div>

				<!-- CARD 2: الربح الصافي بعد الإعلانات ورسوم SpaceSeller (Net Profit) -->
				<div
					class={`rounded-3xl p-5 sm:p-6 shadow-md border-2 transition-colors ${
						isProfitable
							? 'bg-white border-emerald-500/40'
							: 'bg-rose-50/40 border-rose-400/50'
					}`}
				>
					<div class="flex items-center justify-between mb-2">
						<span
							class={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
								isProfitable
									? 'bg-emerald-50 text-emerald-800 border-emerald-200'
									: 'bg-rose-100 text-rose-800 border-rose-300'
							}`}
						>
							{isProfitable ? 'صافي ربح الحملة 💰' : 'صافي خسارة ⚠️'}
						</span>
						<span class="text-lg">{isProfitable ? '📈' : '📉'}</span>
					</div>
					<p class="text-xs font-extrabold text-neutral-600">
						الربح الصافي بعد الإعلانات وSpaceSeller
					</p>
					<div class="flex items-baseline gap-1.5 mt-2" dir="ltr">
						<span
							class={`text-3xl sm:text-4xl font-black tracking-tight ${
								isProfitable ? 'text-[#065f46]' : 'text-rose-700'
							}`}
						>
							{netProfitAfterAds >= 0
								? `+${Math.round(netProfitAfterAds).toLocaleString()}`
								: Math.round(netProfitAfterAds).toLocaleString()}
						</span>
						<span class="text-sm font-black text-neutral-500">MAD</span>
					</div>
					<div class="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<span class="text-neutral-500 font-semibold">الربح قبل الإعلانات:</span>
							<span class="font-black text-neutral-900" dir="ltr">
								{Math.round(netProfitBeforeAds).toLocaleString()} MAD
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-neutral-500 font-semibold">ميزانية الإعلانات:</span>
							<span class="font-black text-rose-700" dir="ltr">
								-{Math.round(effectiveAdSpend).toLocaleString()} MAD
							</span>
						</div>
					</div>
				</div>

				<!-- CARD 3: معدل الوصول الفعلي (Net Delivered %) -->
				<div class="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-neutral-200/90">
					<div class="flex items-center justify-between mb-2">
						<span
							class="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black"
						>
							أداء الفانل واللوجستيك 🚚
						</span>
						<span class="text-lg">📦</span>
					</div>
					<p class="text-xs font-extrabold text-neutral-600">
						معدل الوصول الفعلي (Net Delivered %)
					</p>
					<div class="flex items-baseline gap-1.5 mt-2" dir="ltr">
						<span class="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
							{(effectiveDeliveryRate * 100).toFixed(1)}%
						</span>
					</div>
					<div class="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<span class="text-neutral-500 font-semibold">طلبيات موصلة فعلياً:</span>
							<span class="font-black text-[#065f46]" dir="ltr">
								{deliveredOrders.toFixed(1)} / {totalLeads}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-neutral-500 font-semibold">المعادلة:</span>
							<span class="font-bold text-neutral-700" dir="ltr">
								{confirmationRate}% × {deliveryRate}%
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Detailed Financial Waterfall Breakdown Card -->
			<div class="rounded-3xl bg-white p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-4">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3.5">
					<div class="flex items-center gap-2">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-black text-sm"
						>
							📑
						</span>
						<div>
							<h3 class="text-sm sm:text-base font-black text-neutral-900">
								التفصيل المالي الدقيق للحملة (Cashflow & Funnel Waterfall)
							</h3>
							<p class="text-[11px] text-neutral-500 font-medium">
								حساب خطوة بخطوة من إجمالي الـ Leads إلى صافي الكاش في جيبك
							</p>
						</div>
					</div>
					<span
						class="text-xs font-extrabold text-[#065f46] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200"
						dir="ltr"
					>
						AOV: {Math.round(aov)} MAD • Avg Bottles: {avgBottlesPerOrder}
					</span>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div class="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
						<span class="block text-[11px] font-bold text-neutral-500">
							1. الكاش المحصل (Gross Revenue)
						</span>
						<span class="block text-lg font-black text-neutral-900 mt-1" dir="ltr">
							{Math.round(grossRevenue).toLocaleString()} MAD
						</span>
						<span class="block text-[10px] font-semibold text-neutral-400 mt-0.5">
							من {deliveredOrders.toFixed(1)} طلبية موصلة
						</span>
					</div>

					<div class="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
						<span class="block text-[11px] font-bold text-neutral-500">
							2. مجموع رسوم SpaceSeller
						</span>
						<span class="block text-lg font-black text-rose-700 mt-1" dir="ltr">
							-{Math.round(totalSpaceSellerFees).toLocaleString()} MAD
						</span>
						<span class="block text-[10px] font-semibold text-neutral-400 mt-0.5">
							{spaceSellerFee} DH × {deliveredOrders.toFixed(1)} طلبية
						</span>
					</div>

					<div class="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
						<span class="block text-[11px] font-bold text-neutral-500">
							3. إجمالي تكلفة السلعة (COGS)
						</span>
						<span class="block text-lg font-black text-rose-700 mt-1" dir="ltr">
							-{Math.round(totalCOGS).toLocaleString()} MAD
						</span>
						<span class="block text-[10px] font-semibold text-neutral-400 mt-0.5">
							{(totalPhysicalBottles * effectiveDeliveryRate).toFixed(1)} علبة موصلة × {effectiveUnitCost.toFixed(0)} DH
						</span>
					</div>

					<div
						class={`rounded-2xl p-3.5 border ${
							isProfitable
								? 'bg-emerald-50/70 border-emerald-200'
								: 'bg-rose-50/70 border-rose-200'
						}`}
					>
						<span class="block text-[11px] font-extrabold text-neutral-700">
							4. الربح الصافي النهائي
						</span>
						<span
							class={`block text-lg font-black mt-1 ${
								isProfitable ? 'text-[#065f46]' : 'text-rose-700'
							}`}
							dir="ltr"
						>
							{netProfitAfterAds >= 0
								? `+${Math.round(netProfitAfterAds).toLocaleString()}`
								: Math.round(netProfitAfterAds).toLocaleString()} MAD
						</span>
						<span class="block text-[10px] font-bold text-neutral-500 mt-0.5">
							بعد خصم {Math.round(effectiveAdSpend)} DH إعلانات
						</span>
					</div>
				</div>

				<!-- Unit Metrics Bar -->
				<div
					class="rounded-2xl bg-[#f4f7f6] border border-emerald-950/10 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
				>
					<div>
						<span class="block text-[11px] font-bold text-neutral-500">
							Margin / Delivered Order
						</span>
						<span class="block text-base font-black text-[#065f46] mt-0.5" dir="ltr">
							+{marginPerDeliveredOrder.toFixed(1)} MAD
						</span>
					</div>
					<div>
						<span class="block text-[11px] font-bold text-neutral-500">
							Break-Even CPA (الحد الأقصى)
						</span>
						<span class="block text-base font-black text-amber-800 mt-0.5" dir="ltr">
							{breakEvenCPA.toFixed(1)} MAD
						</span>
					</div>
					<div>
						<span class="block text-[11px] font-bold text-neutral-500">
							Actual CPA (تكلفتك الحالية)
						</span>
						<span class="block text-base font-black text-neutral-900 mt-0.5" dir="ltr">
							{actualCPA.toFixed(1)} MAD
						</span>
					</div>
					<div>
						<span class="block text-[11px] font-bold text-neutral-500">
							Profit Per Lead (ربح الـ Lead)
						</span>
						<span
							class={`block text-base font-black mt-0.5 ${
								profitPerLead >= 0 ? 'text-emerald-700' : 'text-rose-700'
							}`}
							dir="ltr"
						>
							{profitPerLead >= 0 ? `+${profitPerLead.toFixed(1)}` : profitPerLead.toFixed(1)} MAD
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- ======================================================================= -->
	<!-- UNIT ECONOMICS BREAKDOWN TABLE BY OFFER TIER (ALL 7 TIERS)              -->
	<!-- ======================================================================= -->
	<div class="rounded-3xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
		<div
			class="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-l from-white to-amber-50/30"
		>
			<div class="flex items-center gap-3">
				<span
					class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#134e4a] text-amber-300 font-black text-lg shadow-xs"
				>
					📊
				</span>
				<div>
					<h2 class="text-base sm:text-lg font-black text-neutral-900">
						جدول ربحية الباقات والعروض ونقطة التعادل لكل عرض (Unit Economics by Offer Tier)
					</h2>
					<p class="text-xs text-neutral-500 font-medium mt-0.5">
						مقارنة شاملة لجميع الباقات الـ 7 مع الأبسيل (+99 DH) بناءً على نسبة التأكيد ({confirmationRate}%) ونسبة التوصيل ({deliveryRate}%) — صافي وصول {(effectiveDeliveryRate * 100).toFixed(1)}%
					</p>
				</div>
			</div>

			<div class="text-xs font-extrabold text-[#065f46] bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
				💡 اضغط على أي باقة لمحاكاتها فوراً
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-right border-collapse">
				<thead>
					<tr
						class="border-b border-neutral-200 bg-neutral-50/90 text-[11px] font-black text-neutral-600 uppercase tracking-wider"
					>
						<th class="py-3.5 px-4 sm:px-6">الباقة / العرض (Offer Tier)</th>
						<th class="py-3.5 px-3 text-center">عدد العلب</th>
						<th class="py-3.5 px-4">ثمن البيع (Revenue)</th>
						<th class="py-3.5 px-4">رسوم SpaceSeller</th>
						<th class="py-3.5 px-4">تكلفة السلعة (COGS)</th>
						<th class="py-3.5 px-4">صافي ربح الطلبية الموصلة</th>
						<th class="py-3.5 px-4 bg-amber-50/70 text-amber-950">
							Break-Even CPA (أقصى ثمن للـ Lead)
						</th>
						<th class="py-3.5 px-4 text-center">Break-Even ROAS</th>
						<th class="py-3.5 px-4 sm:px-6">ربح الـ Lead (مع إعلاناتك)</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-100 text-xs">
					{#each tierEconomicsRows as row}
						<tr
							onclick={() => simulateSpecificTier(row)}
							class={`transition-colors cursor-pointer ${
								row.isHighlight
									? 'bg-emerald-50/25 hover:bg-emerald-50/70'
									: 'hover:bg-neutral-50'
							}`}
						>
							<!-- 1. Offer Tier Name -->
							<td class="py-4 px-4 sm:px-6 whitespace-nowrap">
								<div class="flex items-center gap-2">
									<span class="font-black text-neutral-900 text-xs sm:text-sm">
										{row.name}
									</span>
									{#if row.badge}
										<span
											class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black"
										>
											{row.badge}
										</span>
									{/if}
								</div>
								<span class="block text-[11px] text-neutral-400 font-medium mt-0.5">
									{row.subtitle}
								</span>
							</td>

							<!-- 2. Bottle Count -->
							<td class="py-4 px-3 text-center whitespace-nowrap">
								<span
									class="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-neutral-900 text-amber-300 font-black text-xs"
								>
									{row.bottles} {row.bottles === 1 ? 'علبة' : 'علب'}
								</span>
							</td>

							<!-- 3. Revenue -->
							<td class="py-4 px-4 whitespace-nowrap font-black text-sm text-neutral-900" dir="ltr">
								{row.revenue} DH
							</td>

							<!-- 4. SpaceSeller Fee -->
							<td class="py-4 px-4 whitespace-nowrap font-bold text-rose-700" dir="ltr">
								-{row.spaceSellerFee} DH
							</td>

							<!-- 5. Wholesale Cost (COGS) -->
							<td class="py-4 px-4 whitespace-nowrap font-bold text-rose-700" dir="ltr">
								-{Math.round(row.cogs)} DH
								<span class="block text-[10px] text-neutral-400 font-normal">
									({row.bottles} × {Math.round(effectiveUnitCost)} DH)
								</span>
							</td>

							<!-- 6. Net Margin per Delivered Order -->
							<td class="py-4 px-4 whitespace-nowrap">
								<span
									class={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${
										row.netMarginDelivered > 0
											? 'bg-emerald-50 text-[#065f46] border-emerald-200'
											: 'bg-rose-50 text-rose-800 border-rose-200'
									}`}
									dir="ltr"
								>
									{row.netMarginDelivered > 0
										? `+${Math.round(row.netMarginDelivered)}`
										: Math.round(row.netMarginDelivered)} DH
								</span>
							</td>

							<!-- 7. Break-Even CPA -->
							<td class="py-4 px-4 whitespace-nowrap bg-amber-50/40">
								<span
									class="inline-flex items-center px-3 py-1 rounded-xl bg-[#134e4a] text-amber-300 font-black text-xs sm:text-sm shadow-2xs"
									dir="ltr"
								>
									{row.rowBreakEvenCPA.toFixed(1)} DH
								</span>
							</td>

							<!-- 8. Break-Even ROAS -->
							<td class="py-4 px-4 text-center whitespace-nowrap font-black text-neutral-700" dir="ltr">
								{row.rowBreakEvenROAS.toFixed(2)}x
							</td>

							<!-- 9. Net Profit per Lead at Current Actual CPA -->
							<td class="py-4 px-4 sm:px-6 whitespace-nowrap">
								<span
									class={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${
										row.rowProfitPerLead >= 0
											? 'bg-emerald-50 text-emerald-800 border-emerald-200'
											: 'bg-rose-50 text-rose-800 border-rose-200'
									}`}
									dir="ltr"
								>
									{row.rowProfitPerLead >= 0
										? `+${row.rowProfitPerLead.toFixed(1)}`
										: row.rowProfitPerLead.toFixed(1)} DH / Lead
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
