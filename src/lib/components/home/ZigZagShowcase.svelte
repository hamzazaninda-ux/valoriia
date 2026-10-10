<script lang="ts">
	interface Props {
		onSelectProduct?: (sku: string) => void;
	}

	let { onSelectProduct }: Props = $props();

	const items = [
		{
			sku: 'gummies_biotine',
			image: '/images/products/gummies_biotine.svg',
			badge: '💇‍♀️ مشكلة تساقط الشعر والماء القاصح',
			headline: 'علاش شعرك كيطيح وخا كتبدلي الشامبوان كل شهر؟',
			painPoint: 'في المغرب، الماء القاصح (الكالكير)، الصباغات المتكررة، وضغوطات الحياة اليومية كينشفو الزغبة من برا وكيقتلو البصيلة من الداخل. الحل الحقيقي لا يبدأ من مستحضرات السطح.. بل من التغذية الخلوية العميقة.',
			solution: 'علكات NOVAVITA بتركيز 3000mcg من البيوتين النقي والزنك تخترق مجرى الدم مباشرة لتنشيط الدورة الدموية في فروة الرأس، إيقاف التساقط نهائياً، وإنبات البيبي هير في الفراغات.',
			benefits: [
				'إيقاف تساقط الشعر الهرموني والموسمي الناتج عن الكالكير والصباغة',
				'تحفيز إنبات فراغات مقدمة الرأس وجوانب الشعر (Baby Hair كثيف)',
				'تقوية الأظافر الهشة ومنع تكسرها لتصبح صلبة ولامعة خلال أسابيع'
			],
			specs: '3000 mcg بيوتين نقي • زنك • فيتامين C • 25 علكة مضغ',
			flavor: 'نكهة الفراولة الطبيعية المنعشة 🍓',
			color: 'border-rose-200 bg-rose-50/40 text-[#E86A7C]',
			ctaText: 'اكتشفي علكات البيوتين للشعر'
		},
		{
			sku: 'gummies_collagen',
			image: '/images/products/gummies_collagen.svg',
			badge: '✨ الحقيقة البيولوجية بعد سن 25 سنة',
			headline: 'ابتداءً من سن 25.. يفقد جسمكِ 1% من كولاجينه الطبيعي سنوياً!',
			painPoint: 'النتيجة؟ جفاف مفاجئ، بهتان في اللون، وفقدان مرونة الجلد مع بداية ظهور الخطوط التعبيرية حول العينين والفم. الكريمات السطحية لا تكفي لأن جزيئات الكولاجين التقليدي كبيرة ولا تعبر المسام.',
			solution: 'كولاجين NOVAVITA البحري المتحلل (Hydrolyzed Marine Collagen) مدمج بحمض الهيالورونيك، مصمم بجزيئات متناهية الصغر يمتصها الجسم خلوياً ليعيد بناء شبكة الكولاجين الطبيعية وملء خلايا البشرة من العمق.',
			benefits: [
				'تعويض النقص السنوي للكولاجين واستعادة نضارة البشرة الزجاجية المشدودة',
				'ترطيب مائي داخلي عميق يغنيك عن طبقات المكياج وخافي العيوب',
				'تنعيم ملمس الجلد وتخفيف مظهر التجاعيد والخطوط التعبيرية المبكرة'
			],
			specs: 'كولاجين بحري متحلل • حمض الهيالورونيك • فيتامين C • 25 علكة مضغ',
			flavor: 'نكهة التوت البري اللذيذة 🫐',
			color: 'border-emerald-200 bg-emerald-50/40 text-[#1B4332]',
			ctaText: 'اكتشفي علكات كولاجين النضارة'
		},
		{
			sku: 'gumies_vitamine',
			image: '/images/products/gumies_vitamine.svg',
			badge: '⚡ كراهية الكبسولات الصيدلانية والإرهاق اليومي',
			headline: 'كفاكِ معاناة مع الكبسولات الضخمة وثقل المعدة!',
			painPoint: 'الكبسولات الصيدلانية الكبيرة برائحتها المزعجة وطعمها المعدني تسبب الغثيان وثقل المعدة، وسرعان ما ينتهي بها الأمر منسية في الخزانة. ومع ضغوطات العمل والمنزل، تشعرين بخمول مستمر ونقص في الطاقة.',
			solution: 'حوّلنا روتينكِ العلاجي المرهق إلى لحظة متعة بنكهة الفواكه الطبيعية كتحلي بيها نهارك. تركيبة نباتية متوازنة تجمع 13 فيتامين ومعدن أساسي تمنحك نشاطاً مستمراً طوال النهار بدون أي تعب.',
			benefits: [
				'13 فيتامين ومعدن تشمل (A, C, D3, E, K1) ومجموعة B-Complex الكاملة',
				'حمض الفوليك (Folic Acid) لتجديد الطاقة ومحاربة التعب والإرهاق المزمن',
				'تعزيز المناعة الطبيعية ونضارة الجسم بدون ماء وبدون أي ثقل هضمي'
			],
			specs: '13 فيتامين ومعدن • فيتامين B-Complex • حمض الفوليك • 25 علكة مضغ',
			flavor: 'نكهة الفواكه المشكلة اللذيذة 🍊',
			color: 'border-amber-200 bg-amber-50/40 text-amber-800',
			ctaText: 'اكتشفي علكات الملتي فيتامين والنشاط'
		}
	];

	function handleAction(sku: string) {
		if (onSelectProduct) {
			onSelectProduct(sku);
		} else {
			window.location.href = `/products/${sku}`;
		}
	}
</script>

<section id="showcase" class="py-14 sm:py-24 bg-white border-b border-emerald-950/10" dir="rtl">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
		
		<!-- Section Header -->
		<div class="text-center max-w-3xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs font-black text-[#1B4332] border border-emerald-900/10">
				🌿 ثلاثية الجمال والصحة المصممة للمرأة بالمغرب
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
				علاجات دقيقة تعالج أسباب المشكلة من الجذور.. بنكهة فواكه تعشقينها
			</h2>
			<p class="text-base sm:text-lg leading-relaxed text-gray-700 font-medium">
				فهمنا بعمق التحديات اليومية التي تواجه جمال وصحة المرأة المغربية، وابتكرنا روتيناً خلوياً متكاملاً يمنحك التغيير الحقيقي دون عناء الكبسولات الجافة.
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Strict Alternating Zig-Zag Rows:
		     Row 0: Text Right (lg:order-1) | Image Left (lg:order-2)
		     Row 1: Image Right (lg:order-1) | Text Left (lg:order-2)
		     Row 2: Text Right (lg:order-1) | Image Left (lg:order-2)
		-->
		<div class="space-y-20 sm:space-y-28">
			{#each items as item, index}
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
					
					<!-- Text Content Column -->
					<div class={`lg:col-span-6 space-y-4 sm:space-y-5 text-start ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
						
						<!-- Badge -->
						<div class="inline-flex items-center gap-2 rounded-full bg-[#1B4332]/5 px-3.5 py-1 text-xs sm:text-sm font-black text-[#1B4332] border border-[#1B4332]/10">
							{item.badge}
						</div>

						<!-- Headline with Link -->
						<h3 class="font-display text-xl sm:text-3xl font-black text-[#1B4332] leading-snug">
							<a href={`/products/${item.sku}`} class="hover:text-[#E86A7C] transition-colors">
								{item.headline}
							</a>
						</h3>

						<!-- Pain Point Context (Moroccan Emotional Hook) -->
						<p class="text-base sm:text-lg text-gray-700 leading-relaxed font-semibold bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/70">
							{item.painPoint}
						</p>

						<!-- Scientific Solution -->
						<p class="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
							{item.solution}
						</p>

						<!-- Benefits Checklist -->
						<div class="space-y-2.5 pt-1">
							{#each item.benefits as benefit}
								<div class="flex items-start gap-2.5">
									<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mt-0.5">
										✓
									</span>
									<span class="text-sm sm:text-base font-bold text-[#1F2937] leading-relaxed">
										{benefit}
									</span>
								</div>
							{/each}
						</div>

						<!-- Dose Specs Pill -->
						<div class="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-stone-600 bg-stone-100 px-3.5 py-1.5 rounded-xl">
							<span>🔬 التركيبة:</span>
							<span>{item.specs}</span>
						</div>

						<!-- CTAs -->
						<div class="pt-3 flex flex-wrap items-center gap-3">
							<a
								href={`/products/${item.sku}`}
								class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-95 px-6 sm:px-8 text-sm sm:text-base font-black text-white shadow-md shadow-emerald-950/15 transition-all duration-300 no-underline"
							>
								<span>{item.ctaText}</span>
								<span class="text-sm">←</span>
							</a>
							<button
								type="button"
								onclick={() => handleAction(item.sku)}
								class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white border-2 border-[#1B4332]/25 hover:bg-emerald-50 text-[#1B4332] text-xs sm:text-sm font-black px-4 py-2 transition-colors cursor-pointer"
							>
								<span>طلب سريع من الصفحة ⚡</span>
							</button>
						</div>

					</div>

					<!-- Visual Mockup Column -->
					<div class={`lg:col-span-6 flex justify-center ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
						<a
							href={`/products/${item.sku}`}
							class="relative w-full max-w-md aspect-square rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl border-2 {item.color} overflow-hidden group block cursor-pointer transition-transform duration-300 hover:-translate-y-1.5"
							aria-label={`عرض تفاصيل ${item.headline}`}
						>
							<!-- Background Ambient Gradient Glow -->
							<div class="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/80 blur-2xl"></div>
							<div class="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#E86A7C]/15 blur-2xl"></div>

							<!-- Floating Badge -->
							<div class="relative z-10 w-full flex items-center justify-between mb-2">
								<span class="text-[11px] font-black text-emerald-900 bg-white/90 px-3 py-1 rounded-full shadow-2xs border border-emerald-950/10">
									علبة 25 علكة مضغ
								</span>
								<span class="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
									امتصاص فوري ⚡
								</span>
							</div>
							
							<!-- High-Res Mockup Image Container -->
							<div class="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-3">
								<div class="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl bg-white/95 shadow-md p-3 flex items-center justify-center border border-stone-200/60 backdrop-blur-xs transition-transform duration-500 group-hover:scale-105">
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
								
								<!-- Flavor Pill Tag -->
								<div class="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1 text-xs font-black shadow-xs border border-stone-200/70">
									<span>{item.flavor}</span>
								</div>
							</div>
						</a>
					</div>

				</div>
			{/each}
		</div>

	</div>
</section>
