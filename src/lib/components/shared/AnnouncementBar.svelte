<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const announcementText =
		'🚚 التوصيل مجاني وسريع لجميع المدن المغربية  •  الدفع نقداً عند استلام ومعاينة طلبك  •  ضمان استبدال واسترجاع 14 يوماً  •  تأكيد فوري عبر الواتساب  •  ';
</script>

<aside
	class="relative z-50 flex h-9 w-full items-center overflow-hidden bg-[#1B4332] text-white shadow-2xs select-none {className}"
	aria-label="شريط الإعلانات"
	dir="ltr"
>
	<div class="marquee-track flex items-center whitespace-nowrap">
		{#each [0, 1, 2, 3] as i}
			<div
				class="flex shrink-0 items-center pe-8 text-xs font-medium tracking-wide text-white/95"
				aria-hidden={i > 0}
				dir="rtl"
			>
				<span>{announcementText}</span>
			</div>
		{/each}
	</div>
</aside>

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
