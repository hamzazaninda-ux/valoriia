<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const templateInfo: Record<string, { icon: string; desc: string; gradient: string; preview: string }> = {
		classic: {
			icon: '🏆',
			desc: 'قالب احترافي مع صور جمالية وشكل كلاسيكي. الأنسب للمنتجات المميزة والعلامات التجارية.',
			gradient: 'from-emerald-500 to-teal-600',
			preview: 'Classic Landing — صفحة هبوط كلاسيكية',
		},
		modern: {
			icon: '⚡',
			desc: 'قالب عصري بخلفية داكنة وتأثيرات حديثة. الأنسب للمنتجات التقنية والجمال.',
			gradient: 'from-indigo-500 to-purple-600',
			preview: 'Modern Landing — صفحة هبوط عصرية',
		},
		minimal: {
			icon: '✨',
			desc: 'قالب بسيط وأنيق بدون تشتيت. الأنسب لتحويل عالٍ وعروض مباشرة.',
			gradient: 'from-gray-700 to-gray-900',
			preview: 'Minimal Landing — صفحة هبوط بسيطة',
		},
		killers: {
			icon: '🔥',
			desc: 'قالب بقوة تحويل عالية جداً مصمم على طريقة Sense. الأنسب للمنتجات الأكثر طلباً وتأثيرات بصرية راقية.',
			gradient: 'from-amber-600 to-stone-900',
			preview: 'Killers Landing — صفحة هبوط Sense',
		},
	};
</script>

<svelte:head>
	<title>القوالب — Alpha Vital CMS</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">🎨 إدارة القوالب</h1>
			<p class="text-gray-500 mt-1 text-sm">خصّص قوالب صفحات هبوط منتجاتك بالكامل — ألوان، نصوص، وأقسام</p>
		</div>
		<a
			href="/admin/products"
			class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
		>
			← المنتجات
		</a>
	</div>

	<!-- Templates Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		{#each data.templates as template}
			{@const info = templateInfo[template.id] ?? { icon: '📄', desc: template.description, gradient: 'from-gray-400 to-gray-600', preview: template.name }}
			{@const theme = data.themes[template.id]}

			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
				<!-- Template Preview Card -->
				<div class="relative h-48 bg-gradient-to-br {info.gradient} overflow-hidden">
					<!-- Simulated page preview -->
					<div class="absolute inset-0 flex flex-col p-4 opacity-30">
						<div class="h-3 w-3/4 bg-white rounded mb-2"></div>
						<div class="h-2 w-1/2 bg-white rounded mb-4"></div>
						<div class="h-2 w-full bg-white/60 rounded mb-1"></div>
						<div class="h-2 w-full bg-white/60 rounded mb-1"></div>
						<div class="h-2 w-3/4 bg-white/60 rounded mb-4"></div>
						<div class="h-8 w-full bg-white/80 rounded-lg mb-3"></div>
						<div class="grid grid-cols-3 gap-1">
							<div class="h-2 bg-white/40 rounded"></div>
							<div class="h-2 bg-white/40 rounded"></div>
							<div class="h-2 bg-white/40 rounded"></div>
						</div>
					</div>

					<!-- Icon badge -->
					<div class="absolute top-4 right-4 text-3xl">{info.icon}</div>

					<!-- Default badge -->
					{#if template.isDefault}
						<div class="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
							افتراضي
						</div>
					{/if}

					<!-- Color preview dots -->
					{#if theme}
						<div class="absolute bottom-4 right-4 flex gap-1.5">
							<div class="w-5 h-5 rounded-full border-2 border-white/50 shadow" style="background:{theme.colors.primary}"></div>
							<div class="w-5 h-5 rounded-full border-2 border-white/50 shadow" style="background:{theme.colors.cta}"></div>
							<div class="w-5 h-5 rounded-full border-2 border-white/50 shadow" style="background:{theme.colors.accent}"></div>
						</div>
					{/if}
				</div>

				<!-- Card Body -->
				<div class="p-5">
					<div class="flex items-start justify-between mb-2">
						<div>
							<h3 class="font-bold text-gray-900 text-base">
								{theme?.name || template.name}
							</h3>
							<span class="text-xs text-gray-400 font-mono">{template.id}</span>
						</div>
					</div>

					<p class="text-sm text-gray-500 mb-4 leading-relaxed">{info.desc}</p>

					<!-- Theme current colors strip -->
					{#if theme}
						<div class="mb-4 p-3 bg-gray-50 rounded-lg">
							<p class="text-xs text-gray-400 mb-2 font-medium">الألوان الحالية</p>
							<div class="flex gap-2 flex-wrap">
								{#each Object.entries(theme.colors).slice(0, 5) as [key, val]}
									<div
										class="flex items-center gap-1 text-xs text-gray-500"
										title={key}
									>
										<div class="w-4 h-4 rounded border border-gray-200" style="background:{val}"></div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex gap-2">
						<a
							href="/admin/templates/{template.id}/customize"
							class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg text-center transition-colors"
						>
							🎨 تخصيص
						</a>
						<a
							href="/"
							target="_blank"
							class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
							title="معاينة الموقع"
						>
							👁️
						</a>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Help section -->
	<div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
		<div class="flex gap-3">
			<span class="text-2xl">💡</span>
			<div>
				<h3 class="font-semibold text-blue-900 mb-1">كيف يعمل نظام القوالب؟</h3>
				<ul class="text-sm text-blue-700 space-y-1">
					<li>• كل منتج يمكنك تعيين قالب له من صفحة تعديل المنتج</li>
					<li>• التخصيصات التي تحفظها هنا تنطبق على كل المنتجات التي تستخدم هذا القالب</li>
					<li>• استخدم "حفظ كمسودة" لمعاينة التغييرات قبل النشر</li>
					<li>• يمكنك اختبار قوالب مختلفة لمعرفة أيها يحقق أعلى مبيعات</li>
				</ul>
			</div>
		</div>
	</div>
</div>
