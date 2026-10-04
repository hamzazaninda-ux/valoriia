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
		brandName = 'Lhamza Shop',
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
</script>

<header class="sticky top-0 z-50 border-b border-stone-200/70 bg-[#FAF9F6]/95 backdrop-blur-md">
	<div class="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4" dir="rtl">
		<!-- 1. Right Side (جهة اليمين): Hamburger menu button -->
		<div class="flex items-center">
			<button
				type="button"
				onclick={toggleMenu}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-stone-200/60 active:scale-95"
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
		</div>

		<!-- 2. Center (المنتصف): Store Name "Lhamza Shop" in one clean line, no overlapping badge -->
		<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
			<a
				href="#top"
				class="group flex items-center whitespace-nowrap px-2 py-1"
				aria-label={brandName}
			>
				<span class="font-display text-lg sm:text-2xl font-black tracking-tight text-[#1E293B] transition-colors group-hover:text-[#1B4332]">
					{brandName}
				</span>
			</a>
		</div>

		<!-- 3. Left Side (جهة اليسار): Search icon + Cart icon comfortably spaced -->
		<div class="flex items-center gap-3 sm:gap-4">
			{#if searchOpen}
				<input
					id="store-search-input"
					type="search"
					bind:value={query}
					placeholder="قلّب على منتج…"
					class="h-9 w-28 sm:w-44 rounded-xl border border-stone-200 bg-white px-3 text-xs sm:text-sm outline-none transition-all placeholder:text-stone-400 focus:w-36 sm:focus:w-52 focus:border-[#1B4332]"
				/>
			{/if}
			<button
				type="button"
				onclick={toggleSearch}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-stone-200/60 active:scale-95"
				aria-label="البحث في المنتجات"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
				</svg>
			</button>
			<button
				type="button"
				onclick={() => onOpenCart?.()}
				class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-stone-200/60 active:scale-95"
				aria-label="سلة التسوق"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-2.965-.912l-1.122.746A1.5 1.5 0 002.25 15.75v1.5c0 .828.672 1.5 1.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H6.108a1.5 1.5 0 00-1.087-.835L4.638 4.5M7.5 14.25L9.75 6h9.563a1.125 1.125 0 011.107 1.335l-.891 4.5a1.125 1.125 0 01-1.107.915H7.5z" />
				</svg>
				{#if cartCount > 0}
					<span class="absolute -top-0.5 -start-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
						{cartCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Desktop Navigation Links -->
	<nav class="hidden border-t border-stone-200/70 md:block" aria-label="التنقل الرئيسي">
		<div class="mx-auto flex max-w-5xl items-center justify-center gap-8 px-4 py-2.5 text-sm font-semibold text-stone-600">
			<a href="#top" class="transition-colors hover:text-[#1B4332]">الرئيسية</a>
			<a href="#bestsellers" class="transition-colors hover:text-[#1B4332]">المنتجات</a>
			<a href="#why" class="transition-colors hover:text-[#1B4332]">علاش حنا</a>
			<a href="#contact" class="transition-colors hover:text-[#1B4332]">تواصل معنا</a>
		</div>
	</nav>

	<!-- Mobile Dropdown Menu -->
	{#if menuOpen}
		<nav class="border-t border-stone-200/70 bg-white px-4 py-3 md:hidden shadow-lg" dir="rtl">
			<div class="grid gap-1 text-sm font-semibold text-stone-700">
				{#each [['الرئيسية', '#top'], ['المنتجات', '#bestsellers'], ['علاش حنا', '#why'], ['تواصل معنا', '#contact']] as [label, href]}
					<a
						{href}
						onclick={() => (menuOpen = false)}
						class="rounded-lg px-3 py-2.5 transition-colors hover:bg-stone-50 hover:text-[#1B4332] active:bg-stone-100"
					>
						{label}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
