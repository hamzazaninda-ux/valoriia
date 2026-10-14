<script lang="ts">
	import { page } from '$app/stores';

	const defaultWa = '212600000000';
	const waMessage = 'السلام عليكم NOVAVITA، أريد طلب العرض مع التوصيل المجاني والدفع عند الاستلام';
	const waUrl = `https://wa.me/${defaultWa}?text=${encodeURIComponent(waMessage)}`;
</script>

<svelte:head>
	<title>طلبكِ مضمون • NOVAVITA المغرب</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-[#FAF8F5] text-[#1F2937] flex items-center justify-center px-4 py-12 font-body" dir="rtl">
	<div class="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-950/10 text-center space-y-6">
		
		<!-- Brand Header -->
		<div class="flex items-center justify-center gap-2.5">
			<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4332] font-display text-xl font-black text-white shadow-md">
				N
			</div>
			<span class="font-display text-2xl font-black tracking-tight text-[#1B4332]">
				NOVAVITA
			</span>
		</div>

		<!-- Reassuring Icon & Badge -->
		<div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 text-xs font-bold text-[#1B4332]">
			<span class="relative flex h-2 w-2">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
				<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
			</span>
			<span>خدمة الطلب السريع مفعلة ومتاحة الآن</span>
		</div>

		<!-- Friendly Arabic Explanation -->
		<div class="space-y-3">
			<h1 class="text-xl sm:text-2xl font-black text-[#1B4332] leading-snug">
				وقع ضغط غير متوقع على السيرفر بسبب كثرة الطلبات
			</h1>
			<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
				لطلب منتجك مباشرة عبر واتساب والحصول على نفس العرض والتوصيل المجاني والدفع عند الاستلام، اضغطي على الزر أسفله:
			</p>
		</div>

		<!-- High-Converting WhatsApp Action CTA -->
		<div class="pt-2">
			<a
				href={waUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] text-white py-4 px-6 text-base font-bold shadow-[0_8px_24px_rgba(37,211,102,0.35)] hover:bg-[#20ba56] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
				aria-label="اطلبي مباشرة عبر واتساب"
			>
				<svg class="h-6 w-6 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
				</svg>
				<span>اطلبي مباشرة عبر واتساب الآن 💬</span>
			</a>
		</div>

		<!-- Secondary Action: Return Home -->
		<div>
			<a
				href="/"
				class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#1B4332] transition-colors"
			>
				<span>←</span>
				<span>العودة للصفحة الرئيسية للمتجر</span>
			</a>
		</div>

		<!-- Trust Guarantees -->
		<div class="border-t border-gray-100 pt-6 grid grid-cols-3 gap-2 text-[11px] font-semibold text-gray-500">
			<div class="flex flex-col items-center gap-1">
				<span class="text-base">🚚</span>
				<span>توصيل مجاني</span>
			</div>
			<div class="flex flex-col items-center gap-1">
				<span class="text-base">💵</span>
				<span>الدفع عند الاستلام</span>
			</div>
			<div class="flex flex-col items-center gap-1">
				<span class="text-base">🌿</span>
				<span>طبيعي 100% حلال</span>
			</div>
		</div>

		{#if $page.status && $page.status !== 404}
			<p class="text-[10px] text-gray-400 font-mono">رمز الاستجابة: {$page.status}</p>
		{/if}

	</div>
</div>
