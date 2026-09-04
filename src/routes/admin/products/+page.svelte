<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';

	let { data } = $props();

	let products = $state(data.products || []);
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sortBy = $state('updated');
	let processingSlug = $state<string | null>(null);

	let filteredProducts = $derived.by(() => {
		let result = [...products];

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(
				p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter(p => p.status === statusFilter);
		}

		switch (sortBy) {
			case 'name':
				result.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
				break;
			case 'created':
				result.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
				break;
			case 'updated':
			default:
				result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
				break;
		}

		return result;
	});

	function formatDate(iso: string): string {
		try {
			const d = new Date(iso);
			return d.toLocaleDateString('ar-MA', { year: 'numeric', month: 'short', day: 'numeric' });
		} catch {
			return iso;
		}
	}

	async function handleDelete(slug: string, title: string) {
		if (!confirm(`هل أنت متأكد من حذف "${title}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`)) return;
		if (processingSlug) return;

		processingSlug = slug;
		try {
			const res = await fetch(`/api/products/${slug}`, { method: 'DELETE' });
			if (res.ok) {
				products = products.filter(p => p.slug !== slug);
				toasts.success(`تم حذف "${title}" بنجاح`);
			} else {
				toasts.error('فشل في حذف المنتج');
			}
		} catch {
			toasts.error('حدث خطأ أثناء حذف المنتج');
		} finally {
			processingSlug = null;
		}
	}

	async function handlePublish(slug: string) {
		if (processingSlug) return;

		processingSlug = slug;
		try {
			const res = await fetch(`/api/products/${slug}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'publish' })
			});
			if (res.ok) {
				products = products.map(p =>
					p.slug === slug ? { ...p, status: 'published', updatedAt: new Date().toISOString() } : p
				);
				toasts.success('تم نشر المنتج بنجاح');
			} else {
				const errorData = await res.json().catch(() => null);
				toasts.error(errorData?.error || 'فشل في نشر المنتج');
			}
		} catch {
			toasts.error('حدث خطأ أثناء النشر');
		} finally {
			processingSlug = null;
		}
	}

	async function handleUnpublish(slug: string, title: string) {
		if (!confirm(`هل تريد إلغاء نشر "${title}"؟\n\nسيتم إخفاء المنتج من الموقع.`)) return;
		if (processingSlug) return;

		processingSlug = slug;
		try {
			const res = await fetch(`/api/products/${slug}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'unpublish' })
			});
			if (res.ok) {
				products = products.map(p =>
					p.slug === slug ? { ...p, status: 'draft', updatedAt: new Date().toISOString() } : p
				);
				toasts.success('تم إلغاء النشر بنجاح');
			} else {
				toasts.error('فشل في إلغاء النشر');
			}
		} catch {
			toasts.error('حدث خطأ أثناء إلغاء النشر');
		} finally {
			processingSlug = null;
		}
	}
</script>

<svelte:head>
	<title>المنتجات - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold text-gray-900">المنتجات</h1>
		<a
			href="/admin/products/new"
			class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
		>
			+ منتج جديد
		</a>
	</div>

	<div class="bg-white shadow-sm rounded-lg border p-4">
		<div class="flex flex-wrap items-center gap-4">
			<div class="flex-1 min-w-[200px]">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="بحث بالاسم أو الرابط..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
				/>
			</div>

			<div>
				<select
					bind:value={statusFilter}
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
				>
					<option value="all">الكل</option>
					<option value="published">منشور</option>
					<option value="draft">مسودة</option>
				</select>
			</div>

			<div>
				<select
					bind:value={sortBy}
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
				>
					<option value="updated">آخر تحديث</option>
					<option value="name">الاسم</option>
					<option value="created">تاريخ الإنشاء</option>
				</select>
			</div>
		</div>

		<div class="mt-3 text-sm text-gray-500">
			إجمالي: {products.length}
			{#if searchQuery || statusFilter !== 'all'}
				| المعروض: {filteredProducts.length}
			{/if}
		</div>
	</div>

	<div class="bg-white shadow-sm rounded-lg border overflow-hidden">
		{#if filteredProducts.length === 0}
			<div class="p-8 text-center text-gray-500">
				{#if products.length === 0}
					لا توجد منتجات بعد.
				{:else}
					لا توجد نتائج مطابقة.
				{/if}
			</div>
		{:else}
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر تحديث</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredProducts as product (product.slug)}
						<tr class={processingSlug === product.slug ? 'opacity-50' : ''}>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="h-10 w-10 flex-shrink-0">
										<img class="h-10 w-10 rounded-lg object-cover" src={product.heroImage} alt="" />
									</div>
									<div class="mr-4">
										<div class="text-sm font-medium text-gray-900">{product.title}</div>
										<div class="text-sm text-gray-500">/{product.slug}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {product.status === 'published' ? 'bg-green-100 text-green-800' : product.status === 'archived' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}">
									{product.status === 'published' ? 'منشور' : product.status === 'archived' ? 'أرشيف' : 'مسودة'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{product.startingPrice} DH
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatDate(product.updatedAt)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
								<a href="/admin/products/{product.slug}/edit" class="text-emerald-600 hover:text-emerald-900">
									تعديل
								</a>
								<a href="/admin/products/{product.slug}/preview" class="text-blue-600 hover:text-blue-900">
									معاينة
								</a>
								{#if product.status !== 'published'}
									<button
										onclick={() => handlePublish(product.slug)}
										disabled={processingSlug !== null}
										class="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{processingSlug === product.slug ? '...' : 'نشر'}
									</button>
								{:else}
									<button
										onclick={() => handleUnpublish(product.slug, product.title)}
										disabled={processingSlug !== null}
										class="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{processingSlug === product.slug ? '...' : 'إلغاء النشر'}
									</button>
								{/if}
								<button
									onclick={() => handleDelete(product.slug, product.title)}
									disabled={processingSlug !== null}
									class="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{processingSlug === product.slug ? '...' : 'حذف'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
