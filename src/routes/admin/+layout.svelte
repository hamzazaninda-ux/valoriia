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
		sublabel?: string;
		href: string;
		icon: string;
		badge?: string;
		match?: string[];
	};

	type NavGroup = { title: string; items: NavItem[] };

	const navGroups: NavGroup[] = [
		{
			title: 'الرئيسية والمبيعات',
			items: [
				{ label: 'لوحة التحكم', sublabel: 'Dashboard', href: '/admin', icon: 'home', match: ['/admin'] },
				{ label: 'الطلبات', sublabel: 'Orders & Fulfillment', href: '/admin/orders', icon: 'cart', match: ['/admin/orders'] }
			]
		},
		{
			title: 'الكتالوغ والمنتجات',
			items: [
				{ label: 'المنتجات', sublabel: 'Products & SKUs', href: '/admin/products', icon: 'box', match: ['/admin/products'] },
				{ label: 'القوالب', sublabel: 'Themes & Templates', href: '/admin/templates', icon: 'palette', match: ['/admin/templates'] }
			]
		},
		{
			title: 'النظام والربط',
			items: [
				{ label: 'الإعدادات', sublabel: 'Settings & Integrations', href: '/admin/settings', icon: 'gear', match: ['/admin/settings'] }
			]
		}
	];

	const icons: Record<string, string> = {
		home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
		cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z',
		box: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
		palette: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.043-1.622M12 21v-2.25',
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
	<div class="min-h-screen bg-neutral-900">
		{@render children()}
	</div>
{:else}
	<div class="min-h-screen bg-[#f7f9f8] text-neutral-900 font-sans antialiased" dir="rtl">
		<!-- Desktop Sidebar (Right Side in Arabic RTL) -->
		<aside class="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-emerald-900/30 bg-[#0f291e] text-white lg:flex shadow-2xl">
			<!-- NOVAVITA Brand Crest -->
			<a href="/admin" class="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-white/10 group">
				<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 font-black text-xl text-emerald-950 shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform">
					N
				</span>
				<div>
					<div class="flex items-center gap-1.5">
						<span class="font-extrabold text-xl tracking-tight text-white">NOVAVITA</span>
						<span class="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="متجر مباشر"></span>
					</div>
					<span class="block text-[11px] font-semibold text-emerald-200/70">لوحة التحكم والمبيعات</span>
				</div>
			</a>

			<!-- Navigation Links -->
			<nav class="flex-1 space-y-6 overflow-y-auto px-3.5 py-5 scrollbar-thin">
				{#each navGroups as group}
					<div>
						<p class="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-emerald-300/50 uppercase">
							{group.title}
						</p>
						<div class="space-y-1">
							{#each group.items as item}
								{@const active = isActive(item)}
								<a
									href={item.href}
									class={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.99] ${
										active
											? 'bg-emerald-800/80 text-white shadow-md shadow-emerald-950/40 border border-emerald-600/40'
											: 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
									}`}
								>
									<span class="flex items-center gap-3">
										<svg class={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-amber-300' : 'text-emerald-300/80 group-hover:text-amber-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
											<path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
										</svg>
										<span>{item.label}</span>
									</span>

									{#if active}
										<span class="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<!-- Quick Bottom Tools -->
			<div class="space-y-1.5 border-t border-white/10 p-3.5 bg-black/15">
				<a
					href="/"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-emerald-100/70 hover:bg-white/10 hover:text-white transition-colors"
				>
					<svg class="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.globe} />
					</svg>
					<span>زيارة المتجر المباشر</span>
					<span class="ms-auto text-[10px] text-emerald-400/80 font-mono">↗</span>
				</a>
				<button
					type="button"
					onclick={handleLogout}
					disabled={loggingOut}
					class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200 transition-colors disabled:opacity-50"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.logout} />
					</svg>
					<span>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
				</button>
			</div>
		</aside>

		<!-- Mobile Navigation Drawer -->
		{#if drawerOpen}
			<div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="قائمة الإدارة">
				<button type="button" class="absolute inset-0 bg-black/60 backdrop-blur-xs" onclick={() => (drawerOpen = false)} aria-label="إغلاق"></button>
				<aside class="absolute inset-y-0 right-0 flex w-72 flex-col bg-[#0f291e] text-white shadow-2xl">
					<div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
						<span class="flex items-center gap-3">
							<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-extrabold text-lg text-emerald-950">N</span>
							<span class="font-extrabold text-lg tracking-tight">NOVAVITA</span>
						</span>
						<button
							type="button"
							onclick={() => (drawerOpen = false)}
							class="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-200/70 hover:bg-white/10"
							aria-label="إغلاق"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<nav class="flex-1 space-y-6 overflow-y-auto px-4 py-5">
						{#each navGroups as group}
							<div>
								<p class="px-2 pb-2 text-[10px] font-extrabold text-emerald-300/50 uppercase">{group.title}</p>
								<div class="space-y-1">
									{#each group.items as item}
										<a
											href={item.href}
											onclick={() => (drawerOpen = false)}
											class={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold ${
												isActive(item) ? 'bg-emerald-800 text-white' : 'text-emerald-100/70 hover:bg-white/10'
											}`}
										>
											<span class="flex items-center gap-3">
												<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
													<path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
												</svg>
												{item.label}
											</span>
										</a>
									{/each}
								</div>
							</div>
						{/each}
						<div class="space-y-2 border-t border-white/10 pt-4">
							<a href="/" target="_blank" rel="noopener" class="block rounded-xl px-3 py-2 text-xs font-bold text-emerald-200/80 hover:bg-white/10">
								زيارة المتجر ↗
							</a>
							<button type="button" onclick={handleLogout} disabled={loggingOut} class="block w-full text-right rounded-xl px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10">
								{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
							</button>
						</div>
					</nav>
				</aside>
			</div>
		{/if}

		<!-- Main Page Workspace -->
		<div class="lg:ms-64 flex flex-col min-h-screen">
			<!-- Top Bar Header -->
			<header class="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
				<div class="flex h-16 items-center justify-between px-4 sm:px-6">
					<!-- Mobile menu toggle & title -->
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => (drawerOpen = true)}
							class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
							aria-label="القائمة"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
							</svg>
						</button>
						<span class="font-extrabold text-lg text-emerald-950 lg:hidden">NOVAVITA</span>
						<div class="hidden lg:flex items-center gap-2 text-xs text-neutral-500 font-medium">
							<span class="text-neutral-400">لوحة التحكم</span>
							<span>/</span>
							<span class="font-bold text-neutral-900">
								{page.url.pathname === '/admin' ? 'نظرة عامة على المبيعات' : page.url.pathname.replace('/admin/', '')}
							</span>
						</div>
					</div>

					<!-- Header Actions -->
					<div class="flex items-center gap-2.5">
						<span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							متجر NOVAVITA نشط
						</span>
						<a
							href="/"
							target="_blank"
							rel="noopener"
							class="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs hover:border-emerald-600 hover:text-emerald-700 transition-colors"
						>
							<svg class="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</svg>
							<span>المتجر</span>
						</a>
						<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f291e] font-extrabold text-sm text-amber-300 shadow-xs">
							N
						</span>
					</div>
				</div>
			</header>

			<!-- View Content -->
			<main class="flex-1 p-4 sm:p-6 lg:p-8">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
