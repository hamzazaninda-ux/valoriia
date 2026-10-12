<script lang="ts">
	const points = [
		{
			title: 'الامتصاص الحيوي',
			novavita: '92% امتصاص فوري عبر الفم',
			traditional: '20-30% يتلفه حمض المعدة'
		},
		{
			title: 'سهولة الاستخدام',
			novavita: 'ممتعة، لذيذة بنكهة الفواكه الطبيعية',
			traditional: 'صعبة البلع وتسبب حموضة'
		},
		{
			title: 'راحة المعدة',
			novavita: 'خفيفة 100% ولا تسبب أي تهيج أو غثيان',
			traditional: 'ثقيلة وتسبب عسر هضم'
		},
		{
			title: 'السكر والمواد الحافظة',
			novavita: '0% سكر مضاف، بكتين نباتي حلال',
			traditional: 'جيلاتين حيواني ومواد مالئة'
		},
		{
			title: 'الالتزام اليومي',
			novavita: '98% يلتزمون بها يومياً بدون نسيان',
			traditional: 'انقطاع متكرر وصعوبة استمرار'
		}
	];
</script>

<section class="py-14 sm:py-24 bg-white border-b border-emerald-950/10" dir="rtl">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
		
		<div class="text-center max-w-xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs font-black text-[#1B4332] border border-emerald-900/10">
				<svg class="w-3.5 h-3.5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.564 1.258l-1.397.7a2.25 2.25 0 01-2.018 0l-1.397-.7a1.25 1.25 0 01-.564-1.258L18.75 4.97zm-13.5 0C4.24 5.113 3.24 5.287 2.25 5.49m3-.52L2.63 15.696c-.122.499.106 1.028.564 1.258l1.397.7a2.25 2.25 0 002.018 0l1.397-.7a1.25 1.25 0 00.564-1.258L5.25 4.97z"/>
				</svg>
				<span>المقارنة السريرية المباشرة</span>
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
				علاش علكات NOVAVITA كتتفوق على الحبوب التقليدية؟
			</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Comparison Table Responsive Wrapper -->
		<div class="overflow-hidden rounded-3xl border-2 border-emerald-950/15 shadow-xl bg-[#FAF8F5]">
			<table class="w-full text-start text-sm sm:text-base border-collapse" dir="rtl">
				<thead>
					<tr class="border-b border-emerald-950/10 bg-white">
						<th class="p-4 sm:p-5 text-start font-black text-stone-600 text-sm sm:text-base w-1/3">المعايير</th>
						<th class="p-4 sm:p-5 text-center font-black text-[#1B4332] bg-emerald-50/80 border-x border-emerald-950/10 w-1/3">
							<span class="block text-base sm:text-lg">علكات NOVAVITA</span>
							<span class="text-xs font-bold text-emerald-800">الروتين السريري الذكي</span>
						</th>
						<th class="p-4 sm:p-5 text-center font-bold text-stone-500 w-1/3">
							<span class="block text-base sm:text-lg">الحبوب والكبسولات التقليدية</span>
							<span class="text-xs">الروتين العادي</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-emerald-950/10 bg-white/70">
					{#each points as point}
						<tr class="hover:bg-white transition-colors">
							<td class="p-4 sm:p-5 font-bold text-sm sm:text-base text-[#1F2937] leading-relaxed">
								{point.title}
							</td>
							<td class="p-4 sm:p-5 font-extrabold text-sm sm:text-base text-[#1B4332] bg-emerald-50/50 border-x border-emerald-950/10 leading-relaxed">
								<div class="flex items-start gap-2 justify-center">
									<div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
										</svg>
									</div>
									<span class="text-start">{point.novavita}</span>
								</div>
							</td>
							<td class="p-4 sm:p-5 font-medium text-sm sm:text-base text-stone-500 leading-relaxed">
								<div class="flex items-start gap-2 justify-center">
									<div class="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
										</svg>
									</div>
									<span class="text-start">{point.traditional}</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

	</div>
</section>

