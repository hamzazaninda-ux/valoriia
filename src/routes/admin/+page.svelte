<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const today = new Date().toLocaleDateString('ar-MA', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const statusChip: Record<string, string> = {
		published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		draft: 'bg-amber-50 text-amber-700 border-amber-200',
		archived: 'bg-neutral-100 text-neutral-500 border-neutral-200'
	};
	const statusLabel: Record<string, string> = {
		published: 'منشور',
		draft: 'مسودة',
		archived: 'مؤرشف'
	};

	const orderStatusBadges: Record<string, string> = {
		جديد: 'bg-amber-50 text-amber-700 border-amber-200',
		مؤكد: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		'جاري الشحن': 'bg-blue-50 text-blue-700 border-blue-200',
		'تم التسليم': 'bg-teal-50 text-teal-700 border-teal-200',
		ملغي: 'bg-rose-50 text-rose-700 border-rose-200'
	};

	function getWhatsappLink(phone: string, customerName: string, product: string): string {
		let clean = phone.replace(/\D/g, '');
		if (clean.startsWith('0')) {
			clean = '212' + clean.slice(1);
		} else if (!clean.startsWith('212')) {
			clean = '212' + clean;
		}

		const greeting = encodeURIComponent(
			`السلام عليكم ${customerName}، معكم متجر Lhamza Shop بخصوص طلبكم (${product}).`
		);
		return `https://wa.me/${clean}?text=${greeting}`;
	}
</script>

<svelte:head>
	<title>لوحة التحكم - Lhamza Shop</title>
</svelte:head>

<div class="space-y-6" dir="rtl">
	<!-- Greeting -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl font-bold text-neutral-900">
				مرحباً بك في {data.health.brandName}
			</h1>
			<p class="mt-1 text-sm text-neutral-500">{today} — نظرة شاملة على نشاط المتجر والمبيعات</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/admin/orders"
				class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 shadow-2xs transition-all hover:bg-neutral-50 active:scale-[0.98]"
			>
				<svg class="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z" />
				</svg>
				إدارة الطلبات
			</a>
			<a
				href="/admin/products/new"
				class="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white shadow-2xs transition-all hover:bg-emerald-900 active:scale-[0.98]"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
					<path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				منتج جديد
			</a>
		</div>
	</div>

	<!-- Top Stats: Orders & Sales & Products -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<!-- Total Orders -->
		<a
			href="/admin/orders"
			class="group rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
		>
			<div class="flex items-center justify-between">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-950 text-amber-300">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z" />
					</svg>
				</span>
				{#if data.stats.pendingOrders > 0}
					<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
						{data.stats.pendingOrders} جديدة
					</span>
				{/if}
			</div>
			<p class="mt-3 text-3xl font-black text-neutral-900">{data.stats.totalOrders}</p>
			<p class="mt-0.5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-emerald-700">إجمالي الطلبات</p>
		</a>

		<!-- Confirmed Revenue -->
		<a
			href="/admin/orders"
			class="group rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
		>
			<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</span>
			<p class="mt-3 text-3xl font-black text-neutral-900">
				{data.stats.confirmedRevenue} <span class="text-sm font-bold text-neutral-500">{data.currencySymbol}</span>
			</p>
			<p class="mt-0.5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-emerald-700">المبيعات المؤكدة</p>
		</a>

		<!-- Products -->
		<a
			href="/admin/products"
			class="group rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
		>
			<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
				</svg>
			</span>
			<p class="mt-3 text-3xl font-black text-neutral-900">{data.stats.total}</p>
			<p class="mt-0.5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-emerald-700">المنتجات ({data.stats.published} منشورة)</p>
		</a>

		<!-- Templates -->
		<a
			href="/admin/templates"
			class="group rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
		>
			<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-200 text-stone-700">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.043-1.622M12 21v-2.25" />
				</svg>
			</span>
			<p class="mt-3 text-3xl font-black text-neutral-900">{data.stats.templates}</p>
			<p class="mt-0.5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-emerald-700">القوالب المتوفرة</p>
		</a>
	</div>

	<!-- Main Grid: Recent Orders & Recent Products -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Orders Card -->
		<div class="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
			<div class="flex items-center justify-between pb-3 border-b border-neutral-100">
				<div class="flex items-center gap-2">
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
						🛒
					</span>
					<div>
						<h2 class="font-display text-base font-bold text-neutral-900">أحدث الطلبات</h2>
						<span class="text-[11px] text-neutral-400">آخر 5 طلبيات مسجلة</span>
					</div>
				</div>
				<a href="/admin/orders" class="text-xs font-bold text-emerald-700 hover:underline underline-offset-4 flex items-center gap-1">
					عرض الكل
					<span>←</span>
				</a>
			</div>

			{#if data.recentOrders.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center py-10 text-center">
					<span class="text-3xl">📦</span>
					<p class="mt-2 text-sm font-bold text-neutral-700">ما كاين حتى طلب باقي</p>
					<p class="text-xs text-neutral-400">أي طلب جديد غادي يتسجل هنا مباشرة</p>
				</div>
			{:else}
				<div class="mt-3 divide-y divide-neutral-100 flex-1">
					{#each data.recentOrders as order}
						{@const badgeClass = orderStatusBadges[order.status] || orderStatusBadges['جديد']}
						<div class="flex items-center justify-between gap-3 py-3">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="truncate text-sm font-extrabold text-neutral-900">{order.fullName}</p>
									<span class={`rounded-lg border px-1.5 py-0.2 text-[10px] font-bold ${badgeClass}`}>
										{order.status}
									</span>
								</div>
								<p class="mt-0.5 truncate text-xs text-neutral-500">
									{order.product} • <span class="font-bold text-emerald-800">{order.totalPrice} {data.currencySymbol}</span>
								</p>
								<div class="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
									<span>📍 {order.city}</span>
									<span>•</span>
									<span dir="ltr">{order.phone}</span>
								</div>
							</div>

							<!-- Quick Actions: WhatsApp & Details -->
							<div class="flex items-center gap-1.5 shrink-0">
								<a
									href={getWhatsappLink(order.phone, order.fullName, order.product)}
									target="_blank"
									rel="noopener"
									class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25 transition-colors"
									title="واتساب سريع"
								>
									<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
									</svg>
								</a>
								<a
									href="/admin/orders"
									class="flex h-8 px-2.5 items-center justify-center rounded-xl bg-neutral-100 text-xs font-bold text-neutral-700 hover:bg-neutral-200 transition-colors"
								>
									تفاصيل
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Products Card -->
		<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
			<div class="flex items-center justify-between pb-3 border-b border-neutral-100">
				<div class="flex items-center gap-2">
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 font-bold">
						🏷️
					</span>
					<div>
						<h2 class="font-display text-base font-bold text-neutral-900">أحدث المنتجات</h2>
						<span class="text-[11px] text-neutral-400">الكتالوج والصفحات المنشورة</span>
					</div>
				</div>
				<a href="/admin/products" class="text-xs font-bold text-emerald-700 hover:underline underline-offset-4 flex items-center gap-1">
					عرض الكل
					<span>←</span>
				</a>
			</div>

			{#if data.recentProducts.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center py-10 text-center">
					<svg viewBox="0 0 120 100" class="h-14 w-auto text-neutral-200" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
						<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
					</svg>
					<p class="mt-2 text-sm font-bold text-neutral-700">ما كاين حتى منتج باقي</p>
					<a href="/admin/products/new" class="mt-2 inline-flex min-h-10 items-center rounded-xl bg-emerald-950 px-4 text-xs font-bold text-white">+ زيد منتج</a>
				</div>
			{:else}
				<div class="mt-3 divide-y divide-neutral-100 flex-1">
					{#each data.recentProducts as p}
						<a href={`/admin/products/${p.slug}/edit`} class="group flex items-center gap-3 py-3">
							<span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
								{#if p.heroImage}
									<img src={p.heroImage} alt={p.title} class="h-full w-full object-cover" loading="lazy" />
								{:else}
									<svg class="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
										<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
									</svg>
								{/if}
							</span>
							<div class="min-w-0 flex-1">
								<span class="block truncate text-sm font-extrabold text-neutral-800 transition-colors group-hover:text-emerald-700">{p.title || p.slug}</span>
								<span class="mt-0.5 block text-xs text-neutral-400">/{p.slug} • {p.startingPrice} DH</span>
							</div>
							<span class={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusChip[p.status] || statusChip.draft}`}>
								{statusLabel[p.status] || p.status}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom Section: Store Health & Quick Actions -->
	<div class="grid gap-4 lg:grid-cols-5">
		<!-- Store Health -->
		<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] lg:col-span-3">
			<h2 class="font-display text-base font-bold text-neutral-900">حالة الربط والجاهزية</h2>
			<div class="mt-3 space-y-2.5">
				{#each [
					{ ok: data.health.sheets, label: 'استقبال الطلبات (Google Sheets Webhook)', href: '/admin/settings' },
					{ ok: data.health.whatsapp, label: 'رقم الواتساب الرسمي لخدمة الزبناء', href: '/admin/settings' },
					{ ok: data.stats.published > 0, label: 'منتج منشور وجاهز للطلب على الأقل', href: '/admin/products' }
				] as row}
					<a href={row.href} class="flex items-center gap-2.5 rounded-2xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5 transition-colors hover:border-emerald-500/30">
						<span class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${row.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
							{#if row.ok}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
								</svg>
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008z" />
								</svg>
							{/if}
						</span>
						<span class="text-xs sm:text-sm font-bold text-neutral-700">{row.label}</span>
						<span class={`ms-auto text-[11px] font-bold ${row.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
							{row.ok ? 'مفعل وجاهز' : 'خاصو إعداد'}
						</span>
					</a>
				{/each}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="rounded-3xl bg-emerald-950 p-5 text-white shadow-lg lg:col-span-2 flex flex-col justify-between">
			<div>
				<h2 class="font-display text-base font-bold">إجراءات سريعة</h2>
				<p class="mt-0.5 text-xs text-emerald-200/60">روابط مباشرة للإدارة والمتابعة</p>
			</div>
			<div class="mt-4 grid grid-cols-2 gap-2">
				<a href="/admin/orders" class="rounded-2xl bg-amber-400 px-3 py-3 text-center text-xs font-black text-emerald-950 transition-transform hover:scale-[1.02] active:scale-[0.98]">
					إدارة الطلبات
				</a>
				<a href="/admin/products/new" class="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-center text-xs font-bold text-white transition-colors hover:bg-white/20">
					+ منتج جديد
				</a>
				<a href="/" target="_blank" rel="noopener" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center text-xs font-bold transition-colors hover:bg-white/10">
					عرض المتجر
				</a>
				<a href="/admin/settings" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center text-xs font-bold transition-colors hover:bg-white/10">
					الإعدادات
				</a>
			</div>
		</div>
	</div>
</div>
