<script lang="ts">
	const reviews = [
		{
			name: 'سلمى العلمي',
			city: 'الدار البيضاء',
			age: '28 سنة',
			stars: 5,
			badge: 'شراء مؤكد ✓',
			date: 'منذ أسبوعين',
			text: 'بعد الولادة شعري ولا كيطيح بالخصلات وتخلعت بزاااف. جربت شحال د المكملات وكانو كيروعو ليا المعدة. مع NOVAVITA تغير كلشي، المذاق بحال شي بونبون كيحمق، ودابا كملت شهرين: التساقط حبس تماماً وخلف ليا البيبي هير بكثافة! كنصح بيهم كل بنت.'
		},
		{
			name: 'مريم بنجلون',
			city: 'الرباط',
			age: '34 سنة',
			stars: 5,
			badge: 'شراء مؤكد ✓',
			date: 'منذ 3 أسابيع',
			text: 'أحسن استثمار درتو في راسي هاد العام. أظافري كانو كيتهرسو غير بوحدهم ودابا ولاو قاصحين، وبشرتي ولات فيها واحد النضارة كاع صحاباتي في الخدمة سولوني على السر ديالها. شكراً على سرعة التوصيل والمعاملة الراقية.'
		},
		{
			name: 'كنزة المرابط',
			city: 'مراكش',
			age: '25 سنة',
			stars: 5,
			badge: 'شراء مؤكد ✓',
			date: 'منذ شهر',
			text: 'الكونسيبت واعر بزاف! عمري قدرت نتبع كورس ديال الفيتامينات حتى لهاد المرة حيت الطعم كيشهي ومكتحسيش براسك مريضة كتشربي دوا. التوصيل وصلني في 24 ساعة لدارنا وفحصت الطرد قبل ما نخلص.'
		}
	];
</script>

<section class="py-12 sm:py-20 bg-[#FAF8F5] border-b border-emerald-950/10">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
		
		<div class="text-center max-w-xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
				⭐ تجارب حقيقية
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				شنو كيقولو زبوناتنا في المغرب؟
			</h2>
			<p class="text-sm sm:text-base text-stone-600 font-medium">
				أكثر من 1,450 سيدة مغربية اختارت NOVAVITA وحصلت على نتائج ملموسة
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#1B4332]"></div>
		</div>

		<!-- Reviews Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each reviews as review}
				<div class="flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 shadow-lg border border-emerald-950/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="flex text-[#F59E0B] gap-1">
								{#each Array(review.stars) as _}
									<svg class="w-4 h-4 fill-current text-[#F59E0B]" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
								{review.badge}
							</span>
						</div>

						<p class="text-xs sm:text-sm font-medium leading-relaxed text-[#1F2937]/90 text-start">
							"{review.text}"
						</p>
					</div>

					<div class="pt-6 border-t border-stone-100 flex items-center justify-between text-xs mt-4">
						<div class="flex flex-col text-start">
							<span class="font-extrabold text-[#1B4332] text-sm">{review.name}</span>
							<span class="text-stone-400 font-semibold">{review.city} ({review.age})</span>
						</div>
						<span class="text-stone-400 font-medium text-[11px]">{review.date}</span>
					</div>
				</div>
			{/each}
		</div>

	</div>
</section>
