<script lang="ts">
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

	// Fallback collection (3 slots) — disappears automatically once real products exist.
	const placeholders: Slot[] = [
		{
			slug: '',
			title: 'المنظم الذكي متعدد الاستعمال',
			subtitle: 'رتّب المطبخ والحمام في دقائق + رشاش فابور مع كل طلب',
			image: '',
			price: 149,
			oldPrice: 249,
			discount: 'تخفيض 40%',
			rating: 4.8,
			reviews: 127,
			real: false
		},
		{
			slug: '',
			title: 'ممسحة العصر الذكية',
			subtitle: 'عصر ذاتي بلا ما تقيس الماء بيديك — للدار كاملة',
			image: '',
			price: 129,
			oldPrice: 199,
			discount: 'تخفيض 35%',
			rating: 4.7,
			reviews: 89,
			real: false
		},
		{
			slug: '',
			title: 'طقم التنظيم المنزلي + هدية',
			subtitle: 'ثلاث قطع أساسية لكل دار + الرشاش فابور',
			image: '',
			price: 199,
			oldPrice: 299,
			discount: 'تخفيض 33%',
			rating: 4.9,
			reviews: 203,
			real: false
		}
	];

	function toSlot(p: any): Slot {
		return {
			slug: p.slug,
			title: p.title,
			subtitle: p.subtitle || '',
			image: p.heroImage || '',
			price: p.startingPrice || 0,
			oldPrice: null,
			discount: null,
			rating: 0,
			reviews: 0,
			real: true
		};
	}

	const real = $derived((data.products || []).slice(0, 12).map(toSlot));
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
				cart = JSON.parse(localStorage.getItem('valoriia-cart') || '{}');
			} catch {
				cart = {};
			}
			cartReady = true;
		}
	});
	$effect(() => {
		if (cartReady && typeof localStorage !== 'undefined') {
			localStorage.setItem('valoriia-cart', JSON.stringify(cart));
		}
	});

	const bySlug = $derived(Object.fromEntries(catalog.map((s) => [s.slug || s.title, s])));
	const cartCount = $derived(Object.values(cart).reduce((a, b) => a + b, 0));
	const cartTotal = $derived(
		Object.entries(cart).reduce((sum, [k, q]) => sum + (bySlug[k]?.price || 0) * q, 0)
	);

	function keyOf(s: Slot) {
		return s.slug || s.title;
	}
	function addToCart(s: Slot) {
		const k = keyOf(s);
		cart[k] = (cart[k] || 0) + 1;
		drawerOpen = true;
	}
	function setQty(k: string, q: number) {
		if (q <= 0) {
			const { [k]: _, ...rest } = cart;
			cart = rest;
		} else {
			cart[k] = q;
		}
	}
	function orderViaWhatsApp() {
		const lines = Object.entries(cart).map(
			([k, q]) => `• ${bySlug[k]?.title || k} × ${q}`
		);
		const text = `السلام، بغيت نطلب من Valoriia:\n${lines.join('\n')}\nالمجموع التقريبي: ${cartTotal} ${cur}\nالاسم الكامل: \nالمدينة: \nالهاتف: `;
		window.open(`${waBase}?text=${encodeURIComponent(text)}`, '_blank');
	}

	const marqueeItems = $derived([
		`التوصيل سريع لجميع المدن المغربية`,
		`الدفع عند الاستلام`,
		`المنظم + الرشاش فابور`,
		`أكثر من 1000 زبون راضٍ`
	]);

	const collections = [
		{
			id: 'storage',
			title: 'التنظيم والتخزين',
			sub: 'كل ما يرتّب دارك',
			tint: 'bg-emerald-50',
			ring: 'ring-emerald-600/20',
			icon: 'box'
		},
		{
			id: 'clean',
			title: 'نظافة بلا عناء',
			sub: 'أدوات ذكية وسريعة',
			tint: 'bg-amber-50',
			ring: 'ring-amber-600/20',
			icon: 'sparkle'
		},
		{
			id: 'gifts',
			title: 'عروض وهدايا',
			sub: 'تخفيضات + فابور',
			tint: 'bg-stone-100',
			ring: 'ring-stone-500/20',
			icon: 'gift'
		}
	];
</script>

<svelte:head>
	<title>{brand.name} | متجر التنظيم والنظافة في المغرب</title>
	<meta
		name="description"
		content="Valoriia — متجر مغربي للتنظيم والنظافة المنزلية. التوصيل لجميع المدن والدفع عند الاستلام."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{#snippet stars(rating: number)}
	<span class="inline-flex items-center gap-0.5" aria-label={`التقييم ${rating} من 5`}>
		{#each [1, 2, 3, 4, 5] as i}
			<svg
				class={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-neutral-200'}`}
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
		<h2 class="font-display text-2xl font-bold text-neutral-900 md:text-3xl">{title}</h2>
		{#if sub}
			<p class="mt-1.5 text-sm text-neutral-500">{sub}</p>
		{/if}
		<div class="mx-auto mt-3 h-0.5 w-24 rounded-full bg-neutral-900"></div>
	</div>
{/snippet}

<div id="top" class="min-h-screen bg-[#faf9f6] font-body text-neutral-800" dir="rtl">
	<!-- 1. Announcement marquee -->
	<div class="overflow-hidden bg-neutral-950 py-2 text-white" aria-hidden="true">
		<div class="animate-store-marquee flex w-max items-center gap-8 pe-8">
			{#each [0, 1] as dup}
				<div class="flex items-center gap-8" aria-hidden={dup === 1}>
					{#each marqueeItems as item}
						<span class="flex items-center gap-8 whitespace-nowrap text-xs font-semibold">
							{item}
							<svg class="h-2 w-2 text-amber-400" viewBox="0 0 8 8" fill="currentColor">
								<rect x="1.5" y="1.5" width="5" height="5" rx="1" transform="rotate(45 4 4)" />
							</svg>
						</span>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- 2. Sticky header -->
	<header class="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/90 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
			<a href="#top" class="flex items-center gap-2">
				<span
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 font-display text-lg font-bold text-amber-400"
					>ف</span
				>
				<span class="font-display text-xl font-bold text-emerald-950">{brand.name}</span>
			</a>

			<nav class="hidden items-center gap-6 text-sm font-semibold text-neutral-600 md:flex">
				<a href="#top" class="transition-colors hover:text-emerald-700">الرئيسية</a>
				<a href="#collections" class="transition-colors hover:text-emerald-700">المجموعات</a>
				<a href="#bestsellers" class="transition-colors hover:text-emerald-700">الأكثر مبيعاً</a>
				<a href="#why" class="transition-colors hover:text-emerald-700">علاش حنا</a>
				<a href="#contact" class="transition-colors hover:text-emerald-700">اتصل بنا</a>
			</nav>

			<div class="flex items-center gap-1.5">
				{#if searchOpen}
					<input
						type="search"
						bind:value={query}
						placeholder="قلّب على منتج…"
						class="h-10 w-36 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none transition-all placeholder:text-neutral-400 focus:w-48 focus:border-emerald-500 sm:w-48"
					/>
				{/if}
				<button
					type="button"
					onclick={() => {
						searchOpen = !searchOpen;
						if (!searchOpen) query = '';
					}}
					class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-neutral-100 active:scale-95"
					aria-label="البحث في المنتجات"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
					</svg>
				</button>
				<button
					type="button"
					onclick={() => (drawerOpen = true)}
					class="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-neutral-100 active:scale-95"
					aria-label="سلة التسوق"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z" />
					</svg>
					{#if cartCount > 0}
						<span class="absolute -top-0.5 -start-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
							{cartCount}
						</span>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => (menuOpen = !menuOpen)}
					class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-neutral-100 active:scale-95 md:hidden"
					aria-label="القائمة"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
					</svg>
				</button>
			</div>
		</div>
		{#if menuOpen}
			<nav class="border-t border-neutral-100 bg-white px-4 py-3 md:hidden">
				<div class="grid gap-1 text-sm font-semibold text-neutral-700">
					{#each [['الرئيسية', '#top'], ['المجموعات', '#collections'], ['الأكثر مبيعاً', '#bestsellers'], ['علاش حنا', '#why'], ['اتصل بنا', '#contact']] as [label, href]}
						<a
							{href}
							onclick={() => (menuOpen = false)}
							class="rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50 active:bg-emerald-50"
							>{label}</a
						>
					{/each}
				</div>
			</nav>
		{/if}
	</header>

	<!-- 3. Hero -->
	<section class="mx-auto max-w-5xl px-4 pt-6 md:pt-10">
		<div
			class="relative overflow-hidden rounded-3xl bg-emerald-950 text-white shadow-[0_20px_60px_-20px_rgba(2,44,34,0.5)]"
		>
			<div
				class="pointer-events-none absolute inset-0 opacity-[0.15]"
				style="background-image: radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0); background-size: 22px 22px;"
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute -top-24 -start-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
				aria-hidden="true"
			></div>

			<div class="relative grid items-center gap-8 p-7 md:grid-cols-2 md:p-12">
				<div class="space-y-5 text-center md:text-start">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-bold text-amber-300"
					>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
						</svg>
						عرض الافتتاح — الرشاش فابور
					</span>
					<h1 class="font-display text-3xl font-bold leading-[1.5] md:text-5xl md:leading-[1.4]">
						نظّم دارك، وخلي التنظيف ساهل
					</h1>
					<p class="mx-auto max-w-md text-sm leading-loose text-emerald-100/80 md:mx-0 md:text-base">
						المنظم الذكي اللي كيجمع ليك كلشي في بلاصة وحدة، ومع كل طلب
						<strong class="text-amber-300">الرشاش فابور</strong>. التوصيل لجميع المدن
						والخلاص ملي توصلك السلعة.
					</p>
					<div class="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-center md:justify-start">
						<a
							href="#bestsellers"
							class="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-400 px-7 font-bold text-emerald-950 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-amber-300 active:scale-[0.98]"
						>
							تسوّق دابا
						</a>
						<a
							href="#offer"
							class="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 font-bold text-white transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
						>
							شوف العرض
						</a>
					</div>
					<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs text-emerald-100/70 md:justify-start">
						<span class="inline-flex items-center gap-1.5">
							<svg class="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							خلص ملي توصلك
						</span>
						<span class="inline-flex items-center gap-1.5">
							<svg class="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
							</svg>
							توصيل لجميع المدن
						</span>
						<span class="inline-flex items-center gap-1.5">
							<svg class="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
							</svg>
							+1000 زبون راضٍ
						</span>
					</div>
				</div>

				<div class="relative mx-auto w-full max-w-sm">
					<div
						class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-bl from-emerald-900 to-emerald-950 p-6"
					>
						<svg viewBox="0 0 300 260" class="h-auto w-full" role="img" aria-label="المنظم الذكي مع الرشاش">
							<ellipse cx="150" cy="232" rx="110" ry="14" fill="#ffffff" opacity="0.08" />
							<rect x="70" y="90" width="110" height="140" rx="14" fill="none" stroke="#fbbf24" stroke-width="3" opacity="0.9" />
							<rect x="70" y="90" width="110" height="34" rx="14" fill="#fbbf24" opacity="0.15" />
							<line x1="70" y1="124" x2="180" y2="124" stroke="#fbbf24" stroke-width="2" opacity="0.5" />
							<line x1="70" y1="158" x2="180" y2="158" stroke="#fbbf24" stroke-width="2" opacity="0.5" />
							<line x1="70" y1="192" x2="180" y2="192" stroke="#fbbf24" stroke-width="2" opacity="0.5" />
							<rect x="196" y="130" width="44" height="100" rx="10" fill="none" stroke="#a7f3d0" stroke-width="3" opacity="0.9" />
							<rect x="204" y="112" width="28" height="18" rx="5" fill="none" stroke="#a7f3d0" stroke-width="3" opacity="0.9" />
							<line x1="232" y1="118" x2="252" y2="112" stroke="#a7f3d0" stroke-width="3" stroke-linecap="round" />
							<circle cx="258" cy="110" r="3" fill="#a7f3d0" opacity="0.9" />
							<circle cx="266" cy="104" r="2.2" fill="#a7f3d0" opacity="0.6" />
							<circle cx="250" cy="100" r="2.2" fill="#a7f3d0" opacity="0.6" />
							<path d="M52 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fbbf24" opacity="0.85" />
							<path d="M248 52 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#a7f3d0" opacity="0.85" />
							<circle cx="96" cy="52" r="2.5" fill="#ffffff" opacity="0.5" />
							<circle cx="212" cy="210" r="2.5" fill="#ffffff" opacity="0.5" />
						</svg>
						<span
							class="absolute end-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-lg"
						>
							تخفيض حتى 40%
						</span>
						<span
							class="absolute start-4 bottom-4 rounded-full border border-amber-300/40 bg-emerald-950/80 px-3 py-1.5 text-xs font-bold text-amber-300 backdrop-blur"
						>
							الرشاش فابور
						</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Collections -->
	<section id="collections" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-12">
		{@render sectionTitle('تسوّق حسب المجموعة', 'اختار القسم اللي كيهمّك ودخل شوف المنتجات')}
		<div class="mt-7 grid grid-cols-3 gap-3 sm:gap-6">
			{#each collections as c}
				<a
					href="#bestsellers"
					class="group flex flex-col items-center gap-2.5 active:scale-[0.97]"
				>
					<span
						class={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-full ${c.tint} ring-4 ${c.ring} transition-all duration-300 group-hover:shadow-xl group-hover:ring-emerald-500/40`}
					>
						{#if c.icon === 'box'}
							<svg class="h-1/3 w-1/3 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
							</svg>
						{:else if c.icon === 'sparkle'}
							<svg class="h-1/3 w-1/3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
							</svg>
						{:else}
							<svg class="h-1/3 w-1/3 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
							</svg>
						{/if}
					</span>
					<span class="text-center">
						<span class="block text-sm font-extrabold text-neutral-800 transition-colors group-hover:text-emerald-700 md:text-base">{c.title}</span>
						<span class="mt-0.5 block text-[11px] text-neutral-400 md:text-xs">{c.sub}</span>
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- 5. Bestsellers -->
	<section id="bestsellers" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-14">
		<div class="text-center">
			<div class="flex items-center justify-center gap-2">
				<svg class="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.7-5.3-3.2-6.9-.4 1.1-1 2.1-2 2.9.1-2.8-1.2-5.3-3.1-6.8C10.4 3.3 9.4 2.5 8.5 2c.2 2.3-.3 4.3-1.3 6C5.9 9.7 4.5 11.9 4.5 14.8 4.5 19 7.6 22 12 22z" />
				</svg>
				<h2 class="font-display text-2xl font-bold text-neutral-900 md:text-3xl">الأكثر مبيعاً</h2>
				<svg class="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.7-5.3-3.2-6.9-.4 1.1-1 2.1-2 2.9.1-2.8-1.2-5.3-3.1-6.8C10.4 3.3 9.4 2.5 8.5 2c.2 2.3-.3 4.3-1.3 6C5.9 9.7 4.5 11.9 4.5 14.8 4.5 19 7.6 22 12 22z" />
				</svg>
			</div>
			<div class="mx-auto mt-3 h-0.5 w-24 rounded-full bg-neutral-900"></div>
			{#if query.trim()}
				<p class="mt-2 text-sm text-neutral-500">
					نتائج البحث عن “{query.trim()}”: {visible.length}
					<button type="button" onclick={() => (query = '')} class="font-bold text-emerald-700 underline underline-offset-4">مسح البحث</button>
				</p>
			{/if}
		</div>

		{#if visible.length === 0}
			<div class="mx-auto mt-8 max-w-sm rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-10 text-center">
				<svg viewBox="0 0 120 90" class="mx-auto h-20 w-auto text-neutral-300" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
					<circle cx="52" cy="38" r="24" />
					<line x1="70" y1="56" x2="96" y2="82" stroke-linecap="round" />
					<path d="M38 34 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="currentColor" stroke="none" opacity="0.5" />
				</svg>
				<p class="mt-4 font-bold text-neutral-700">ما لقينا حتى منتج بهاد الاسم</p>
				<p class="mt-1 text-sm text-neutral-400">جرّب كلمة أخرى ولا شوف المجموعة كاملة</p>
				<button
					type="button"
					onclick={() => (query = '')}
					class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-950 px-6 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
				>
					عرض كل المنتجات
				</button>
			</div>
		{:else}
			<div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each visible as s}
					<article
						class="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:shadow-xl hover:border-emerald-500/30 active:scale-[0.99]"
					>
						<div class="relative h-60 overflow-hidden bg-gradient-to-bl from-emerald-50 via-[#faf9f6] to-amber-50">
							{#if s.image}
								<a href={s.real ? `/${s.slug}` : '#offer'} class="block h-full w-full" aria-label={s.title}>
									<img
										src={s.image}
										alt={s.title}
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
									/>
								</a>
							{:else}
								<a href={s.real ? `/${s.slug}` : '#offer'} class="relative block h-full w-full" aria-label={s.title}>
									<svg viewBox="0 0 320 220" class="h-full w-full" role="img" aria-label={s.title}>
										<circle cx="255" cy="45" r="60" fill="#022c22" opacity="0.06" />
										<circle cx="40" cy="185" r="70" fill="#d97706" opacity="0.08" />
										<rect x="110" y="45" width="100" height="130" rx="12" fill="none" stroke="#022c22" stroke-width="4" opacity="0.75" />
										<rect x="110" y="45" width="100" height="30" rx="12" fill="#022c22" opacity="0.12" />
										<line x1="110" y1="105" x2="210" y2="105" stroke="#022c22" stroke-width="3" opacity="0.4" />
										<line x1="110" y1="140" x2="210" y2="140" stroke="#022c22" stroke-width="3" opacity="0.4" />
										<rect x="222" y="95" width="34" height="80" rx="8" fill="none" stroke="#d97706" stroke-width="4" opacity="0.8" />
										<rect x="228" y="82" width="22" height="13" rx="4" fill="none" stroke="#d97706" stroke-width="4" opacity="0.8" />
										<path d="M70 60 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#d97706" opacity="0.7" />
										<circle cx="262" cy="60" r="3" fill="#022c22" opacity="0.3" />
										<circle cx="60" cy="170" r="3" fill="#022c22" opacity="0.3" />
									</svg>
								</a>
							{/if}
							{#if s.discount}
								<span class="absolute start-3 top-3 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-black text-white shadow-md">
									{s.discount}
								</span>
							{/if}
							{#if !s.real}
								<span class="absolute end-3 top-3 rounded-lg border border-amber-500/30 bg-white/90 px-2.5 py-1 text-[11px] font-black text-amber-700 backdrop-blur">
									قريباً
								</span>
							{/if}
						</div>

						<div class="flex flex-1 flex-col gap-3 p-5">
							<div>
								{#if s.real}
									<a href={`/${s.slug}`} class="text-[15px] font-extrabold leading-snug text-neutral-900 transition-colors hover:text-emerald-700">
										{s.title}
									</a>
								{:else}
									<h3 class="text-[15px] font-extrabold leading-snug text-neutral-900">{s.title}</h3>
								{/if}
								<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">{s.subtitle}</p>
							</div>
							<div class="flex items-baseline gap-2">
								<span class="text-lg font-black text-emerald-700">{s.price} {cur}</span>
								{#if s.oldPrice}
									<span class="text-xs text-neutral-400 line-through">{s.oldPrice} {cur}</span>
								{/if}
							</div>
							{#if s.reviews > 0}
								<div class="flex items-center gap-1.5">
									{@render stars(s.rating)}
									<span class="text-[11px] text-neutral-400">({s.reviews} تقييم)</span>
								</div>
							{:else}
								<div class="flex items-center gap-1.5">
									<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">جديد في المتجر</span>
								</div>
							{/if}
							<div class="mt-auto flex gap-2 pt-1">
								{#if s.real}
									<a
										href={`/${s.slug}`}
										class="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-950 px-4 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-900 active:scale-[0.98]"
									>
										اطلب دابا
									</a>
									<button
										type="button"
										onclick={() => addToCart(s)}
										class="inline-flex min-h-12 w-12 items-center justify-center rounded-2xl border border-emerald-900/15 bg-emerald-50 text-emerald-800 transition-all duration-300 hover:bg-emerald-100 active:scale-95"
										aria-label={`زيد ${s.title} للسلة`}
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
										</svg>
									</button>
								{:else}
									<a
										href="#offer"
										class="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-950 px-4 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-900 active:scale-[0.98]"
									>
										احجز دابا
									</a>
								{/if}
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
					class="inline-flex min-h-12 items-center rounded-2xl bg-neutral-950 px-10 text-sm font-bold text-white transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98]"
				>
					{showAll ? 'عرض أقل' : 'عرض الكل'}
				</button>
			</div>
		{/if}
	</section>

	<!-- 6. Trust strip -->
	<div class="mt-14 overflow-hidden border-y border-neutral-200/70 bg-white py-4" aria-hidden="true">
		<div class="animate-store-marquee-fast flex w-max items-center gap-10 pe-10">
			{#each [0, 1] as dup}
				<div class="flex items-center gap-10" aria-hidden={dup === 1}>
					{#each Array(6) as _, i}
						<span class="flex items-center gap-2 whitespace-nowrap">
							<svg class="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
								<path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
							</svg>
							<span class={`font-display text-lg font-bold ${i % 2 ? 'text-transparent' : 'text-neutral-900'}`} style={i % 2 ? '-webkit-text-stroke: 1px #a3a3a3;' : ''}>
								أكثر من 1000 عميل راضٍ
							</span>
						</span>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- 7. Why us -->
	<section id="why" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-12">
		{@render sectionTitle('علاش يختارونا المغاربة', 'الشراء من عندنا ساهل وآمن')}
		<div class="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each [['توصيل لجميع المدن', 'من طنجة للكويرة، السلعة توصلك حتى لباب الدار', 'truck'], ['خلص ملي توصلك', 'الدفع عند الاستلام — ما تخلص حتى تشوف السلعة بعينيك', 'cash'], ['جودة مضمونة', 'منتجات مختارة بعناية وضمان الاستبدال', 'shield']] as [t, d, icon]}
				<div class="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-xl hover:border-emerald-500/30">
					<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950 text-amber-300">
						{#if icon === 'truck'}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
							</svg>
						{:else if icon === 'cash'}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zm4.125 9.75a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zm3.75 0a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zm3.75 0a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zM18 14.25l.008-.008" />
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A48.374 48.374 0 0112 3c2.392 0 4.736.278 6.984.785a48.35 48.35 0 01-1.118 18.897c-.127.35-.423.566-.787.566H6.92c-.364 0-.66-.216-.787-.566A48.35 48.35 0 014.5 4.285C6.748 3.778 9.092 3.5 11.484 3.5c.17 0 .34 0 .51.006L12 3l-.006.214z" />
							</svg>
						{/if}
					</span>
					<h3 class="mt-3.5 font-display text-base font-bold text-neutral-900">{t}</h3>
					<p class="mt-1 text-sm leading-relaxed text-neutral-500">{d}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- 8. Order CTA -->
	<section id="offer" class="mx-auto max-w-5xl scroll-mt-24 px-4 pt-12">
		<div class="relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 text-center text-white md:py-14">
			<div
				class="pointer-events-none absolute inset-0 opacity-[0.12]"
				style="background-image: radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0); background-size: 20px 20px;"
				aria-hidden="true"
			></div>
			<div class="relative mx-auto max-w-xl space-y-4">
				<span class="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300">
					عرض محدود — الرشاش فابور مع كل طلب
				</span>
				<h2 class="font-display text-2xl font-bold leading-snug md:text-4xl">
					جاهز تنظّم دارك؟
				</h2>
				<p class="text-sm leading-loose text-emerald-100/80 md:text-base">
					خلّي لينا الطلب دابا عبر واتساب، أكّد معانا العنوان بالتليفون،
					والسلعة توصلك حتى لباب الدار وتخلص ملي تستلمها.
				</p>
				<div class="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
					<a
						href={`${waBase}?text=${encodeURIComponent('السلام Valoriia، بغيت نستفسر على العرض ديال المنظم + الرشاش فابور')}`}
						target="_blank"
						rel="noopener"
						class="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#25D366] px-8 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#20ba56] active:scale-[0.98]"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
						اطلب عبر واتساب
					</a>
					<a
						href="#bestsellers"
						class="inline-flex min-h-12 items-center rounded-2xl border border-white/20 px-8 font-bold text-white transition-colors hover:bg-white/10"
					>
						رجع للمنتجات
					</a>
				</div>
				<p class="text-xs text-emerald-100/60">
					متاح لخدمتك: {brand.supportHours || 'طيلة أيام الأسبوع'}
				</p>
			</div>
		</div>
	</section>

	<!-- 9. Footer -->
	<footer id="contact" class="mt-14 scroll-mt-24 bg-neutral-950 text-neutral-400">
		<div class="mx-auto grid max-w-5xl grid-cols-1 gap-9 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 font-display text-lg font-bold text-amber-400">ف</span>
					<span class="font-display text-xl font-bold text-white">{brand.name}</span>
				</div>
				<p class="text-xs leading-loose text-neutral-400">
					متجر مغربي متخصص في منتجات التنظيم والنظافة المنزلية. منتجات مختارة
					بعناية، توصيل سريع، والخلاص عند الاستلام.
				</p>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">تسوّق</h4>
				<div class="grid gap-2 text-xs">
					<a href="#collections" class="transition-colors hover:text-amber-300">المجموعات</a>
					<a href="#bestsellers" class="transition-colors hover:text-amber-300">الأكثر مبيعاً</a>
					<a href="#offer" class="transition-colors hover:text-amber-300">العرض الحالي</a>
					<a href="#why" class="transition-colors hover:text-amber-300">علاش حنا</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">المساعدة</h4>
				<div class="grid gap-2 text-xs">
					<a href="#why" class="transition-colors hover:text-amber-300">الشحن والتوصيل</a>
					<a href="#offer" class="transition-colors hover:text-amber-300">كيفاش نطلب</a>
					<a href="#contact" class="transition-colors hover:text-amber-300">اتصل بنا</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">تواصل معانا</h4>
				<a
					href={`${waBase}?text=${encodeURIComponent('السلام Valoriia، عندي استفسار')}`}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-emerald-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-200"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					راسلنا على واتساب
				</a>
				<p class="text-[11px] text-neutral-500">متاح لخدمتك: {brand.supportHours || 'طيلة أيام الأسبوع'}</p>
			</div>
		</div>
		<div class="border-t border-white/10 bg-black/40 py-5 text-center text-[11px] text-neutral-500">
			<p>© {new Date().getFullYear()} {brand.name} — الدفع عند الاستلام في جميع أنحاء المغرب.</p>
		</div>
	</footer>

	<!-- 10. Floating WhatsApp -->
	{#if waNumber}
		<a
			href={`${waBase}?text=${encodeURIComponent('السلام Valoriia، عندي استفسار')}`}
			target="_blank"
			rel="noopener"
			class="fixed bottom-5 left-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-xl transition-transform duration-300 hover:scale-105 active:scale-95"
			aria-label="تواصل عبر واتساب"
		>
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
			</svg>
		</a>
	{/if}

	<!-- 11. Cart drawer -->
	{#if drawerOpen}
		<div class="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="سلة التسوق">
			<button
				type="button"
				class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
				onclick={() => (drawerOpen = false)}
				aria-label="سد السلة"
			></button>
			<aside class="absolute bottom-0 left-0 top-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
				<div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
					<h2 class="font-display text-lg font-bold text-neutral-900">السلة ({cartCount})</h2>
					<button
						type="button"
						onclick={() => (drawerOpen = false)}
						class="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100"
						aria-label="سد السلة"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				{#if cartCount === 0}
					<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
						<svg viewBox="0 0 120 100" class="h-24 w-auto text-neutral-200" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 30h104l-9 48a10 10 0 01-10 8H27a10 10 0 01-10-8L8 30z" />
							<path stroke-linecap="round" d="M40 30l6-14h28l6 14" />
							<circle cx="48" cy="52" r="2.5" fill="currentColor" stroke="none" />
							<circle cx="72" cy="52" r="2.5" fill="currentColor" stroke="none" />
							<path stroke-linecap="round" d="M46 68c4 5 8 5 12 0s8-5 12 0" opacity="0.7" />
						</svg>
						<p class="font-bold text-neutral-700">السلة خاوية</p>
						<p class="text-sm text-neutral-400">زيد شي منتج وغادي يبان هنا</p>
						<button
							type="button"
							onclick={() => {
								drawerOpen = false;
								document.getElementById('bestsellers')?.scrollIntoView({ behavior: 'smooth' });
							}}
							class="mt-2 inline-flex min-h-11 items-center rounded-xl bg-emerald-950 px-6 font-bold text-white active:scale-[0.98]"
						>
							تسوّق دابا
						</button>
					</div>
				{:else}
					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each Object.entries(cart) as [k, q]}
							{@const item = bySlug[k]}
							{#if item}
								<div class="flex items-center gap-3 rounded-2xl border border-neutral-200/60 p-3">
									<div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
										{#if item.image}
											<img src={item.image} alt={item.title} class="h-full w-full object-cover" />
										{:else}
											<svg class="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
												<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
											</svg>
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-bold text-neutral-800">{item.title}</p>
										<p class="text-xs font-black text-emerald-700">{item.price} {cur}</p>
									</div>
									<div class="flex items-center gap-1.5">
										<button type="button" onclick={() => setQty(k, q - 1)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 active:scale-95" aria-label="نقص الكمية">−</button>
										<span class="w-5 text-center text-sm font-bold">{q}</span>
										<button type="button" onclick={() => setQty(k, q + 1)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 active:scale-95" aria-label="زيد الكمية">+</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
					<div class="space-y-3 border-t border-neutral-100 p-4">
						<div class="flex items-center justify-between font-black text-neutral-900">
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
							class="w-full py-2 text-center text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-600"
						>
							إفراغ السلة
						</button>
					</div>
				{/if}
			</aside>
		</div>
	{/if}
</div>
