<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { validateProduct, validateSlug } from '$lib/utils/clientValidation';
	import { toasts } from '$lib/stores/toast';

	let { data } = $props();

	const initialProduct = structuredClone(data.product);

	// Migrate old 'src' key to 'image' for carousel slides in both draft and published objects
	if (initialProduct.published?.content?.carousel) {
		initialProduct.published.content.carousel = initialProduct.published.content.carousel.map((slide: any) => {
			if (slide.src && !slide.image) {
				slide.image = slide.src;
			}
			return slide;
		});
	}
	if (initialProduct.draft?.content?.carousel) {
		initialProduct.draft.content.carousel = initialProduct.draft.content.carousel.map((slide: any) => {
			if (slide.src && !slide.image) {
				slide.image = slide.src;
			}
			return slide;
		});
	}

	let product = $state(initialProduct);
	let templates = $state(data.templates);

	// Initialize edit state from draft if it exists, otherwise from published
	let editState = $state({
		...(structuredClone(initialProduct.draft || initialProduct.published)),
		tracking: structuredClone(initialProduct.meta.tracking),
		advanced: structuredClone(initialProduct.meta.advanced)
	});

	// Initialize missing arrays/fields for older products
	if (!editState.content.faq) editState.content.faq = [];
	if (!editState.content.carousel) editState.content.carousel = [];
	if (editState.content.footerText === undefined) editState.content.footerText = '';

	// Initialize killers content structure if not exists
	if (!editState.content.killers) editState.content.killers = {};
	if (!editState.content.killers.bullets) editState.content.killers.bullets = ['', '', ''];
	if (!editState.content.killers.featuredReview) editState.content.killers.featuredReview = { text: '', image: '', author: '' };
	if (!editState.content.killers.stories) editState.content.killers.stories = [];
	if (!editState.content.killers.gridReviews) editState.content.killers.gridReviews = [];
	if (!editState.content.killers.benefits) editState.content.killers.benefits = [];
	if (!editState.content.killers.usageSteps) editState.content.killers.usageSteps = ['', '', '', ''];
	if (!editState.content.killers.footerCta) editState.content.killers.footerCta = { text: '', image: '' };
	if (!editState.content.killers.guarantees) editState.content.killers.guarantees = [];

	let template = $state(product.template);
	let saving = $state(false);
	let activeTab = $state('general');
	let hasDraft = $state(!!product.draft);
	let dirty = $state(false);
	let initialized = false;

	// slug editing
	let slugValue = $state(product.slug);

	// Validation errors
	let validationErrors = $state<Record<string, string>>({});
	let shakeFields = $state<Record<string, boolean>>({});
	let shakeTabs = $state<Record<string, boolean>>({});

	function triggerShake(field: string) {
		const tabId = getTabForField(field);
		
		// Reset state
		shakeTabs[tabId] = false;
		shakeFields[field] = false;
		
		// Set to true after brief delay to trigger CSS keyframe animation
		setTimeout(() => {
			shakeTabs[tabId] = true;
			shakeFields[field] = true;
		}, 10);
		
		// Reset animation after 500ms so it can be re-triggered
		setTimeout(() => {
			shakeTabs[tabId] = false;
			shakeFields[field] = false;
		}, 510);
	}

	function isFieldShaking(field: string, index?: number): boolean {
		for (const key of Object.keys(shakeFields)) {
			if (!shakeFields[key]) continue;
			if (key.includes(field)) {
				if (index !== undefined) {
					const regex = new RegExp(`(\\.|\\b|\\[)${index}(\\.|\\b|\\])`);
					if (regex.test(key)) return true;
				} else {
					return true;
				}
			}
		}
		return false;
	}

	const tabs = $derived([
		{ id: 'general', label: 'عام' },
		{ id: 'pricing', label: 'الأسعار' },
		{ id: 'hero', label: 'الصورة الرئيسية' },
		{ id: 'gallery', label: 'المعرض' },
		...(template === 'killers' ? [{ id: 'killers', label: '🔥 إعدادات Killers' }] : []),
		{ id: 'offersPreview', label: 'معاينة العروض' },
		{ id: 'seo', label: 'SEO' },
		{ id: 'tracking', label: 'التتبع' },
		{ id: 'scripts', label: 'السكريبتات' },
		{ id: 'advanced', label: 'متقدم' }
	]);

	// Track unsaved changes
	$effect(() => {
		JSON.stringify(editState);
		template;
		slugValue;
		if (initialized) dirty = true;
		else initialized = true;
	});

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		if (tabParam && tabs.some(t => t.id === tabParam)) {
			activeTab = tabParam;
		}

		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (dirty) {
				e.preventDefault();
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	function handleTitleInput() {
		validateField();
	}

	function validateField() {
		const newErrors: Record<string, string> = {};

		const slugError = validateSlug(slugValue);
		if (slugError) newErrors.slug = slugError;

		validationErrors = newErrors;
	}

	// Carousel helpers
	// Carousel helpers
	if (!editState.content.carousel) {
		editState.content.carousel = editState.content.heroImage 
			? [{ image: editState.content.heroImage, alt: '' }] 
			: [];
	}

	// Migrate from old 'src' to new 'image'
	editState.content.carousel = editState.content.carousel.map((slide: any) => {
		if (slide.src && !slide.image) {
			slide.image = slide.src;
			delete slide.src;
		}
		if (!slide.badge) {
			slide.badge = null;
		}
		return slide;
	});

	function addCarouselImage() {
		editState.content.carousel = [
			...editState.content.carousel,
			{ image: '', alt: '', title: '', bgGradient: '', badge: null }
		];
	}

	function removeCarouselImage(index: number) {
		const removed = editState.content.carousel[index];
		editState.content.carousel = editState.content.carousel.filter((_: any, i: number) => i !== index);
		
		if (removed.image && removed.image === editState.content.heroImage) {
			editState.content.heroImage = editState.content.carousel[0]?.image || '';
		}
	}

	function moveCarouselImage(index: number, direction: 'up' | 'down') {
		const arr = [...editState.content.carousel];
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= arr.length) return;
		[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
		editState.content.carousel = arr;
	}

	function setCarouselMain(index: number) {
		const selected = editState.content.carousel[index];
		if (selected && selected.image) {
			editState.content.heroImage = selected.image;
		}
	}

	// Gallery helpers
	function addGalleryImage() {
		editState.content.gallery = [
			...editState.content.gallery,
			{ src: '', alt: '', showInHero: false }
		];
	}

	function removeGalleryImage(index: number) {
		editState.content.gallery = editState.content.gallery.filter((_: any, i: number) => i !== index);
	}

	function moveGalleryImage(index: number, direction: 'up' | 'down') {
		const gallery = [...editState.content.gallery];
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= gallery.length) return;
		[gallery[index], gallery[newIndex]] = [gallery[newIndex], gallery[index]];
		editState.content.gallery = gallery;
	}


	// Offer helpers
	function getNextOfferId(): number {
		const ids = editState.pricing.offers.map((o: any) => o.id);
		if (ids.length === 0) return 1;
		return Math.max(...ids) + 1;
	}

	function addOffer() {
		const newId = getNextOfferId();
		editState.pricing.offers = [
			...editState.pricing.offers,
			{
				id: newId,
				title: '',
				subtitle: '',
				price: 1,
				originalPrice: 1,
				quantity: 1,
				badge: null,
				isPopular: false
			}
		];
	}

	function removeOffer(index: number) {
		editState.pricing.offers = editState.pricing.offers.filter((_: any, i: number) => i !== index);
	}

	function formatPrice(price: number): string {
		const symbol = editState.pricing.currency === 'MAD' ? 'DH' : editState.pricing.currency;
		return `${price} ${symbol}`;
	}

	function getTabForField(field: string): string {
		// Normalize: strip common prefixes from server validation
		const normalized = field
			.replace(/^published\./, '')
			.replace(/^content\./, '')
			.replace(/^pricing\./, '')
			.replace(/^order\./, '');

		if (normalized.startsWith('killers') || normalized.startsWith('content.killers')) return 'killers';
		if (normalized === 'slug' || normalized === 'title' || normalized === 'subtitle' || normalized === 'rating' || normalized === 'reviewCount') return 'general';
		if (normalized.startsWith('gallery') || normalized.startsWith('content.gallery')) return 'gallery';
		if (normalized.startsWith('offers') || normalized.startsWith('pricing.offers')) return 'pricing';
		if (normalized === 'heroImage' || normalized.startsWith('carousel') || normalized.startsWith('content.heroImage') || normalized.startsWith('content.carousel')) return 'hero';
		if (normalized === 'metaTitle' || normalized === 'metaDescription' || normalized === 'ogImage' || normalized.startsWith('seo.')) return 'seo';
		if (normalized === 'sku' || normalized === 'googleSheetsUrl' || normalized === 'whatsappNumber' || normalized.startsWith('order.')) return 'general';
		// Fallback: check original field
		if (field.startsWith('killers') || field.startsWith('content.killers')) return 'killers';
		if (field.startsWith('seo.')) return 'seo';
		if (field.startsWith('content.gallery')) return 'gallery';
		if (field.startsWith('content.carousel') || field.includes('heroImage')) return 'hero';
		if (field.includes('offer') || field.startsWith('pricing.')) return 'pricing';
		return 'general';
	}


	function sanitizeProductData() {
		if (editState.content.heroImage) {
			editState.content.heroImage = editState.content.heroImage.trim();
		}
		if (editState.content.carousel) {
			editState.content.carousel = editState.content.carousel.map((slide: any) => {
				if (slide.image) slide.image = slide.image.trim();
				if (slide.title) slide.title = slide.title.trim();
				return slide;
			});
		}
		if (editState.content.gallery) {
			editState.content.gallery = editState.content.gallery.map((img: any) => {
				if (img.src) img.src = img.src.trim();
				if (img.alt) img.alt = img.alt.trim();
				return img;
			});
		}
		if (editState.content.title) editState.content.title = editState.content.title.trim();
		if (editState.content.subtitle) editState.content.subtitle = editState.content.subtitle.trim();
		if (editState.order.sku) editState.order.sku = editState.order.sku.trim();
		if (editState.order.googleSheetsUrl) editState.order.googleSheetsUrl = editState.order.googleSheetsUrl.trim();
		if (editState.order.whatsappNumber) editState.order.whatsappNumber = editState.order.whatsappNumber.trim();
		if (editState.seo.metaTitle) editState.seo.metaTitle = editState.seo.metaTitle.trim();
		if (editState.seo.metaDescription) editState.seo.metaDescription = editState.seo.metaDescription.trim();

		if (editState.content.killers) {
			const k = editState.content.killers;
			if (k.bullets) k.bullets = k.bullets.map((b: string) => b.trim());
			if (k.featuredReview) {
				if (k.featuredReview.text) k.featuredReview.text = k.featuredReview.text.trim();
				if (k.featuredReview.image) k.featuredReview.image = k.featuredReview.image.trim();
				if (k.featuredReview.author) k.featuredReview.author = k.featuredReview.author.trim();
			}
			if (k.stories) {
				k.stories = k.stories.map((s: any) => ({
					name: s.name ? s.name.trim() : '',
					text: s.text ? s.text.trim() : ''
				}));
			}
			if (k.gridReviews) {
				k.gridReviews = k.gridReviews.map((r: any) => ({
					name: r.name ? r.name.trim() : '',
					text: r.text ? r.text.trim() : '',
					image: r.image ? r.image.trim() : ''
				}));
			}
			if (k.benefits) {
				k.benefits = k.benefits.map((b: any) => ({
					title: b.title ? b.title.trim() : '',
					text: b.text ? b.text.trim() : ''
				}));
			}
			if (k.usageSteps) k.usageSteps = k.usageSteps.map((s: string) => s.trim());
			if (k.footerCta) {
				if (k.footerCta.text) k.footerCta.text = k.footerCta.text.trim();
				if (k.footerCta.image) k.footerCta.image = k.footerCta.image.trim();
			}
			if (k.guarantees) {
				k.guarantees = k.guarantees.map((g: any) => ({
					title: g.title ? g.title.trim() : '',
					text: g.text ? g.text.trim() : '',
					image: g.image ? g.image.trim() : ''
				}));
			}
		}
	}

	async function handleSave() {
		sanitizeProductData();
		validateField();

		// Run full product validation
		const productErrors = validateProduct({
			slug: slugValue,
			template,
			published: editState
		});

		if (productErrors.length > 0 || Object.keys(validationErrors).length > 0) {
			let firstError;
			if (productErrors.length > 0) {
				firstError = productErrors[0];
			} else {
				const field = Object.keys(validationErrors)[0];
				firstError = { field, message: validationErrors[field] };
			}
			
			const tabId = getTabForField(firstError.field);
			const tabName = tabs.find(t => t.id === tabId)?.label || 'عام';
			
			activeTab = tabId;
			triggerShake(firstError.field);
			toasts.error(`خطأ في قسم (${tabName}): ${firstError.message}`);
			return;
		}

		saving = true;
		try {
			const oldSlug = product.slug;
			const updatedProduct = {
				...product,
				slug: slugValue,
				template,
				draft: editState,
				meta: {
					...product.meta,
					tracking: editState.tracking,
					advanced: editState.advanced
				},
				updatedAt: new Date().toISOString()
			};

			const response = await fetch(`/api/products/${oldSlug}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedProduct)
			});

			if (response.ok) {
				product = updatedProduct;
				hasDraft = true;
				dirty = false;
				toasts.success('تم الحفظ بنجاح');
				if (slugValue !== oldSlug) {
					goto(`/admin/products/${slugValue}/edit`, { replaceState: true });
				}
			} else {
				const errorData = await response.json();
				if (errorData.details && errorData.details.length > 0) {
					// Navigate to the first error's tab and show specific message
					const firstDetail = errorData.details[0];
					const tabId = getTabForField(firstDetail.field);
					const tabName = tabs.find(t => t.id === tabId)?.label || 'عام';
					activeTab = tabId;
					triggerShake(firstDetail.field);
					const uniqueMessages = [...new Set<string>(errorData.details.map((e: any) => e.message as string))];
					toasts.error(`خطأ في قسم (${tabName}): ${uniqueMessages[0]}`);
				} else if (errorData.error) {
					toasts.error(`فشل في الحفظ: ${errorData.error}`);
				} else {
					toasts.error('فشل في الحفظ. يرجى المحاولة مرة أخرى.');
				}
			}
		} catch {
			toasts.error('حدث خطأ أثناء الحفظ. يرجى التحقق من الاتصال.');
		} finally {
			saving = false;
		}
	}

	async function handlePublish() {
		sanitizeProductData();
		if (dirty) {
			await handleSave();
			if (dirty) return;
		}

		const changesText = hasDraft ? 'التغييرات الحالية ستتم نشرها' : 'المنتج سيتم نشره';
		if (!confirm(`هل أنت متأكد من نشر هذا المنتج؟\n\n${changesText}\n\nسيكون متاحاً للمستخدمين فوراً.`)) return;

		validateField();

		const productErrors = validateProduct(
			{
				slug: slugValue,
				template,
				published: editState
			},
			true
		);

		if (productErrors.length > 0 || Object.keys(validationErrors).length > 0) {
			let firstError;
			if (productErrors.length > 0) {
				firstError = productErrors[0];
			} else {
				const field = Object.keys(validationErrors)[0];
				firstError = { field, message: validationErrors[field] };
			}
			
			const tabId = getTabForField(firstError.field);
			const tabName = tabs.find(t => t.id === tabId)?.label || 'عام';
			
			activeTab = tabId;
			triggerShake(firstError.field);
			toasts.error(`خطأ في قسم (${tabName}): ${firstError.message}`);
			return;
		}

		saving = true;
		try {
			const oldSlug = product.slug;
			const response = await fetch(`/api/products/${product.slug}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'publish' })
			});

			if (response.ok) {
				const updatedPublished = JSON.parse(JSON.stringify(editState));
				const updatedTracking = JSON.parse(JSON.stringify(product.meta.tracking));
				const updatedAdvanced = JSON.parse(JSON.stringify(product.meta.advanced));

				product = {
					...product,
					slug: slugValue,
					template,
					published: updatedPublished,
					draft: null,
					status: 'published',
					meta: {
						...product.meta,
						tracking: updatedTracking,
						advanced: updatedAdvanced
					},
					updatedAt: new Date().toISOString()
				};
				editState = {
					...updatedPublished,
					tracking: updatedTracking,
					advanced: updatedAdvanced
				};
				hasDraft = false;
				dirty = false;
				toasts.success('تم نشر المنتج بنجاح');
				if (slugValue !== oldSlug) {
					goto(`/admin/products/${slugValue}/edit`, { replaceState: true });
				}
			} else {
				const errorData = await response.json();
				if (errorData.details && errorData.details.length > 0) {
					// Navigate to the first error's tab and show specific message
					const firstDetail = errorData.details[0];
					const tabId = getTabForField(firstDetail.field);
					const tabName = tabs.find(t => t.id === tabId)?.label || 'عام';
					activeTab = tabId;
					triggerShake(firstDetail.field);
					const uniqueMessages = [...new Set<string>(errorData.details.map((e: any) => e.message as string))];
					toasts.error(`خطأ في قسم (${tabName}): ${uniqueMessages[0]}`);
				} else if (errorData.error) {
					toasts.error(`فشل في النشر: ${errorData.error}`);
				} else {
					toasts.error('فشل في النشر. يرجى المحاولة مرة أخرى.');
				}
			}
		} catch {
			toasts.error('حدث خطأ أثناء النشر. يرجى التحقق من الاتصال.');
		} finally {
			saving = false;
		}
	}

	async function handleUnpublish() {
		if (!confirm(`هل تريد إلغاء نشر "${editState.content.title}"؟\n\nسيتم إخفاء المنتج من الموقع لكنه سيظل متاحاً للتعديل.`)) return;

		saving = true;
		try {
			const response = await fetch(`/api/products/${product.slug}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'unpublish' })
			});

			if (response.ok) {
				const updatedPublished = JSON.parse(JSON.stringify(product.published));
				const updatedTracking = JSON.parse(JSON.stringify(product.meta.tracking));
				const updatedAdvanced = JSON.parse(JSON.stringify(product.meta.advanced));

				product = {
					...product,
					status: 'draft',
					draft: updatedPublished,
					updatedAt: new Date().toISOString()
				};
				editState = {
					...updatedPublished,
					tracking: updatedTracking,
					advanced: updatedAdvanced
				};
				hasDraft = true;
				dirty = false;
				toasts.success('تم إلغاء النشر بنجاح');
			} else {
				toasts.error('فشل في إلغاء النشر');
			}
		} catch {
			toasts.error('حدث خطأ أثناء إلغاء النشر');
		} finally {
			saving = false;
		}
	}

	function handlePreview() {
		const url = `/admin/products/${product.slug}/preview`;
		window.open(url, '_blank');
		toasts.info('تم فتح المعاينة في نافذة جديدة');
	}
</script>

<svelte:head>
	<title>تعديل {editState.content.title} - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div class="flex items-center gap-4">
			<a href="/admin/products" class="text-gray-600 hover:text-gray-900">
				← رجوع
			</a>
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{editState.content.title}</h1>
				{#if hasDraft}
					<p class="text-sm text-yellow-600">هناك تغييرات غير منشورة</p>
				{/if}
			</div>
		</div>
		<div class="flex gap-3">
			<button
				onclick={handlePreview}
				disabled={saving}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				معاينة
			</button>
			{#if product.status === 'published'}
				<button
					onclick={handleUnpublish}
					disabled={saving}
					class="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving ? '...' : 'إلغاء النشر'}
				</button>
			{/if}
			<button
				onclick={handleSave}
				disabled={saving}
				class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{saving ? 'جاري الحفظ...' : 'حفظ'}
			</button>
			<button
				onclick={handlePublish}
				disabled={saving}
				class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{saving ? '...' : 'نشر'}
			</button>
		</div>
	</div>

	<div class="bg-white shadow-sm rounded-lg border">
		<div class="border-b border-gray-200">
			<nav class="flex -mb-px overflow-x-auto">
				{#each tabs as tab}
					<button
						onclick={() => (activeTab = tab.id)}
						class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-300 {shakeTabs[tab.id] ? 'animate-shake border-red-500 text-red-600 bg-red-50/50 ring-2 ring-red-500/20 rounded' : ''} {activeTab === tab.id && !shakeTabs[tab.id] ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>

		<div class="p-6">
			{#if activeTab === 'general'}
				<div class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
						<input
							type="text"
							bind:value={editState.content.title}
							oninput={handleTitleInput}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">الرابط (Slug)</label>
						<div class="flex items-center">
							<span class="text-sm text-gray-500 mr-1">/</span>
							<input
								type="text"
								bind:value={slugValue}
								readonly
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
								placeholder="alpha-vital"
							/>
						</div>
						{#if validationErrors.slug}
							<p class="text-sm text-red-600 mt-1">{validationErrors.slug}</p>
						{/if}
						<p class="text-xs text-gray-500 mt-1">الرابط ثابت بعد الإنشاء ولا يمكن تغييره.</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي</label>
						<input
							type="text"
							bind:value={editState.content.subtitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">التقييم</label>
							<input
								type="number"
								min="1"
								max="5"
								step="0.1"
								bind:value={editState.content.rating}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">عدد التقييمات</label>
							<input
								type="number"
								bind:value={editState.content.reviewCount}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">القالب</label>
						<select
							bind:value={template}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						>
							{#each templates as tmpl}
								<option value={tmpl.id}>{tmpl.name}</option>
							{/each}
						</select>
						{#if templates.find((t: any) => t.id === template)}
							<p class="text-xs text-gray-500 mt-1">{templates.find((t: any) => t.id === template)?.description}</p>
						{/if}
					</div>

					<div class="border-t pt-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">إعدادات الطلب</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
								<input
									type="text"
									bind:value={editState.order.sku}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="alpha-vital-sleep"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">رابط Google Sheets</label>
								<input
									type="url"
									bind:value={editState.order.googleSheetsUrl}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="https://script.google.com/macros/s/.../exec"
								/>
							</div>
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									bind:checked={editState.order.phoneConfirmation}
									id="phoneConfirmation"
									class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
								/>
								<label for="phoneConfirmation" class="text-sm text-gray-700">تأكيد الهاتف</label>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">رقم WhatsApp</label>
								<input
									type="text"
									bind:value={editState.order.whatsappNumber}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="2126XXXXXXXX"
								/>
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'pricing'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-gray-900">العروض</h3>
						<button
							onclick={addOffer}
							class="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
						>
							+ إضافة عرض
						</button>
					</div>
					{#each editState.pricing.offers as offer, i (offer.id)}
						<div class="p-4 border rounded-lg space-y-3">
							<div class="flex items-center justify-between">
								<h4 class="font-medium">عرض {i + 1} (ID: {offer.id})</h4>
								<button
									onclick={() => removeOffer(i)}
									class="text-red-500 hover:text-red-700 text-sm"
								>
									حذف
								</button>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm text-gray-600 mb-1">العنوان</label>
									<input
										type="text"
										bind:value={offer.title}
										class="w-full px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label class="block text-sm text-gray-600 mb-1">العنوان الفرعي</label>
									<input
										type="text"
										bind:value={offer.subtitle}
										class="w-full px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label class="block text-sm text-gray-600 mb-1">السعر</label>
									<input
										type="number"
										bind:value={offer.price}
										class="w-full px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label class="block text-sm text-gray-600 mb-1">السعر الأصلي</label>
									<input
										type="number"
										bind:value={offer.originalPrice}
										class="w-full px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label class="block text-sm text-gray-600 mb-1">الكمية</label>
									<input
										type="number"
										bind:value={offer.quantity}
										class="w-full px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label class="block text-sm text-gray-600 mb-1">الشارة</label>
									<input
										type="text"
										bind:value={offer.badge}
										class="w-full px-3 py-2 border rounded-md text-sm"
										placeholder="الأكثر طلباً 🔥"
									/>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									bind:checked={offer.isPopular}
									id="popular-{offer.id}"
									class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
								/>
								<label for="popular-{offer.id}" class="text-sm text-gray-700">الأكثر شعبية</label>
							</div>
						</div>
					{/each}
					{#if editState.pricing.offers.length === 0}
						<p class="text-center text-gray-500 py-8">لا توجد عروض. اضغط "إضافة عرض" لإضافة عرض جديد.</p>
					{/if}
				</div>

			{:else if activeTab === 'hero'}
				<div class="space-y-6" dir="rtl">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-bold text-gray-900">إدارة الكاروسيل والصورة الرئيسية</h3>
							<p class="text-xs text-gray-500 mt-0.5">
								أضف صور الكاروسيل هنا. يمكنك تعيين إحداها كصورة رئيسية (Main Hero Image).
							</p>
						</div>
						<button
							onclick={addCarouselImage}
							class="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 shadow-sm"
						>
							+ إضافة صورة
						</button>
					</div>

					{#if editState.content.carousel.length === 0}
						<div class="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
							<p class="text-gray-500 text-sm">لا توجد صور في الكاروسيل.</p>
							<button onclick={addCarouselImage} class="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium">اضغط هنا لإضافة صورتك الأولى</button>
						</div>
					{:else}
						<div class="space-y-4">
							{#each editState.content.carousel as slide, i}
								<div class="p-4 border rounded-xl space-y-4 transition-all duration-300 {slide.image === editState.content.heroImage ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-400' : 'border-gray-200 bg-white hover:border-emerald-200'}">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">صورة {i + 1}</span>
											{#if slide.image === editState.content.heroImage}
												<span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
													⭐ الصورة الرئيسية
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={() => moveCarouselImage(i, 'up')}
												disabled={i === 0}
												class="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1"
												title="تحريك لأعلى"
											>
												↑
											</button>
											<button
												onclick={() => moveCarouselImage(i, 'down')}
												disabled={i === editState.content.carousel.length - 1}
												class="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1"
												title="تحريك لأسفل"
											>
												↓
											</button>
											<div class="w-px h-4 bg-gray-300 mx-1"></div>
											<button
												onclick={() => removeCarouselImage(i)}
												class="text-red-500 hover:text-red-700 text-sm font-medium px-2"
											>
												حذف
											</button>
										</div>
									</div>

									<div class="flex flex-col sm:flex-row gap-4">
										<div class="shrink-0 w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
											{#if slide.image}
												<img src={slide.image} alt="Slide preview" class="w-full h-full object-cover" />
											{:else}
												<span class="text-gray-400 text-2xl">🖼️</span>
											{/if}
										</div>
										<div class="flex-1 space-y-3">
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">رابط الصورة (URL)</label>
												<input
													type="text"
													value={slide.image}
													oninput={(e) => slide.image = e.currentTarget.value.trim()}
													class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono {isFieldShaking('carousel', i) ? 'animate-shake border-red-500 bg-red-50 ring-1 ring-red-500 text-red-900' : (slide.image && !slide.image.startsWith('http://') && !slide.image.startsWith('https://') ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' : 'border-gray-300 focus:ring-emerald-500')}"
													placeholder="https://..."
												/>
												{#if isFieldShaking('carousel', i)}
													<div class="mt-1.5 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-md border border-red-200 animate-shake">
														⚠️ هذا الرابط غير صالح (يجب البدء بـ http أو https وبدون مسافات)
													</div>
												{:else if slide.image && !slide.image.startsWith('http://') && !slide.image.startsWith('https://')}
													<div class="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-md border border-red-200">
														<span>⚠️ الرابط غير صالح: يجب أن يبدأ بـ http:// أو https://</span>
														<button
															type="button"
															onclick={() => slide.image = 'https://' + slide.image.replace(/^(https?:\/\/)?/, '')}
															class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 font-sans transition-colors cursor-pointer"
														>
															إصلاح تلقائي (إضافة https://)
														</button>
													</div>
												{/if}
											</div>
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">العنوان (Title)</label>
												<input
													type="text"
													bind:value={slide.title}
													class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="مثال: SLIDE 1 — Hero / main product shot"
												/>
											</div>
											<div class="grid grid-cols-2 gap-3">
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">نص الشارة (Badge Text)</label>
													<input
														type="text"
														value={slide.badge?.text || ''}
														oninput={(e) => {
															if (!slide.badge) slide.badge = { text: '', position: 'top-right' };
															slide.badge.text = e.currentTarget.value;
															if (!e.currentTarget.value) slide.badge = null;
														}}
														class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
														placeholder="مثال: 100% NATURAL"
													/>
												</div>
												{#if slide.badge}
													<div>
														<label class="block text-xs font-semibold text-gray-700 mb-1">موضع الشارة</label>
														<select
															bind:value={slide.badge.position}
															class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
														>
															<option value="top-right">أعلى اليمين</option>
															<option value="top-left">أعلى اليسار</option>
															<option value="bottom-right">أسفل اليمين</option>
															<option value="bottom-left">أسفل اليسار</option>
														</select>
													</div>
												{/if}
											</div>
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">خلفية الشريحة (Background Gradient)</label>
												<input
													type="text"
													bind:value={slide.bgGradient}
													class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
													placeholder="linear-gradient(135deg, #7c6f5f, #a89684)"
												/>
											</div>
										</div>
									</div>

									<div class="pt-2 border-t flex justify-end">
										{#if slide.image && slide.image !== editState.content.heroImage}
											<button
												onclick={() => setCarouselMain(i)}
												class="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
											>
												تعيين كصورة رئيسية ⭐
											</button>
										{:else if slide.image === editState.content.heroImage}
											<div class="text-xs font-bold text-gray-500 px-3 py-1.5">
												هذه هي الصورة الرئيسية المحددة
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				<!-- ─────────────────────────────── -->

			{:else if activeTab === 'gallery'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-gray-900">معرض الصور</h3>
						<button
							onclick={addGalleryImage}
							class="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
						>
							+ إضافة صورة
						</button>
					</div>
					{#if editState.content.gallery.length === 0}
						<p class="text-center text-gray-500 py-8">لا توجد صور في المعرض. اضغط "إضافة صورة" لإضافة صورة جديدة.</p>
					{:else}
						<div class="space-y-4">
							{#each editState.content.gallery as image, i (image.src ? `${image.src}-${i}` : `gallery-${i}`)}
								<div class="p-4 border rounded-lg space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-gray-700">صورة {i + 1}</span>
										<div class="flex items-center gap-2">
											<button
												onclick={() => moveGalleryImage(i, 'up')}
												disabled={i === 0}
												class="text-gray-500 hover:text-gray-700 disabled:opacity-30 text-sm"
												title="تحريك لأعلى"
											>
												↑
											</button>
											<button
												onclick={() => moveGalleryImage(i, 'down')}
												disabled={i === editState.content.gallery.length - 1}
												class="text-gray-500 hover:text-gray-700 disabled:opacity-30 text-sm"
												title="تحريك لأسفل"
											>
												↓
											</button>
											<button
												onclick={() => removeGalleryImage(i)}
												class="text-red-500 hover:text-red-700 text-sm"
											>
												حذف
											</button>
										</div>
									</div>
									<div>
										<label class="block text-sm text-gray-600 mb-1">رابط الصورة</label>
										<input
											type="text"
											value={image.src}
											oninput={(e) => image.src = e.currentTarget.value.trim()}
											class="w-full px-3 py-2 border rounded-md text-sm"
											placeholder="https://..."
										/>
									</div>
									<div>
										<label class="block text-sm text-gray-600 mb-1">النص البديل (Alt Text)</label>
										<input
											type="text"
											bind:value={image.alt}
											class="w-full px-3 py-2 border rounded-md text-sm"
											placeholder="وصف الصورة بالعربية"
										/>
									</div>

									{#if image.src}
										<img
											src={image.src}
											alt={image.alt || 'Preview'}
											class="h-32 object-cover rounded-lg"
										/>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

			{:else if activeTab === 'offersPreview'}
				<div class="space-y-4">
					<h3 class="text-lg font-medium text-gray-900">معاينة العروض</h3>
					<p class="text-sm text-gray-500">معاينة مرئية لكيفية ظهور العروض في استمارة الطلب.</p>
					{#if editState.pricing.offers.length === 0}
						<p class="text-center text-gray-500 py-8">لا توجد عروض للمعاينة. أضف عروضاً من تبويب الأسعار.</p>
					{:else}
						<div class="border border-border/60 shadow-lg overflow-hidden rounded-2xl bg-card max-w-lg" dir="rtl">
							<div class="h-1 bg-emerald-500"></div>
							<div class="text-center pb-4 pt-6 select-none px-6">
								<h2 class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 tracking-wide pb-1.5" style="font-family: 'El Messiri', sans-serif;">
									إستمارة تأكيد الطلب
								</h2>
								<p class="text-emerald-800/90 text-sm font-bold mt-2 px-2 leading-relaxed" style="font-family: 'El Messiri', sans-serif;">
									المرجو إدخال معلوماتكم بدقة لتأكيد الطلب والتوصيل مجاني
								</p>
							</div>

							<div class="px-4 pb-6">
								<div class="space-y-4">
									<div class="space-y-3 pb-3 border-b border-gray-100" dir="rtl">
										<span class="block text-right font-extrabold text-sm text-black mb-1 select-none">
											اختر العرض المناسب لك:
										</span>

										<div class="grid grid-cols-1 gap-2.5">
											{#each editState.pricing.offers as offer}
												<div class="relative flex items-center justify-between p-3.5 border rounded-xl border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30">
													<div class="flex items-center gap-3">
														<div class="w-5 h-5 rounded-full border flex items-center justify-center border-gray-300 bg-white">
														</div>

														<div class="text-right">
															<span class="block text-sm font-extrabold text-black">{offer.title || 'عنوان العرض'}</span>
															<span class="block text-[11px] text-muted-foreground font-semibold mt-0.5">{offer.subtitle || 'وصف العرض'}</span>
														</div>
													</div>

													<div class="text-left flex flex-col items-end shrink-0">
														{#if offer.badge}
															<span class="text-[9px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 {offer.isPopular ? 'animate-pulse' : ''}">
																{offer.badge}
															</span>
														{/if}
														<div class="flex items-center gap-1.5 justify-end">
															<span class="text-xs text-muted-foreground line-through font-semibold">{formatPrice(offer.originalPrice)}</span>
															<span class="font-black transition-all duration-300 {offer.isPopular ? 'text-orange-500 text-[18px] scale-105' : 'text-emerald-600 text-base'}">{formatPrice(offer.price)}</span>
														</div>
														<span class="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5 border border-emerald-100">
															+ توصيل مجاني سريع
														</span>
													</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

			{:else if activeTab === 'seo'}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">عنوان SEO</label>
						<input
							type="text"
							bind:value={editState.seo.metaTitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
						<p class="text-xs text-gray-500 mt-1">{editState.seo.metaTitle.length}/60 حرف</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">وصف SEO</label>
						<textarea
							bind:value={editState.seo.metaDescription}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						></textarea>
						<p class="text-xs text-gray-500 mt-1">{editState.seo.metaDescription.length}/160 حرف</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">صورة OG (Open Graph)</label>
						<input
							type="url"
							bind:value={editState.seo.ogImage}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="https://..."
						/>
						{#if editState.seo.ogImage}
							<img
								src={editState.seo.ogImage}
								alt="OG Preview"
								class="mt-4 h-48 object-cover rounded-lg border"
							/>
						{:else if editState.content.heroImage}
							<div class="mt-4">
								<p class="text-xs text-gray-500 mb-1">معاينة الصورة الافتراضية (Hero Image):</p>
								<img
									src={editState.content.heroImage}
									alt="Fallback OG"
									class="h-48 object-cover rounded-lg border opacity-60"
								/>
							</div>
						{/if}
					</div>

					<div class="border-t pt-4 mt-4">
						<h4 class="text-sm font-medium text-gray-700 mb-3">معاينة مباشرة</h4>
						<div class="border rounded-lg p-4 bg-gray-50">
							<div class="text-xs text-gray-500 mb-1">محركات البحث</div>
							<div class="text-blue-700 text-lg font-medium hover:underline cursor-pointer">
								{editState.seo.metaTitle || editState.content.title || 'عنوان المنتج'}
							</div>
							<div class="text-green-700 text-xs mb-1">https://valoriia.ma/{slugValue}</div>
							<div class="text-gray-600 text-sm">
								{editState.seo.metaDescription || editState.content.subtitle || 'وصف المنتج'}
							</div>
						</div>
						<div class="border rounded-lg p-4 bg-gray-50 mt-3">
							<div class="text-xs text-gray-500 mb-1">مشاركة على وسائل التواصل</div>
							<div class="border rounded-lg overflow-hidden bg-white">
								{#if editState.seo.ogImage || editState.content.heroImage}
									<img
										src={editState.seo.ogImage || editState.content.heroImage}
										alt="OG Preview"
										class="w-full h-40 object-cover"
									/>
								{/if}
								<div class="p-3">
									<div class="text-xs text-gray-400">valoriia.ma</div>
									<div class="text-sm font-medium text-gray-900">
										{editState.seo.metaTitle || editState.content.title || 'عنوان المنتج'}
									</div>
									<div class="text-xs text-gray-500 mt-1">
										{editState.seo.metaDescription || editState.content.subtitle || 'وصف المنتج'}
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={editState.seo.noindex}
							id="noindex"
							class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<label for="noindex" class="text-sm text-gray-700">إخفاء من محركات البحث</label>
					</div>
				</div>

			{:else if activeTab === 'killers'}
				<div class="space-y-8" dir="rtl">
					<!-- Bullets Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<h3 class="text-base font-bold text-gray-900 border-b pb-2">🎯 النقاط الوصفية المميزة (Bullets)</h3>
						<p class="text-xs text-gray-500">أضف حتى 10 نقاط مميزة تظهر بجانب/أسفل المنتج الرئيسي.</p>
						<div class="space-y-2">
							{#each editState.content.killers.bullets as _, idx}
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-gray-500 w-6 text-center">{idx + 1}</span>
									<input
										type="text"
										bind:value={editState.content.killers.bullets[idx]}
										class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="اكتب نقطة وصفية هنا..."
									/>
									<button
										type="button"
										onclick={() => editState.content.killers.bullets = editState.content.killers.bullets.filter((_, i) => i !== idx)}
										class="text-red-500 hover:text-red-700 text-xs px-2"
									>
										حذف
									</button>
								</div>
							{/each}
						</div>
						<button
							type="button"
							onclick={() => editState.content.killers.bullets = [...editState.content.killers.bullets, '']}
							class="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
						>
							+ إضافة نقطة جديدة
						</button>
					</div>

					<!-- Featured Review Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<h3 class="text-base font-bold text-gray-900 border-b pb-2">⭐ التقييم الرئيسي المميز (Featured Review)</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-3">
								<div>
									<label class="block text-xs font-semibold text-gray-700 mb-1">اسم الكاتب</label>
									<input
										type="text"
										bind:value={editState.content.killers.featuredReview.author}
										class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="مثال: فهد، الرياض"
									/>
								</div>
								<div>
									<label class="block text-xs font-semibold text-gray-700 mb-1">نص التقييم</label>
									<textarea
										bind:value={editState.content.killers.featuredReview.text}
										rows="3"
										class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="نص التجربة أو التقييم..."
									></textarea>
								</div>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-700 mb-1">رابط صورة التقييم</label>
								<input
									type="text"
									bind:value={editState.content.killers.featuredReview.image}
									class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
									placeholder="https://... أو /images/killers/..."
								/>
								{#if editState.content.killers.featuredReview.image}
									<div class="mt-2 w-24 h-24 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
										<img src={editState.content.killers.featuredReview.image} alt="Preview" class="w-full h-full object-cover" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Customer Stories Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<div class="flex items-center justify-between border-b pb-2">
							<h3 class="text-base font-bold text-gray-900">👥 قصص نجاح العملاء (Customer Stories)</h3>
							<button
								type="button"
								onclick={() => editState.content.killers.stories = [...editState.content.killers.stories, { name: '', text: '' }]}
								class="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
							>
								+ إضافة قصة
							</button>
						</div>
						{#if editState.content.killers.stories.length === 0}
							<p class="text-center text-xs text-gray-500 py-4">لا توجد قصص عملاء حالياً.</p>
						{:else}
							<div class="space-y-4">
								{#each editState.content.killers.stories as story, idx}
									<div class="p-4 border border-gray-200 bg-white rounded-lg space-y-3">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-gray-600">قصة {idx + 1}</span>
											<button
												type="button"
												onclick={() => editState.content.killers.stories = editState.content.killers.stories.filter((_, i) => i !== idx)}
												class="text-red-500 hover:text-red-700 text-xs"
											>
												حذف
											</button>
										</div>
										<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
											<div class="md:col-span-1">
												<label class="block text-xs font-semibold text-gray-700 mb-1">الاسم والمدينة</label>
												<input
													type="text"
													bind:value={story.name}
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="عبدالله، جدة"
												/>
											</div>
											<div class="md:col-span-3">
												<label class="block text-xs font-semibold text-gray-700 mb-1">القصة/التجربة</label>
												<textarea
													bind:value={story.text}
													rows="2"
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="اكتب تفاصيل التجربة هنا..."
												></textarea>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Grid Reviews Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<div class="flex items-center justify-between border-b pb-2">
							<h3 class="text-base font-bold text-gray-900">💬 تقييمات إضافية بالشبكة (Grid Reviews)</h3>
							<button
								type="button"
								onclick={() => editState.content.killers.gridReviews = [...editState.content.killers.gridReviews, { name: '', text: '', image: '' }]}
								class="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
							>
								+ إضافة تقييم للشبكة
							</button>
						</div>
						{#if editState.content.killers.gridReviews.length === 0}
							<p class="text-center text-xs text-gray-500 py-4">لا توجد تقييمات إضافية حالياً.</p>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each editState.content.killers.gridReviews as item, idx}
									<div class="p-4 border border-gray-200 bg-white rounded-lg space-y-3">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-gray-600">تقييم {idx + 1}</span>
											<button
												type="button"
												onclick={() => editState.content.killers.gridReviews = editState.content.killers.gridReviews.filter((_, i) => i !== idx)}
												class="text-red-500 hover:text-red-700 text-xs"
											>
												حذف
											</button>
										</div>
										<div class="space-y-2">
											<div class="grid grid-cols-2 gap-2">
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">الاسم والمدينة</label>
													<input
														type="text"
														bind:value={item.name}
														class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
														placeholder="نواف، مكة"
													/>
												</div>
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">رابط صورة التقييم</label>
													<input
														type="text"
														bind:value={item.image}
														class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
														placeholder="/images/killers/shipico.png"
													/>
												</div>
											</div>
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">المحتوى</label>
												<textarea
													bind:value={item.text}
													rows="2"
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="اكتب التقييم..."
												></textarea>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Benefits Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<div class="flex items-center justify-between border-b pb-2">
							<h3 class="text-base font-bold text-gray-900">✨ ميزات وفوائد المنتج (Benefits)</h3>
							<button
								type="button"
								onclick={() => editState.content.killers.benefits = [...editState.content.killers.benefits, { title: '', text: '' }]}
								class="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
							>
								+ إضافة ميزة
							</button>
						</div>
						{#if editState.content.killers.benefits.length === 0}
							<p class="text-center text-xs text-gray-500 py-4">لا توجد ميزات حالياً.</p>
						{:else}
							<div class="space-y-4">
								{#each editState.content.killers.benefits as benefit, idx}
									<div class="p-4 border border-gray-200 bg-white rounded-lg space-y-3">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-gray-600">ميزة {idx + 1}</span>
											<button
												type="button"
												onclick={() => editState.content.killers.benefits = editState.content.killers.benefits.filter((_, i) => i !== idx)}
												class="text-red-500 hover:text-red-700 text-xs"
											>
												حذف
											</button>
										</div>
										<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">عنوان الميزة</label>
												<input
													type="text"
													bind:value={benefit.title}
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="يقلل تساقط الشعر"
												/>
											</div>
											<div class="md:col-span-2">
												<label class="block text-xs font-semibold text-gray-700 mb-1">تفاصيل الميزة</label>
												<input
													type="text"
													bind:value={benefit.text}
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="اكتب تفاصيل الميزة هنا..."
												/>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Usage Steps -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<h3 class="text-base font-bold text-gray-900 border-b pb-2">🚿 طريقة وخطوات الاستخدام (Usage Steps)</h3>
						<p class="text-xs text-gray-500">أضف خطوات توضح للمشتري كيفية استخدام المنتج للحصول على أفضل نتيجة.</p>
						<div class="space-y-2">
							{#each editState.content.killers.usageSteps as _, idx}
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-gray-500 w-6 text-center">{idx + 1}</span>
									<input
										type="text"
										bind:value={editState.content.killers.usageSteps[idx]}
										class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="مثال: دلك فروة الرأس بلطف بحركات دائرية..."
									/>
									<button
										type="button"
										onclick={() => editState.content.killers.usageSteps = editState.content.killers.usageSteps.filter((_, i) => i !== idx)}
										class="text-red-500 hover:text-red-700 text-xs px-2"
									>
										حذف
									</button>
								</div>
							{/each}
						</div>
						<button
							type="button"
							onclick={() => editState.content.killers.usageSteps = [...editState.content.killers.usageSteps, '']}
							class="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
						>
							+ إضافة خطوة جديدة
						</button>
					</div>

					<!-- Footer CTA & Footer CTA Image -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<h3 class="text-base font-bold text-gray-900 border-b pb-2">📣 العبارة التسويقية في النهاية (Footer CTA)</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-xs font-semibold text-gray-700 mb-1">العبارة التسويقية الختامية</label>
								<textarea
									bind:value={editState.content.killers.footerCta.text}
									rows="3"
									class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="لا تدع الصلع يسرق ثقتك..."
								></textarea>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-700 mb-1">رابط صورة النهاية التسويقية</label>
								<input
									type="text"
									bind:value={editState.content.killers.footerCta.image}
									class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
									placeholder="https://... أو /images/killers/..."
								/>
								{#if editState.content.killers.footerCta.image}
									<div class="mt-2 w-24 h-24 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
										<img src={editState.content.killers.footerCta.image} alt="Preview" class="w-full h-full object-cover" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Guarantees Section -->
					<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
						<div class="flex items-center justify-between border-b pb-2">
							<h3 class="text-base font-bold text-gray-900">🛡️ الضمانات في الأسفل (Guarantees)</h3>
							<button
								type="button"
								onclick={() => editState.content.killers.guarantees = [...editState.content.killers.guarantees, { title: '', text: '', image: '' }]}
								class="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
							>
								+ إضافة ضمان
							</button>
						</div>
						{#if editState.content.killers.guarantees.length === 0}
							<p class="text-center text-xs text-gray-500 py-4">لا توجد ضمانات حالياً.</p>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each editState.content.killers.guarantees as guarantee, idx}
									<div class="p-4 border border-gray-200 bg-white rounded-lg space-y-3">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-gray-600">ضمان {idx + 1}</span>
											<button
												type="button"
												onclick={() => editState.content.killers.guarantees = editState.content.killers.guarantees.filter((_, i) => i !== idx)}
												class="text-red-500 hover:text-red-700 text-xs"
											>
												حذف
											</button>
										</div>
										<div class="space-y-2">
											<div class="grid grid-cols-2 gap-2">
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">عنوان الضمان</label>
													<input
														type="text"
														bind:value={guarantee.title}
														class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
														placeholder="الدفع عند الاستلام"
													/>
												</div>
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">رابط أيقونة الضمان</label>
													<input
														type="text"
														bind:value={guarantee.image}
														class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
														placeholder="/images/killers/codincon.png"
													/>
												</div>
											</div>
											<div>
												<label class="block text-xs font-semibold text-gray-700 mb-1">تفاصيل الضمان</label>
												<input
													type="text"
													bind:value={guarantee.text}
													class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
													placeholder="تفاصيل العرض..."
												/>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

			{:else if activeTab === 'tracking'}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">GTM Container ID</label>
						<input
							type="text"
							bind:value={editState.tracking.gtmContainerId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="GTM-XXXXXXX"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
						<input
							type="text"
							bind:value={editState.tracking.facebookPixelId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Google Ads Conversion ID</label>
						<input
							type="text"
							bind:value={editState.tracking.googleAdsConversionId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>
				</div>

			{:else if activeTab === 'scripts'}
				<div class="space-y-4">
						<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Scripts - Head</label>
						<textarea
							bind:value={editState.advanced.headScripts}
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
							placeholder="Paste head scripts here"
						></textarea>
						</div>
						<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Scripts - Body</label>
						<textarea
							bind:value={editState.advanced.bodyScripts}
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
							placeholder="Paste body scripts here"
						></textarea>
						</div>
						<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Scripts - Footer</label>
						<textarea
							bind:value={editState.advanced.footerScripts}
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
							placeholder="Paste footer scripts here"
						></textarea>
						</div>
				</div>

			{:else if activeTab === 'advanced'}
				<div class="space-y-4">
						<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">CSS مخصص</label>
						<textarea
							bind:value={editState.advanced.customCss}
							rows="6"
							class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
							placeholder="custom-class: property value"
						></textarea>
						</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		15%, 45%, 75% { transform: translateX(-6px); }
		30%, 60% { transform: translateX(6px); }
	}
	:global(.animate-shake) {
		animation: shake 0.4s ease-in-out;
	}
</style>
