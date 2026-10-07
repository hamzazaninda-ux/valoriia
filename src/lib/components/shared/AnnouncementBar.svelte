<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		class?: string;
		isStatic?: boolean;
	}

	let { class: className = '', isStatic }: Props = $props();

	// If isStatic is explicitly passed, honor it; otherwise automatically detect if path is not home
	const effectiveStatic = $derived(
		isStatic !== undefined ? isStatic : page.url.pathname !== '/'
	);

	const announcementText =
		'التوصيل مجاني وسريع لجميع المدن المغربية  ✦  الدفع نقداً بعد استلام ومعاينة طلبك  ✦  ضمان استبدال واسترجاع 14 يوماً  ✦  تأكيد فوري عبر الواتساب  ✦  ';
</script>

{#if effectiveStatic}
	<!-- Static Banner for Product & Landing Pages (Centered, readable, zero movement) -->
	<aside
		class="relative z-40 flex min-h-8 sm:min-h-9 w-full items-center justify-center bg-[#1B4332] text-white px-3 py-1.5 shadow-2xs select-none border-b border-emerald-900/40 {className}"
		aria-label="شريط الإعلانات"
		dir="rtl"
	>
		<div class="flex items-center justify-center flex-wrap gap-x-2.5 sm:gap-x-3.5 gap-y-0.5 text-[11px] sm:text-xs font-bold text-center leading-tight">
			<span class="inline-flex items-center gap-1 text-white">
				<span>🚚</span>
				<span class="sm:hidden">توصيل مجاني وفابور</span>
				<span class="hidden sm:inline">توصيل مجاني وسريع لجميع المدن</span>
			</span>
			<span class="text-amber-400 font-extrabold select-none">✦</span>
			<span class="inline-flex items-center gap-1 text-white">
				<span>📦</span>
				<span class="sm:hidden">الدفع بعد المعاينة</span>
				<span class="hidden sm:inline">الدفع نقداً بعد استلام ومعاينة طلبك</span>
			</span>
			<span class="text-amber-400 font-extrabold select-none hidden sm:inline">✦</span>
			<span class="hidden sm:inline-flex items-center gap-1 text-white">
				<span>🛡️</span>
				<span>ضمان استبدال واسترجاع 14 يوماً</span>
			</span>
		</div>
	</aside>
{:else}
	<!-- Infinite Marquee Ticker for Homepage -->
	<aside
		class="relative z-50 flex h-8 sm:h-9 w-full items-center overflow-hidden bg-[#1B4332] text-white shadow-2xs select-none {className}"
		aria-label="شريط الإعلانات"
		dir="ltr"
	>
		<div class="marquee-track flex items-center whitespace-nowrap">
			{#each [0, 1, 2, 3] as i}
				<div
					class="flex shrink-0 items-center pe-8 text-[11px] sm:text-xs font-semibold tracking-wide text-white/95"
					aria-hidden={i > 0}
					dir="rtl"
				>
					<span>{announcementText}</span>
				</div>
			{/each}
		</div>
	</aside>
{/if}

<style>
	.marquee-track {
		display: flex;
		width: max-content;
		will-change: transform;
		animation: marquee-scroll 28s linear infinite;
	}

	.marquee-track:hover {
		animation-play-state: paused;
	}

	@keyframes marquee-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee-track {
			animation: none;
		}
	}
</style>
