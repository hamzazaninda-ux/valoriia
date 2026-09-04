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
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			const data = await response.json();

			if (data.success) {
				goto('/admin');
			} else {
				error = data.error || 'كلمة المرور غير صحيحة';
			}
		} catch {
			error = 'حدث خطأ في الاتصال';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>تسجيل الدخول - Admin</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
		<h1 class="text-2xl font-bold text-center mb-6">تسجيل الدخول</h1>

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					كلمة المرور
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
					placeholder="أدخل كلمة المرور"
					required
				/>
			</div>

			{#if error}
				<p class="text-red-500 text-sm text-center">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
			>
				{loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
			</button>
		</form>
	</div>
</div>
