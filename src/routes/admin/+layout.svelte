<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ToastContainer from '$lib/components/ui/toast/ToastContainer.svelte';

	let { children } = $props();

	let loggingOut = $state(false);

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
</script>

<ToastContainer />

<div class="min-h-screen bg-gray-50">
	<nav class={page.url.pathname === '/admin/login' ? 'hidden' : 'bg-white shadow-sm border-b'}>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<a href="/admin" class="flex items-center px-4 text-xl font-bold text-emerald-600">
						Alpha Vital CMS
					</a>
				</div>

				<div class="flex items-center gap-4">
					<a href="/admin/templates" class="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
						🎨 القوالب
					</a>
					<a href="/" class="text-gray-600 hover:text-gray-900 text-sm">
						الموقع
					</a>
					<button
						onclick={handleLogout}
						disabled={loggingOut}
						class="text-gray-600 hover:text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
					</button>
				</div>
			</div>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</div>
</div>
