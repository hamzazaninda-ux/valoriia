<script lang="ts">
	const faqs = [
		{
			q: 'إمتى كيبداو يبانو النتائج؟',
			a: 'أول ما كتلاحظيه خلال أول أسبوعين هو توقف تكسر الأظافر وزيادة نضارة ورطوبة البشرة. أما بالنسبة لنمو وكثافة الشعر ووقف التساقط فكتبدا النتيجة تبان بوضوح بعد 4 إلى 6 أسابيع من الاستعمال اليومي المنتظم.'
		},
		{
			q: 'كيفاش كنستعمل NOVAVITA وشحال ناكل في النهار؟',
			a: 'تناولي حبتين (2 Gummies) يومياً في أي وقت تفضلينه، ويفضل صباحاً بعد وجبة الفطور. كتمضغيهم بحال الحلوى بكل سهولة وبلا ما تحتاجي للماء.'
		},
		{
			q: 'واش فيها جيلاتين خنزيري أو سكر مضاف يربي الوزن؟',
			a: 'لا أبداً! NOVAVITA حلال 100% ومصنوعة من بكتين الفواكه النباتي النقي، خالية تماماً من الجيلاتين الحيواني الخنزيري، وحبتان في اليوم يحتويان على أقل من 15 سعرة حرارية، يعني ما كيزيدوش في الوزن إطلاقاً.'
		},
		{
			q: 'كيفاش كيدوز الطلب وطريقة الدفع والتوصيل بالمغرب؟',
			a: 'الطلب بسيط جداً: كتعمري استمارة الطلب برقم هاتفك، كيتصل بيك فريق التأكيد، والطلب كيوصلك حتى للدار في 24 إلى 48 ساعة. الدفع كيكون نقداً عند الاستلام بعد ما تفتحي وتعايني طردك بنفسك!'
		}
	];

	let openIndex = $state<number | null>(0);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="py-12 sm:py-20 bg-white border-b border-emerald-950/10">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
		
		<div class="text-center max-w-xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
				💬 الأسئلة الشائعة
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				كل ما تودين معرفته عن NOVAVITA
			</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Accordion items -->
		<div class="space-y-3.5" dir="rtl">
			{#each faqs as faq, i}
				<div class="rounded-2xl border border-stone-200/80 bg-[#FAF8F5] overflow-hidden transition-all duration-200">
					<button
						type="button"
						onclick={() => toggle(i)}
						class="flex w-full items-center justify-between p-4 sm:p-5 text-start font-bold text-sm sm:text-base text-[#1F2937] hover:text-[#1B4332] transition-colors"
					>
						<span>{faq.q}</span>
						<span class={`text-lg font-bold transition-transform duration-200 text-[#1B4332] ${openIndex === i ? 'rotate-180' : ''}`}>
							▼
						</span>
					</button>

					{#if openIndex === i}
						<div class="px-4 pb-5 pt-1 text-xs sm:text-sm font-medium leading-relaxed text-stone-600 border-t border-stone-200/60">
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>

	</div>
</section>
