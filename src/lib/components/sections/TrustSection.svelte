<script lang="ts">
	interface Props {
		whatsappNumber?: string;
		brandName?: string;
		supportHours?: string;
	}

	let {
		whatsappNumber = '212626558375',
		brandName = 'Lhamza Shop',
		supportHours = 'طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً'
	}: Props = $props();

	const cleanWa = $derived(whatsappNumber.replace(/\D/g, '') || '212626558375');
	const defaultWaMessage = 'السلام عليكم Lhamza Shop، بغيت نستفسر على المنتجات وعندي سؤال لخدمة الزبناء';
	const waUrl = $derived(`https://wa.me/${cleanWa}?text=${encodeURIComponent(defaultWaMessage)}`);
</script>

<section id="why" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-14 pb-8" dir="rtl">
	<!-- Section Header -->
	<div class="text-center space-y-2 mb-10">
		<div class="inline-flex items-center gap-2 rounded-full border border-[#C99738]/30 bg-[#C99738]/10 px-4 py-1 text-xs font-bold text-[#C99738]">
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
			<span>التزامنا بالجودة والثقة</span>
		</div>
		<h2 class="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B]">
			علاش يختارونا المغاربة؟
		</h2>
		<p class="mx-auto max-w-lg text-xs sm:text-sm text-stone-500 leading-relaxed">
			تجربة تسوق آمنة ومريحة من البداية حتى كتوصلك السلعة وتجربها بيدك.
		</p>
		<div class="mx-auto mt-3 h-0.5 w-20 rounded-full bg-[#1B4332]"></div>
	</div>

	<!-- 1. The 3 Core Trust Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<!-- Card 1: Package Inspection -->
		<div class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1B4332]/40 hover:shadow-xl">
			<!-- Subtle Moroccan Geometric Pattern Accent (<= 5% opacity) -->
			<div class="pointer-events-none absolute -end-6 -bottom-6 h-28 w-28 text-[#1B4332] opacity-[0.04]" aria-hidden="true">
				<svg viewBox="0 0 100 100" fill="currentColor">
					<polygon points="50,0 62,38 100,50 62,62 50,100 38,62 0,50 38,38" />
					<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="4" />
				</svg>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C99738] shadow-xs transition-transform duration-300 group-hover:scale-105">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
						</svg>
					</span>
					<span class="text-xs font-bold text-[#C99738] bg-[#C99738]/10 px-2.5 py-1 rounded-full">
						مكفول 100%
					</span>
				</div>
				<div>
					<h3 class="font-display text-lg font-bold text-[#1E293B]">
						فتح الكولية وقلّب عاد خلّص
					</h3>
					<p class="mt-2 text-xs sm:text-sm leading-loose text-stone-600">
						حق المعاينة مكفول قانونياً وأخلاقياً. تأكد من جودة المنتج وجميع قطعه قبل دفع أي درهم للموزع.
					</p>
				</div>
			</div>
			<div class="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
				<svg class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
				<span>معاينة مجانية أمام الموزع قبل الدفع</span>
			</div>
		</div>

		<!-- Card 2: Direct Fast Delivery -->
		<div class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1B4332]/40 hover:shadow-xl">
			<!-- Subtle Moroccan Geometric Pattern Accent (<= 5% opacity) -->
			<div class="pointer-events-none absolute -end-6 -bottom-6 h-28 w-28 text-[#1B4332] opacity-[0.04]" aria-hidden="true">
				<svg viewBox="0 0 100 100" fill="currentColor">
					<polygon points="50,0 62,38 100,50 62,62 50,100 38,62 0,50 38,38" />
					<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="4" />
				</svg>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C99738] shadow-xs transition-transform duration-300 group-hover:scale-105">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
						</svg>
					</span>
					<span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
						24h - 48h
					</span>
				</div>
				<div>
					<h3 class="font-display text-lg font-bold text-[#1E293B]">
						توصيل مباشر حتى لباب دارك
					</h3>
					<p class="mt-2 text-xs sm:text-sm leading-loose text-stone-600">
						خدمة توصيل سريعة ومجانية تغطي كافة ربوع المملكة خلال 24 إلى 48 ساعة فقط.
					</p>
				</div>
			</div>
			<div class="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
				<svg class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
				<span>توصيل مجاني لكافة المدن والقرى</span>
			</div>
		</div>

		<!-- Card 3: 14-Day Replacement Warranty -->
		<div class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1B4332]/40 hover:shadow-xl">
			<!-- Subtle Moroccan Geometric Pattern Accent (<= 5% opacity) -->
			<div class="pointer-events-none absolute -end-6 -bottom-6 h-28 w-28 text-[#1B4332] opacity-[0.04]" aria-hidden="true">
				<svg viewBox="0 0 100 100" fill="currentColor">
					<polygon points="50,0 62,38 100,50 62,62 50,100 38,62 0,50 38,38" />
					<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="4" />
				</svg>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C99738] shadow-xs transition-transform duration-300 group-hover:scale-105">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0 1 12 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 0 1-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 0 1 4.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z" />
						</svg>
					</span>
					<span class="text-xs font-bold text-[#C99738] bg-[#C99738]/10 px-2.5 py-1 rounded-full">
						14 يوماً
					</span>
				</div>
				<div>
					<h3 class="font-display text-lg font-bold text-[#1E293B]">
						ضمان استبدال رسمي لمدة 14 يوماً
					</h3>
					<p class="mt-2 text-xs sm:text-sm leading-loose text-stone-600">
						خدمة ما بعد البيع رهن إشارتك؛ في حال وجود أي ملاحظة أو عيب نقوم باستبدال المنتج مجاناً وبدون تعقيدات.
					</p>
				</div>
			</div>
			<div class="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
				<svg class="h-4 w-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
				<span>استبدال فوري أو استرجاع كامل</span>
			</div>
		</div>
	</div>

	<!-- 2. Professional Customer Service & Advisory Card -->
	<div id="offer" class="mt-8 scroll-mt-24 relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)]">
		<!-- Subtle decorative background gradient -->
		<div class="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#1B4332]/5 blur-3xl" aria-hidden="true"></div>
		<div class="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-[#C99738]/10 blur-3xl" aria-hidden="true"></div>

		<div class="relative flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
			<!-- Info & Details -->
			<div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4 sm:gap-5 flex-1">
				<div class="relative">
					<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1B4332] text-white shadow-md">
						<svg class="h-8 w-8 text-[#C99738]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
						</svg>
					</div>
					<!-- Online pulse dot -->
					<span class="absolute -top-1 -right-1 flex h-4 w-4">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></span>
					</span>
				</div>

				<div class="space-y-1.5">
					<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
						<h3 class="font-display text-xl sm:text-2xl font-bold text-[#1E293B]">
							فريق خدمة الزبناء في خدمتك
						</h3>
						<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
							متصلون الآن
						</span>
					</div>
					<p class="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
						عندك أي استفسار على طريقة الاستعمال، المقاسات، تتبع الشحنة، أو خدمة ما بعد البيع؟ مستشارو الطلبات متواجدون لمساعدتك خطوة بخطوة.
					</p>
					<div class="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs font-semibold text-stone-500">
						<svg class="h-4 w-4 text-[#C99738]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
						<span>أوقات العمل الرسمية: {supportHours}</span>
					</div>
				</div>
			</div>

			<!-- Official WhatsApp Action CTA -->
			<div class="w-full sm:w-auto shrink-0 flex flex-col items-center sm:items-end">
				<a
					href={waUrl}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-13 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 sm:px-8 py-3.5 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#20ba56] hover:shadow-xl active:scale-[0.98]"
				>
					<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
					</svg>
					<span class="text-sm sm:text-base font-bold text-center">
						تواصل مع مستشار الطلبات مباشرة عبر WhatsApp
					</span>
				</a>
				<span class="mt-2 text-[11px] text-stone-500 font-medium">
					إجابة سريعة • استشارة مجانية قبل تأكيد طلبك
				</span>
			</div>
		</div>
	</div>
</section>
