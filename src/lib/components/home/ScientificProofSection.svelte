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
		const el = document.getElementById('order-section');
		if (el) el.scrollIntoView({ behavior: 'smooth' });
	}

	const certifications = [
		{
			icon: '🔬',
			badge: 'GMP CERTIFIED',
			title: 'جودة تصنيع دوائية معتمدة (GMP)',
			desc: 'تُصنّع علكات NOVAVITA وفق أعلى معايير ممارسات التصنيع الجيد (Good Manufacturing Practice) في مختبرات عالمية معتمدة لضمان أقصى درجات النقاء والفاعلية.'
		},
		{
			icon: '🌿',
			badge: '100% HALAL & VEGAN',
			title: 'حلال 100% وبكتين فواكه نباتي',
			desc: 'خالية تماماً من أي جيلاتين أو مشتقات خنزيرية. نعتمد بكتين الفواكه الطبيعي والجيلاتين البقري الحلال المعتمد لضمان راحة بال مطلقة لكل سيدة مغربية.'
		},
		{
			icon: '🧪',
			badge: 'LAB TESTED',
			title: 'فحص مخبري مستقل للنقاء',
			desc: 'كل دفعة إنتاج تخضع لتحاليل مخبرية دقيقة (Third-Party Lab Tested) للتأكد من خلوها التام من المعادن الثقيلة، المبيدات، والملونات الصناعية الضارة.'
		},
		{
			icon: '🛡️',
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
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs font-black text-[#1B4332] border border-emerald-900/10">
				🔬 الأدلة العلمية ومعايير التصنيع الدوائي
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
				ليس مجرد حلوى.. بل تركيبة علاجية مثبتة بالجرعات الدقيقة
			</h2>
			<p class="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
				صُنعت NOVAVITA في مختبرات عالمية معتمدة وفق أدق معايير السلامة، لنمنحك نتائج ملموسة تبدأ من الخلايا وتظهر على شعرك وبشرتك بنكهة لذيذة ومضغ مريح.
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#1B4332]"></div>
		</div>

		<!-- 4 Regulatory & Trust Certifications Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
			{#each certifications as cert}
				<div class="rounded-3xl bg-white p-6 shadow-md border border-emerald-950/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-3xl">{cert.icon}</span>
							<span class="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
								{cert.badge}
							</span>
						</div>
						<h3 class="font-display text-base font-black text-[#1B4332]">
							{cert.title}
						</h3>
						<p class="text-xs text-stone-600 leading-relaxed font-medium">
							{cert.desc}
						</p>
					</div>
					<div class="pt-4 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 mt-4">
						<span>✓</span>
						<span>معتمد ومطابق للمواصفات</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Clinical Dosages Detailed Breakdown (Alternating Zig-Zag Rows) -->
		<div class="rounded-3xl bg-white p-6 sm:p-10 border-2 border-emerald-950/10 shadow-xl space-y-10">
			
			<div class="text-center max-w-2xl mx-auto space-y-2">
				<span class="text-xs font-black text-[#E86A7C] uppercase tracking-wider">Clinical Dosage Breakdown</span>
				<h3 class="font-display text-xl sm:text-3xl font-black text-[#1B4332]">
					الجرعات الصيدلانية الدقيقة في كل عبوة
				</h3>
				<p class="text-xs sm:text-sm text-stone-500 font-medium">
					تحتوي كل عبوة على 25 علكة مركزة سهلة المضغ. الروتين الموصى به: علكتان يومياً مع إحدى الوجبات الرئيسية لامتصاص مثالي.
				</p>
			</div>

			<div class="space-y-8">
				{#each dosages as d, index}
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 rounded-2xl border {d.color}">
						
						<!-- Visual / Badge side (Switches on Even / Odd) -->
						<div class={`lg:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white/80 shadow-xs border border-stone-200/60 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
							<span class="text-xs font-bold text-stone-500">{d.target}</span>
							<span class="font-display text-xl sm:text-2xl font-black text-[#1B4332] mt-1" dir="ltr">{d.dose}</span>
							<span class="text-xs font-extrabold text-[#E86A7C] mt-0.5">{d.synergy}</span>
							<div class="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
								<span>💊 كورس 25 علكة مضغ</span>
							</div>
						</div>

						<!-- Description & Cellular Action side -->
						<div class={`lg:col-span-8 space-y-3 text-start ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
							<div class="flex items-center gap-2">
								<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4332] text-white text-xs font-black">
									{index + 1}
								</span>
								<h4 class="font-display text-lg font-black text-[#1F2937]">
									{d.name}
								</h4>
							</div>
							<p class="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
								{d.details}
							</p>
							<div class="flex flex-wrap items-center gap-2 text-[11px] font-bold text-stone-500 pt-1">
								<span class="bg-white px-2.5 py-0.5 rounded-md border border-stone-200">امتصاص خلوى فوري</span>
								<span class="bg-white px-2.5 py-0.5 rounded-md border border-stone-200">خالي من السكر الزائد</span>
								<span class="bg-white px-2.5 py-0.5 rounded-md border border-stone-200">بدون إرهاق للمعدة</span>
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
					class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-95 px-8 py-3 text-sm sm:text-base font-black text-white shadow-lg shadow-emerald-950/15 transition-all duration-300 cursor-pointer"
				>
					<span>اختاري روتينكِ العلاجي المعتمد الآن</span>
					<span class="text-base">←</span>
				</button>
			</div>

		</div>

	</div>
</section>
