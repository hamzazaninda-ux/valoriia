<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.settings.brand.name} | {data.settings.brand.tagline || 'مكملات غذائية طبيعية'}</title>
	<meta name="description" content={data.settings.brand.tagline || 'مكملات غذائية طبيعية وعضوية عالية الجودة'} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-[#fafaf9] flex flex-col font-sans select-none" dir="rtl">
	<!-- Top Bar: Mobile Optimized, Compact -->
	<div class="bg-emerald-950 text-emerald-100 text-center py-2 px-3 text-[11px] font-bold tracking-wide border-b border-emerald-900/30">
		✨ شحن مجاني وسريع في المغرب + الدفع عند الاستلام ✨
	</div>

	<!-- Premium Responsive Hero Section -->
	<header class="relative overflow-hidden bg-gradient-to-b from-emerald-950 to-emerald-900 text-white py-12 md:py-16 px-4 text-center">
		<!-- Glowing ambient light background -->
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
		
		<div class="relative max-w-3xl mx-auto space-y-4">
			<!-- Tagline Badge -->
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] md:text-xs font-semibold tracking-wide">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12Z" />
				</svg>
				ضمان الجودة العالية والفعالية
			</div>
			
			<h1 class="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight font-serif">
				{data.settings.brand.name}
			</h1>
			
			<p class="max-w-xl mx-auto text-sm md:text-base text-emerald-100/80 font-medium leading-relaxed px-2">
				{data.settings.brand.tagline || 'مكملات غذائية طبيعية وعضوية 100% من أجود الخلاصات الطبيعية'}
			</p>

			<!-- Compact Trust Indicators: Beautiful Icons -->
			<div class="pt-4 flex justify-center items-center gap-4 text-xs text-emerald-200/90 border-t border-white/5 max-w-sm mx-auto">
				<div class="flex items-center gap-1">
					<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12Z" />
					</svg>
					<span>أصلية 100%</span>
				</div>
				<span class="text-white/20">•</span>
				<div class="flex items-center gap-1">
					<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M8.25 18.75V14.25m0 0H12m.002-3h7.197L19.5 20.25M18 14.25h3.375a1.125 1.125 0 001.125-1.125V9.75A3.375 3.375 0 0018.75 6.375h-3.375a1.125 1.125 0 00-1.125 1.125v1.5m.002 4.5h-.002v-3.75h-.002M12 9.75h.008v.008H12V9.75Zm0 2.25h.008v.008H12v-.008Z" />
					</svg>
					<span>توصيل سريع</span>
				</div>
				<span class="text-white/20">•</span>
				<div class="flex items-center gap-1">
					<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5Zm4.307 1.834h.008v.008H8.057V6.334Zm.008 3.75h.008v.008H8.065V10.084Zm1.5-3.75h.008v.008H9.565V6.334Zm.008 3.75h.008v.008H9.573V10.084Z" />
					</svg>
					<span>دفع عند الاستلام</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Handcrafted Touch Badges Section (Horizontal scrolling on Mobile for compactness) -->
	<section class="w-full px-4 -mt-5 relative z-10">
		<div class="max-w-5xl mx-auto flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 select-none">
			<div class="bg-white rounded-xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-neutral-100 flex items-center gap-3 shrink-0 w-[260px] snap-center">
				<div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
					<svg class="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747c-1.164.218-2.368.107-3.486-.33a6.002 6.002 0 01-5.18-5.18 5.992 5.992 0 00-.663-3.486A9.004 9.004 0 003 12a9 9 0 009 9Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21V9" />
					</svg>
				</div>
				<div>
					<h4 class="font-bold text-neutral-800 text-xs leading-none">مكونات طبيعية ونقية</h4>
					<p class="text-[10px] text-neutral-400 mt-1 leading-normal">مستخلصات عضوية لضمان أفضل حماية وصحة.</p>
				</div>
			</div>
			<div class="bg-white rounded-xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-neutral-100 flex items-center gap-3 shrink-0 w-[260px] snap-center">
				<div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
					<svg class="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v1.244c0 .597-.237 1.17-.659 1.591L4.805 10.222a2.25 2.25 0 00-.659 1.591v6.437a2.25 2.25 0 00 2.25 2.25h11.21a2.25 2.25 0 00 2.25-2.25v-6.437c0-.597-.237-1.17-.659-1.591L14.909 5.94a2.25 2.25 0 00-.659-1.591V3.104m-4.5 0h4.5m-4.5 0a1.125 1.125 0 00-1.125 1.125M14.25 3.104A1.125 1.125 0 0 1 15.375 4.23M12 10.5h.008v.008H12V10.5Zm0 3.75h.008v.008H12v-.008Zm0 3.75h.008v.008H12v-.008Z" />
					</svg>
				</div>
				<div>
					<h4 class="font-bold text-neutral-800 text-xs leading-none">مختبرة وآمنة تماماً</h4>
					<p class="text-[10px] text-neutral-400 mt-1 leading-normal">تخضع لأشد معايير السلامة والجودة الصحية.</p>
				</div>
			</div>
			<div class="bg-white rounded-xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-neutral-100 flex items-center gap-3 shrink-0 w-[260px] snap-center">
				<div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
					<svg class="w-5.5 h-5.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
					</svg>
				</div>
				<div>
					<h4 class="font-bold text-neutral-800 text-xs leading-none">رضا مضمون 100%</h4>
					<p class="text-[10px] text-neutral-400 mt-1 leading-normal">آلاف العملاء يثقون بجودة منتجاتنا وخدماتنا.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Products Catalog -->
	<main class="max-w-5xl mx-auto w-full px-4 py-10 flex-1 space-y-6">
		<div class="text-right space-y-1">
			<h2 class="text-xl md:text-2xl font-black text-neutral-800 font-serif">المكملات المتاحة</h2>
			<p class="text-xs text-neutral-400">اختر مكمّلك الغذائي الطبيعي بجودة مضمونة وسعر مناسب</p>
		</div>

		<!-- Grid Layout: Compact, Mobile Optimized (Shows 1 premium card or clean columns) -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.products as product}
				<a
					href="/{product.slug}"
					class="group bg-white rounded-2xl border border-neutral-200/50 overflow-hidden hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 flex flex-col h-full active:scale-[0.98]"
				>
					<!-- Fixed Image Container: Clean soft padding & 100% full contain (Never cuts the bottle) -->
					<div class="relative h-64 w-full bg-gradient-to-br from-neutral-50/70 to-neutral-100/30 flex items-center justify-center p-6 transition-colors duration-300 group-hover:from-neutral-50 group-hover:to-neutral-50">
						<img
							src={product.heroImage}
							alt={product.title}
							class="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
							loading="lazy"
						/>
					</div>
					
					<!-- Card Details: optimized spacing for mobile text sizes -->
					<div class="p-5 flex flex-col flex-1 justify-between gap-4">
						<div class="space-y-1.5">
							<h3 class="text-md font-extrabold text-neutral-800 leading-tight transition-colors duration-300 group-hover:text-emerald-700">
								{product.title}
							</h3>
							<p class="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
								{product.subtitle}
							</p>
						</div>
						
						<!-- Price & CTA Line -->
						<div class="pt-3.5 border-t border-neutral-100 flex items-center justify-between">
							<div class="flex flex-col">
								<span class="text-[10px] text-neutral-400">السعر الحالي</span>
								<span class="text-md font-black text-emerald-600">{product.startingPrice} DH</span>
							</div>
							<span class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
								طلب المنتج
								<svg class="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-[-2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
								</svg>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>

	<!-- Footer -->
	<footer class="bg-[#111] text-neutral-400 border-t border-neutral-800">
		<div class="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 gap-8 text-right">
			<div class="space-y-3">
				<h3 class="text-md font-bold text-white font-serif">{data.settings.brand.name}</h3>
				<p class="text-xs text-neutral-400 leading-relaxed max-w-sm">
					متجر مغربي معتمد متخصص في جلب وتقديم أجود أنواع المكملات الغذائية الطبيعية لتعزيز صحتك ورفاهيتك اليومية.
				</p>
			</div>
			<div class="space-y-2.5 flex flex-col justify-start items-start sm:items-end">
				<h4 class="text-xs font-bold text-white uppercase tracking-wider">الدعم والمساعدة</h4>
				<a href="https://wa.me/{data.settings.brand.whatsappNumber}" class="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors">
					<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					<span>راسلنا مباشرة على واتساب</span>
				</a>
				<p class="text-[10px] text-neutral-500">متاح لخدمتك: {data.settings.brand.supportHours || 'طيلة أيام الأسبوع'}</p>
			</div>
		</div>
		<div class="border-t border-neutral-800/60 py-6 text-center text-[10px] text-neutral-500 bg-neutral-950">
			<p>© {new Date().getFullYear()} {data.settings.brand.name}. جميع الحقوق محفوظة.</p>
		</div>
	</footer>
</div>

<style>
	/* Hide standard scrollbars on trust items container */
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
