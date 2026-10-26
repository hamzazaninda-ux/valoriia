<script lang="ts">
	import { onDestroy } from 'svelte';

	interface OrderDetails {
		orderId: string;
		total: number;
		phone: string;
		name: string;
		address?: string;
		city?: string;
		[key: string]: any;
	}

	let {
		isOpen = $bindable(false),
		orderDetails = { orderId: '', total: 349, phone: '', name: '' },
		onAcceptUpsell = (updatedOrder: any) => {},
		onDeclineUpsell = () => {}
	}: {
		isOpen?: boolean;
		orderDetails?: OrderDetails;
		onAcceptUpsell?: (updatedOrder: any) => void | Promise<void>;
		onDeclineUpsell?: () => void;
	} = $props();

	// Easily configurable pricing & timer
	const upsellPrice = 29; // Updated to 29 MAD
	const oldPrice = 99; // Anchor crossed-out price
	const initialSeconds = 15; // 15 to 30 seconds countdown

	let secondsLeft = $state(initialSeconds);
	let isSubmitting = $state(false);
	let isDeclining = $state(false);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function startTimer() {
		stopTimer();
		secondsLeft = initialSeconds;
		timerInterval = setInterval(() => {
			if (secondsLeft > 1) {
				secondsLeft--;
			} else {
				secondsLeft = 0;
				stopTimer();
				if (!isSubmitting && !isDeclining) {
					handleDecline();
				}
			}
		}, 1000);
	}

	$effect(() => {
		if (isOpen) {
			isSubmitting = false;
			isDeclining = false;
			startTimer();
		} else {
			stopTimer();
		}
		return () => {
			stopTimer();
		};
	});

	onDestroy(() => {
		stopTimer();
	});

	async function handleAccept() {
		if (isSubmitting || isDeclining) return;
		isSubmitting = true;
		stopTimer();

		const originalTotal = Number(orderDetails.total || 0);
		const newTotal = originalTotal + upsellPrice;

		const updatedOrder = {
			...orderDetails,
			total: newTotal,
			price: newTotal,
			hasUpsell: true,
			upsellPrice,
			upsellItem: 'سدادة وفلتر مصرف الأرضية (+29 MAD)',
			upsellSku: 'filter-baloua'
		};

		try {
			await onAcceptUpsell(updatedOrder);
		} catch (err) {
			console.error('Failed to accept upsell:', err);
		}
	}

	async function handleDecline() {
		if (isSubmitting || isDeclining) return;
		isDeclining = true;
		stopTimer();
		try {
			await onDeclineUpsell();
		} catch (err) {
			console.error('Failed to decline upsell:', err);
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
		dir="rtl"
		role="dialog"
		aria-modal="true"
		aria-label="عرض خاص بعد إتمام الطلب"
	>
		<div
			class="relative w-full max-w-sm max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-emerald-600/30 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
		>
			<!-- 1. Top Urgency Timer -->
			<div
				class="bg-amber-50 border border-amber-200 rounded-xl py-1 px-3 text-center mb-1.5 flex items-center justify-center gap-1.5 shrink-0"
			>
				<span class="text-xs font-bold text-amber-900">⏳ عرض خاص يختفي خلال:</span>
				<span
					class="bg-amber-500 text-white font-mono font-black text-xs px-2 py-0.5 rounded-full shadow-inner"
				>
					00:{secondsLeft < 10 ? '0' + secondsLeft : secondsLeft} ({secondsLeft} ثواني)
				</span>
			</div>

			<!-- 2. Headline -->
			<h3 class="text-base sm:text-lg font-black text-gray-900 text-center leading-snug mb-1.5 shrink-0">
				⚡ تهنّاي من خنقة القوادس، الحشرات والروائح الكريهة!
			</h3>

			<!-- 3. Product Image Showcase (Full Sharpness & No Cropping) -->
			<div
				class="relative w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner mb-2 flex items-center justify-center shrink-0"
			>
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/q_auto:best,f_auto,w_800/v1791060860/%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D9%84%D8%B3%D8%AF%D8%A7%D8%AF%D8%A9_%D9%85%D8%B5%D8%B1%D9%81_%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A%D8%A9.png"
					alt="سدادة وفلتر مصرف الأرضية الذكية"
					loading="eager"
					decoding="sync"
					class="w-full h-44 sm:h-48 object-contain select-none"
					style="image-rendering: -webkit-optimize-contrast;"
				/>

				<!-- Price Badge (Top Left in RTL) -->
				<div
					class="absolute top-2 start-2 bg-[#0B5E3C] text-white px-2.5 py-1 rounded-xl text-center shadow-lg border border-white/20"
				>
					<div class="text-xs sm:text-sm font-black leading-tight">{upsellPrice} درهم فقط</div>
					<div class="text-[9px] text-emerald-200 line-through leading-none mt-0.5">{oldPrice} DH</div>
				</div>

				<!-- Selling Feature Banner (Bottom Overlay) -->
				<div
					class="absolute bottom-1.5 inset-x-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white font-black text-[10px] sm:text-xs py-1 px-2 rounded-full text-center shadow-md truncate"
				>
					توصيل فابور مع طلبيتك • تمنع انسداد الشعر والروائح 100%
				</div>
			</div>

			<!-- 4. Compact Direct Benefit (No Truncation / No Ellipsis) -->
			<p class="text-xs text-gray-700 text-center font-bold leading-relaxed mb-2 px-1 shrink-0">
				تمنع صعود الروائح الكريهة والصراصير نهائياً، مع تصريف فوري للمياه بدون انسداد.
			</p>

			<!-- 5. Both Action Buttons (Always Visible Above The Fold) -->
			<div class="space-y-1.5 w-full shrink-0">
				<button
					type="button"
					onclick={handleAccept}
					disabled={isSubmitting || isDeclining}
					class="w-full py-2.5 px-4 bg-[#0B5E3C] hover:bg-[#08482E] active:scale-[0.99] transition text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
				>
					{#if isSubmitting}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						<span>جاري الإضافة...</span>
					{:else}
						<span>✅</span>
						<span>أضف للطلب • {upsellPrice} درهم فقط</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={handleDecline}
					disabled={isSubmitting || isDeclining}
					class="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] transition text-gray-600 hover:text-gray-800 font-bold text-xs sm:text-sm rounded-xl text-center cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5"
				>
					{#if isDeclining}
						<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></span>
						<span>جاري تأكيد الطلب...</span>
					{:else}
						<span>لا، شكراً (متابعة بطلبيتي فقط)</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
