<script lang="ts">
	interface Props {
		onCtaClick?: () => void;
	}

	let { onCtaClick }: Props = $props();

	function handleAction() {
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

	const certifications = [
		{
			id: 'gmp',
			badge: 'GMP CERTIFIED',
			title: 'جودة تصنيع دوائية معتمدة (GMP)',
			desc: 'تُصنّع علكات NOVAVITA وفق أعلى معايير ممارسات التصنيع الجيد (Good Manufacturing Practice) في مختبرات عالمية معتمدة لضمان أقصى درجات النقاء والفاعلية.'
		},
		{
			id: 'halal',
			badge: '100% HALAL & VEGAN',
			title: 'حلال 100% وبكتين فواكه نباتي',
			desc: 'خالية تماماً من أي جيلاتين أو مشتقات خنزيرية. نعتمد بكتين الفواكه الطبيعي والجيلاتين البقري الحلال المعتمد لضمان راحة بال مطلقة لكل سيدة مغربية.'
		},
		{
			id: 'lab',
			badge: 'LAB TESTED',
			title: 'فحص مخبري مستقل للنقاء',
			desc: 'كل دفعة إنتاج تخضع لتحاليل مخبرية دقيقة (Third-Party Lab Tested) للتأكد من خلوها التام من المعادن الثقيلة، المبيدات، والملونات الصناعية الضارة.'
		},
		{
			id: 'safety',
			badge: 'FOOD SAFETY',
			title: 'مطابقة لمعايير السلامة الصحية',
			desc: 'تركيبة مرخصة ومطابقة لمعايير السلامة الغذائية بالمغرب وللمعايير الصحية الدولية، مصممة خصيصاً للاستهلاك اليومي الآمن بدون أي آثار جانبية.'
		}
	];

	const dosages = [
		{
			name: 'علكات البيوتين المركزة',
			target: 'إنبات الفراغات ووقف التساقط',
			dose: '3000 mcg',
			synergy: '+ زنك نقي + فيتامين C',
			color: 'border-rose-200 bg-rose-50/50 text-[#E86A7C]',
			details: 'جرعة صيدلانية دقيقة من البيوتين النقي (3000 ميكروغرام) تعمل مباشرة على تسريع تخليق الكيراتين وتغذية الجذور العميقة، مدعومة بالزنك لضبط إفراز الدهون وفيتامين C لتقوية ألياف الشعر.'
		},
		{
			name: 'كولاجين البشرة البحري',
			target: 'مرونة الجلد ومقاومة التجاعيد',
			dose: 'Hydrolyzed Marine Collagen',
			synergy: '+ حمض الهيالورونيك (Hyaluronic Acid)',
			color: 'border-emerald-200 bg-emerald-50/50 text-[#1B4332]',
			details: 'كولاجين بحري متحلل بجزيئات ميكرونية دقيقة يمتصها الجسم أسرع 3 مرات من الكبسولات العادية، مدمج بحمض الهيالورونيك لحبس الرطوبة داخل طبقات الجلد وملء الخطوط التعبيرية.'
		},
		{
			name: 'الملتي فيتامين الشامل',
			target: 'محاربة الإرهاق وتعزيز المناعة',
			dose: '13 فيتامين ومعدن أساسي',
			synergy: '+ B-Complex كامل + Folic Acid',
			color: 'border-amber-200 bg-amber-50/50 text-amber-800',
			details: 'توليفة يومية مدروسة تضم فيتامينات (A, C, D3, E, K1) مع مجموعة فيتامينات B المركبة وحمض الفوليك لتعويض النقص الغذائي، رفع طاقة الجسم الحيوية، وحماية الخلايا من الإجهاد التأكسدي.'
		}
	];
</script>

<section id="science" class="py-14 sm:py-24 bg-[#FAF8F5] border-b border-emerald-950/10" dir="rtl">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
		
		<!-- Section Header -->
		<div class="text-center max-w-3xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs font-black text-[#1B4332] border border-emerald-900/10">
				<svg class="w-3.5 h-3.5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0 1 15.9 16.5H8.1a4.5 4.5 0 0 1-2.33-.658L4.2 14.9"/>
				</svg>
				<span>الأدلة العلمية ومعايير التصنيع الدوائي</span>
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
				ليس مجرد حلوى.. بل تركيبة علاجية بالجرعات الصيدلانية الدقيقة
			</h2>
			<p class="text-base sm:text-lg leading-relaxed text-gray-700 font-medium">
				فارق علمي حقيقي: امتصاص يبدأ من الفم بنسبة تصل إلى 92% مقارنة بـ 20% فقط للحبوب والكبسولات التقليدية
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#1B4332]"></div>
		</div>

		<!-- 4 Regulatory & Trust Certifications Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
			{#each certifications as cert}
				<div class="rounded-3xl bg-white p-6 shadow-md border border-emerald-950/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1B4332]">
								{#if cert.id === 'gmp'}
									<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/>
									</svg>
								{:else if cert.id === 'halal'}
									<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/>
										<path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5l2.5 2.5 5-5"/>
									</svg>
								{:else if cert.id === 'lab'}
									<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
									</svg>
								{:else}
									<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0012 3c-2.392 0-4.736.278-6.984.785a48.35 48.35 0 00-1.118 18.897c.127.35.423.566.787.566h6.63c.364 0 .66-.216.787-.566A48.35 48.35 0 0019.5 4.285 48.37 48.37 0 0012 3.5c-.17 0-.34 0-.51.006z"/>
									</svg>
								{/if}
							</div>
							<span class="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
								{cert.badge}
							</span>
						</div>
						<h3 class="font-display text-base sm:text-lg font-black text-[#1B4332]">
							{cert.title}
						</h3>
						<p class="text-sm sm:text-base text-gray-600 leading-relaxed font-medium">
							{cert.desc}
						</p>
					</div>
					<div class="pt-4 border-t border-stone-100 flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 mt-4">
						<svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
						</svg>
						<span>معتمد ومطابق للمواصفات</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Clinical Dosages Detailed Breakdown (Alternating Zig-Zag Rows) -->
		<div class="rounded-3xl bg-white p-6 sm:p-10 border-2 border-emerald-950/10 shadow-xl space-y-10">
			
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<span class="text-xs sm:text-sm font-black text-[#E86A7C] uppercase tracking-wider">Clinical Dosage Breakdown</span>
				<h3 class="font-display text-xl sm:text-3xl font-black text-[#1B4332]">
					الجرعات الصيدلانية الدقيقة في كل عبوة
				</h3>
				<p class="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
					تحتوي كل عبوة على 25 علكة مركزة سهلة المضغ. الروتين الموصى به: علكتان يومياً مع إحدى الوجبات الرئيسية لامتصاص مثالي.
				</p>
			</div>

			<div class="space-y-8">
				{#each dosages as d, index}
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 rounded-2xl border {d.color}">
						
						<!-- Visual / Badge side (Switches on Even / Odd) -->
						<div class={`lg:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white/80 shadow-xs border border-stone-200/60 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
							<span class="text-sm font-bold text-stone-600">{d.target}</span>
							<span class="font-display text-xl sm:text-2xl font-black text-[#1B4332] mt-1" dir="ltr">{d.dose}</span>
							<span class="text-xs sm:text-sm font-extrabold text-[#E86A7C] mt-0.5">{d.synergy}</span>
							<div class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
								<svg class="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
								<span>كورس 25 علكة مضغ</span>
							</div>
						</div>


						<!-- Description & Cellular Action side -->
						<div class={`lg:col-span-8 space-y-3 text-start ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
							<div class="flex items-center gap-2">
								<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4332] text-white text-xs font-black">
									{index + 1}
								</span>
								<h4 class="font-display text-lg sm:text-xl font-black text-[#1F2937]">
									{d.name}
								</h4>
							</div>
							<p class="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
								{d.details}
							</p>
							<div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 pt-1">
								<span class="bg-white px-3 py-1 rounded-md border border-stone-200">امتصاص خلوى فوري</span>
								<span class="bg-white px-3 py-1 rounded-md border border-stone-200">خالي من السكر الزائد</span>
								<span class="bg-white px-3 py-1 rounded-md border border-stone-200">بدون إرهاق للمعدة</span>
							</div>
						</div>

					</div>
				{/each}
			</div>

			<!-- Quick Call to Action -->
			<div class="pt-4 text-center">
				<button
					type="button"
					onclick={handleAction}
					class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-95 px-8 py-3 text-base sm:text-lg font-bold text-white shadow-lg shadow-emerald-950/15 transition-all duration-300 cursor-pointer"
				>
					<span>اختاري روتينكِ العلاجي المعتمد الآن</span>
					<span class="text-base">←</span>
				</button>
			</div>

		</div>

	</div>
</section>
