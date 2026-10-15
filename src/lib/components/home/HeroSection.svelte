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
					<span class="text-xs sm:text-sm font-semibold text-[#1B4332]">
						🌿 مكملات تجميلية وصحية طبيعية 100%
					</span>
				</div>

				<!-- b) H1 Headline -->
				<h1 class="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-[#1B4332] leading-[1.25] tracking-tight">
					سر إشراقة بشرتك، كثافة شعرك وطاقتك اليومية.. في حلوى لذيذة واحدة!
				</h1>

				<!-- c) Concise Description -->
				<p class="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-medium max-w-2xl">
					علكات NOVAVITA الفاخرة، تركيبة فرنسية متطورة مصممة خصيصاً للمرأة المغربية. عناية متكاملة تبدأ من الداخل بدون حبوب مزعجة أو طعم مر.
				</p>

				<!-- d) Micro Trust Badges Row -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2 w-full">
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex items-center justify-center text-center gap-2 hover:border-[#1B4332]/30 transition-colors">
						<span class="text-emerald-700 font-bold">✓</span>
						<span class="font-bold text-xs sm:text-sm text-gray-900">توصيل مجاني وسريع</span>
					</div>
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex items-center justify-center text-center gap-2 hover:border-[#1B4332]/30 transition-colors">
						<span class="text-emerald-700 font-bold">✓</span>
						<span class="font-bold text-xs sm:text-sm text-gray-900">دفع عند الاستلام</span>
					</div>
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex items-center justify-center text-center gap-2 hover:border-[#1B4332]/30 transition-colors">
						<span class="text-emerald-700 font-bold">✓</span>
						<span class="font-bold text-xs sm:text-sm text-gray-900">ضمان استرجاع 30 يوم</span>
					</div>
				</div>

				<!-- e) Action Row -->
				<div class="flex flex-col sm:flex-row items-center gap-3 pt-1 w-full sm:w-auto">
					<!-- Primary Action Button -->
					<button
						type="button"
						onclick={scrollToOrder}
						class="w-full sm:w-auto inline-flex min-h-13 sm:min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] px-7 py-3 text-base sm:text-lg font-bold text-white shadow-xl shadow-emerald-950/20 transition-all duration-300 cursor-pointer group"
					>
						<span>اكتشفي الباقات والعروض الحصرية</span>
						<span class="text-xl transition-transform group-hover:-translate-x-1">←</span>
					</button>

					<!-- Adjacent Reassurance Badge -->
					<div class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-stone-200/90 px-4 py-3 text-sm sm:text-base font-bold text-[#1B4332] shadow-2xs w-full sm:w-auto">
						<svg class="w-4 h-4 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0 1 12 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 0 1-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 0 1 4.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z"/>
						</svg>
						<span>معاينة مجانية عند الباب قبل الدفع</span>
					</div>
				</div>


			</div>

			<!-- Column 2 (Left in RTL on Desktop, Top on Mobile): Visual Container with Before-and-After Graphic -->
			<div class="order-1 lg:order-2 lg:col-span-5 flex justify-center w-full">
				<div class="w-full max-w-md mx-auto px-2">
					<div class="relative w-full h-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#FAF8F5]">
						<img 
							src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791751038/%D8%AB%D9%84%D8%A7%D8%AB_%D8%B9%D8%A8%D9%88%D8%A7%D8%AA_%D9%86%D9%88%D9%81%D8%A7%D9%81%D9%8A%D8%AA%D8%A7_%D9%85%D8%B9_%D8%A7%D9%84%D8%AA%D9%88%D8%AA_%D9%88%D8%A7%D9%84%D9%81%D8%A7%D9%83%D9%87%D8%A9.png" 
							alt="علكات كولاجين نوفافيتا - قبل وبعد" 
							class="w-full h-auto object-contain block"
							loading="eager"
							fetchpriority="high"
							decoding="async"
						/>
						<!-- Signature confidence badge at the bottom of the card -->
						<div class="absolute bottom-3 start-3 sm:bottom-4 sm:start-4 bg-white/95 backdrop-blur-xs rounded-full px-3.5 py-1.5 border border-[#1B4332]/10 shadow-md flex items-center gap-1.5 text-xs font-bold text-[#1B4332] z-10">
							<span class="text-emerald-700 font-black">✓</span>
							<span>بكتين نباتي طبيعي 100% حلال</span>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
</section>
