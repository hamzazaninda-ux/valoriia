<script lang="ts">
	interface Props {
		onSelectProduct?: (sku: string) => void;
	}

	let { onSelectProduct }: Props = $props();

	const items = [
		{
			sku: 'gummies_biotine',
			image: '/images/products/gummies_biotine.svg',
			tag: 'شعر كثيف وأظافر قوية 💇‍♀️',
			headline: 'بيوتين مركز 5000mcg مع الزنك وفيتامين C',
			description: 'الحل النهائي لمشكلة تساقط الشعر المزعجة. تركيبة غنية بالبيوتين النقي والزنك لتغذية البصيلات من الداخل وإنبات فراغات الرأس بفعالية وأمان.',
			benefits: [
				'إيقاف تساقط الشعر المستمر وتحفيز نمو البيبي هير (Baby Hair)',
				'تقوية جذور وبصيلات الشعر وإعطاؤه لمعاناً وحيوية طبيعية',
				'علاج تكسر الأظافر الهشة وجعلها صلبة وسريعة النمو'
			],
			flavor: 'نكهة الفراولة الطبيعية المنعشة 🍓',
			color: 'border-rose-200 bg-rose-50/40 text-[#E86A7C]',
			buttonText: 'اكتشفي علكات البيوتين'
		},
		{
			sku: 'gummies_collagen',
			image: '/images/products/gummies_collagen.svg',
			tag: 'نضارة وشباب البشرة ✨',
			headline: 'كولاجين بحري متحلل لمرونة الجلد ومحاربة التجاعيد',
			description: 'جددي خلايا بشرتك وأعيدي لها النضارة المفقودة. كولاجين بحري متحلل خفيف وسريع الامتصاص كيعوض نقص الكولاجين الطبيعي بعد سن 25 ويمنحك بشرة زجاجية مشدودة.',
			benefits: [
				'تعويض نقص الكولاجين الطبيعي بعد سن 25 سنة',
				'ترطيب عميق وإشراقة طبيعية مشرقة تغنيك عن طبقات الماكياج',
				'شد البشرة وتخفيف مظهر الخطوط الدقيقة والتجاعيد التعبيرية'
			],
			flavor: 'نكهة التوت البري اللذيذة 🫐',
			color: 'border-emerald-200 bg-emerald-50/40 text-[#1B4332]',
			buttonText: 'اكتشفي علكات الكولاجين'
		},
		{
			sku: 'gumies_vitamine',
			image: '/images/products/gumies_vitamine.svg',
			tag: 'طاقة ومناعة يومية ⚡',
			headline: 'فيتامينات متكاملة للنشاط والمناعة بدون تعب أو إرهاق',
			description: 'الروتين اليومي الشامل لكل سيدة عاملة أو أم تبحث عن النشاط والتوازن. تركيبة متكاملة تجمع الفيتامينات والمعادن الناقصة في التغذية اليومية بدون ثقل في المعدة.',
			benefits: [
				'13 فيتامين ومعدن أساسي تشمل فيتامين C و D والزنك و B-Complex',
				'محاربة الخمول والإجهاد اليومي ومنحك طاقة مستمرة طوال النهار',
				'تعزيز قوة الجهاز المناعي والصحة العامة للمرأة'
			],
			flavor: 'نكهة الفواكه المشكلة اللذيذة 🍊',
			color: 'border-amber-200 bg-amber-50/40 text-amber-800',
			buttonText: 'اكتشفي علكات الفيتامينات'
		}
	];

	function handleAction(sku: string) {
		if (onSelectProduct) {
			onSelectProduct(sku);
		} else {
			const el = document.getElementById('order-section');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<section id="showcase" class="py-12 sm:py-20 bg-white border-b border-emerald-950/10">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
		
		<!-- Section Header -->
		<div class="text-center max-w-2xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332] border border-emerald-900/10">
				🌿 ثلاثية الجمال المتكاملة
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				كل ما يحتاجه جمالك وصحتك.. في حبة واحدة لذيذة
			</h2>
			<p class="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
				تم ابتكار كل منتج بجرعات علمية دقيقة وبكتين فواكه نباتي 100% حلال لنتائج سريعة تدوم طويلاً.
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Alternating Rows (Desktop: Image-Right/Text-Left on Even, Text-Right/Image-Left on Odd) -->
		<div class="space-y-16 sm:space-y-24">
			{#each items as item, index}
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
					
					<!-- Visual Mockup Container -->
					<div class={`lg:col-span-6 flex justify-center ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
						<a
							href={`/products/${item.sku}`}
							class="relative w-full max-w-md aspect-square rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg border-2 {item.color} overflow-hidden group block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
							aria-label={`عرض تفاصيل ${item.headline}`}
						>
							<!-- Background Circle Art -->
							<div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/70 blur-xl"></div>
							
							<!-- Product Card Preview with Mockup Image & Error Fallback -->
							<div class="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-4">
								<div class="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl bg-white/90 shadow-md p-2 flex items-center justify-center border border-stone-200/60 backdrop-blur-xs transition-transform duration-500 group-hover:scale-105">
									<img
										src={item.image}
										alt={item.headline}
										class="w-full h-full object-contain drop-shadow-md"
										loading="lazy"
										onerror={(e: any) => {
											e.currentTarget.onerror = null;
											e.currentTarget.src = '/images/products/gummies_collagen.svg';
										}}
									/>
								</div>
								
								<div class="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-black shadow-xs">
									<span>{item.flavor}</span>
								</div>
							</div>
						</a>
					</div>

					<!-- Text Content -->
					<div class={`lg:col-span-6 space-y-4 sm:space-y-5 text-center lg:text-start ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
						<div class="inline-flex items-center gap-2 rounded-full bg-[#1B4332]/5 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
							{item.tag}
						</div>

						<h3 class="font-display text-xl sm:text-3xl font-black text-[#1B4332] leading-snug">
							<a href={`/products/${item.sku}`} class="hover:text-[#E86A7C] transition-colors">
								{item.headline}
							</a>
						</h3>

						<p class="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
							{item.description}
						</p>

						<!-- Benefits Checklist -->
						<div class="space-y-2.5 pt-2 text-start">
							{#each item.benefits as benefit}
								<div class="flex items-start gap-2.5">
									<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mt-0.5">
										✓
									</span>
									<span class="text-xs sm:text-sm font-bold text-[#1F2937] leading-relaxed">
										{benefit}
									</span>
								</div>
							{/each}
						</div>

						<div class="pt-4 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
							<a
								href={`/products/${item.sku}`}
								class="inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-95 px-6 sm:px-8 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-300 no-underline"
							>
								<span>{item.buttonText}</span>
								<span class="text-sm">←</span>
							</a>
							<button
								type="button"
								onclick={() => handleAction(item.sku)}
								class="inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2 rounded-2xl bg-white border border-[#1B4332]/30 hover:bg-emerald-50 text-[#1B4332] text-xs sm:text-sm font-bold px-4 py-2 transition-colors cursor-pointer"
							>
								<span>طلب سريع من الصفحة ⚡</span>
							</button>
						</div>
					</div>

				</div>
			{/each}
		</div>

	</div>
</section>
