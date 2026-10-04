<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ToastContainer from '$lib/components/ui/toast/ToastContainer.svelte';

	let { children } = $props();

	let loggingOut = $state(false);
	let drawerOpen = $state(false);

	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			goto('/admin/login');
		} finally {
			loggingOut = false;
		}
	}

	type NavItem = {
		label: string;
		href?: string;
		icon: string;
		badge?: string;
		soon?: boolean;
		match?: string[];
	};

	type NavGroup = { title: string; items: NavItem[] };

	const groups: NavGroup[] = [
		{
			title: 'الرئيسية',
			items: [{ label: 'لوحة التحكم', href: '/admin', icon: 'home', match: ['/admin'] }]
		},
		{
			title: 'الكتالوغ',
			items: [
				{ label: 'المنتجات', href: '/admin/products', icon: 'box', match: ['/admin/products'] },
				{ label: 'منتج جديد', href: '/admin/products/new', icon: 'plus' },
				{ label: 'القوالب', href: '/admin/templates', icon: 'palette', match: ['/admin/templates'] }
			]
		},
		{
			title: 'المبيعات',
			items: [{ label: 'الطلبات', href: '/admin/orders', icon: 'cart', match: ['/admin/orders'] }]
		},
		{
			title: 'التسويق',
			items: [
				{ label: 'الأبسيل', icon: 'trend', soon: true },
				{ label: 'الكوبونات', icon: 'ticket', soon: true },
				{ label: 'الزبناء', icon: 'users', soon: true }
			]
		}
	];

	const icons: Record<string, string> = {
		home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
		box: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
		plus: 'M12 4.5v15m7.5-7.5h-15',
		palette:
			'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.043-1.622m-4.043 1.622L12 21.75M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M3 12h2.25m.386-6.364L7.05 7.05M12 21v-2.25',
		cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z',
		trend: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
		ticket:
			'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.25 2.25 0 011.58 2.143l.003.01a2.25 2.25 0 01-1.583 2.134v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.25 2.25 0 01-1.58-2.143l-.004-.01a2.25 2.25 0 011.584-2.134v-3.026c0-.621-.504-1.125-1.125-1.125H3.375z',
		users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
		gear: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003 1.003a1.125 1.125 0 01-.39.32l-.01.005a1.125 1.125 0 01-.043 1.993l1.003 1.003a1.125 1.125 0 01.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.751-.072-1.075.124a6.57 6.57 0 01-.22.127c-.332.183-.582.496-.645.87l-.213 1.281c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-1.003a1.125 1.125 0 01.39-.32l.01-.005a1.125 1.125 0 01.043-1.993l-1.004-1.003a1.125 1.125 0 01-.26-1.431l1.297-2.247a1.125 1.125 0 011.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.496.644-.87l.214-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
		globe: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5a11.964 11.964 0 01-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
		logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
	};

	function isActive(item: NavItem): boolean {
		const path = page.url.pathname;
		if (item.href === '/admin') return path === '/admin';
		if (item.match) return item.match.some((m) => path === m || path.startsWith(m + '/'));
		if (item.href) return path === item.href || path.startsWith(item.href + '/');
		return false;
	}

	const isLogin = $derived(page.url.pathname === '/admin/login');
</script>

<ToastContainer />

{#if isLogin}
	<div class="min-h-screen bg-gray-50">
		{@render children()}
	</div>
{:else}
	<div class="min-h-screen bg-[#faf9f6] font-body" dir="rtl">
		<!-- Desktop sidebar (right side in RTL = start) -->
		<aside class="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-neutral-200/70 bg-emerald-950 text-white lg:flex">
			<a href="/admin" class="flex items-center gap-2.5 px-5 pt-6 pb-5">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 font-display text-xl font-bold text-emerald-950">L</span>
				<span>
					<span class="block font-display text-lg font-bold leading-none">Lhamza Shop</span>
					<span class="mt-1 block text-[11px] text-emerald-200/60">لوحة التحكم</span>
				</span>
			</a>

			<nav class="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
				{#each groups as group}
					<div>
						<p class="px-3 pb-1.5 text-[11px] font-bold text-emerald-200/50">{group.title}</p>
						<div class="space-y-1">
							{#each group.items as item}
								{#if item.soon}
									<div
										class="flex cursor-default items-center justify-between rounded-xl px-3 py-2.5 text-emerald-100/40"
										title="جاي قريباً"
									>
										<span class="flex items-center gap-3 text-sm font-semibold">
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
												<path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
											</svg>
											{item.label}
										</span>
										<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-emerald-200/60">قريباً</span>
									</div>
								{:else}
									<a
										href={item.href}
										class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ${
											isActive(item)
												? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
												: 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
										}`}
									>
										<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
											<path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
										</svg>
										{item.label}
										{#if isActive(item)}
											<span class="ms-auto h-1.5 w-1.5 rounded-full bg-amber-400"></span>
										{/if}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<div class="space-y-1 border-t border-white/10 p-3">
				<a
					href="/admin/settings"
					class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${isActive({ label: '', icon: 'gear', href: '/admin/settings' }) ? 'bg-white/10 text-white' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}
				>
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.gear} />
					</svg>
					الإعدادات
				</a>
				<a
					href="/"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/70 transition-all hover:bg-white/5 hover:text-white"
				>
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.globe} />
					</svg>
					عرض الموقع
				</a>
				<button
					type="button"
					onclick={handleLogout}
					disabled={loggingOut}
					class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/70 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
				>
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.logout} />
					</svg>
					{loggingOut ? 'جاري الخروج…' : 'تسجيل الخروج'}
				</button>
			</div>
		</aside>

		<!-- Mobile drawer -->
		{#if drawerOpen}
			<div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="قائمة الإدارة">
				<button type="button" class="absolute inset-0 bg-black/50" onclick={() => (drawerOpen = false)} aria-label="سد القائمة"></button>
				<aside class="absolute inset-y-0 right-0 flex w-72 flex-col bg-emerald-950 text-white shadow-2xl">
					<div class="flex items-center justify-between px-5 pt-5 pb-4">
						<span class="flex items-center gap-2.5">
							<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-display text-lg font-bold text-emerald-950">L</span>
							<span class="font-display text-lg font-bold">Lhamza Shop</span>
						</span>
						<button
							type="button"
							onclick={() => (drawerOpen = false)}
							class="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-100/70 hover:bg-white/10"
							aria-label="سد القائمة"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<nav class="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
						{#each groups as group}
							<div>
								<p class="px-3 pb-1.5 text-[11px] font-bold text-emerald-200/50">{group.title}</p>
								<div class="space-y-1">
									{#each group.items as item}
										{#if item.soon}
											<div class="flex cursor-default items-center justify-between rounded-xl px-3 py-2.5 text-emerald-100/40">
												<span class="text-sm font-semibold">{item.label}</span>
												<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-emerald-200/60">قريباً</span>
											</div>
										{:else}
											<a
												href={item.href}
												onclick={() => (drawerOpen = false)}
												class={`block rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive(item) ? 'bg-white/10 text-white' : 'text-emerald-100/70'}`}
											>
												{item.label}
											</a>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
						<div class="space-y-1 border-t border-white/10 pt-3">
							<a href="/admin/settings" onclick={() => (drawerOpen = false)} class="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/70">الإعدادات</a>
							<a href="/" target="_blank" rel="noopener" class="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/70">عرض الموقع</a>
							<button type="button" onclick={handleLogout} disabled={loggingOut} class="block w-full rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-emerald-100/70 disabled:opacity-50">
								{loggingOut ? 'جاري الخروج…' : 'تسجيل الخروج'}
							</button>
						</div>
					</nav>
				</aside>
			</div>
		{/if}

		<!-- Main column -->
		<div class="lg:ms-64">
			<header class="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 backdrop-blur">
				<div class="flex h-16 items-center gap-3 px-4 sm:px-6">
					<button
						type="button"
						onclick={() => (drawerOpen = true)}
						class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
						aria-label="فتح القائمة"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
						</svg>
					</button>
					<span class="font-display text-lg font-bold text-emerald-950 lg:hidden">Lhamza Shop</span>
					<div class="ms-auto flex items-center gap-2">
						<a
							href="/"
							target="_blank"
							rel="noopener"
							class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 text-sm font-bold text-neutral-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</svg>
							عرض الموقع
						</a>
						<span class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 font-display text-sm font-bold text-amber-400" title="المدير">م</span>
					</div>
				</div>
			</header>

			<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
