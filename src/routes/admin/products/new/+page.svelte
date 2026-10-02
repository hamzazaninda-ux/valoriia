<script lang="ts">
	import { goto } from '$app/navigation';
	import { validateRequired, validateSlug } from '$lib/utils/clientValidation';
	import { toasts } from '$lib/stores/toast';

	let { data } = $props();

	let name = $state('');
	let slug = $state('');
	let templateId = $state(data.templates.find((t: any) => t.isDefault)?.id || 'classic');
	let creating = $state(false);
	let slugEdited = $state(false);
	let errors = $state<{ name?: string; slug?: string }>({});

	// LOW-7: generateSlug strips non-ASCII (including Arabic) characters.
	// The caller should check the result and warn the user if it came out empty.
	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function handleNameInput() {
		if (!slugEdited) {
			slug = generateSlug(name);
		}
		validateField();
	}

	function handleSlugInput() {
		slugEdited = true;
		slug = generateSlug(slug);
		validateField();
	}

	function validateField() {
		const newErrors: { name?: string; slug?: string } = {};

		const nameError = validateRequired(name, 'اسم المنتج');
		if (nameError) newErrors.name = nameError;

		// LOW-7: Show an explicit message when the name contains only non-Latin characters
		// (e.g., Arabic) that the slug generator strips away, leaving an empty slug.
		if (!slug.trim() && name.trim() && !slugEdited) {
			newErrors.slug = 'لم يتم إنشاء الرابط تلقائياً. يرجى إدخال الرابط يدوياً باستخدام أحرف إنجليزية وأرقام.';
		} else {
			const slugError = validateSlug(slug);
			if (slugError) newErrors.slug = slugError;
		}

		errors = newErrors;
	}

	async function handleCreate() {
		validateField();

		if (Object.keys(errors).length > 0) {
			return;
		}

		creating = true;
		try {
			const now = new Date().toISOString();
			const productId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

			// MED-2: Corrected indentation — product object is clearly inside the try block.
			const product = {
				id: productId,
				slug,
				status: 'draft' as const,
				createdAt: now,
				updatedAt: now,
				template: templateId,
				published: {
					content: {
						heroImage: templateId === 'killers' ? '/images/killers/imagewom1.png' : '',
						title: name,
						subtitle: templateId === 'killers' ? 'أقوى سيروم طبيعي بتركيبة البيوتين الفعالة لإنبات فراغات الرأس وتكثيف الشعر خلال أسابيع معدودة.' : '',
						rating: 5,
						reviewCount: templateId === 'killers' ? 12450 : 0,
						gallery: templateId === 'killers' ? [
							{ src: '/images/killers/imagewom1.png', alt: 'Biotin Serum' }
						] : [],
						carousel: templateId === 'killers' ? [
							{ image: '/images/killers/imagewom1.png', alt: 'Biotin Serum Slide', title: 'بيوتين هير سيروم الأصلي' }
						] : [],
						faq: templateId === 'killers' ? [
							{ question: 'هل السيروم آمن للاستخدام اليومي؟', answer: 'نعم، السيروم مصنوع من مكونات طبيعية 100% وخالٍ تماماً من الكيماويات الضارة، مما يجعله آمناً تماماً للاستخدام اليومي لجميع أنواع الشعر.' },
							{ question: 'متى تبدأ النتائج في الظهور؟', answer: 'تظهر النتائج الأولية في تقليل تساقط الشعر خلال أول أسبوعين، وتبدأ الفراغات في الإنبات وظهور بصيلات جديدة من الأسبوع الرابع إلى السادس للاستخدام المنتظم.' },
							{ question: 'كيف يمكنني الحصول على الضمان الذهبي؟', answer: 'نحن نثق في جودة منتجاتنا، لذلك نقدم ضماناً ذهبياً: إذا لم تلاحظ أي نتيجة إيجابية خلال 30 يوماً من الاستخدام الصحيح، يمكنك استرجاع كامل أموالك دون أي تعقيدات.' }
						] : [],
						footerText: '',
						killers: templateId === 'killers' ? {
							bullets: [
								'يوقف تساقط الشعر ويقوي البصيلات',
								'يحفز نمو شعر جديد وأكثر كثافة',
								'تركيبة طبيعية آمنة 100% بدون آثار جانبية'
							],
							featuredReview: {
								text: 'كنت أحس بالحرج من الصلع في مقدمة رأسي، ولكن بعد 4 أسابيع من استخدام السيروم بدأ الفراغ يختفي والشعر ينمو من جديد. منتج يستحق كل ريال!',
								image: '/images/killers/imagewom1.png',
								author: 'فهد، الرياض'
							},
							stories: [
								{
									name: 'عبدالله، جدة',
									text: 'كنت أعاني من تساقط مستمر بسبب ضغوطات العمل. جربت منتجات كثيرة وبدون فائدة. بعد استخدام السيروم لمدة شهر، قل التساقط بنسبة 90% وأصبح شعري أقوى.'
								},
								{
									name: 'خالد، الدمام',
									text: 'سيروم رائع جداً وسريع الامتصاص ورائحته جميلة. لاحظت فرقاً كبيراً في كثافة الشعر وملء الفراغات بعد 6 أسابيع فقط.'
								}
							],
							gridReviews: [
								{
									name: 'نواف، مكة',
									text: 'منتج ممتاز جداً وتوصيل سريع. أنصح الجميع بتجربته.',
									image: '/images/killers/shipico.png'
								},
								{
									name: 'سامي، المدينة',
									text: 'استخدمته لمدة أسبوعين وبدأت ألاحظ توقف التساقط بشكل ملحوظ.',
									image: '/images/killers/waraico.png'
								},
								{
									name: 'بدر، الخبر',
									text: 'الخدمة ممتازة والمنتج أصلي وفعال جداً. شكراً لكم.',
									image: '/images/killers/codincon.png'
								},
								{
									name: 'ماجد، الرياض',
									text: 'تغليف ممتاز وجودة عالية وتأثير حقيقي وملموس.',
									image: '/images/killers/cussup.png'
								}
							],
							benefits: [
								{
									title: 'يقلل تساقط الشعر بشكل فعال',
									text: 'يعمل على تغذية البصيلات الضعيفة من الجذور لتقليل التساقط اليومي والحفاظ على قوة الشعر.'
								},
								{
									title: 'يعزز نمو شعر جديد وقوي',
									text: 'يحفز الخلايا الجذعية في فروة الرأس لإنتاج بصيلات جديدة وملء الفراغات.'
								},
								{
									title: 'يغذي ويرطب فروة الرأس',
									text: 'يحتوي على فيتامينات ومعادن أساسية لتحسين بيئة فروة الرأس ومنع الجفاف والقشرة.'
								},
								{
									title: 'نتائج ملحوظة في أسابيع قليلة',
									text: 'تظهر النتائج الأولية من الأسبوع الرابع للاستخدام المنتظم والصحيح للسيروم.'
								}
							],
							usageSteps: [
								'اغسل شعرك جيداً بالماء الفاتر والشامبو المناسب ثم جففه بلطف.',
								'ضع بضع قطرات من السيروم مباشرة على فروة الرأس وخاصة في مناطق الفراغات.',
								'دلك فروة رأسك بلطف بحركات دائرية لمدة 2-3 دقائق لضمان امتصاص السيروم.',
								'اتركه على رأسك ولا تغسله. يفضل استخدامه مرتين يومياً صباحاً ومساءً.'
							],
							footerCta: {
								text: 'لا تدع الصلع يسرق ثقتك بنفسك. ابدأ رحلة استعادة شعرك اليوم مع البيوتين هير سيروم الأصلي!',
								image: '/images/killers/imagewom1.png'
							},
							guarantees: [
								{
									title: 'ضمان المنتج الأصلي',
									text: 'نضمن لك أن المنتج أصلي 100% ومستورد من المصنع مباشرة.',
									image: '/images/killers/waraico.png'
								},
								{
									title: 'الدفع عند الاستلام',
									text: 'لن تدفع شيئاً حتى تستلم منتجك بين يديك وتفحصه بنفسك.',
									image: '/images/killers/codincon.png'
								},
								{
									title: 'شحن سريع ومجاني',
									text: 'نوصل المنتج لجميع مدن المملكة مجاناً وفي وقت قياسي.',
									image: '/images/killers/shipico.png'
								},
								{
									title: 'خدمة عملاء ممتازة',
									text: 'فريقنا جاهز للرد على استفساراتك ومساعدتك في أي وقت.',
									image: '/images/killers/cussup.png'
								}
							]
						} : undefined
					},
					pricing: {
						currency: templateId === 'killers' ? 'SAR' : 'MAD',
						offers: [
							{
								id: 1,
								title: templateId === 'killers' ? 'عرض عبوة واحدة' : 'عرض أساسي',
								subtitle: templateId === 'killers' ? 'كافية لمدة شهر من الاستخدام' : '',
								price: templateId === 'killers' ? 199 : 1,
								originalPrice: templateId === 'killers' ? 399 : 1,
								quantity: 1,
								badge: templateId === 'killers' ? 'الأكثر طلباً' : null,
								isPopular: true
							}
						]
					},
					order: {
						sku: slug,
						googleSheetsUrl: '',
						phoneConfirmation: true,
						whatsappNumber: ''
					},
					seo: {
						metaTitle: name,
						metaDescription: '',
						noindex: false
					}
				},
				draft: null,
				meta: {
					tracking: {},
					advanced: {},
					changelog: [
						{ action: 'created' as const, timestamp: now }
					]
				}
			};

			const response = await fetch(`/api/products/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(product)
			});

			if (response.ok) {
				toasts.success('تم إنشاء المنتج بنجاح');
				if (templateId === 'killers') {
					goto(`/admin/products/${slug}/edit?tab=killers`);
				} else {
					goto(`/admin/products/${slug}/edit`);
				}
			} else {
				const errorData = await response.json();
				if (errorData.details) {
					const slugConflict = errorData.details.find((e: any) => e.field === 'slug');
					if (slugConflict) {
						errors = { ...errors, slug: slugConflict.message };
					}
					const uniqueMessages = [...new Set(errorData.details.map((e: any) => e.message))];
					toasts.error(uniqueMessages.join('\n'));
				} else {
					toasts.error(errorData.error || 'فشل في إنشاء المنتج');
				}
			}
		} catch {
			toasts.error('حدث خطأ أثناء إنشاء المنتج');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>منتج جديد - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/admin/products" class="text-gray-600 hover:text-gray-900">
			← رجوع
		</a>
		<h1 class="text-2xl font-bold text-gray-900">منتج جديد</h1>
	</div>

	<div class="bg-white shadow-sm rounded-lg border p-6">
		<div class="space-y-4 max-w-xl">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
				<input
					type="text"
					bind:value={name}
					oninput={handleNameInput}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 {errors.name ? 'border-red-500' : ''}"
					placeholder="مثال: Valoriia"
				/>
				{#if errors.name}
					<p class="mt-1 text-sm text-red-600">{errors.name}</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">الرابط (Slug)</label>
				<div class="flex items-center">
					<span class="text-sm text-gray-500 mr-1">/</span>
					<input
						type="text"
						bind:value={slug}
						oninput={handleSlugInput}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 {errors.slug ? 'border-red-500' : ''}"
						placeholder="alpha-vital"
					/>
				</div>
				{#if errors.slug}
					<p class="mt-1 text-sm text-red-600">{errors.slug}</p>
				{:else}
					<p class="mt-1 text-xs text-gray-500">
						يتم إنشاء الرابط تلقائياً من الاسم الإنجليزي. يمكنك تعديله يدوياً.
					</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">القالب</label>
				<select
					bind:value={templateId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
				>
					{#each data.templates as tmpl}
						<option value={tmpl.id}>{tmpl.name}</option>
					{/each}
				</select>
			</div>

			<div class="pt-4">
				<button
					onclick={handleCreate}
					disabled={creating || !name.trim() || !slug.trim()}
					class="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if creating}
						جاري الإنشاء...
					{:else if templateId === 'killers'}
						التالي ←
					{:else}
						إنشاء المنتج
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
