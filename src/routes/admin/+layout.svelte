<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ToastContainer from '$lib/components/ui/toast/ToastContainer.svelte';

	let { children } = $props();

	const DEFAULT_PIN = '2026';

	let isUnlocked = $state(false);
	let checkingAuth = $state(true);
	let pinInput = $state('');
	let pinError = $state('');

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

		if (clean === DEFAULT_PIN || clean === 'Winhamza77') {
			try {
				localStorage.setItem('nv_admin_pin', DEFAULT_PIN);
				document.cookie = `nv_admin_pin=${DEFAULT_PIN}; path=/; max-age=604800; SameSite=Lax`;
			} catch {}
			isUnlocked = true;
			pinInput = '';
			fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: clean })
			}).catch(() => {});
		} else {
			pinError = 'الرمز غير صحيح. اكتب 2026';
		}
	}

	async function handleLogout() {
		try {
			localStorage.removeItem('nv_admin_pin');
			document.cookie = 'nv_admin_pin=; path=/; max-age=0';
		} catch {}
		await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
		isUnlocked = false;
	}
</script>

<ToastContainer />

{#if !isUnlocked && !checkingAuth}
	<!-- Simple Pure White PIN Screen -->
	<div class="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-gray-900" dir="rtl">
		<div class="w-full max-w-md rounded-2xl bg-white p-8 border-2 border-gray-200 shadow-sm text-center space-y-6">
			<div class="space-y-2">
				<h1 class="text-3xl font-bold text-gray-900">لوحة الإدارة — NOVAVITA</h1>
				<p class="text-lg text-gray-600">دخل الكود السري باش تفتح اللوحة (الكود: 2026)</p>
			</div>

			<form onsubmit={handleUnlock} class="space-y-4">
				<input
					type="password"
					inputmode="numeric"
					bind:value={pinInput}
					placeholder="2026"
					required
					class="w-full h-14 rounded-xl border-2 border-gray-300 bg-white px-4 text-center text-2xl font-bold tracking-widest text-gray-900 outline-none focus:border-blue-600"
					dir="ltr"
				/>

				{#if pinError}
					<div class="rounded-xl bg-red-50 border border-red-200 p-3 text-base font-bold text-red-700">
						{pinError}
					</div>
				{/if}

				<button
					type="submit"
					class="w-full h-14 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xl transition-colors cursor-pointer"
				>
					دخول
				</button>
			</form>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-white text-gray-900 font-sans antialiased" dir="rtl">
		<!-- Simple Clean White Top Header (No Sidebar) -->
		<header class="bg-white border-b-2 border-gray-200 sticky top-0 z-30">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
				<!-- Title on Top -->
				<div class="flex items-center gap-3">
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
						حاسبة الأرباح والـ Break-Even
					</h1>
				</div>

				<!-- Two Big Simple Buttons to Switch Between الطلبيات and الحاسبة -->
				<div class="flex items-center gap-3 w-full sm:w-auto justify-center">
					<a
						href="/admin"
						class={`flex-1 sm:flex-initial text-center px-6 py-3 rounded-xl text-lg sm:text-xl font-bold border-2 transition-all ${
							page.url.pathname === '/admin'
								? 'bg-gray-900 text-white border-gray-900'
								: 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
						}`}
					>
						📦 الطلبيات
					</a>
					<a
						href="/admin/calculator"
						class={`flex-1 sm:flex-initial text-center px-6 py-3 rounded-xl text-lg sm:text-xl font-bold border-2 transition-all ${
							page.url.pathname.startsWith('/admin/calculator')
								? 'bg-gray-900 text-white border-gray-900'
								: 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
						}`}
					>
						🧮 الحاسبة
					</a>
					<button
						type="button"
						onclick={handleLogout}
						title="قفل"
						class="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 text-base font-bold cursor-pointer"
					>
						خروج
					</button>
				</div>
			</div>
		</header>

		<!-- Main Pure White Content Container -->
		<main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 bg-white">
			{@render children()}
		</main>
	</div>
{/if}
