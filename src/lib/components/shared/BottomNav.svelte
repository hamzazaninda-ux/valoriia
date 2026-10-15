<script lang="ts">
	interface Props {
		whatsappNumber?: string;
		cartCount?: number;
		onSearch?: () => void;
		onOpenCart?: () => void;
	}

	let { whatsappNumber = '212600000000', cartCount = 0, onSearch, onOpenCart }: Props = $props();

	const itemClass =
		'flex min-h-14 flex-col items-center justify-center gap-1 text-stone-500 transition-colors hover:text-[#1B4332] active:scale-95';
</script>

<!-- Mobile bottom bar: الرئيسية | البحث | الأقسام | السلة -->

<!-- Mobile bottom bar: الرئيسية | البحث | الأقسام | السلة -->
<nav
	class="fixed inset-x-0 bottom-0 z-30 border-t border-stone-100 bg-white/95 backdrop-blur-md md:hidden"
	aria-label="التنقل السفلي"
	dir="rtl"
>
	<div class="grid grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
		<a href="#top" class={itemClass}>
			<svg class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
			</svg>
			<span class="text-[11px] font-semibold">الرئيسية</span>
		</a>
		<button type="button" onclick={() => onSearch?.()} class={itemClass}>
			<svg class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
			</svg>
			<span class="text-[11px] font-semibold">البحث</span>
		</button>
		<a href="#collections" class={itemClass}>
			<svg class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
			</svg>
			<span class="text-[11px] font-semibold">الأقسام</span>
		</a>
		<button type="button" onclick={() => onOpenCart?.()} class={itemClass}>
			<span class="relative">
				<svg class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
				</svg>
				{#if cartCount > 0}
					<span class="absolute -top-1.5 -start-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
						{cartCount}
					</span>
				{/if}
			</span>
			<span class="text-[11px] font-semibold">السلة</span>
		</button>
	</div>
</nav>
