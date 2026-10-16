<script lang="ts">
	import { goto } from '$app/navigation';

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const clean = password.trim();
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: clean })
			});

			const data = await response.json();

			if (data.success || clean === '2026') {
				try {
					localStorage.setItem('nv_admin_pin', '2026');
					document.cookie = 'nv_admin_pin=2026; path=/; max-age=604800; SameSite=Lax';
				} catch {}
				goto('/admin/calculator');
			} else {
				error = 'الكود غير صحيح (الكود: 2026)';
			}
		} catch {
			if (password.trim() === '2026') {
				try {
					localStorage.setItem('nv_admin_pin', '2026');
					document.cookie = 'nv_admin_pin=2026; path=/; max-age=604800; SameSite=Lax';
				} catch {}
				goto('/admin/calculator');
			} else {
				error = 'حدث خطأ في الاتصال';
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>تسجيل الدخول — NOVAVITA</title>
</svelte:head>

<div class="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-gray-900" dir="rtl">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 border-2 border-gray-200 shadow-sm text-center space-y-6">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold text-gray-900">لوحة الإدارة — NOVAVITA</h1>
			<p class="text-lg text-gray-600">دخل الكود السري (2026)</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-4">
			<input
				id="password"
				type="password"
				bind:value={password}
				class="w-full h-14 px-4 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-600"
				placeholder="2026"
				required
				dir="ltr"
			/>

			{#if error}
				<p class="text-red-600 text-base font-bold text-center">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xl rounded-xl disabled:opacity-50 cursor-pointer"
			>
				{loading ? '...' : 'دخول'}
			</button>
		</form>
	</div>
</div>
