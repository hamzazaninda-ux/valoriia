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
</script>

<svelte:head>
	<title>لوحة التحكم - Valoriia</title>
</svelte:head>

<div class="space-y-6" dir="rtl">
	<!-- Greeting -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl font-bold text-neutral-900">
				مرحباً بك في {data.health.brandName}
			</h1>
			<p class="mt-1 text-sm text-neutral-500">{today} — هاك شنو واقع في المتجر ديالك</p>
		</div>
		<a
			href="/admin/products/new"
			class="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white shadow transition-all hover:bg-emerald-900 active:scale-[0.98]"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
				<path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			منتج جديد
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [
			{ label: 'المنتجات', value: data.stats.total, href: '/admin/products', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', tint: 'bg-emerald-950 text-amber-300' },
			{ label: 'منشورة', value: data.stats.published, href: '/admin/products', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', tint: 'bg-emerald-100 text-emerald-700' },
			{ label: 'مسودات', value: data.stats.drafts, href: '/admin/products', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z', tint: 'bg-amber-100 text-amber-700' },
			{ label: 'القوالب', value: data.stats.templates, href: '/admin/templates', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.043-1.622M12 21v-2.25', tint: 'bg-stone-200 text-stone-700' }
		] as s}
			<a
				href={s.href}
				class="group rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
			>
				<span class={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.tint}`}>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d={s.icon} />
					</svg>
				</span>
				<p class="mt-3 text-3xl font-black text-neutral-900">{s.value}</p>
				<p class="mt-0.5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-emerald-700">{s.label}</p>
			</a>
		{/each}
	</div>

	<div class="grid gap-4 lg:grid-cols-5">
		<!-- Recent products -->
		<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] lg:col-span-3">
			<div class="flex items-center justify-between">
				<h2 class="font-display text-lg font-bold text-neutral-900">أحدث المنتجات</h2>
				<a href="/admin/products" class="text-sm font-bold text-emerald-700 hover:underline underline-offset-4">عرض الكل</a>
			</div>
			{#if data.recent.length === 0}
				<div class="flex flex-col items-center gap-2 py-10 text-center">
					<svg viewBox="0 0 120 100" class="h-16 w-auto text-neutral-200" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
						<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
					</svg>
					<p class="font-bold text-neutral-700">ما كاين حتى منتج باقي</p>
					<p class="text-sm text-neutral-400">زيد أول منتج وغادي يبان هنا</p>
					<a href="/admin/products/new" class="mt-2 inline-flex min-h-11 items-center rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white">+ زيد منتج</a>
				</div>
			{:else}
				<div class="mt-3 divide-y divide-neutral-100">
					{#each data.recent as p}
						<a href={`/admin/products/${p.slug}/edit`} class="group flex items-center gap-3 py-3">
							<span class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
								{#if p.heroImage}
									<img src={p.heroImage} alt={p.title} class="h-full w-full object-cover" loading="lazy" />
								{:else}
									<svg class="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
										<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
									</svg>
								{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-extrabold text-neutral-800 transition-colors group-hover:text-emerald-700">{p.title || p.slug}</span>
								<span class="mt-0.5 block text-xs text-neutral-400">/{p.slug} • {p.startingPrice} DH</span>
							</span>
							<span class={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusChip[p.status] || statusChip.draft}`}>
								{statusLabel[p.status] || p.status}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Store health + quick actions -->
		<div class="space-y-4 lg:col-span-2">
			<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
				<h2 class="font-display text-lg font-bold text-neutral-900">حالة المتجر</h2>
				<div class="mt-3 space-y-2.5">
					{#each [
						{ ok: data.health.sheets, label: 'استقبال الطلبات (Google Sheets)', href: '/admin/settings' },
						{ ok: data.health.whatsapp, label: 'رقم الواتساب', href: '/admin/settings' },
						{ ok: data.stats.published > 0, label: 'منتج منشور على الأقل', href: '/admin/products' }
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
							<span class="text-sm font-bold text-neutral-700">{row.label}</span>
							<span class={`ms-auto text-[11px] font-bold ${row.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
								{row.ok ? 'مزيان' : 'خاصو إعداد'}
							</span>
						</a>
					{/each}
				</div>
			</div>

			<div class="rounded-3xl bg-emerald-950 p-5 text-white shadow-lg">
				<h2 class="font-display text-lg font-bold">إجراءات سريعة</h2>
				<div class="mt-3 grid grid-cols-2 gap-2">
					<a href="/admin/products/new" class="rounded-2xl bg-amber-400 px-3 py-3 text-center text-sm font-black text-emerald-950 transition-transform hover:scale-[1.02] active:scale-[0.98]">+ منتج جديد</a>
					<a href="/admin/orders" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center text-sm font-bold transition-colors hover:bg-white/10">الطلبات</a>
					<a href="/" target="_blank" rel="noopener" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center text-sm font-bold transition-colors hover:bg-white/10">عرض الموقع</a>
					<a href="/admin/settings" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-center text-sm font-bold transition-colors hover:bg-white/10">الإعدادات</a>
				</div>
			</div>
		</div>
	</div>
</div>
