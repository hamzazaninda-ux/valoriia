<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard - Admin</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-medium text-gray-900">المنتجات</h3>
			<p class="mt-2 text-3xl font-bold text-emerald-600">{data.stats.total}</p>
		</div>

		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-medium text-gray-900">المنشورة</h3>
			<p class="mt-2 text-3xl font-bold text-green-600">{data.stats.published}</p>
		</div>

		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-medium text-gray-900">المسودات</h3>
			<p class="mt-2 text-3xl font-bold text-yellow-600">{data.stats.drafts}</p>
		</div>

		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-medium text-gray-900">الأرشيف</h3>
			<p class="mt-2 text-3xl font-bold text-gray-600">{data.stats.archived}</p>
		</div>
	</div>

	<div class="bg-white p-6 rounded-lg shadow-sm border">
		<h2 class="text-lg font-medium text-gray-900 mb-4">إجراءات سريعة</h2>
		<div class="flex gap-4">
			<a
				href="/admin/products/new"
				class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
			>
				+ منتج جديد
			</a>
			<a
				href="/admin/products"
				class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
			>
				إدارة المنتجات
			</a>
			<a
				href="/admin/settings"
				class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
			>
				الإعدادات
			</a>
		</div>
	</div>
</div>
