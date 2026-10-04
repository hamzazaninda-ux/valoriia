<script lang="ts">
	import type { PageData } from './$types';
	import { toasts } from '$lib/stores/toast';
	import type { TemplateTheme } from '$lib/types/theme';

	let { data }: { data: PageData } = $props();

	let theme = $state<TemplateTheme>(structuredClone(data.theme));
	let activeTab = $state<'colors' | 'hero' | 'pricing' | 'form' | 'trust' | 'advanced'>('colors');
	let previewDevice = $state<'desktop' | 'mobile'>('desktop');
	let saving = $state(false);
	let publishing = $state(false);
	let resetting = $state(false);

	async function handleSaveDraft() {
		saving = true;
		try {
			const res = await fetch(`/api/templates/${data.templateId}/theme`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'save-draft', theme })
			});
			const result = await res.json();
			if (res.ok) {
				toasts.success(result.message || 'تم حفظ المسودة بنجاح');
			} else {
				toasts.error(result.error || 'فشل حفظ المسودة');
			}
		} catch {
			toasts.error('حدث خطأ في الاتصال أثناء الحفظ');
		} finally {
			saving = false;
		}
	}

	async function handlePublish() {
		publishing = true;
		try {
			// First save draft
			await fetch(`/api/templates/${data.templateId}/theme`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'save-draft', theme })
			});
			// Then publish
			const res = await fetch(`/api/templates/${data.templateId}/theme`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'publish' })
			});
			const result = await res.json();
			if (res.ok) {
				toasts.success(result.message || 'تم نشر التغيرات بنجاح');
			} else {
				toasts.error(result.error || 'فشل النشر');
			}
		} catch {
			toasts.error('حدث خطأ في الاتصال أثناء النشر');
		} finally {
			publishing = false;
		}
	}

	async function handleReset() {
		if (!confirm('هل أنت تأكد من إرجاع الإعدادات الافتراضية للقالب؟')) return;
		resetting = true;
		try {
			const res = await fetch(`/api/templates/${data.templateId}/theme`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'reset' })
			});
			const result = await res.json();
			if (res.ok && result.theme) {
				theme = result.theme;
				toasts.success(result.message || 'تمت إعادة التعيين');
			} else {
				toasts.error(result.error || 'فشل إعادة التعيين');
			}
		} catch {
			toasts.error('حدث خطأ أثناء إعادة التعيين');
		} finally {
			resetting = false;
		}
	}
</script>

<svelte:head>
	<title>تخصيص القالب {theme.name} — Lhamza Shop CMS</title>
</svelte:head>

<div class="h-[calc(100vh-5rem)] flex flex-col -mx-4 -my-8 sm:-mx-6 lg:-mx-8">
	<!-- Top Bar -->
	<header class="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
		<div class="flex items-center gap-4">
			<a href="/admin/templates" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
				←
			</a>
			<div>
				<h1 class="text-lg font-bold text-gray-900 flex items-center gap-2">
					🎨 تخصيص {theme.name}
				</h1>
				<span class="text-xs text-gray-500 font-mono">{data.templateId}</span>
			</div>
		</div>

		<!-- Viewport Toggle -->
		<div class="hidden md:flex bg-gray-100 p-1 rounded-lg border border-gray-200">
			<button
				onclick={() => (previewDevice = 'desktop')}
				class="px-3 py-1 text-xs font-medium rounded-md transition-all {previewDevice === 'desktop' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}"
			>
				💻 حاسوب
			</button>
			<button
				onclick={() => (previewDevice = 'mobile')}
				class="px-3 py-1 text-xs font-medium rounded-md transition-all {previewDevice === 'mobile' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}"
			>
				📱 هاتف
			</button>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-2">
			<button
				onclick={handleReset}
				disabled={resetting || saving || publishing}
				class="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
			>
				إعادة تعيين
			</button>
			<button
				onclick={handleSaveDraft}
				disabled={saving || publishing}
				class="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
			>
				{saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
			</button>
			<button
				onclick={handlePublish}
				disabled={publishing || saving}
				class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
			>
				{publishing ? 'جاري النشر...' : '🚀 نشر التغييرات'}
			</button>
		</div>
	</header>

	<!-- Main Workspace Split Pane -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Settings Sidebar -->
		<aside class="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10">
			<!-- Tabs Navigation -->
			<div class="flex border-b border-gray-200 overflow-x-auto no-scrollbar text-xs font-semibold text-gray-600 bg-gray-50">
				<button
					onclick={() => (activeTab = 'colors')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'colors' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					🎨 الألوان
				</button>
				<button
					onclick={() => (activeTab = 'hero')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'hero' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					⭐ الهيدر
				</button>
				<button
					onclick={() => (activeTab = 'pricing')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'pricing' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					💰 العروض
				</button>
				<button
					onclick={() => (activeTab = 'form')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'form' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					📋 النموذج
				</button>
				<button
					onclick={() => (activeTab = 'trust')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'trust' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					🏆 الثقة
				</button>
				<button
					onclick={() => (activeTab = 'advanced')}
					class="px-4 py-3 border-b-2 whitespace-nowrap transition-colors {activeTab === 'advanced' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent hover:text-gray-900'}"
				>
					⚙️ متقدم
				</button>
			</div>

			<!-- Tab Contents Container -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- COLORS TAB -->
				{#if activeTab === 'colors'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">لوحة ألوان القالب</h2>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">اللون الرئيسي (Primary Accent)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.primary} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.primary} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">لون زر الطلب (CTA Button)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.cta} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.cta} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">لون شارات التخفيض والعروض (Accent)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.accent} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.accent} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">لون خلفية الصفحة (Background)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.background} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.background} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">لون خلفية البطاقات (Surface)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.surface} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.surface} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">لون النصوص الرئيسي (Text)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={theme.colors.text} class="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer" />
								<input type="text" bind:value={theme.colors.text} class="flex-1 text-xs border border-gray-300 rounded-lg p-2 font-mono" />
							</div>
						</div>
					</div>

				<!-- HERO TAB -->
				{:else if activeTab === 'hero'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">إعدادات القسم العلوي</h2>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.hero.showBadge} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار الشارة العلوية (Header Badge)</span>
						</label>

						{#if theme.sections.hero.showBadge}
							<div>
								<label class="block text-xs font-semibold text-gray-700 mb-1">نص الشارة</label>
								<input type="text" bind:value={theme.sections.hero.badgeText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
							</div>
						{/if}

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.hero.showRating} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار النجوم والتقييمات</span>
						</label>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.hero.showSalesCount} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار عداد العملاء/المبيعات</span>
						</label>

						{#if theme.sections.hero.showSalesCount}
							<div>
								<label class="block text-xs font-semibold text-gray-700 mb-1">نص عداد المبيعات</label>
								<input type="text" bind:value={theme.sections.hero.salesCountText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
							</div>
						{/if}
					</div>

				<!-- PRICING TAB -->
				{:else if activeTab === 'pricing'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">إعدادات العروض والتسعير</h2>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص زر الطلب الرئيسي (CTA)</label>
							<input type="text" bind:value={theme.sections.pricing.ctaText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص الزر الثابت (Sticky Button)</label>
							<input type="text" bind:value={theme.sections.pricing.stickyCtaText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص شارة التوصيل المجاني</label>
							<input type="text" bind:value={theme.sections.pricing.freeShippingBadgeText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.pricing.showOriginalPrice} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار السعر القديم (المشطوب)</span>
						</label>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.pricing.showPopularBadge} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار شارة "الأكثر مبيعاً" على العروض</span>
						</label>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص ضمان الاسترجاع</label>
							<input type="text" bind:value={theme.sections.pricing.guaranteeText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>
					</div>

				<!-- FORM TAB -->
				{:else if activeTab === 'form'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">إعدادات نموذج الطلب</h2>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">عنوان نموذج الطلب</label>
							<input type="text" bind:value={theme.sections.orderForm.title} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص حقل الاسم (Placeholder)</label>
							<input type="text" bind:value={theme.sections.orderForm.namePlaceholder} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص حقل المدينة (Placeholder)</label>
							<input type="text" bind:value={theme.sections.orderForm.cityPlaceholder} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص حقل الهاتف (Placeholder)</label>
							<input type="text" bind:value={theme.sections.orderForm.phonePlaceholder} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">نص زر إرسال الطلب</label>
							<input type="text" bind:value={theme.sections.orderForm.submitText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						</div>
					</div>

				<!-- TRUST TAB -->
				{:else if activeTab === 'trust'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">عناصر الثقة والأمان (Trust Badges)</h2>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.trustBadges.showCOD} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار الدفع عند الاستلام</span>
						</label>
						{#if theme.sections.trustBadges.showCOD}
							<input type="text" bind:value={theme.sections.trustBadges.codText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						{/if}

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.trustBadges.showFreeShipping} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار التوصيل المجاني</span>
						</label>
						{#if theme.sections.trustBadges.showFreeShipping}
							<input type="text" bind:value={theme.sections.trustBadges.freeShippingText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						{/if}

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.trustBadges.showWarranty} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار الضمان والاسترجاع</span>
						</label>
						{#if theme.sections.trustBadges.showWarranty}
							<input type="text" bind:value={theme.sections.trustBadges.warrantyText} class="w-full text-xs border border-gray-300 rounded-lg p-2.5" />
						{/if}

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.trustBadges.showFAQ} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">إظهار قسم الأسئلة الشائعة (FAQ)</span>
						</label>
					</div>

				<!-- ADVANCED TAB -->
				{:else if activeTab === 'advanced'}
					<div class="space-y-4">
						<h2 class="text-sm font-bold text-gray-900 mb-2">إعدادات متقدمة</h2>

						<label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
							<input type="checkbox" bind:checked={theme.sections.advanced.showStickyButton} class="w-4 h-4 text-emerald-600 rounded" />
							<span class="text-xs font-semibold text-gray-800">تفعيل الزر الثابت السفلي (Sticky CTA)</span>
						</label>

						<div>
							<label class="block text-xs font-semibold text-gray-700 mb-1">استدوار الزوايا (Border Radius)</label>
							<select bind:value={theme.sections.advanced.borderRadius} class="w-full text-xs border border-gray-300 rounded-lg p-2.5">
								<option value="none">بدون (حادة)</option>
								<option value="sm">خفيف (Small)</option>
								<option value="md">متوسط (Medium)</option>
								<option value="lg">كبير (Large)</option>
								<option value="xl">دائري جداً (Extra Large)</option>
								<option value="full">بيضاوي (Full)</option>
							</select>
						</div>
					</div>
				{/if}
			</div>
		</aside>

		<!-- Right Interactive Live Simulator -->
		<main class="flex-1 bg-gray-100 p-4 md:p-8 flex items-center justify-center overflow-y-auto">
			<div
				class="transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden bg-white flex flex-col border border-gray-300 max-h-full"
				style="width: {previewDevice === 'mobile' ? '375px' : '100%'}; height: {previewDevice === 'mobile' ? '700px' : '100%'}"
			>
				<!-- Simulated Header bar -->
				<div class="h-8 bg-gray-800 text-white flex items-center justify-between px-3 text-[10px] shrink-0 font-mono">
					<span>معاينة حية للقالب</span>
					<span style="color: {theme.colors.primary}">● {theme.name}</span>
				</div>

				<!-- Live Preview Frame Render -->
				<div
					class="flex-1 overflow-y-auto p-4 space-y-6"
					style="
						background-color: {theme.colors.background};
						color: {theme.colors.text};
					"
				>
					<!-- Header Section Preview -->
					<div
						class="p-4 rounded-xl space-y-3 text-center border"
						style="
							background-color: {theme.colors.surface};
							border-color: {theme.colors.primary}33;
						"
					>
						{#if theme.sections.hero.showBadge}
							<span
								class="inline-block text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-sm mb-1"
								style="background-color: {theme.colors.accent}"
							>
								{theme.sections.hero.badgeText}
							</span>
						{/if}

						<h2 class="text-xl font-extrabold" style="color: {theme.colors.text}">
							منتج ممتاز مع ضمان عالي الجودة
						</h2>
						<p class="text-xs" style="color: {theme.colors.textMuted}">
							وصف توضيحي جذاب يبرز مزايا المنتج الرئيسية
						</p>

						{#if theme.sections.hero.showRating}
							<div class="flex items-center justify-center gap-1 text-amber-400 text-sm">
								⭐⭐⭐⭐⭐ <span class="text-xs text-gray-500 font-bold">(4.9/5)</span>
							</div>
						{/if}

						{#if theme.sections.hero.showSalesCount}
							<p class="text-xs font-semibold text-emerald-600">
								{theme.sections.hero.salesCountText}
							</p>
						{/if}
					</div>

					<!-- Pricing & Offer Packs Preview -->
					<div
						class="p-4 rounded-xl space-y-3 border"
						style="background-color: {theme.colors.surface}"
					>
						<h3 class="text-sm font-bold text-center">اختر العرض المناسب لك</h3>

						<div
							class="p-3 border-2 rounded-xl flex items-center justify-between"
							style="border-color: {theme.colors.primary}"
						>
							<div>
								<span class="text-xs font-bold block">عرض عبوتين + 1 مجاناً</span>
								<span class="text-[10px] text-gray-500">{theme.sections.pricing.freeShippingBadgeText}</span>
							</div>
							<div class="text-left">
								{#if theme.sections.pricing.showOriginalPrice}
									<span class="text-xs line-through text-gray-400 block">499 درهم</span>
								{/if}
								<span class="text-sm font-extrabold" style="color: {theme.colors.primary}">299 درهم</span>
							</div>
						</div>

						<button
							class="w-full py-3 rounded-xl font-bold text-white text-sm shadow-md transition-all transform active:scale-95"
							style="background-color: {theme.colors.cta}"
						>
							{theme.sections.pricing.ctaText}
						</button>

						{#if theme.sections.pricing.showGuarantee}
							<p class="text-[10px] text-center font-medium text-gray-500">
								{theme.sections.pricing.guaranteeText}
							</p>
						{/if}
					</div>

					<!-- Order Form Preview -->
					<div
						class="p-4 rounded-xl space-y-3 border"
						style="background-color: {theme.colors.surface}"
					>
						<h3 class="text-sm font-bold">{theme.sections.orderForm.title}</h3>

						<div class="space-y-2 text-xs">
							<input
								type="text"
								placeholder={theme.sections.orderForm.namePlaceholder}
								class="w-full p-2.5 rounded-lg border border-gray-300 bg-white/50"
								disabled
							/>
							<input
								type="text"
								placeholder={theme.sections.orderForm.cityPlaceholder}
								class="w-full p-2.5 rounded-lg border border-gray-300 bg-white/50"
								disabled
							/>
							<input
								type="text"
								placeholder={theme.sections.orderForm.phonePlaceholder}
								class="w-full p-2.5 rounded-lg border border-gray-300 bg-white/50"
								disabled
							/>
						</div>

						<button
							class="w-full py-3 rounded-xl font-bold text-white text-sm shadow-md"
							style="background-color: {theme.colors.primary}"
						>
							{theme.sections.orderForm.submitText}
						</button>
					</div>

					<!-- Trust Badges Preview -->
					<div class="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
						{#if theme.sections.trustBadges.showCOD}
							<div class="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
								🚚 {theme.sections.trustBadges.codText}
							</div>
						{/if}
						{#if theme.sections.trustBadges.showFreeShipping}
							<div class="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
								📦 {theme.sections.trustBadges.freeShippingText}
							</div>
						{/if}
						{#if theme.sections.trustBadges.showWarranty}
							<div class="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
								🛡️ {theme.sections.trustBadges.warrantyText}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</main>
	</div>
</div>
