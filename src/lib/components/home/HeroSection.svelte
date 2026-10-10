<script lang="ts">
	interface Props {
		onCtaClick?: () => void;
	}

	let { onCtaClick }: Props = $props();

	function scrollToOrder() {
		if (onCtaClick) {
			onCtaClick();
			return;
		}
		const el = document.getElementById('showcase');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			window.location.href = '/products/gummies_biotine';
		}
	}
</script>

<section class="relative overflow-hidden bg-[#FAF8F5] pt-8 pb-14 sm:pt-12 sm:pb-20 border-b border-emerald-950/10" dir="rtl">
	<!-- Subtle ambient glow in background -->
	<div class="pointer-events-none absolute -top-24 end-1/2 translate-x-1/2 w-[32rem] h-[32rem] bg-emerald-600/5 rounded-full blur-3xl" aria-hidden="true"></div>
	<div class="pointer-events-none absolute top-1/2 -start-24 w-80 h-80 bg-[#E86A7C]/5 rounded-full blur-3xl" aria-hidden="true"></div>

	<div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
			
			<!-- Column 1 (Right in RTL on Desktop, Below on Mobile): Text, Badges, Credibility Cards & CTA -->
			<div class="order-2 lg:order-1 lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-start space-y-5 sm:space-y-6">
				
				<!-- a) Eyebrow Pill Tag -->
				<div class="inline-flex items-center gap-2 rounded-full bg-white border border-[#1B4332]/15 px-4 py-1.5 shadow-2xs">
					<span class="text-xs sm:text-sm font-bold text-[#1B4332]">
						🌿 روتين الجمال والصحة الأكثر طلباً بالمغرب
					</span>
				</div>

				<!-- b) H1 Headline -->
				<h1 class="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-[#1B4332] leading-[1.2] tracking-tight">
					علكات متطورة لجمال يبدأ من الداخل
				</h1>

				<!-- c) Concise Description (2-3 lines only, no bullet points) -->
				<p class="text-sm sm:text-base md:text-lg text-[#1F2937]/80 leading-relaxed font-medium max-w-2xl">
					ثلاث تركيبات مبتكرة بالكولاجين البحري، البيوتين المركز 3000mcg، والملتي فيتامين الشامل — تمنحكِ شعراً كثيفاً، بشرة نضرة، وطاقة يومية بنكهة فواكه طبيعية لذيذة بدون عناء الكبسولات المرة.
				</p>

				<!-- d) 4 Clean White Credibility Cards (Horizontal Row) -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2 w-full">
					<!-- Card 1 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1">
						<span class="text-xl">🛡️</span>
						<span class="font-black text-xs text-[#1B4332]">معاينة عند الباب</span>
						<span class="text-[10px] text-stone-500 font-medium">فتحي وقلبي قبل الدفع</span>
					</div>

					<!-- Card 2 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1">
						<span class="text-xl">🌿</span>
						<span class="font-black text-xs text-[#1B4332]">حلال 100%</span>
						<span class="text-[10px] text-stone-500 font-medium">بكتين فواكه نباتي</span>
					</div>

					<!-- Card 3 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1">
						<span class="text-xl">🔬</span>
						<span class="font-black text-xs text-[#1B4332]">جودة GMP</span>
						<span class="text-[10px] text-stone-500 font-medium">فحص مخبري للنقاء</span>
					</div>

					<!-- Card 4 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1">
						<span class="text-xl">🚚</span>
						<span class="font-black text-xs text-[#1B4332]">توصيل سريع</span>
						<span class="text-[10px] text-stone-500 font-medium">24-48 ساعة لدارك</span>
					</div>
				</div>

				<!-- e) Action Row -->
				<div class="flex flex-col sm:flex-row items-center gap-3 pt-1 w-full sm:w-auto">
					<!-- Primary Action Button -->
					<button
						type="button"
						onclick={scrollToOrder}
						class="w-full sm:w-auto inline-flex min-h-13 sm:min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] px-7 py-3 text-base sm:text-lg font-black text-white shadow-xl shadow-emerald-950/20 transition-all duration-300 cursor-pointer group"
					>
						<span>اكتشفي علكات NOVAVITA</span>
						<span class="text-xl transition-transform group-hover:-translate-x-1">←</span>
					</button>

					<!-- Adjacent Reassurance Badge -->
					<div class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-stone-200/90 px-4 py-3 text-xs sm:text-sm font-bold text-[#1B4332] shadow-2xs w-full sm:w-auto">
						<span>🛡️</span>
						<span>ضمان المعاينة الكاملة عند الباب</span>
					</div>
				</div>

			</div>

			<!-- Column 2 (Left in RTL on Desktop, Top on Mobile): Luxury Visual Container with 3 Jars Mockup -->
			<div class="order-1 lg:order-2 lg:col-span-5 flex justify-center w-full">
				<div class="relative w-full max-w-md lg:max-w-none rounded-3xl bg-gradient-to-br from-[#EAEFEA] via-[#F4F7F4] to-[#FAF8F5] border border-[#1B4332]/10 shadow-lg p-5 sm:p-8 min-h-[350px] sm:min-h-[420px] flex items-center justify-center overflow-hidden group">
					
					<!-- Natural organic background touches -->
					<div class="absolute -top-12 -start-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
					<div class="absolute -bottom-12 -end-12 w-48 h-48 bg-[#E86A7C]/10 rounded-full blur-3xl pointer-events-none"></div>

					<!-- Botanical Leaf SVG accents in background -->
					<svg class="absolute top-4 end-4 w-20 h-20 text-emerald-800/10 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
						<path d="M50 10 C30 30, 20 60, 50 90 C80 60, 70 30, 50 10 Z" />
					</svg>
					<svg class="absolute bottom-12 start-4 w-16 h-16 text-emerald-800/8 pointer-events-none -rotate-45" viewBox="0 0 100 100" fill="currentColor">
						<path d="M50 10 C30 30, 20 60, 50 90 C80 60, 70 30, 50 10 Z" />
					</svg>

					<!-- Trio Jars Mockup Stage -->
					<div class="relative z-10 w-full max-w-[340px] sm:max-w-[380px] h-72 sm:h-80 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
						
						<!-- Left Jar: Marine Collagen (Wild Berry) -->
						<div class="absolute start-0 bottom-4 w-36 sm:w-44 aspect-square -rotate-6 transition-transform duration-500 group-hover:-translate-x-2 z-10">
							<img
								src="/images/products/gummies_collagen.svg"
								alt="علكات الكولاجين البحري"
								class="w-full h-full object-contain drop-shadow-xl"
							/>
						</div>

						<!-- Right Jar: Multivitamin (Citrus) -->
						<div class="absolute end-0 bottom-4 w-36 sm:w-44 aspect-square rotate-6 transition-transform duration-500 group-hover:translate-x-2 z-10">
							<img
								src="/images/products/gumies_vitamine.svg"
								alt="علكات الفيتامينات المتعددة"
								class="w-full h-full object-contain drop-shadow-xl"
							/>
						</div>

						<!-- Center Jar (Front & Prominent): Biotin (Hair & Nails) -->
						<div class="relative w-44 sm:w-52 aspect-square z-20 -translate-y-2 transition-transform duration-500 group-hover:-translate-y-3">
							<img
								src="/images/products/gummies_biotine.svg"
								alt="علكات البيوتين المركزة"
								class="w-full h-full object-contain drop-shadow-2xl"
							/>
						</div>

					</div>

					<!-- Floating Pill Badge (Bottom Corner) -->
					<div class="absolute bottom-4 start-4 sm:bottom-6 sm:start-6 bg-white/95 backdrop-blur-xs rounded-full px-4 py-2 border border-[#1B4332]/10 shadow-md flex items-center gap-1.5 text-xs font-black text-[#1B4332] z-30">
						<span class="text-emerald-700">✓</span>
						<span>بكتين نباتي طبيعي 100% حلال</span>
					</div>

				</div>
			</div>

		</div>
	</div>
</section>
