<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>الطلبات - Lhamza Shop</title>
</svelte:head>

<div class="space-y-6" dir="rtl">
	<div>
		<h1 class="font-display text-2xl font-bold text-neutral-900">الطلبات</h1>
		<p class="mt-1 text-sm text-neutral-500">
			الطلبات كتوصل مباشرة لجوجل شيت — من هنا كتحل شيت كل منتج وكتشوف طلباتو
		</p>
	</div>

	<!-- How it works -->
	<div class="grid gap-3 sm:grid-cols-3">
		{#each [
			['الزبون كيعمّر الاستمارة', 'الاسم + المدينة + الهاتف من صفحة المنتج', 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z'],
			['الطلب كيتسجل في الشيت', 'سطر جديد بكل المعلومات والتاريخ والثمن', 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 12 6.601 9 12 9c5.399 0 6.504 3 7.125 10.5h1.5m-17.25 0a1.125 1.125 0 01-1.125 1.125M18.375 19.5a1.125 1.125 0 001.125 1.125m-17.25-2.25A1.125 1.125 0 013.375 19.5m17.25 0a1.125 1.125 0 001.125-1.125M3.375 7.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v3.026a2.25 2.25 0 01-1.58 2.143l-.004.01a2.25 2.25 0 01-1.583 2.134v3.026c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-3.026a2.25 2.25 0 011.58-2.143l.004-.01a2.25 2.25 0 011.583-2.134V7.5z'],
			['أكّد بالتليفون', 'عيّط للزبون، أكّد العنوان، وصيفط السلعة', 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z']
		] as [t, d, icon]}
			<div class="rounded-3xl border border-neutral-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-950 text-amber-300">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
						<path stroke-linecap="round" stroke-linejoin="round" d={icon} />
					</svg>
				</span>
				<p class="mt-2.5 text-sm font-extrabold text-neutral-800">{t}</p>
				<p class="mt-0.5 text-xs leading-relaxed text-neutral-500">{d}</p>
			</div>
		{/each}
	</div>

	<!-- Global sheet -->
	<div class="flex flex-wrap items-center gap-3 rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
		<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
			</svg>
		</span>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-extrabold text-neutral-800">الشيت العام (افتراضي)</p>
			<p class="text-xs text-neutral-500">المنتجات اللي ما عندهاش شيت خاص كتصيفط لهنا</p>
		</div>
		{#if data.globalSheets}
			<a
				href={data.globalSheets}
				target="_blank"
				rel="noopener"
				class="inline-flex min-h-11 items-center rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
			>
				فتح الشيت
			</a>
		{:else}
			<a
				href="/admin/settings"
				class="inline-flex min-h-11 items-center rounded-xl border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
			>
				ضبط الرابط من الإعدادات
			</a>
		{/if}
	</div>

	<!-- Per-product sheets -->
	<div class="rounded-3xl border border-neutral-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
		<div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
			<h2 class="font-display text-lg font-bold text-neutral-900">شيتات المنتجات ({data.total})</h2>
		</div>
		{#if data.rows.length === 0}
			<div class="flex flex-col items-center gap-2 px-5 py-10 text-center">
				<svg viewBox="0 0 120 100" class="h-16 w-auto text-neutral-200" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
					<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
				</svg>
				<p class="font-bold text-neutral-700">ما كاين حتى منتج باقي</p>
				<a href="/admin/products/new" class="mt-1 inline-flex min-h-11 items-center rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white">+ زيد منتج</a>
			</div>
		{:else}
			<div class="divide-y divide-neutral-100">
				{#each data.rows as r}
					<div class="flex flex-wrap items-center gap-3 px-5 py-3.5">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-extrabold text-neutral-800">{r.title}</p>
							<p class="mt-0.5 text-xs text-neutral-400">
								/{r.slug}
								{#if r.source === 'own'} • شيت خاص{:else if r.source === 'global'} • يستعمل الشيت العام{:else} • بلا شيت{/if}
							</p>
						</div>
						{#if r.sheetsUrl}
							<a
								href={r.sheetsUrl}
								target="_blank"
								rel="noopener"
								class="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-950 px-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
							>
								فتح الشيت
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
								</svg>
							</a>
						{:else}
							<a
								href={`/admin/products/${r.slug}/edit`}
								class="inline-flex min-h-10 items-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
							>
								زيد رابط الشيت
							</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
