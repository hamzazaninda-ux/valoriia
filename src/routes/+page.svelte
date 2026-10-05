<script lang="ts">
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import BottomNav from '$lib/components/shared/BottomNav.svelte';
	import TrustSection from '$lib/components/sections/TrustSection.svelte';
	let { data } = $props();

	const brand = $derived(data.settings.brand);
	const commerce = $derived(data.settings.commerce);
	const cur = $derived(commerce.currencySymbol || 'درهم');
	const waNumber = $derived((brand.whatsappNumber || '').replace(/\D/g, ''));
	const waBase = $derived(waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/');

	type Slot = {
		slug: string;
		title: string;
		subtitle: string;
		image: string;
		price: number;
		oldPrice: number | null;
		discount: string | null;
		rating: number;
		reviews: number;
		real: boolean;
	};

	const circularCategories = [
		{
			title: 'طقم الحمام الذكي',
			image: '/images/col_a.png',
			href: '/kit-tandim'
		},
		{
			title: 'منظمات ومماسح ذكية',
			image: '/images/col_b.png',
			href: '/hamil-jidari-makanis'
		},
		{
			title: 'أقفال وحلول الأمان',
			image: '/images/child-safety-lock.webp',
			href: '/qofl-al-aman'
		}
	];

	// Fallback collection (3 slots) — disappears automatically once real products exist.
	const placeholders: Slot[] = [
		{
			slug: 'kit-tandim',
			title: 'طقم التنظيم المنزلي + هدية',
			subtitle: 'المنظم الذكي للحمام (بدون حفر) + رشاش فابور',
			image: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1790893177/ChatGPT_Image_Sep_4_2026_11_06_09_PM.png',
			price: 229,
			oldPrice: 299,
			discount: null,
			rating: 4.9,
			reviews: 203,
			real: true
		},
		{
			slug: 'mimsahat-asyr',
			title: 'ممسحة العصر الذكية',
			subtitle: 'عصر ذاتي بلا ما تقيس الماء بيديك — للدار كاملة',
			image: 'https://placehold.co/800x800/fdf6e3/92400e?text=Lhamza+Shop',
			price: 129,
			oldPrice: 199,
			discount: null,
			rating: 4.7,
			reviews: 89,
			real: false
		},
		{
			slug: 'monazzim-daki',
			title: 'المنظم الذكي متعدد الاستعمال',
			subtitle: 'رتّب المطبخ والحمام في دقائق + رشاش فابور مع كل طلب',
			image: 'https://placehold.co/800x800/faf9f6/022c22?text=Lhamza+Shop',
			price: 149,
			oldPrice: 249,
			discount: null,
			rating: 4.8,
			reviews: 127,
			real: false
		}
	];

	function toSlot(p: any): Slot {
		const price = p.startingPrice || 229;
		const oldPrice = p.oldPrice || (price === 229 ? 299 : Math.round(price * 1.3));
		return {
			slug: p.slug,
			title: p.title,
			subtitle: p.subtitle || '',
			image: p.heroImage || '',
			price,
			oldPrice,
			discount: null,
			rating: p.rating || 4.9,
			reviews: p.reviews || p.reviewCount || 203,
			real: true
		};
	}

	const real = $derived(
		(data.products || [])
			.filter(
				(p: any) =>
					p.slug !== 'hamil-jidari-makanis' &&
					p.slug !== 'filter-baloua' &&
					p.slug !== 'qofl-al-aman' &&
					!p.heroImage?.includes('79')
			)
			.slice(0, 12)
			.map(toSlot)
	);
	const catalog = $derived(
		real.length >= 3 ? real : [...real, ...placeholders].slice(0, 3)
	);

	// --- Search (client-side filter over the visible catalog) ---
	let query = $state('');
	let searchOpen = $state(false);
	const results = $derived(
		query.trim()
			? catalog.filter(
					(s) =>
						s.title.includes(query.trim()) || s.subtitle.includes(query.trim())
				)
			: catalog
	);
	let showAll = $state(false);
	const visible = $derived(
		query.trim() ? results : showAll ? catalog : catalog.slice(0, 3)
	);

	// --- Mini cart (localStorage, COD flow ends on WhatsApp) ---
	let cart = $state<Record<string, number>>({});
	let cartReady = $state(false);
	let drawerOpen = $state(false);
	let menuOpen = $state(false);

	$effect(() => {
		if (!cartReady && typeof localStorage !== 'undefined') {
			try {
				cart = JSON.parse(localStorage.getItem('lhamza-cart') || localStorage.getItem('valoriia-cart') || '{}');
			} catch {
				cart = {};
			}
			cartReady = true;
		}
	});
	$effect(() => {
		if (cartReady && typeof localStorage !== 'undefined') {
			localStorage.setItem('lhamza-cart', JSON.stringify(cart));
		}
	});

	const bySlug = $derived(Object.fromEntries(catalog.map((s) => [s.slug || s.title, s])));
	const cartCount = $derived(Object.keys(cart).length);
	const cartTotal = $derived(
		Object.keys(cart).reduce((sum, k) => sum + (bySlug[k]?.price || 0), 0)
	);

	function keyOf(s: Slot) {
		return s.slug || s.title;
	}
	function addToCart(s: Slot) {
		const k = keyOf(s);
		if (!(k in cart)) cart[k] = 1;
		drawerOpen = true;
	}
	function removeItem(k: string) {
		const { [k]: _, ...rest } = cart;
		cart = rest;
	}
	function orderViaWhatsApp() {
		const lines = Object.keys(cart).map(
			(k) => `• ${bySlug[k]?.title || k}`
		);
		const text = `السلام، بغيت نطلب من Lhamza Shop:\n${lines.join('\n')}\nالمجموع التقريبي: ${cartTotal} ${cur}\nالاسم الكامل: \nالمدينة: \nالهاتف: `;
		window.open(`${waBase}?text=${encodeURIComponent(text)}`, '_blank');
	}

</script>

<svelte:head>
	<title>{brand.name || 'Lhamza Shop'} | متجر التنظيم والنظافة في المغرب</title>
	<meta
		name="description"
		content="Lhamza Shop — متجر مغربي للتنظيم والنظافة المنزلية. التوصيل لجميع المدن والدفع عند الاستلام."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{#snippet stars(rating: number)}
	<span class="inline-flex items-center gap-0.5" aria-label={`التقييم ${rating} من 5`}>
		{#each [1, 2, 3, 4, 5] as i}
			<svg
				class={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'text-[#C99738]' : 'text-stone-200'}`}
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
				/>
			</svg>
		{/each}
	</span>
{/snippet}

{#snippet sectionTitle(title: string, sub: string)}
	<div class="text-center">
		<h2 class="font-display text-2xl font-bold text-[#1E293B] md:text-3xl">{title}</h2>
		{#if sub}
			<p class="mt-1.5 text-sm text-stone-500">{sub}</p>
		{/if}
		<div class="mx-auto mt-3 h-0.5 w-24 rounded-full bg-[#1B4332]"></div>
	</div>
{/snippet}

<div id="top" class="min-h-screen bg-[#FAF9F6] font-body text-[#1E293B] pb-20 md:pb-0" dir="rtl">
	<!-- 1. Smooth Infinite Marquee Announcement Bar -->
	<AnnouncementBar />


	<!-- 2. Sticky header -->
	<Header
		brandName={brand.name || 'Lhamza Shop'}
		cartCount={cartCount}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => (drawerOpen = true)}
	/>

	<!-- 3. Full-width Visual Branded Hero Banner -->
	<section class="mx-auto max-w-5xl px-3 sm:px-4 pt-1 md:pt-4">
		<div class="relative w-full aspect-[2/1] sm:aspect-[21/9] min-h-[180px] max-h-[220px] sm:max-h-none sm:min-h-[380px] overflow-hidden rounded-2xl shadow-[0_12px_40px_-15px_rgba(0,0,0,0.3)] mx-auto mb-3 mt-1 sm:my-2">
			<!-- Background image with fallback -->
			<img
				src={brand.heroImage || '/images/hero-banner.webp'}
				alt="رتّب دارك بأناقة وراحة بال - Lhamza Shop"
				class="absolute inset-0 h-full w-full object-cover"
				loading="eager"
				onerror={(e) => {
					(e.currentTarget as HTMLImageElement).src =
						'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80';
				}}
			/>

			<!-- Dark Overlay for text contrast -->
			<div class="absolute inset-0 bg-black/35 bg-gradient-to-t from-black/80 via-black/35 to-black/20" aria-hidden="true"></div>

			<!-- Centered Content -->
			<div class="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6 text-center">
				<div class="mx-auto max-w-2xl space-y-1.5 sm:space-y-3.5 px-2 mt-4 sm:mt-0">
					<h1 class="font-display text-xl sm:text-4xl md:text-5xl font-extrabold leading-[1.3] text-white drop-shadow-md">
						رتّب دارك بأناقة وراحة بال
					</h1>
					<p class="mx-auto max-w-lg text-[11px] sm:text-base md:text-lg font-medium leading-relaxed text-white/90 drop-shadow">
						حلول ذكية للتنظيم المنزلي بدون حفر وبدون عناء
					</p>
					<div class="pt-1.5 sm:pt-3">
						<a
							href="#bestsellers"
							class="inline-flex min-h-9 sm:min-h-12 items-center justify-center gap-1.5 rounded-xl bg-[#C99738] hover:bg-[#b88528] active:scale-95 px-5 sm:px-8 text-xs sm:text-sm md:text-base font-bold text-white shadow-xl transition-all duration-300"
						>
							<span>اكتشف العروض</span>
							<span aria-hidden="true">←</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Collections: Circular Category Avatars directly below Hero -->
	<section id="collections" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-6 pb-2">
		<div class="text-center mb-6">
			<h2 class="font-display text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
				تسوّق حسب المجموعة
			</h2>
			<div class="mx-auto mt-2 h-[2px] w-20 rounded-full bg-stone-300"></div>
		</div>

		<div class="flex overflow-x-auto justify-start sm:justify-center gap-4 sm:gap-8 px-2 sm:px-4 py-2 scrollbar-none" dir="rtl">
			{#each circularCategories as cat}
				<a
					href={cat.href}
					class="group flex flex-col items-center gap-2.5 shrink-0 active:scale-95 transition-transform"
					aria-label={cat.title}
				>
					<div
						class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-stone-200 overflow-hidden shadow-sm bg-white p-1 flex items-center justify-center transition-all duration-300 group-hover:border-[#1B4332] group-hover:shadow-md"
					>
						<img
							src={cat.image}
							alt={cat.title}
							class="h-full w-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
					</div>
					<span
						class="text-xs sm:text-sm font-bold text-[#1E293B] text-center max-w-[100px] sm:max-w-[120px] leading-tight transition-colors group-hover:text-[#1B4332]"
					>
						{cat.title}
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- 5. Bestsellers -->
	<section id="bestsellers" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-14">
		<div class="text-center">
			<div class="flex items-center justify-center gap-2">
				<svg class="h-5 w-5 text-[#C99738]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.7-5.3-3.2-6.9-.4 1.1-1 2.1-2 2.9.1-2.8-1.2-5.3-3.1-6.8C10.4 3.3 9.4 2.5 8.5 2c.2 2.3-.3 4.3-1.3 6C5.9 9.7 4.5 11.9 4.5 14.8 4.5 19 7.6 22 12 22z" />
				</svg>
				<h2 class="font-display text-2xl font-bold text-[#1E293B] md:text-3xl">الأكثر مبيعاً</h2>
				<svg class="h-5 w-5 text-[#C99738]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.7-5.3-3.2-6.9-.4 1.1-1 2.1-2 2.9.1-2.8-1.2-5.3-3.1-6.8C10.4 3.3 9.4 2.5 8.5 2c.2 2.3-.3 4.3-1.3 6C5.9 9.7 4.5 11.9 4.5 14.8 4.5 19 7.6 22 12 22z" />
				</svg>
			</div>
			<div class="mx-auto mt-3 h-0.5 w-24 rounded-full bg-[#1B4332]"></div>
			{#if query.trim()}
				<p class="mt-2 text-sm text-stone-500">
					نتائج البحث عن “{query.trim()}”: {visible.length}
					<button type="button" onclick={() => (query = '')} class="font-bold text-[#1B4332] underline underline-offset-4">مسح البحث</button>
				</p>
			{/if}
		</div>

		{#if visible.length === 0}
			<div class="mx-auto mt-8 max-w-sm rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
				<svg viewBox="0 0 120 90" class="mx-auto h-20 w-auto text-stone-300" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
					<circle cx="52" cy="38" r="24" />
					<line x1="70" y1="56" x2="96" y2="82" stroke-linecap="round" />
					<path d="M38 34 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="currentColor" stroke="none" opacity="0.5" />
				</svg>
				<p class="mt-4 font-bold text-[#1E293B]">ما لقينا حتى منتج بهاد الاسم</p>
				<p class="mt-1 text-sm text-stone-400">جرّب كلمة أخرى ولا شوف المجموعة كاملة</p>
				<button
					type="button"
					onclick={() => (query = '')}
					class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#1B4332] px-6 font-bold text-white transition-transform hover:scale-[1.02] hover:bg-[#143326] active:scale-[0.98]"
				>
					عرض كل المنتجات
				</button>
			</div>
		{:else}
			<div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each visible as s}
					<article
						class="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-3.5 sm:p-4 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:border-stone-300 active:scale-[0.99]"
					>
						<div class="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-50 flex items-center justify-center">
							{#if s.image}
								<a href={s.real ? `/${s.slug}` : '#offer'} class="block h-full w-full" aria-label={s.title}>
									<img
										src={s.image}
										alt={s.title}
										loading="lazy"
										class="h-full w-full object-cover rounded-2xl transition-transform duration-500 ease-out group-hover:scale-[1.03]"
									/>
								</a>
							{:else}
								<a href={s.real ? `/${s.slug}` : '#offer'} class="relative block h-full w-full p-4" aria-label={s.title}>
									<div class="flex h-full w-full items-center justify-center rounded-xl bg-stone-100 text-stone-400">
										<svg class="h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20" />
										</svg>
									</div>
								</a>
							{/if}
						</div>

						<div class="flex flex-1 flex-col justify-between gap-3 pt-3 sm:pt-4 px-1 pb-1">
							<div>
								{#if s.real}
									<a href={`/${s.slug}`} class="font-display text-base sm:text-lg font-bold leading-snug text-[#1E293B] transition-colors hover:text-[#1B4332]">
										{s.title}
									</a>
								{:else}
									<h3 class="font-display text-base sm:text-lg font-bold leading-snug text-[#1E293B]">{s.title}</h3>
								{/if}
								{#if s.subtitle}
									<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{s.subtitle}</p>
								{/if}
							</div>

							<div class="flex items-baseline gap-2.5">
								<span class="font-display text-xl sm:text-2xl font-black text-[#1E293B]">{s.price} DH</span>
								{#if s.oldPrice}
									<span class="text-xs sm:text-sm text-stone-400 line-through font-semibold">{s.oldPrice} DH</span>
								{/if}
							</div>

							{#if s.reviews > 0}
								<div class="flex items-center gap-1.5 text-xs text-stone-500">
									{@render stars(s.rating)}
									<span class="text-[11px] text-stone-400">({s.reviews} تقييم)</span>
								</div>
							{/if}

							<div class="mt-auto pt-2">
								<a
									href={s.real ? `/${s.slug}` : '#offer'}
									class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-300 hover:opacity-95 hover:scale-[1.01] active:scale-[0.98]"
									style="background-color: #1B4332;"
								>
									<span>اطلب الآن • الدفع عند الاستلام 🚚</span>
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		{#if !query.trim() && catalog.length > 3}
			<div class="mt-8 text-center">
				<button
					type="button"
					onclick={() => (showAll = !showAll)}
					class="inline-flex min-h-12 items-center rounded-2xl bg-[#1B4332] px-10 text-sm font-bold text-white transition-all duration-300 hover:bg-[#143326] active:scale-[0.98]"
				>
					{showAll ? 'عرض أقل' : 'عرض الكل'}
				</button>
			</div>
		{/if}
	</section>

	<!-- 6. Trust strip -->
	<div class="mt-14 overflow-hidden border-y border-stone-200/70 bg-white/70 py-4" aria-hidden="true">
		<div class="animate-store-marquee-fast flex w-max items-center gap-10 pe-10">
			{#each [0, 1] as dup}
				<div class="flex items-center gap-10" aria-hidden={dup === 1}>
					{#each Array(6) as _, i}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<svg class="h-4 w-4 text-[#C99738]" viewBox="0 0 20 20" fill="currentColor">
								<path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
							</svg>
							<span class={`font-display text-lg font-bold ${i % 2 ? 'text-transparent' : 'text-[#1E293B]'}`} style={i % 2 ? '-webkit-text-stroke: 1px #94a3b8;' : ''}>
								أكثر من 1000 عميل راضٍ
							</span>
						</span>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- 7. Why us & Customer Service -->
	<TrustSection
		whatsappNumber={waNumber || '212626558375'}
		brandName={brand.name || 'Lhamza Shop'}
		supportHours="طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً"
	/>

	<!-- 9. Footer -->
	<footer id="contact" class="mt-14 scroll-mt-24 bg-[#0E261C] text-stone-300">
		<div class="mx-auto grid max-w-5xl grid-cols-1 gap-9 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-display text-lg font-bold text-[#C99738]">L</span>
					<span class="font-display text-xl font-bold text-white">{brand.name || 'Lhamza Shop'}</span>
				</div>
				<p class="text-xs leading-loose text-stone-300">
					Lhamza Shop - متجر مغربي متخصص في منتجات التنظيم والنظافة المنزلية. منتجات مختارة
					بعناية، توصيل سريع، والخلاص عند الاستلام.
				</p>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">تسوّق</h4>
				<div class="grid gap-2 text-xs">
					<a href="#collections" class="transition-colors hover:text-[#C99738]">المجموعات</a>
					<a href="#bestsellers" class="transition-colors hover:text-[#C99738]">الأكثر مبيعاً</a>
					<a href="#offer" class="transition-colors hover:text-[#C99738]">العرض الحالي</a>
					<a href="#why" class="transition-colors hover:text-[#C99738]">علاش حنا</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">المساعدة</h4>
				<div class="grid gap-2 text-xs">
					<a href="#why" class="transition-colors hover:text-[#C99738]">الشحن والتوصيل</a>
					<a href="#offer" class="transition-colors hover:text-[#C99738]">كيفاش نطلب</a>
					<a href="#contact" class="transition-colors hover:text-[#C99738]">اتصل بنا</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">تواصل معانا</h4>
				<a
					href={`${waBase}?text=${encodeURIComponent('السلام Lhamza Shop، عندي استفسار')}`}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:border-[#C99738] hover:text-[#C99738]"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					راسلنا على واتساب
				</a>
				<p class="text-[11px] text-stone-400">متاح لخدمتك: {brand.supportHours || 'طيلة أيام الأسبوع'}</p>
			</div>
		</div>
		<div class="border-t border-white/10 bg-black/30 py-5 text-center text-xs text-stone-400">
			<p>© {new Date().getFullYear()} Lhamza Shop. جميع الحقوق محفوظة.</p>
		</div>
	</footer>

	<!-- 10. Floating WhatsApp Action -->
	<BottomNav
		whatsappNumber={waNumber || '212626558375'}
		{cartCount}
		onSearch={() => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			searchOpen = true;
			setTimeout(() => document.getElementById('store-search-input')?.focus({ preventScroll: true }), 350);
		}}
		onOpenCart={() => (drawerOpen = true)}
	/>

<!-- 11. Cart drawer -->
{#if drawerOpen}
	<div class="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="سلة التسوق">
		<button
			type="button"
			class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
			onclick={() => (drawerOpen = false)}
			aria-label="سد السلة"
		></button>
		<aside class="absolute bottom-0 left-0 top-0 flex w-[86%] max-w-sm flex-col bg-[#FAF9F6] shadow-2xl">
			<div class="flex items-center justify-between border-b border-stone-200/70 bg-white px-5 py-4">
				<h2 class="font-display text-lg font-bold text-[#1E293B]">السلة ({cartCount})</h2>
				<button
					type="button"
					onclick={() => (drawerOpen = false)}
					class="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-stone-100"
					aria-label="سد السلة"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			{#if cartCount === 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
					<svg viewBox="0 0 120 100" class="h-24 w-auto text-stone-300" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
						<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
						<circle cx="48" cy="52" r="2.5" fill="currentColor" stroke="none" />
						<circle cx="72" cy="52" r="2.5" fill="currentColor" stroke="none" />
						<path stroke-linecap="round" d="M46 68c4 5 8 5 12 0s8-5 12 0" opacity="0.7" />
					</svg>
					<p class="font-bold text-[#1E293B]">السلة خاوية</p>
					<p class="text-sm text-stone-400">زيد شي منتج وغادي يبان هنا</p>
					<button
						type="button"
						onclick={() => {
							drawerOpen = false;
							document.getElementById('bestsellers')?.scrollIntoView({ behavior: 'smooth' });
						}}
						class="mt-2 inline-flex min-h-11 items-center rounded-xl bg-[#1B4332] px-6 font-bold text-white transition-all hover:bg-[#143326] active:scale-[0.98]"
					>
						تسوّق دابا
					</button>
				</div>
			{:else}
				<div class="flex-1 space-y-3 overflow-y-auto p-4">
					{#each Object.keys(cart) as k}
						{@const item = bySlug[k]}
						{#if item}
							<div class="rounded-2xl border border-stone-200/60 bg-white p-3 shadow-2xs">
								<div class="flex items-start justify-between gap-2">
									<p class="min-w-0 flex-1 truncate text-sm font-bold text-[#1E293B]">{item.title}</p>
									<button
										type="button"
										onclick={() => removeItem(k)}
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
										aria-label="حيد من السلة"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
										</svg>
									</button>
								</div>
								<span class="mt-2 block h-24 w-full overflow-hidden rounded-xl bg-stone-100">
									{#if item.image}
										<img src={item.image} alt={item.title} class="h-full w-full object-cover" />
									{:else}
										<span class="flex h-full w-full items-center justify-center">
											<svg class="h-6 w-6 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
												<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
											</svg>
										</span>
									{/if}
								</span>
								<div class="mt-2 flex items-center justify-between gap-2">
									<span class="truncate text-[11px] font-semibold text-stone-400">التوصيل مجاني</span>
									<span class="shrink-0 text-sm font-black text-[#1E293B]">{item.price} {cur}</span>
								</div>
							</div>
						{/if}
					{/each}
				</div>
				<div class="space-y-3 border-t border-stone-200/70 bg-white p-4">
					<div class="flex items-center justify-between font-black text-[#1E293B]">
						<span>المجموع</span>
						<span>{cartTotal} {cur}</span>
					</div>
					<button
						type="button"
						onclick={orderViaWhatsApp}
						class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-bold text-white transition-all hover:bg-[#20ba56] active:scale-[0.98]"
					>
						أكّد الطلب عبر واتساب
					</button>
					<button
						type="button"
						onclick={() => (cart = {})}
						class="w-full py-2 text-center text-xs text-stone-400 underline underline-offset-4 hover:text-stone-600"
					>
						إفراغ السلة
					</button>
				</div>
			{/if}
		</aside>
		</div>
	{/if}
</div>
