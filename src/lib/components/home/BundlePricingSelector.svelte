<script lang="ts">
	import { PRICING_TIERS, type PricingTier } from '$lib/constants/pricing';

	interface Props {
		selectedTier?: 'tier_1' | 'tier_2' | 'tier_3';
		isSubmitting?: boolean;
		onSelectTier?: (tier: 'tier_1' | 'tier_2' | 'tier_3') => void;
		onSubmitOrder?: (orderData: { fullName: string; phone: string; tier: 'tier_1' | 'tier_2' | 'tier_3' }) => void;
	}

	let {
		selectedTier = $bindable<'tier_1' | 'tier_2' | 'tier_3'>('tier_2'),
		isSubmitting = false,
		onSelectTier,
		onSubmitOrder
	}: Props = $props();

	let fullName = $state('');
	let phone = $state('');
	let phoneError = $state('');
	let localSubmitting = $state(false);

	function selectTier(tierId: 'tier_1' | 'tier_2' | 'tier_3') {
		selectedTier = tierId;
		onSelectTier?.(tierId);
	}

	function validatePhone(input: string): boolean {
		const cleaned = input.replace(/[\s\-\(\)]/g, '');
		const regex = /^(?:(?:\+?212)|0)[67]\d{8}$/;
		return regex.test(cleaned);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		phoneError = '';

		if (!fullName.trim() || fullName.trim().length < 2) {
			phoneError = 'يرجى إدخال اسمك الكامل بشكل صحيح.';
			return;
		}

		if (!validatePhone(phone)) {
			phoneError = 'يرجى كتابة رقم هاتف مغربي صحيح (مثلاً: 0612345678)';
			return;
		}

		if (localSubmitting || isSubmitting) return;
		localSubmitting = true;

		if (onSubmitOrder) {
			onSubmitOrder({
				fullName: fullName.trim(),
				phone: phone.trim().replace(/[\s\-\(\)]/g, ''),
				tier: selectedTier
			});
			// Reset local debounce state after short guard
			setTimeout(() => {
				localSubmitting = false;
			}, 2500);
		}
	}
</script>

<section id="order-section" class="scroll-mt-20 py-12 sm:py-20 bg-[#FAF8F5] border-b border-emerald-950/10">
	<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
		
		<!-- Section Header -->
		<div class="text-center max-w-2xl mx-auto space-y-3">
			<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/10 px-3.5 py-1 text-xs font-bold text-[#1B4332]">
				🎁 عروض التوفير الحصرية بالمغرب
			</span>
			<h2 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332]">
				اختاري باقتك المناسبة مع التوصيل المجاني
			</h2>
			<p class="text-sm sm:text-base text-stone-600 font-medium">
				الدفع نقداً بعد الاستلام ومعاينة طلبيتك بنفسك • نتائج مضمونة من أول شهر
			</p>
			<div class="mx-auto h-1 w-20 rounded-full bg-[#1B4332]"></div>
		</div>

		<!-- 3 Tier Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
			
			<!-- Tier 1: Trial (1 Bottle) -->
			<button
				type="button"
				onclick={() => selectTier('tier_1')}
				class={`relative flex flex-col text-start rounded-3xl p-5 sm:p-6 transition-all duration-300 bg-white border-2 cursor-pointer ${
					selectedTier === 'tier_1'
						? 'border-[#1B4332] shadow-xl ring-2 ring-[#1B4332]/20 -translate-y-1'
						: 'border-stone-200/80 shadow-sm hover:border-stone-300'
				}`}
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
						{PRICING_TIERS.tier_1.badge}
					</span>
					<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_1' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
						{#if selectedTier === 'tier_1'}
							<div class="w-2 h-2 rounded-full bg-white"></div>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					<h3 class="font-display text-lg font-black text-[#1F2937]">باقة التجربة (علبة واحدة)</h3>
					<p class="text-xs text-stone-500 mt-1">كورس تجريبي (30 يوم / 60 حبة)</p>
				</div>

				<div class="mt-6 flex items-baseline gap-2">
					<span class="font-display text-3xl font-black text-[#1B4332]">199 MAD</span>
					<span class="text-sm text-stone-400 line-through">299 MAD</span>
				</div>

				<div class="mt-3 text-xs font-semibold text-stone-500 flex items-center gap-1.5">
					<span>🚚</span>
					<span>مصاريف الشحن القياسي: 29 درهم</span>
				</div>

				<ul class="mt-6 space-y-2 text-xs font-bold text-stone-600 border-t border-stone-100 pt-4">
					<li class="flex items-center gap-2"><span>✓</span> 1 علبة من اختيارك</li>
					<li class="flex items-center gap-2"><span>✓</span> تكفي شهراً كاملاً</li>
					<li class="flex items-center gap-2"><span>✓</span> الدفع عند الاستلام بعد المعاينة</li>
				</ul>
			</button>

			<!-- Tier 2: Duo (2 Bottles) — Best Value Pre-selected -->
			<button
				type="button"
				onclick={() => selectTier('tier_2')}
				class={`relative flex flex-col text-start rounded-3xl p-5 sm:p-6 transition-all duration-300 bg-white border-2 cursor-pointer ${
					selectedTier === 'tier_2'
						? 'border-[#1B4332] shadow-2xl ring-4 ring-[#1B4332]/20 -translate-y-2'
						: 'border-[#1B4332]/60 shadow-md hover:border-[#1B4332]'
				}`}
			>
				<!-- Top Floating Badge -->
				<div class="absolute -top-3.5 inset-x-0 mx-auto w-max px-4 py-1 rounded-full bg-[#1B4332] text-white text-[11px] sm:text-xs font-black shadow-md flex items-center gap-1">
					<span>⭐ الأكثر طلباً - توفير 119 درهم</span>
				</div>

				<div class="flex items-center justify-between mt-2">
					<span class="text-xs font-extrabold text-[#E86A7C] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
						كورس شهرين متكامل
					</span>
					<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_2' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
						{#if selectedTier === 'tier_2'}
							<div class="w-2 h-2 rounded-full bg-white"></div>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					<h3 class="font-display text-lg font-black text-[#1F2937]">باقة الثنائي (علبتان)</h3>
					<p class="text-xs text-stone-500 mt-1">كورس كامل لوقف التساقط وظهور البيبي هير</p>
				</div>

				<div class="mt-6 flex items-baseline gap-2">
					<span class="font-display text-3xl font-black text-[#1B4332]">279 MAD</span>
					<span class="text-sm text-stone-400 line-through">398 MAD</span>
				</div>

				<div class="mt-3 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-max flex items-center gap-1">
					<span>🚚</span>
					<span>توصيل فابور مجاني وسريع</span>
				</div>

				<ul class="mt-6 space-y-2 text-xs font-bold text-stone-700 border-t border-emerald-950/10 pt-4">
					<li class="flex items-center gap-2 text-emerald-900"><span>✓</span> <strong>علبتان (120 حبة) لكورس شهرين</strong></li>
					<li class="flex items-center gap-2"><span>✓</span> إمكانية مزج البيوتين والكولاجين</li>
					<li class="flex items-center gap-2"><span>✓</span> <strong>توصيل مجاني 100%</strong> لجميع المدن</li>
					<li class="flex items-center gap-2 text-[#E86A7C]"><span>🎁</span> هدية: فرشاة مساج الفروة</li>
				</ul>
			</button>

			<!-- Tier 3: Trio (3 Bottles) — Ultimate Transformation -->
			<button
				type="button"
				onclick={() => selectTier('tier_3')}
				class={`relative flex flex-col text-start rounded-3xl p-5 sm:p-6 transition-all duration-300 bg-white border-2 cursor-pointer ${
					selectedTier === 'tier_3'
						? 'border-[#1B4332] shadow-xl ring-2 ring-[#1B4332]/20 -translate-y-1'
						: 'border-stone-200/80 shadow-sm hover:border-stone-300'
				}`}
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
						{PRICING_TIERS.tier_3.badge}
					</span>
					<div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === 'tier_3' ? 'border-[#1B4332] bg-[#1B4332]' : 'border-stone-300'}`}>
						{#if selectedTier === 'tier_3'}
							<div class="w-2 h-2 rounded-full bg-white"></div>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					<h3 class="font-display text-lg font-black text-[#1F2937]">التحول الشامل (3 علب)</h3>
					<p class="text-xs text-stone-500 mt-1">كورس 3 أشهر للشعر، البشرة والأظافر</p>
				</div>

				<div class="mt-6 flex items-baseline gap-2">
					<span class="font-display text-3xl font-black text-[#1B4332]">349 MAD</span>
					<span class="text-sm text-stone-400 line-through">597 MAD</span>
				</div>

				<div class="mt-3 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-max flex items-center gap-1">
					<span>🚚</span>
					<span>توصيل فابور مجاني وفوري</span>
				</div>

				<ul class="mt-6 space-y-2 text-xs font-bold text-stone-600 border-t border-stone-100 pt-4">
					<li class="flex items-center gap-2"><span>✓</span> 3 علب (180 حبة) — فقط 116 MAD للعلبة</li>
					<li class="flex items-center gap-2"><span>✓</span> روتين شامل متكامل</li>
					<li class="flex items-center gap-2"><span>✓</span> توصيل مجاني وسريع</li>
					<li class="flex items-center gap-2 text-[#E86A7C]"><span>🎁</span> هديتان مجانيتان فاخرتان</li>
				</ul>
			</button>

		</div>

		<!-- Streamlined 1-Step COD Form with strict field minimization -->
		<div class="rounded-3xl bg-white p-6 sm:p-10 border-2 border-emerald-950/15 shadow-xl">
			<div class="text-center max-w-lg mx-auto mb-6">
				<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332]">
					أدخلي اسمك ورقم هاتفك لتأكيد الطلب
				</h3>
				<p class="text-xs sm:text-sm text-stone-500 mt-1">
					الباقة المحددة: <strong class="text-[#1B4332]">{PRICING_TIERS[selectedTier].title}</strong> بمبلغ <strong class="text-[#E86A7C] font-black text-base">{PRICING_TIERS[selectedTier].price} MAD</strong>
				</p>
			</div>

			<form onsubmit={handleSubmit} class="max-w-md mx-auto space-y-4" dir="rtl">
				{#if phoneError}
					<div class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 text-center animate-shake">
						⚠️ {phoneError}
					</div>
				{/if}

				<!-- Strict Field 1: Full Name -->
				<div>
					<label for="order-fullname" class="block text-xs font-bold text-stone-700 mb-1.5">
						الاسم الكامل <span class="text-rose-500">*</span>
					</label>
					<input
						id="order-fullname"
						type="text"
						bind:value={fullName}
						required
						placeholder="مثال: مريم بنجلون"
						class="w-full h-12 rounded-xl border border-stone-200 bg-[#FAF8F5] px-4 text-sm font-semibold outline-none transition-all focus:border-[#1B4332] focus:bg-white"
					/>
				</div>

				<!-- Strict Field 2: Moroccan Phone Number -->
				<div>
					<label for="order-phone" class="block text-xs font-bold text-stone-700 mb-1.5">
						رقم الهاتف (للتواصل وتأكيد التسليم) <span class="text-rose-500">*</span>
					</label>
					<input
						id="order-phone"
						type="tel"
						bind:value={phone}
						required
						placeholder="06XXXXXXXX أو 07XXXXXXXX"
						class="w-full h-12 rounded-xl border border-stone-200 bg-[#FAF8F5] px-4 text-sm font-semibold outline-none transition-all focus:border-[#1B4332] focus:bg-white text-start"
						dir="ltr"
					/>
				</div>

				<!-- Debounced Anti-Double Click Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={localSubmitting || isSubmitting}
						class="w-full min-h-13 sm:min-h-14 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
					>
						{#if localSubmitting || isSubmitting}
							<span>جاري تأكيد طلبك بأمان... ⏳</span>
						{:else}
							<span>تأكيد الطلب الآن (الدفع عند الاستلام) 🛍️</span>
						{/if}
					</button>
				</div>

				<!-- Reassurance Footer -->
				<div class="flex items-center justify-center gap-3 text-[11px] font-bold text-stone-500 pt-1 text-center">
					<span>🔒 سرية تامة وأمان 100%</span>
					<span>•</span>
					<span>📦 معاينة الطرد قبل الدفع كاش للموزع</span>
				</div>
			</form>
		</div>

	</div>
</section>
