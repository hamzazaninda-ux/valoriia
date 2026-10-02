<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>خطأ - Valoriia</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full text-center">
		<div class="mb-6">
			<div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-red-600">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
				</svg>
			</div>
		</div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">حدث خطأ</h1>
		<p class="text-gray-600 mb-6">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
		{#if $page.status}
			<p class="text-sm text-gray-500 mb-4">كود الخطأ: {$page.status}</p>
		{/if}
		<a
			href="/"
			class="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
		>
			العودة للرئيسية
		</a>
	</div>
</div>
