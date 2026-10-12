<script lang="ts">
	const faqs = [
		{
			q: 'واش العلكات كيزيدو فالوزن ولا فيهم السكر؟',
			a: 'لا نهائياً! علكات نوفافيتا خالية تماماً من السكر المضاف ومصنوعة من بكتين الفواكه الطبيعي. العلكة الواحدة فيها سعرات حرارية شبه منعدمة (أقل من 8 سعرات) وماكتفتحش الشهية للأكل.'
		},
		{
			q: 'فوقاش كيبانو أول النتائج ديال الكولاجين والبيوتين؟',
			a: 'أغلب السيدات كيلاحظو ترطيب ونضارة فالبشرة ونقصان تساقط الشعر من الأسبوع الثالث. للحصول على أقصى كثافة للشعر وتجديد خلايا البشرة كنصحو بمتابعة الكورس لمدة 3 أشهر (3 قراعي).'
		},
		{
			q: 'واش حلال وآمنة للاستخدام اليومي؟',
			a: 'نعم 100%، جميع منتجات نوفافيتا حاصلة على شهادات الجودة وحلال وخالية من الجيلاتين الحيواني ومن الجلوتين ومصنعة وفق أعلى المعايير الصيدلانية الدولية.'
		},
		{
			q: 'كيفاش كيتم التوصيل والدفع؟',
			a: 'التوصيل بالمجان لجميع المدن المغربية والدفع عند الاستلام. حتى كتوصلك الطلبية ديالك لباب الدار وتأكدي منها عاد كتخلصي الموزع.'
		}
	];

	let openIndex = $state<number | null>(0);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="py-14 sm:py-24 bg-white border-b border-emerald-950/10" dir="rtl">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
		
		<div class="text-center max-w-xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs font-black text-[#1B4332] border border-emerald-900/10">
				<svg class="w-3.5 h-3.5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.502 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.27z"/>
				</svg>
				<span>إجابات واضحة ومباشرة</span>
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				ما تودين معرفته عن NOVAVITA (الأسئلة الشائعة)
			</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#E86A7C]"></div>
		</div>

		<!-- Accordion items -->
		<div class="space-y-3.5" dir="rtl">
			{#each faqs as faq, i}
				<div class="rounded-2xl border border-stone-200/80 bg-[#FAF8F5] overflow-hidden transition-all duration-200 {openIndex === i ? 'ring-2 ring-[#1B4332]/10 border-[#1B4332]/30 bg-white' : 'hover:border-stone-300'}">
					<button
						type="button"
						onclick={() => toggle(i)}
						class="flex w-full items-center justify-between p-4 sm:p-5 text-start font-bold text-base sm:text-lg text-[#1F2937] hover:text-[#1B4332] transition-colors cursor-pointer gap-4"
					>
						<span>{faq.q}</span>
						<span class={`flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950/5 text-[#1B4332] shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 bg-[#1B4332] text-white' : ''}`}>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</span>
					</button>

					{#if openIndex === i}
						<div class="px-5 pb-6 pt-2 text-sm sm:text-base leading-relaxed text-gray-700 font-medium border-t border-stone-100">
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>

	</div>
</section>

