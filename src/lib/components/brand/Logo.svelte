<script lang="ts">
	interface Props {
		/** Height of the hamza tile in px. */
		size?: number;
		/** 'dark' = ink wordmark for light backgrounds, 'light' = white wordmark for dark backgrounds. */
		tone?: 'dark' | 'light';
		showWord?: boolean;
	}

	let { size = 34, tone = 'dark', showWord = true }: Props = $props();
</script>

<span class="lz-logo" data-tone={tone} style="--s: {size}px">
	<span class="mark" aria-hidden="true"><span class="glyph">ء</span></span>
	{#if showWord}
		<span class="word">Lhamza</span>
	{/if}
</span>

<style>
	.lz-logo {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--s) * 0.3);
		direction: ltr;
	}

	.mark {
		display: grid;
		place-items: center;
		width: var(--s);
		height: var(--s);
		border-radius: calc(var(--s) * 0.26);
		background: var(--lz-amber, #f5a300);
		color: var(--lz-ink, #17232b);
	}

	.glyph {
		font-family: 'Readex Pro', Tahoma, Arial, sans-serif;
		font-weight: 700;
		font-size: calc(var(--s) * 0.82);
		line-height: 1;
		transform: translateY(-4%);
	}

	.word {
		font-family: 'Readex Pro', system-ui, sans-serif;
		font-weight: 700;
		font-size: calc(var(--s) * 0.66);
		letter-spacing: -0.02em;
		line-height: 1;
		color: var(--lz-ink, #17232b);
	}

	[data-tone='light'] .word {
		color: #fff;
	}
</style>
