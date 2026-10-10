<script lang="ts">
	interface Props {
		whatsappNumber?: string;
		cartCount?: number;
		onSearch?: () => void;
		onOpenCart?: () => void;
	}

	let { whatsappNumber = '212626558375', cartCount = 0, onSearch, onOpenCart }: Props = $props();

	const cleanWa = $derived(whatsappNumber.replace(/\D/g, '') || '212626558375');
	const defaultMessage = 'السلام عليكم NOVAVITA، عندي استفسار بخصوص منتجات العناية';
	const waUrl = $derived(`https://wa.me/${cleanWa}?text=${encodeURIComponent(defaultMessage)}`);

	const itemClass =
		'flex min-h-14 flex-col items-center justify-center gap-1 text-stone-500 transition-colors hover:text-[#1B4332] active:scale-95';
</script>

<!-- Floating WhatsApp: sits above the bottom bar on mobile, lower on desktop (no bar there) -->
<a
	href={waUrl}
	target="_blank"
	rel="noopener"
	class="fixed bottom-[76px] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl ring-4 ring-white transition-all duration-300 hover:scale-105 hover:bg-[#20ba56] active:scale-95 md:bottom-6 md:left-5 md:h-14 md:w-14"
	aria-label="تواصل معنا عبر واتساب"
>
	<svg class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
	</svg>
</a>

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
