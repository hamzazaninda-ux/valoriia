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
				goto('/admin');
			} else {
				error = data.error || 'رمز الدخول غير صحيح (الرمز الافتراضي: 2026)';
			}
		} catch {
			if (password.trim() === '2026') {
				try {
					localStorage.setItem('nv_admin_pin', '2026');
					document.cookie = 'nv_admin_pin=2026; path=/; max-age=604800; SameSite=Lax';
				} catch {}
				goto('/admin');
			} else {
				error = 'حدث خطأ في الاتصال';
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>تسجيل الدخول للإدارة — NOVAVITA</title>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-[#092218] via-[#134e4a] to-[#065f46] flex items-center justify-center p-4 font-sans antialiased"
	dir="rtl"
>
	<div
		class="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border-2 border-amber-400/40 text-center space-y-4"
	>
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#134e4a] to-[#065f46] text-amber-300 font-black text-3xl shadow-lg border border-amber-400/40"
		>
			N
		</div>
		<div>
			<h1 class="text-2xl font-black text-neutral-900">لوحة قيادة NOVAVITA</h1>
			<p class="text-xs text-neutral-500 font-semibold mt-1">
				أدخل رمز القفل (الافتراضي: 2026) أو كلمة مرور الإدارة
			</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-4 pt-2">
			<div>
				<label for="password" class="block text-xs font-extrabold text-neutral-700 mb-2">
					رمز الدخول (PIN)
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full h-12 px-4 border-2 border-neutral-200 rounded-2xl text-center text-lg font-black tracking-widest focus:outline-none focus:border-[#065f46]"
					placeholder="2026"
					required
					dir="ltr"
				/>
			</div>

			{#if error}
				<p class="text-rose-600 text-xs font-bold text-center">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full h-12 bg-[#065f46] hover:bg-[#134e4a] text-white font-black text-sm rounded-2xl shadow-lg disabled:opacity-50 cursor-pointer"
			>
				{loading ? 'جاري الدخول...' : 'فتح لوحة التحكم ←'}
			</button>
		</form>
	</div>
</div>
