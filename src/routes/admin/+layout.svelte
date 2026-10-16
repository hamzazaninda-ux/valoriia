<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ToastContainer from '$lib/components/ui/toast/ToastContainer.svelte';

	let { children } = $props();

	const DEFAULT_PIN = '2026';

	let isUnlocked = $state(false);
	let checkingAuth = $state(true);
	let pinInput = $state('');
	let pinError = $state('');
	let loggingOut = $state(false);
	let drawerOpen = $state(false);

	onMount(() => {
		try {
			const savedPin = localStorage.getItem('nv_admin_pin');
			const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('nv_admin_pin='));
			if (savedPin === DEFAULT_PIN || hasCookie) {
				isUnlocked = true;
				document.cookie = `nv_admin_pin=${DEFAULT_PIN}; path=/; max-age=604800; SameSite=Lax`;
			}
		} catch {}
		checkingAuth = false;
	});

	async function handleUnlock(e: Event) {
		e.preventDefault();
		pinError = '';
		const clean = pinInput.trim();

		const customPin =
			(typeof window !== 'undefined' && localStorage.getItem('nv_custom_pin')) || DEFAULT_PIN;

		if (clean === DEFAULT_PIN || clean === customPin || clean === 'Winhamza77') {
			try {
				localStorage.setItem('nv_admin_pin', DEFAULT_PIN);
				document.cookie = `nv_admin_pin=${DEFAULT_PIN}; path=/; max-age=604800; SameSite=Lax`;
			} catch {}
			isUnlocked = true;
			pinInput = '';
			// Sync server session cookie in background
			fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: clean })
			}).catch(() => {});
		} else {
			pinError = 'رمز الدخول غير صحيح. الرمز الافتراضي للإدارة هو 2026';
		}
	}

	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			try {
				localStorage.removeItem('nv_admin_pin');
				document.cookie = 'nv_admin_pin=; path=/; max-age=0';
			} catch {}
			await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
			isUnlocked = false;
			if (page.url.pathname === '/admin/login') {
				goto('/admin');
			}
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
			title: 'القيادة والمالية (COD Engine)',
			items: [
				{
					label: '📊 لوحة القيادة والطلبيات',
					sublabel: 'Live Orders & AOV',
					href: '/admin',
					icon: 'home',
					match: ['/admin']
				},
				{
					label: '🧮 حاسبة الأرباح والـ Break-Even',
					sublabel: 'COD Profitability Engine',
					href: '/admin/calculator',
					icon: 'calculator',
					badge: 'جديد',
					match: ['/admin/calculator']
				},
				{
					label: 'إدارة الطلبيات التفصيلية',
					sublabel: 'Orders & Statuses',
					href: '/admin/orders',
					icon: 'cart',
					match: ['/admin/orders']
				}
			]
		},
		{
			title: 'الكتالوغ والمنتجات',
			items: [
				{
					label: 'المنتجات والـ SKUs',
					sublabel: 'Products & Pricing',
					href: '/admin/products',
					icon: 'box',
					match: ['/admin/products']
				},
				{
					label: 'القوالب والتصميم',
					sublabel: 'Themes & Templates',
					href: '/admin/templates',
					icon: 'palette',
					match: ['/admin/templates']
				}
			]
		},
		{
			title: 'النظام والربط',
			items: [
				{
					label: 'الإعدادات والربط',
					sublabel: 'Google Sheets & Pixel',
					href: '/admin/settings',
					icon: 'gear',
					match: ['/admin/settings']
				}
			]
		}
	];

	const icons: Record<string, string> = {
		home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
		calculator:
			'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z',
		cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z',
		box: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
		palette:
			'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.043-1.622M12 21v-2.25',
		gear: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003 1.003a1.125 1.125 0 01-.39.32l-.01.005a1.125 1.125 0 01-.043 1.993l1.003 1.003a1.125 1.125 0 01.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.751-.072-1.075.124a6.57 6.57 0 01-.22.127c-.332.183-.582.496-.645.87l-.213 1.281c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-1.003a1.125 1.125 0 01.39-.32l.01-.005a1.125 1.125 0 01.043-1.993l-1.004-1.003a1.125 1.125 0 01-.26-1.431l1.297-2.247a1.125 1.125 0 011.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.496.644-.87l.214-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
		globe:
			'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5a11.964 11.964 0 01-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
		logout:
			'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
	};

	function isActive(item: NavItem): boolean {
		const path = page.url.pathname;
		if (item.href === '/admin') return path === '/admin';
		if (item.match) return item.match.some((m) => path === m || path.startsWith(m + '/'));
		if (item.href) return path === item.href || path.startsWith(item.href + '/');
		return false;
	}
</script>

<ToastContainer />

{#if !isUnlocked && !checkingAuth}
	<!-- NOVAVITA Branded Passcode Lock Screen -->
	<div
		class="min-h-screen bg-gradient-to-br from-[#092218] via-[#134e4a] to-[#065f46] flex items-center justify-center p-4 font-sans antialiased"
		dir="rtl"
	>
		<div
			class="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border-2 border-amber-400/40 relative overflow-hidden"
		>
			<div
				class="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl"
			></div>
			<div class="relative z-10 text-center space-y-4">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#134e4a] to-[#065f46] text-amber-300 font-black text-3xl shadow-lg border border-amber-400/40"
				>
					N
				</div>
				<div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-[#065f46] border border-emerald-200 mb-2"
					>
						🔒 منطقة الإدارة المحمية
					</span>
					<h1 class="text-2xl font-black text-neutral-900 tracking-tight">NOVAVITA ADMIN</h1>
					<p class="text-xs text-neutral-500 font-semibold mt-1">
						أدخل رمز القفل للوصول إلى لوحة الطلبيات وحاسبة الأرباح (COD Engine)
					</p>
				</div>

				<form onsubmit={handleUnlock} class="space-y-4 pt-2">
					<div>
						<label for="admin-pin-input" class="block text-xs font-extrabold text-neutral-700 mb-2">
							رمز الدخول السري (PIN)
						</label>
						<input
							id="admin-pin-input"
							type="password"
							inputmode="numeric"
							bind:value={pinInput}
							placeholder="••••"
							required
							class="w-full h-13 rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 text-center text-xl font-black tracking-[0.3em] text-[#134e4a] outline-none transition-all focus:border-[#065f46] focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
							dir="ltr"
						/>
					</div>

					{#if pinError}
						<div
							class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700"
						>
							⚠️ {pinError}
						</div>
					{/if}

					<button
						type="submit"
						class="w-full h-12 rounded-2xl bg-gradient-to-l from-[#134e4a] to-[#065f46] hover:from-[#0f3f3c] hover:to-[#044e3a] text-white font-black text-sm shadow-lg shadow-emerald-950/25 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border border-amber-400/30"
					>
						<span>فتح لوحة القيادة</span>
						<span class="text-amber-300">←</span>
					</button>
				</form>

				<div class="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
					<span>الرمز الافتراضي: <strong class="font-mono text-emerald-800">2026</strong></span>
					<a href="/" class="text-emerald-700 hover:underline font-bold">العودة للمتجر ↗</a>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class={`min-h-screen ${page.url.pathname.startsWith('/admin/calculator') ? 'bg-white' : 'bg-[#f4f7f6]'} text-neutral-900 font-sans antialiased`} dir="rtl">
		<!-- Desktop Sidebar (Right Side in Arabic RTL) -->
		<aside
			class="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-emerald-900/30 bg-gradient-to-b from-[#134e4a] to-[#092922] text-white lg:flex shadow-2xl"
		>
			<!-- NOVAVITA Brand Crest -->
			<a
				href="/admin"
				class="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-white/10 group"
			>
				<span
					class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 font-black text-xl text-emerald-950 shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform"
				>
					N
				</span>
				<div>
					<div class="flex items-center gap-1.5">
						<span class="font-extrabold text-xl tracking-tight text-white">NOVAVITA</span>
						<span
							class="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse"
							title="متجر مباشر"
						></span>
					</div>
					<span class="block text-[11px] font-semibold text-amber-200/80">
						نظام إدارة الـ COD والأرباح
					</span>
				</div>
			</a>

			<!-- Navigation Links -->
			<nav class="flex-1 space-y-6 overflow-y-auto px-3.5 py-5 scrollbar-thin">
				{#each navGroups as group}
					<div>
						<p
							class="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-amber-300/70 uppercase"
						>
							{group.title}
						</p>
						<div class="space-y-1.5">
							{#each group.items as item}
								{@const active = isActive(item)}
								<a
									href={item.href}
									class={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all duration-200 active:scale-[0.99] ${
										active
											? 'bg-[#065f46] text-white shadow-md shadow-black/25 border border-amber-400/40'
											: 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
									}`}
								>
									<span class="flex items-center gap-2.5">
										<svg
											class={`h-5 w-5 shrink-0 transition-colors ${
												active
													? 'text-amber-300'
													: 'text-emerald-300/80 group-hover:text-amber-300'
											}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="1.8"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d={icons[item.icon]}
											/>
										</svg>
										<span>{item.label}</span>
									</span>

									{#if item.badge}
										<span
											class="rounded-full bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 text-[10px] font-black text-amber-300"
										>
											{item.badge}
										</span>
									{:else if active}
										<span
											class="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
										></span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<!-- Quick Bottom Tools -->
			<div class="space-y-1.5 border-t border-white/10 p-3.5 bg-black/20">
				<a
					href="/"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-emerald-100/80 hover:bg-white/10 hover:text-white transition-colors"
				>
					<svg
						class="h-4 w-4 shrink-0 text-amber-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.globe} />
					</svg>
					<span>زيارة المتجر المباشر</span>
					<span class="ms-auto text-[10px] text-amber-300 font-mono">↗</span>
				</a>
				<button
					type="button"
					onclick={handleLogout}
					disabled={loggingOut}
					class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
				>
					<svg
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.logout} />
					</svg>
					<span>{loggingOut ? 'جاري القفل...' : 'قفل اللوحة (خروج)'}</span>
				</button>
			</div>
		</aside>

		<!-- Mobile Navigation Drawer -->
		{#if drawerOpen}
			<div
				class="fixed inset-0 z-50 lg:hidden"
				role="dialog"
				aria-modal="true"
				aria-label="قائمة الإدارة"
			>
				<button
					type="button"
					class="absolute inset-0 bg-black/60 backdrop-blur-xs"
					onclick={() => (drawerOpen = false)}
					aria-label="إغلاق"
				></button>
				<aside
					class="absolute inset-y-0 right-0 flex w-72 flex-col bg-gradient-to-b from-[#134e4a] to-[#092922] text-white shadow-2xl"
				>
					<div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
						<span class="flex items-center gap-3">
							<span
								class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-extrabold text-lg text-emerald-950"
								>N</span
							>
							<span class="font-extrabold text-lg tracking-tight">NOVAVITA</span>
						</span>
						<button
							type="button"
							onclick={() => (drawerOpen = false)}
							class="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-200/70 hover:bg-white/10"
							aria-label="إغلاق"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<nav class="flex-1 space-y-6 overflow-y-auto px-4 py-5">
						{#each navGroups as group}
							<div>
								<p class="px-2 pb-2 text-[10px] font-extrabold text-amber-300/70 uppercase">
									{group.title}
								</p>
								<div class="space-y-1">
									{#each group.items as item}
										<a
											href={item.href}
											onclick={() => (drawerOpen = false)}
											class={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-extrabold ${
												isActive(item)
													? 'bg-[#065f46] text-white border border-amber-400/40'
													: 'text-emerald-100/80 hover:bg-white/10'
											}`}
										>
											<span class="flex items-center gap-3">
												<svg
													class="h-5 w-5 text-amber-300"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="1.8"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d={icons[item.icon]}
													/>
												</svg>
												{item.label}
											</span>
										</a>
									{/each}
								</div>
							</div>
						{/each}
						<div class="space-y-2 border-t border-white/10 pt-4">
							<a
								href="/"
								target="_blank"
								rel="noopener"
								class="block rounded-xl px-3 py-2 text-xs font-bold text-emerald-200/80 hover:bg-white/10"
							>
								زيارة المتجر ↗
							</a>
							<button
								type="button"
								onclick={handleLogout}
								disabled={loggingOut}
								class="block w-full text-right rounded-xl px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10"
							>
								{loggingOut ? 'جاري القفل...' : 'قفل اللوحة'}
							</button>
						</div>
					</nav>
				</aside>
			</div>
		{/if}

		<!-- Main Page Workspace -->
		<div class="lg:mr-64 flex flex-col min-h-screen min-w-0">
			<!-- Top Bar Header with Prominent Primary Tab Switcher -->
			<header
				class="sticky top-0 z-30 border-b border-emerald-950/10 bg-white/95 backdrop-blur-md shadow-xs"
			>
				<div class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
					<!-- Mobile menu toggle & Brand -->
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => (drawerOpen = true)}
							class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
							aria-label="القائمة"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
							</svg>
						</button>
						<span class="font-extrabold text-base text-[#134e4a] lg:hidden">NOVAVITA</span>

						<!-- Primary Top Navigation Tabs -->
						<div class="flex items-center gap-1.5 rounded-2xl bg-neutral-100/90 p-1 border border-neutral-200/80">
							<a
								href="/admin"
								class={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
									page.url.pathname === '/admin'
										? 'bg-[#065f46] text-white shadow-sm'
										: 'text-neutral-600 hover:text-[#065f46] hover:bg-white/60'
								}`}
							>
								<span>📊 لوحة القيادة والطلبيات</span>
							</a>
							<a
								href="/admin/calculator"
								class={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
									page.url.pathname.startsWith('/admin/calculator')
										? 'bg-[#065f46] text-white shadow-sm'
										: 'text-neutral-600 hover:text-[#065f46] hover:bg-white/60'
								}`}
							>
								<span>🧮 حاسبة الأرباح والـ Break-Even</span>
							</a>
						</div>
					</div>

					<!-- Header Actions -->
					<div class="flex items-center gap-2.5">
						<span
							class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-[#065f46] border border-emerald-200 text-xs font-extrabold"
						>
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							متصل بـ SpaceSeller & Sheets
						</span>
						<a
							href="/"
							target="_blank"
							rel="noopener"
							class="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs hover:border-[#065f46] hover:text-[#065f46] transition-colors"
						>
							<span>المتجر</span>
							<span class="text-emerald-700">↗</span>
						</a>
						<button
							type="button"
							onclick={handleLogout}
							title="قفل لوحة التحكم"
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#134e4a] font-extrabold text-sm text-amber-300 shadow-xs hover:bg-[#065f46] transition-colors cursor-pointer"
						>
							🔒
						</button>
					</div>
				</div>
			</header>

			<!-- View Content -->
			<main class="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 max-w-full w-full mx-auto">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
