<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { ProductUpsell } from '$lib/types/product';

	let {
		isOpen = $bindable(false),
		upsell,
		currency = 'درهم',
		onAcceptUpsell = () => {},
		onDeclineUpsell = () => {}
	}: {
		isOpen?: boolean;
		upsell: ProductUpsell;
		currency?: string;
		onAcceptUpsell?: () => void | Promise<void>;
		onDeclineUpsell?: () => void | Promise<void>;
	} = $props();

	const initialSeconds = 20;

	let secondsLeft = $state(initialSeconds);
	let isSubmitting = $state(false);
	let isDeclining = $state(false);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function startTimer() {
		stopTimer();
		secondsLeft = initialSeconds;
		timerInterval = setInterval(() => {
			if (secondsLeft > 1) {
				secondsLeft--;
			} else {
				secondsLeft = 0;
				stopTimer();
				if (!isSubmitting && !isDeclining) handleDecline();
			}
		}, 1000);
	}

	$effect(() => {
		if (isOpen) {
			isSubmitting = false;
			isDeclining = false;
			startTimer();
		} else {
			stopTimer();
		}
		return () => stopTimer();
	});

	onDestroy(stopTimer);

	async function handleAccept() {
		if (isSubmitting || isDeclining) return;
		isSubmitting = true;
		stopTimer();
		try {
			await onAcceptUpsell();
		} catch (err) {
			console.error('Failed to accept upsell:', err);
		}
	}

	async function handleDecline() {
		if (isSubmitting || isDeclining) return;
		isDeclining = true;
		stopTimer();
		try {
			await onDeclineUpsell();
		} catch (err) {
			console.error('Failed to decline upsell:', err);
		}
	}
</script>

{#if isOpen}
	<div class="backdrop" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="upsell-title">
		<div class="sheet">
			<p class="timer">
				العرض كيبقى غير
				<b dir="ltr">00:{secondsLeft < 10 ? '0' + secondsLeft : secondsLeft}</b>
			</p>

			<p class="lead">طلبك تسجل. زيد هادي معاه وتوصلك فنفس الكولية:</p>
			<h3 id="upsell-title">{upsell.headline || upsell.title}</h3>

			<div class="media">
				{#if upsell.image}
					<img src={upsell.image} alt={upsell.title} loading="eager" decoding="async" />
				{:else}
					<span class="media-empty">{upsell.title}</span>
				{/if}
				<span class="price-tag">
					<b>{upsell.price} {currency}</b>
					{#if upsell.originalPrice > upsell.price}<s>{upsell.originalPrice}</s>{/if}
				</span>
			</div>

			{#if upsell.text}<p class="text">{upsell.text}</p>{/if}

			<button type="button" class="accept" onclick={handleAccept} disabled={isSubmitting || isDeclining}>
				{#if isSubmitting}
					<span class="spin"></span> كنزيدوها لطلبك...
				{:else}
					زيدها لطلبي بـ {upsell.price} {currency}
				{/if}
			</button>
			<button type="button" class="decline" onclick={handleDecline} disabled={isSubmitting || isDeclining}>
				{#if isDeclining}
					<span class="spin spin-dark"></span> كنأكدو طلبك...
				{:else}
					لا شكراً، غير الطلب ديالي
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px;
		background: rgba(23, 35, 43, 0.78);
		overflow-y: auto;
	}

	.sheet {
		width: 100%;
		max-width: 380px;
		margin: auto;
		padding: 16px;
		border-radius: 20px;
		background: #fff;
		font-family: 'Readex Pro', system-ui, sans-serif;
		color: #17232b;
		text-align: center;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
	}

	.timer {
		margin: 0 0 12px;
		padding: 6px 10px;
		border-radius: 10px;
		background: #fff4d6;
		color: #7a4d00;
		font-size: 13px;
		font-weight: 600;
	}

	.timer b {
		margin-inline-start: 4px;
		font-variant-numeric: tabular-nums;
	}

	.lead {
		margin: 0;
		font-size: 13px;
		color: #56687a;
	}

	h3 {
		margin: 4px 0 12px;
		font-size: 18px;
		font-weight: 700;
		line-height: 1.45;
	}

	.media {
		position: relative;
		display: grid;
		place-items: center;
		height: 180px;
		border-radius: 14px;
		background: #eef2f3;
		overflow: hidden;
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.media-empty {
		padding: 16px;
		font-size: 14px;
		font-weight: 600;
		color: #56687a;
	}

	.price-tag {
		position: absolute;
		top: 10px;
		inset-inline-start: 10px;
		display: grid;
		padding: 6px 10px;
		border-radius: 10px;
		background: #2f4858;
		color: #fff;
		line-height: 1.2;
	}

	.price-tag b {
		font-size: 15px;
	}

	.price-tag s {
		font-size: 11px;
		color: #b9c9d2;
	}

	.text {
		margin: 12px 0 0;
		font-size: 14px;
		line-height: 1.7;
		color: #3c4e5c;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		border: 0;
		border-radius: 12px;
		font-family: inherit;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.75;
		cursor: not-allowed;
	}

	.accept {
		margin-top: 14px;
		min-height: 50px;
		background: #f5a300;
		color: #17232b;
		font-size: 16px;
		font-weight: 700;
	}

	.accept:hover:not(:disabled) {
		background: #d98f00;
	}

	.decline {
		margin-top: 8px;
		min-height: 42px;
		background: #eef2f3;
		color: #56687a;
		font-size: 13.5px;
		font-weight: 600;
	}

	.spin {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid rgba(23, 35, 43, 0.25);
		border-top-color: #17232b;
		animation: spin 0.8s linear infinite;
	}

	.spin-dark {
		border-color: rgba(86, 104, 122, 0.25);
		border-top-color: #56687a;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
