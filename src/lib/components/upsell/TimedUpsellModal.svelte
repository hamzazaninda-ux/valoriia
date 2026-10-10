<script lang="ts">
	interface Props {
		open?: boolean;
		orderTotal?: number;
		onAccept?: () => void;
		onDecline?: () => void;
	}

	let {
		open = $bindable(false),
		orderTotal = 279,
		onAccept,
		onDecline
	}: Props = $props();

	let timeLeft = $state(15);
	let selectedFlavor = $state<'collagen' | 'biotin' | 'multivitamin'>('collagen');
	let timerId: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (open) {
			timeLeft = 15;
			if (timerId) clearInterval(timerId);

			timerId = setInterval(() => {
				if (timeLeft > 0) {
					timeLeft -= 1;
				} else {
					// Auto decline when timer reaches 0:00
					if (timerId) clearInterval(timerId);
					handleDecline();
				}
			}, 1000);
		} else {
			if (timerId) clearInterval(timerId);
		}

		return () => {
			if (timerId) clearInterval(timerId);
		};
	});

	function handleAccept() {
		if (timerId) clearInterval(timerId);
		open = false;
		onAccept?.();
	}

	function handleDecline() {
		if (timerId) clearInterval(timerId);
		open = false;
		onDecline?.();
	}

	const radius = 24;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = $derived(
		circumference - (timeLeft / 15) * circumference
	);
</script>

{#if open}
	<div
		class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
		role="dialog"
		aria-modal="true"
		aria-label="عرض خاطف حصري"
		dir="rtl"
	>
		<!-- Backdrop -->
		<div class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>

		<!-- Modal Container -->
		<div class="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#FAF8F5] p-5 sm:p-8 shadow-2xl border-2 border-emerald-900/20 text-center space-y-5 animate-scale-up z-10">
			
			<!-- Top Urgency Banner with Radial Timer -->
			<div class="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl p-3">
				<div class="flex items-center gap-2 text-rose-800 text-xs sm:text-sm font-black text-start">
					<span class="text-xl animate-pulse">⚠️</span>
					<span>فرصة خاصة كتعطى مرة واحدة فقط قبل ما نرسلو طلبك!</span>
				</div>

				<!-- 15s Radial Timer -->
				<div class="relative flex h-14 w-14 shrink-0 items-center justify-center">
					<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 60 60">
						<circle
							cx="30"
							cy="30"
							r={radius}
							stroke="#FEE2E2"
							stroke-width="4"
							fill="transparent"
						/>
						<circle
							cx="30"
							cy="30"
							r={radius}
							stroke="#E86A7C"
							stroke-width="4"
							stroke-linecap="round"
							fill="transparent"
							stroke-dasharray={circumference}
							stroke-dashoffset={strokeDashoffset}
							class="transition-all duration-1000 ease-linear"
						/>
					</svg>
					<span class="absolute text-xs font-black text-rose-700">
						0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
					</span>
				</div>
			</div>

			<!-- Offer Headline -->
			<div class="space-y-1.5">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/10 px-3 py-1 text-xs font-black text-[#1B4332]">
					🔥 خصم استثنائي 50% على العلبة الإضافية
				</span>
				<h3 class="font-display text-xl sm:text-2xl font-black text-[#1B4332] leading-snug">
					أضيفي علبة إضافية من اختيارك لتعزيز روتينك بـ <span class="text-[#E86A7C]">99 درهم فقط!</span>
				</h3>
				<p class="text-xs sm:text-sm text-stone-600 font-medium">
					(بدل 199 درهم) • في نفس الطرد وبدون أي مصاريف شحن إضافية
				</p>
			</div>

			<!-- Product Showcase Card -->
			<div class="rounded-2xl bg-white border border-emerald-950/10 p-4 shadow-sm flex items-center gap-4 text-start">
				<div class="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shrink-0">
					🍓
				</div>
				<div class="flex-1">
					<div class="flex items-center justify-between">
						<h4 class="text-sm font-black text-[#1F2937]">علبة مكملة بنكهة طبيعية</h4>
						<span class="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">وفر 100 DH</span>
					</div>
					<div class="flex items-baseline gap-2 mt-1">
						<span class="font-display text-lg font-black text-[#1B4332]">99 MAD</span>
						<span class="text-xs text-stone-400 line-through">199 MAD</span>
					</div>
					<div class="flex items-center gap-2 mt-2">
						<label for="upsell-flavor-select" class="text-[11px] font-bold text-stone-500">اختر النوع:</label>
						<select
							id="upsell-flavor-select"
							bind:value={selectedFlavor}
							class="text-xs font-bold rounded-lg border border-stone-200 bg-[#FAF8F5] px-2 py-1 outline-none focus:border-[#1B4332]"
						>
							<option value="collagen">كولاجين البشرة (توت)</option>
							<option value="biotin">بيوتين الشعر (فراولة)</option>
							<option value="multivitamin">فيتامينات الحيوية (فواكه)</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Primary CTA (Accept +99 MAD) -->
			<div class="space-y-2.5 pt-1">
				<button
					type="button"
					onclick={handleAccept}
					class="w-full min-h-13 sm:min-h-14 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-black text-white text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all duration-300 flex items-center justify-center gap-2"
				>
					<span>نعم، ضيفيها لطلبي بـ 99 درهم فقط 🎁</span>
					<span class="text-xl">←</span>
				</button>

				<button
					type="button"
					onclick={handleDecline}
					class="text-xs sm:text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors py-1 underline underline-offset-4"
				>
					لا شكراً، أريد طلبي الأصلي فقط بدون إضافات
				</button>
			</div>

			<p class="text-[11px] text-stone-400 font-medium">
				🔒 لن يتم خصم أي مبلغ الآن — تدفعين المبلغ الإجمالي عند استلام ومعاينة الطرد
			</p>
		</div>
	</div>
{/if}

<style>
	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.animate-scale-up {
		animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
