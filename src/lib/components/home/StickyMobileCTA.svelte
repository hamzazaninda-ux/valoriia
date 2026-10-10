<script lang="ts">
	interface Props {
		price?: number;
		tierLabel?: string;
		onCtaClick?: () => void;
	}

	let {
		price = 279,
		tierLabel = 'باقة الثنائي (شهرين)',
		onCtaClick
	}: Props = $props();

	let visible = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const handleScroll = () => {
			// Show sticky CTA after scrolling past 350px
			visible = window.scrollY > 350;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function handleClick() {
		if (onCtaClick) {
			onCtaClick();
			return;
		}
		const el = document.getElementById('showcase');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			window.location.href = '/products/gummies_biotine';
		}
	}
</script>

{#if visible}
	<div
		class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-950/15 p-3 shadow-2xl md:hidden transition-transform duration-300 transform translate-y-0"
		dir="rtl"
	>
		<div class="flex items-center justify-between gap-3 max-w-md mx-auto">
			<div class="flex flex-col text-start leading-tight">
				<span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md w-max">
					توصيل فابور مجاني
				</span>
				<div class="flex items-baseline gap-1 mt-0.5">
					<span class="font-display text-lg font-black text-[#1B4332]">{price} MAD</span>
					<span class="text-[10px] text-stone-400 line-through">398 MAD</span>
				</div>
			</div>

			<button
				type="button"
				onclick={handleClick}
				class="flex-1 min-h-11 rounded-xl bg-[#E86A7C] hover:bg-[#d45366] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-900/20 flex items-center justify-center gap-1.5 transition-all"
			>
				<span>اطلبي الآن • الدفع عند الاستلام</span>
				<span class="text-sm">←</span>
			</button>
		</div>
	</div>
{/if}
