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
	const upsellPrice = 79; // Price to add to order (e.g. 79 or 99 MAD)
	const oldPrice = 149; // Anchor crossed-out price
	const initialSeconds = 15; // 15 to 30 seconds countdown

	let secondsLeft = $state(initialSeconds);
	let isSubmitting = $state(false);
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
				if (!isSubmitting) {
					handleDecline();
				}
			}
		}, 1000);
	}

	$effect(() => {
		if (isOpen) {
			isSubmitting = false;
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
		if (isSubmitting) return;
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
			upsellItem: 'سدادة وفلتر مصرف الأرضية الذكية (مضاد للروائح والحشرات)',
			upsellSku: 'filter-baloua'
		};

		try {
			await onAcceptUpsell(updatedOrder);
		} catch (err) {
			console.error('Failed to accept upsell:', err);
		}
	}

	function handleDecline() {
		if (isSubmitting) return;
		stopTimer();
		onDeclineUpsell();
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
		dir="rtl"
		role="dialog"
		aria-modal="true"
		aria-label="عرض خاص بعد إتمام الطلب"
	>
		<div
			class="relative w-full max-w-[420px] bg-white rounded-[32px] shadow-2xl overflow-hidden border-2 border-[#0B5E3C] p-4 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-200"
		>
			<!-- Top Urgency Banner -->
			<div
				class="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl py-2 px-3 text-center mb-3 flex items-center justify-center gap-2"
			>
				<span class="text-xs sm:text-sm font-bold text-[#78350F] flex items-center gap-1">
					<span>⏳</span>
					<span>عرض خاص يختفي خلال:</span>
				</span>
				<span
					class="bg-[#D97706] text-white font-mono font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-inner tracking-wide"
				>
					00:{secondsLeft < 10 ? '0' + secondsLeft : secondsLeft} ({secondsLeft} ثواني)
				</span>
			</div>

			<!-- Main Catchy Title -->
			<h3 class="text-base sm:text-lg font-black text-gray-900 text-center leading-snug mb-3">
				⚡ تهنّاي من خنقة القوادس، الحشرات والروائح الكريهة!
			</h3>

			<!-- Product Image Container with Badges -->
			<div
				class="relative w-full aspect-square max-h-[290px] sm:max-h-[310px] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center mb-3"
			>
				<img
					src="https://res.cloudinary.com/xqjngk8y/image/upload/v1791060860/%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D9%84%D8%B3%D8%AF%D8%A7%D8%AF%D8%A9_%D9%85%D8%B5%D8%B1%D9%81_%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A%D8%A9.png"
					alt="سدادة وفلتر مصرف الأرضية الذكية"
					class="w-full h-full object-cover"
					loading="eager"
				/>

				<!-- Price Badge (Top Right) -->
				<div
					class="absolute top-2.5 end-2.5 bg-[#0B5E3C] text-white px-3.5 py-1.5 rounded-2xl text-center shadow-lg border border-white/20"
				>
					<div class="text-sm sm:text-base font-black leading-tight">{upsellPrice} درهم فقط</div>
					<div class="text-[11px] text-emerald-200 line-through leading-none mt-0.5">{oldPrice} DH</div>
				</div>

				<!-- Selling Feature Banner (Bottom Overlay) -->
				<div
					class="absolute bottom-2.5 inset-x-3 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white font-black text-[11px] sm:text-xs py-1.5 px-3 rounded-full text-center shadow-md truncate"
				>
					توصيل فابور مع طلبيتك • تمنع انسداد الشعر والروائح 100%
				</div>
			</div>

			<!-- Benefit Micro-copy -->
			<p class="text-xs sm:text-sm text-gray-700 text-center font-medium leading-relaxed mb-4 px-1">
				تغلق بإحكام وتمنع صعود الروائح الكريهة والصراصير، وتحبس الشعر والأوساخ مع تصريف سريع للمياه بدون حاجة لأي صيانة.
			</p>

			<!-- Action Buttons -->
			<div class="space-y-2">
				<button
					type="button"
					onclick={handleAccept}
					disabled={isSubmitting}
					class="w-full min-h-[48px] py-3.5 px-4 bg-[#0B5E3C] hover:bg-[#08482E] active:scale-[0.98] transition-all text-white font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
				>
					{#if isSubmitting}
						<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						<span>جاري إضافة العرض للطلب...</span>
					{:else}
						<span>أضيفي للطلب • {upsellPrice} درهم فقط</span>
						<span class="bg-white/20 px-1.5 py-0.5 rounded-lg text-sm">✅</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={handleDecline}
					disabled={isSubmitting}
					class="w-full min-h-[42px] py-2.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all text-gray-600 hover:text-gray-800 font-bold text-sm sm:text-base rounded-2xl text-center cursor-pointer"
				>
					لا شكراً
				</button>
			</div>
		</div>
	</div>
{/if}
