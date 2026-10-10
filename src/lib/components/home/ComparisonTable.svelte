<script lang="ts">
	const points = [
		{
			title: 'المذاق وتجربة التناول',
			novavita: 'نكهة توت وفواكه طبيعية لذيذة ومنعشة 🍓',
			traditional: 'طعم مر ومعدني غير محبب ورائحة مزعجة ❌'
		},
		{
			title: 'سهولة البلع والاستعمال',
			novavita: 'علكات طرية للمضغ بدون ماء في أي وقت وبأي مكان ✨',
			traditional: 'كبسولات صيدلانية ضخمة يصعب ابتلاعها ❌'
		},
		{
			title: 'الالتزام والاستمرارية',
			novavita: 'روتين صباحي ممتع كتسنايه كل نهار ومستحيل تنسايه 😍',
			traditional: 'كيتنسى بعد أسبوعين وتترك القارورة في الخزانة ❌'
		},
		{
			title: 'التأثير على المعدة والهضم',
			novavita: 'بكتين فواكه نباتي خفيف وسريع الامتصاص 3 مرات 🔬',
			traditional: 'ثقيلة على المعدة وقد تسبب حموضة وغثيان ❌'
		},
		{
			title: 'المصدر والجودة الحلال',
			novavita: '100% نباتي، حلال، وخالي تماماً من الجيلاتين الخنزيري 🇲🇦',
			traditional: 'مصدر الجيلاتين الحيواني غير واضح ومشكوك فيه ❌'
		}
	];
</script>

<section class="py-12 sm:py-20 bg-white border-b border-emerald-950/10">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
		
		<div class="text-center max-w-xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
				⚖️ المقارنة الواضحة
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				علاش علكات NOVAVITA كتتفوق على الحبوب التقليدية؟
			</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Comparison Table Responsive Wrapper -->
		<div class="overflow-hidden rounded-3xl border-2 border-emerald-950/15 shadow-xl bg-[#FAF8F5]">
			<table class="w-full text-start text-sm sm:text-base border-collapse" dir="rtl">
				<thead>
					<tr class="border-b border-emerald-950/10 bg-white">
						<th class="p-3.5 sm:p-5 text-start font-black text-stone-600 text-sm sm:text-base w-1/3">المعيار</th>
						<th class="p-3.5 sm:p-5 text-center font-black text-[#1B4332] bg-emerald-50/70 border-x border-emerald-950/10 w-1/3">
							<span class="block text-base sm:text-lg">حلوى NOVAVITA 🍓</span>
							<span class="text-xs sm:text-sm font-bold text-emerald-800">الحل الذكي الممتع</span>
						</th>
						<th class="p-3.5 sm:p-5 text-center font-bold text-stone-500 w-1/3">
							<span class="block text-base sm:text-lg">الحبوب العادية 💊</span>
							<span class="text-xs sm:text-sm">الروتين التقليدي</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-emerald-950/10 bg-white/60">
					{#each points as point}
						<tr class="hover:bg-white transition-colors">
							<td class="p-3.5 sm:p-5 font-bold text-sm sm:text-base text-[#1F2937] leading-relaxed">
								{point.title}
							</td>
							<td class="p-3.5 sm:p-5 text-center font-extrabold text-sm sm:text-base text-[#1B4332] bg-emerald-50/50 border-x border-emerald-950/10 leading-relaxed">
								{point.novavita}
							</td>
							<td class="p-3.5 sm:p-5 text-center font-medium text-sm sm:text-base text-stone-600 leading-relaxed">
								{point.traditional}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

	</div>
</section>
