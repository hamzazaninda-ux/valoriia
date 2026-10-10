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
		const el = document.getElementById('order-section');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<section class="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#FAF8F5] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-emerald-950/10">
	<!-- Subtle ambient glow -->
	<div class="pointer-events-none absolute -top-24 end-1/2 translate-x-1/2 w-96 h-96 bg-[#E86A7C]/10 rounded-full blur-3xl" aria-hidden="true"></div>
	<div class="pointer-events-none absolute top-1/2 -start-24 w-80 h-80 bg-[#1B4332]/10 rounded-full blur-3xl" aria-hidden="true"></div>

	<div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
			
			<!-- Left Column / Text on RTL (Right on screen) -->
			<div class="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-start space-y-4 sm:space-y-6">
				
				<!-- Eyebrow Badge -->
				<div class="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 border border-emerald-900/15 shadow-2xs backdrop-blur-xs">
					<span class="text-base">🍓</span>
					<span class="text-xs sm:text-sm font-extrabold text-[#1B4332]">روتين الجمال والصحة الأكثر طلباً بالمغرب</span>
				</div>

				<!-- Main Headline -->
				<h1 class="font-display text-2xl sm:text-4xl md:text-5xl font-black text-[#1B4332] leading-[1.25] tracking-tight">
					وداعاً لكبسولات الفيتامينات المرة والكبيرة.. اكتشفي سر الإشراقة الطبيعية مع <span class="text-[#E86A7C]">NOVAVITA Gummies</span>
				</h1>

				<!-- Sub-headline -->
				<p class="text-sm sm:text-base md:text-lg text-[#1F2937]/80 leading-relaxed max-w-2xl font-medium">
					تركيبة متطورة بالبيوتين المركز، الكولاجين البحري وفيتامين C، كتعطيك نتائج حقيقية ملموسة بنكهة التوت الطبيعية اللي غتعشقيها كل صباح.
				</p>

				<!-- Value Bullets -->
				<div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-start">
					<div class="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-emerald-950/5">
						<span class="text-lg shrink-0">🍓</span>
						<span class="text-xs sm:text-sm font-bold text-[#1F2937]">نكهة فواكه وتوت طبيعية لذيذة وسهلة في المضغ</span>
					</div>
					<div class="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-emerald-950/5">
						<span class="text-lg shrink-0">🔬</span>
						<span class="text-xs sm:text-sm font-bold text-[#1F2937]">امتصاص أسرع 3 مرات مقارنة بالكبسولات الجافة</span>
					</div>
					<div class="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-emerald-950/5">
						<span class="text-lg shrink-0">🇲🇦</span>
						<span class="text-xs sm:text-sm font-bold text-[#1F2937]">بكتين نباتي حلال 100% ومطابق لأعلى معايير الجودة</span>
					</div>
					<div class="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-emerald-950/5">
						<span class="text-lg shrink-0">🚚</span>
						<span class="text-xs sm:text-sm font-bold text-[#1F2937]">توصيل 24/48 ساعة لجميع مدن المغرب والدفع عند الاستلام</span>
					</div>
				</div>

				<!-- Scarcity Stock Ticker -->
				<div class="w-full max-w-lg bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-bold text-amber-900">
					<span class="animate-pulse">🔥</span>
					<span>باقي فقط <strong class="text-rose-600 font-extrabold text-sm sm:text-base">14 علبة</strong> متوفرة بهذا السعر الترويجي اليوم!</span>
				</div>

				<!-- Primary CTA & Trust Badges -->
				<div class="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
					<button
						type="button"
						onclick={scrollToOrder}
						class="w-full sm:w-auto inline-flex min-h-12 sm:min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#E86A7C] hover:bg-[#d45366] active:scale-[0.98] px-8 py-3 text-base sm:text-lg font-black text-white shadow-xl shadow-rose-900/15 transition-all duration-300"
					>
						<span>جربي NOVAVITA اليوم (توصيل فابور)</span>
						<span class="text-xl">←</span>
					</button>

					<div class="flex items-center gap-2 text-xs font-semibold text-[#1F2937]/70 py-1">
						<div class="flex text-[#F59E0B] gap-0.5">
							{#each Array(5) as _}
								<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{/each}
						</div>
						<span><strong>4.9/5</strong> (أزيد من 1,450 مغربية)</span>
					</div>
				</div>

			</div>

			<!-- Right Column / Mockup Visual (Left on screen) -->
			<div class="lg:col-span-5 flex justify-center">
				<div class="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-[#1B4332] to-[#2D6A4F] p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center text-center text-white border-2 border-emerald-900/30 overflow-hidden group">
					
					<!-- Background Berry Art -->
					<div class="absolute -top-10 -right-10 w-40 h-40 bg-[#E86A7C]/20 rounded-full blur-2xl"></div>
					<div class="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl"></div>

					<!-- Visual Mockup Container -->
					<div class="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-4">
						<!-- Floating Badge -->
						<span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20">
							✨ تركيبة الجمال الثلاثية المتكاملة
						</span>

						<!-- Mockup SVG Illustration -->
						<div class="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
							<img
								src="/images/products/gummies_biotine.svg"
								alt="NOVAVITA Gummies Trio"
								class="w-full h-full object-contain drop-shadow-2xl"
								onerror={(e: any) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = '/images/products/gummies_collagen.svg';
								}}
							/>
						</div>

						<!-- Bottom Sub-card -->
						<div class="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-bold text-white/95 border border-white/10 w-full max-w-xs">
							<span>🌿 بكتين فواكه طبيعي 100% حلال • خالي من الجيلاتين</span>
						</div>
					</div>

				</div>
			</div>

		</div>
	</div>
</section>
