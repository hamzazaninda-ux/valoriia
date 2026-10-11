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
					<svg class="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
						<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
					</svg>
					<span class="text-xs sm:text-sm font-semibold text-[#1B4332]">
						روتين الجمال والصحة الأكثر طلباً بالمغرب
					</span>
				</div>

				<!-- b) H1 Headline -->
				<h1 class="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-[#1B4332] leading-[1.25] tracking-tight">
					علكات متطورة لجمال يبدأ من الداخل
				</h1>

				<!-- c) Concise Description (2-3 lines only, no bullet points) -->
				<p class="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-medium max-w-2xl">
					ثلاث تركيبات مبتكرة بالكولاجين البحري، البيوتين المركز 3000mcg، والملتي فيتامين الشامل — تمنحكِ شعراً كثيفاً، بشرة نضرة، وطاقة يومية بنكهة فواكه طبيعية لذيذة بدون عناء الكبسولات المرة.
				</p>

				<!-- d) 4 Clean White Credibility Cards (Horizontal Row) -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2 w-full">
					<!-- Card 1 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#1B4332]/30 transition-colors">
						<div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
							</svg>
						</div>
						<span class="font-bold text-xs sm:text-sm text-gray-900">معاينة عند الباب</span>
						<span class="text-[11px] sm:text-xs text-stone-500 font-medium">فتحي وقلبي قبل الدفع</span>
					</div>

					<!-- Card 2 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#1B4332]/30 transition-colors">
						<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
								<path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/>
							</svg>
						</div>
						<span class="font-bold text-xs sm:text-sm text-gray-900">حلال 100%</span>
						<span class="text-[11px] sm:text-xs text-stone-500 font-medium">بكتين فواكه نباتي</span>
					</div>

					<!-- Card 3 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#1B4332]/30 transition-colors">
						<div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0 1 15.9 16.5H8.1a4.5 4.5 0 0 1-2.33-.658L4.2 14.9"/>
							</svg>
						</div>
						<span class="font-bold text-xs sm:text-sm text-gray-900">معايير GMP</span>
						<span class="text-[11px] sm:text-xs text-stone-500 font-medium">فحص مخبري للنقاء</span>
					</div>

					<!-- Card 4 -->
					<div class="rounded-2xl bg-white border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#1B4332]/30 transition-colors">
						<div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
							</svg>
						</div>
						<span class="font-bold text-xs sm:text-sm text-gray-900">توصيل سريع</span>
						<span class="text-[11px] sm:text-xs text-stone-500 font-medium">24-48 ساعة لدارك</span>
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
						<span>اكتشفي علكات NOVAVITA</span>
						<span class="text-xl transition-transform group-hover:-translate-x-1">←</span>
					</button>

					<!-- Adjacent Reassurance Badge -->
					<div class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-stone-200/90 px-4 py-3 text-sm sm:text-base font-bold text-[#1B4332] shadow-2xs w-full sm:w-auto">
						<svg class="w-4 h-4 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0 1 12 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 0 1-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 0 1 4.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z"/>
						</svg>
						<span>ضمان المعاينة الكاملة عند الباب</span>
					</div>
				</div>


			</div>

			<!-- Column 2 (Left in RTL on Desktop, Top on Mobile): Luxury Visual Container with Unified 3-Jar Cluster -->
			<div class="order-1 lg:order-2 lg:col-span-5 flex justify-center w-full">
				<div class="relative w-full max-w-md mx-auto aspect-square bg-[#FAF8F5] rounded-[28px] overflow-hidden shadow-sm border border-black/5 flex items-center justify-center">
					<img 
						src="https://res.cloudinary.com/uqfy0kku/image/upload/v1791746077/%D8%B9%D8%A8%D9%88%D8%A7%D8%AA_%D9%86%D9%88%D9%81%D8%A7%D9%81%D9%8A%D8%AA%D8%A7_%D9%85%D8%B9_%D9%81%D9%88%D8%A7%D9%83%D9%87_%D8%B7%D8%A7%D8%B2%D8%AC%D8%A9ugburu.png" 
						alt="تشكيلة علكات نوفافيتا مع الفواكه الطبيعية" 
						class="w-full h-full object-cover object-center block"
						loading="eager"
						fetchpriority="high"
					/>
				</div>
			</div>

		</div>
	</div>
</section>
