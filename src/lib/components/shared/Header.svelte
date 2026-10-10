<script lang="ts">
	interface Props {
		brandName?: string;
		cartCount?: number;
		searchOpen?: boolean;
		menuOpen?: boolean;
		query?: string;
		onOpenCart?: () => void;
	}

	let {
		brandName = 'NOVAVITA',
		cartCount = 0,
		searchOpen = $bindable(false),
		menuOpen = $bindable(false),
		query = $bindable(''),
		onOpenCart
	}: Props = $props();

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (!searchOpen) query = '';
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	const navLinks = [
		{ label: 'الرئيسية', href: '/' },
		{ label: 'مجموعتنا', href: '/collection' },
		{ label: 'كولاجين', href: '/products/gummies_collagen' },
		{ label: 'بيوتين', href: '/products/gummies_biotine' },
		{ label: 'ملتي فيتامين', href: '/products/gumies_vitamine' },
		{ label: 'من نحن', href: '/about' },
		{ label: 'اتصل بنا', href: '/contact' }
	];
</script>

<header class="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#FAF8F5]/95 backdrop-blur-md transition-shadow duration-200">
	<div class="relative mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3" dir="rtl">
		<!-- 1. Right Side (جهة اليمين): Hamburger menu button on mobile + Quick Nav on desktop -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={toggleMenu}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-[#1B4332] transition-all hover:bg-emerald-900/10 active:scale-95 md:hidden"
				aria-label="القائمة الرئيسية"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					{#if menuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
					{/if}
				</svg>
			</button>

			<!-- Trust Tagline on Desktop -->
			<div class="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-[#1B4332]/80 bg-emerald-950/5 px-2.5 py-1 rounded-full border border-emerald-900/10">
				<span>🌿</span>
				<span>100% طبيعي وحلال</span>
			</div>
		</div>

		<!-- 2. Center (المنتصف): Brand Logo "N" + NOVAVITA Typography -->
		<div class="flex items-center justify-center pointer-events-auto">
			<a
				href="/"
				class="group flex items-center gap-2 sm:gap-2.5 whitespace-nowrap px-1 py-0.5 text-center transition-transform hover:scale-[1.01]"
				aria-label="NOVAVITA - الصفحة الرئيسية"
			>
				<!-- Sleek Circular "N" SVG Logo -->
				<div class="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center shadow-xs transition-transform group-hover:rotate-3">
					<svg class="h-full w-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="50" cy="50" r="46" stroke="#1B4332" stroke-width="5" fill="#FAF8F5" />
						<circle cx="50" cy="50" r="40" stroke="#E86A7C" stroke-width="1.5" stroke-dasharray="4 3" fill="none" />
						<path d="M33 68V32L67 68V32" stroke="#1B4332" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<div class="flex flex-col text-start">
					<span class="font-display text-xl sm:text-2xl font-black tracking-tight text-[#1B4332] leading-tight transition-colors group-hover:text-[#143427]">
						{brandName || 'NOVAVITA'}
					</span>
					<span class="text-[9px] sm:text-[11px] font-semibold text-[#E86A7C] leading-none tracking-normal">
						العناية بالجمال والصحة من الداخل
					</span>
				</div>
			</a>
		</div>

		<!-- 3. Left Side (جهة اليسار): Search + Sticky Cart Icon with Badge -->
		<div class="flex items-center gap-2 sm:gap-3">
			{#if searchOpen}
				<input
					id="store-search-input"
					type="search"
					bind:value={query}
					placeholder="ابحثي عن منتج…"
					class="h-9 w-28 sm:w-44 rounded-xl border border-emerald-900/20 bg-white px-3 text-xs sm:text-sm outline-none transition-all placeholder:text-stone-400 focus:w-36 sm:focus:w-52 focus:border-[#1B4332]"
				/>
			{/if}

			<button
				type="button"
				onclick={toggleSearch}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-[#1B4332] transition-colors hover:bg-emerald-900/10 active:scale-95"
				aria-label="البحث في المنتجات"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
				</svg>
			</button>

			<!-- Quick Cart Drawer Trigger (Always accessible on Mobile and Desktop) -->
			<button
				type="button"
				onclick={() => onOpenCart?.()}
				class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4332]/5 text-[#1B4332] border border-emerald-900/10 transition-all hover:bg-[#1B4332] hover:text-white active:scale-95"
				aria-label="سلة التسوق"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
				</svg>
				{#if cartCount > 0}
					<span class="absolute -top-1 -start-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E86A7C] px-1 text-[11px] font-black text-white shadow-sm ring-2 ring-[#FAF8F5]">
						{cartCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Desktop Navigation Links (الرئيسية, مجموعتنا, كولاجين, بيوتين, ملتي فيتامين, من نحن, اتصل بنا) -->
	<nav class="hidden border-t border-emerald-950/10 bg-white/70 md:block" aria-label="التنقل الرئيسي">
		<div class="mx-auto flex max-w-6xl items-center justify-center gap-6 lg:gap-8 px-4 py-2.5 text-sm font-bold text-[#1B4332]">
			{#each navLinks as link}
				<a
					href={link.href}
					class="relative py-1 transition-colors hover:text-[#E86A7C] after:absolute after:bottom-0 after:start-0 after:h-0.5 after:w-0 after:bg-[#E86A7C] after:transition-all hover:after:w-full"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</nav>

	<!-- Mobile Dropdown Menu -->
	{#if menuOpen}
		<nav class="border-t border-emerald-950/10 bg-white px-4 py-3 md:hidden shadow-xl" dir="rtl">
			<div class="grid gap-1 text-sm font-bold text-[#1B4332]">
				{#each navLinks as link}
					<a
						href={link.href}
						onclick={() => (menuOpen = false)}
						class="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-emerald-50 hover:text-[#E86A7C] active:bg-emerald-100"
					>
						<span>{link.label}</span>
						<span class="text-xs text-stone-400">←</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
