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
		'✨ عرض خاص اليوم: توصيل فابور وسريع لجميع مدن المغرب + الدفع عند الاستلام بعد معاينة طلبيتك! ✦ مكملات غذائية طبيعية وحلال 100% ✦';
</script>

{#if effectiveStatic}
	<!-- Static Banner for Product & Landing Pages (Centered, readable, zero movement) -->
	<aside
		class="relative z-40 flex min-h-8 sm:min-h-9 w-full items-center justify-center bg-[#1B4332] text-white px-4 py-1.5 shadow-2xs select-none border-b border-emerald-900/40 {className}"
		aria-label="شريط الإعلانات"
		dir="rtl"
	>
		<p class="text-[11px] sm:text-xs font-bold text-center leading-tight tracking-wide text-white">
			{announcementText}
		</p>
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
					class="flex shrink-0 items-center px-10 sm:px-16 text-[11px] sm:text-xs font-semibold tracking-wide text-white/95"
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
