<script lang="ts">
	interface ProductCard {
		slug: string;
		image: string;
		alt: string;
		tag: string;
		tagColor: string;
		title: string;
		description: string;
		stars: number;
		reviewCount: string;
		price: string;
	}

	const products: ProductCard[] = [
		{
			slug: 'gummies_collagen',
			image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752600/mockup-collagen_gummies-main_1.png',
			alt: 'كولاجين بحري + حمض الهيالورونيك - نوفافيتا',
			tag: 'Marine Collagen + Hyaluronic Acid',
			tagColor: 'bg-emerald-50 text-[#1B4332] border-emerald-200/80',
			title: 'كولاجين بحري + حمض الهيالورونيك',
			description: 'مرونة البشرة، نضارة فورية ومقاومة علامات التقدم في السن',
			stars: 5,
			reviewCount: '+480 تقييم',
			price: 'يبدأ من 199 MAD'
		},
		{
			slug: 'gummies_biotine',
			image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752602/mockup-Biotine_gummies-main.png',
			alt: 'بيوتين عالي التركيز + زنك - نوفافيتا',
			tag: 'Biotin 5000mcg + Zinc',
			tagColor: 'bg-rose-50 text-[#E86A7C] border-rose-200/80',
			title: 'بيوتين عالي التركيز + زنك',
			description: 'وقف تساقط الشعر، تقوية الجذور وزيادة كثافة ولمعان الأظافر',
			stars: 5,
			reviewCount: '+620 تقييم',
			price: 'يبدأ من 199 MAD'
		},
		{
			slug: 'gumies_vitamine',
			image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752600/mockup-Melatonine_Gummies-main.png',
			alt: 'ملتي فيتامين ونشاط يومي - نوفافيتا',
			tag: 'Multivitamin Daily Boost',
			tagColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
			title: 'ملتي فيتامين ونشاط يومي',
			description: 'تعزيز المناعة، طاقة مستمرة وتوازن هرموني متكامل',
			stars: 5,
			reviewCount: '+350 تقييم',
			price: 'يبدأ من 199 MAD'
		}
	];
</script>

<section id="showcase" class="py-14 sm:py-24 bg-[#FAF8F5] border-b border-emerald-950/10 scroll-mt-20" dir="rtl">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
		
		<!-- Section Header -->
		<div class="text-center max-w-3xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#1B4332]/15 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#1B4332] shadow-2xs">
				OUR FORMULATIONS • تركيباتنا السريرية
			</span>
			<h2 class="font-display text-2xl sm:text-4xl lg:text-[2.6rem] font-black text-[#1B4332] leading-tight tracking-tight">
				ثلاث علكات، ثلاث مشاكل، حل سريري واحد
			</h2>
			<p class="text-base sm:text-lg leading-relaxed text-gray-700 font-medium max-w-2xl mx-auto">
				صُممت مكملات نوفافيتا لتمنحك أقصى درجات الامتصاص الحيوي بتركيبات غنية بالمكونات الفعالة
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- 3-Product Cards Grid (Desktop: 3 cols, Mobile: 1 col) -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
			{#each products as p}
				<div class="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
					
					<!-- Top Portion: Tag, Image, Title & Copy -->
					<div>
						<!-- Top Tag Pill -->
						<div class="flex items-center justify-between mb-4">
							<span class={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${p.tagColor}`}>
								{p.tag}
							</span>
							<span class="text-[11px] font-semibold text-stone-400">
								25 علكة مضغ
							</span>
						</div>

						<!-- Product Image: Clean luxury DTC container -->
						<a
							href={`/products/${p.slug}`}
							class="block focus:outline-none"
							aria-label={`عرض ${p.title}`}
						>
							<div class="relative w-full aspect-square bg-[#FAF8F5] rounded-[22px] overflow-hidden border border-black/5 flex items-center justify-center p-3 mb-4 group">
								<img 
									src={p.image} 
									alt={p.alt} 
									class="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
									loading="lazy"
								/>
							</div>
						</a>

						<!-- Title -->
						<h3 class="text-lg sm:text-xl font-bold text-[#1B4332] mb-2 leading-snug group-hover:text-[#E86A7C] transition-colors">
							<a href={`/products/${p.slug}`}>
								{p.title}
							</a>
						</h3>

						<!-- Punchy Copy: Max 2 short high-impact lines -->
						<p class="text-sm sm:text-base leading-relaxed text-gray-700 font-medium line-clamp-3">
							{p.description}
						</p>
					</div>

					<!-- Bottom Portion: Reviews & Action Bar -->
					<div class="pt-5 mt-4 border-t border-gray-100/90 space-y-3.5">
						
						<!-- Reviews & Stars -->
						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div class="flex text-[#F59E0B] gap-0.5">
								{#each Array(p.stars) as _}
									<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<span class="font-bold text-stone-500">
								{p.reviewCount}
							</span>
						</div>

						<!-- Bottom Action Bar: Price + Pill Button -->
						<div class="flex items-center justify-between pt-1">
							<div class="text-gray-900 font-black text-base sm:text-lg">
								{p.price}
							</div>
							<a
								href={`/products/${p.slug}`}
								class="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1B4332] hover:bg-[#143427] active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 shadow-md shadow-emerald-950/15 transition-all duration-300 no-underline"
							>
								<span>اكتشفي الآن</span>
								<span class="text-base transition-transform group-hover:-translate-x-0.5">←</span>
							</a>
						</div>

					</div>

				</div>
			{/each}
		</div>

	</div>
</section>
