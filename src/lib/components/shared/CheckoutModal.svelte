<script lang="ts">
	import { cart, cartUi, type CompletedOrder } from '$lib/stores/cart.svelte';
	import { buildOrderPayload, sendOrder } from '$lib/utils/checkout';
	import { isValidMoroccanPhone } from '$lib/utils/phone';

	let {
		currency = 'درهم',
		sheetsUrl = '',
		productTitle = 'منتج',
		sku = 'SKU-GENERAL',
		onDone
	}: {
		currency?: string;
		sheetsUrl?: string;
		productTitle?: string;
		sku?: string;
		onDone: (order: CompletedOrder) => void;
	} = $props();

	let fullName = $state('');
	let phoneNumber = $state('');
	let errors = $state({ fullName: '', phoneNumber: '' });
	let submitError = $state('');
	let loading = $state(false);

	function focusField(id: 'co-name' | 'co-phone') {
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		(el as HTMLElement).focus({ preventScroll: true });
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		errors = { fullName: '', phoneNumber: '' };
		submitError = '';

		if (fullName.trim().length < 2) {
			errors.fullName = 'دخل الاسم الكامل من فضلك';
			focusField('co-name');
			return;
		}
		if (!isValidMoroccanPhone(phoneNumber.trim())) {
			errors.phoneNumber = 'رقم الهاتف غير صحيح (مثال: 0612345678)';
			focusField('co-phone');
			return;
		}
		if (cart.lines.length === 0) return;

		loading = true;

		const payload = buildOrderPayload(
			{ fullName, phoneNumber },
			cart.lines,
			{
				productTitle,
				sku,
				currency,
				pageUrl: typeof window !== 'undefined' ? window.location.href : ''
			},
			'cart'
		);

		const completed: CompletedOrder = {
			orderId: payload.orderId as string,
			fullName: payload.fullName as string,
			phoneNumber: payload.phoneNumber as string,
			lines: cart.lines.map((l) => ({ ...l })),
			subtotal: payload.price as number,
			currency
		};

		sendOrder(payload as Record<string, unknown>, sheetsUrl).then(
			() => {
				localStorage.setItem('latestOrder', JSON.stringify({ ...payload, qte: payload.quantity }));
				sessionStorage.setItem('latestOrder', JSON.stringify({ ...payload, qte: payload.quantity }));
				cart.clear();
				loading = false;
				if (onDone) {
					onDone(completed);
				} else {
					cartUi.resetAll();
					window.location.href = '/thank-you';
				}
			},
			() => {
				loading = false;
				submitError = 'تعذر إرسال الطلب. المرجو المحاولة مرة أخرى.';
			}
		);
	}
</script>

{#if cartUi.checkout}
	<div class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="تأكيد الطلب">
		<button
			type="button"
			class="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
			onclick={() => cartUi.closeCheckout()}
			aria-label="سد نافذة التأكيد"
		></button>
		<div class="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" dir="rtl">
			<div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
				<h2 class="font-display text-lg font-bold text-neutral-900">تأكيد الطلب</h2>
				<button
					type="button"
					onclick={() => cartUi.closeCheckout()}
					class="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100"
					aria-label="سد نافذة التأكيد"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex-1 space-y-4 overflow-y-auto p-5">
				<!-- Order summary -->
				<div class="rounded-2xl border border-neutral-200/60 bg-neutral-50/70 p-4">
					<p class="pb-2 text-sm font-extrabold text-neutral-800">ملخص الطلب ({cart.count})</p>
					<div class="space-y-2">
						{#each cart.lines as line (line.key)}
							<div class="flex items-center gap-2.5">
								<span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
									{#if line.image}
										<img src={line.image} alt={line.title} class="h-full w-full object-cover" />
									{:else}
										<svg class="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
											<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />
										</svg>
									{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-[13px] font-bold text-neutral-800">{line.title}</span>
								</span>
								<span class="shrink-0 text-[13px] font-black text-neutral-800">{line.price} {currency}</span>
							</div>
						{/each}
					</div>
					<div class="mt-3 flex items-center justify-between border-t border-neutral-200 pt-2.5 font-black text-neutral-900">
						<span>المجموع (التوصيل مجاني)</span>
						<span>{cart.subtotal} {currency}</span>
					</div>
				</div>

				<!-- Only 2 fields -->
				<form onsubmit={handleSubmit} class="space-y-3">
					<div>
						<label for="co-name" class="mb-1 block pr-1 text-sm font-extrabold text-neutral-800">الاسم الكامل</label>
						<input
							id="co-name"
							type="text"
							bind:value={fullName}
							oninput={() => {
								if (errors.fullName) errors.fullName = '';
							}}
							placeholder="مثال: ياسين العلوي"
							autocomplete="name"
							class="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-right text-sm font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
						/>
						{#if errors.fullName}
							<p class="mt-1 text-[11px] font-semibold text-red-600">{errors.fullName}</p>
						{/if}
					</div>
					<div>
						<label for="co-phone" class="mb-1 block pr-1 text-sm font-extrabold text-neutral-800">
							رقم الهاتف <span class="font-normal text-neutral-400">(غادي نعيطو ليك نأكدو)</span>
						</label>
						<input
							id="co-phone"
							type="tel"
							inputmode="tel"
							bind:value={phoneNumber}
							oninput={() => {
								if (errors.phoneNumber) errors.phoneNumber = '';
							}}
							placeholder="06xxxxxxxx"
							autocomplete="tel"
							class="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-right text-sm font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							dir="ltr"
							style="text-align: right;"
						/>
						{#if errors.phoneNumber}
							<p class="mt-1 text-[11px] font-semibold text-red-600">{errors.phoneNumber}</p>
						{/if}
					</div>
					<button
						type="submit"
						disabled={loading}
						class="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 py-4 font-black text-white shadow-lg transition-all hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-60"
					>
						{#if loading}
							<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent pointer-events-none" style="pointer-events: none;"></span>
							<span class="pointer-events-none" style="pointer-events: none;">جاري إرسال الطلب…</span>
						{:else}
							<span class="pointer-events-none" style="pointer-events: none;">أكّد الطلب — {cart.subtotal} {currency}</span>
						{/if}
					</button>
					{#if submitError}
						<p class="text-center text-[11px] font-semibold text-red-600">{submitError}</p>
					{/if}
					<p class="text-center text-[11px] leading-relaxed text-neutral-400">
						بالضغط على تأكيد، غادي نعيطو ليك باش نأكدو العنوان — والخلاص عند الاستلام
					</p>
				</form>
			</div>
		</div>
	</div>
{/if}
