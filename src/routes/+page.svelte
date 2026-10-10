<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import TrustSection from '$lib/components/sections/TrustSection.svelte';
	import HeroSection from '$lib/components/home/HeroSection.svelte';
	import ZigZagShowcase from '$lib/components/home/ZigZagShowcase.svelte';
	import ScientificProofSection from '$lib/components/home/ScientificProofSection.svelte';
	import BundlePricingSelector from '$lib/components/home/BundlePricingSelector.svelte';
	import ComparisonTable from '$lib/components/home/ComparisonTable.svelte';
	import ReviewsSection from '$lib/components/home/ReviewsSection.svelte';
	import FaqAccordion from '$lib/components/home/FaqAccordion.svelte';
	import StickyMobileCTA from '$lib/components/home/StickyMobileCTA.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import TimedUpsellModal from '$lib/components/upsell/TimedUpsellModal.svelte';
	import { PRICING_TIERS } from '$lib/constants/pricing';

	let { data } = $props();

	const brand = $derived(data?.settings?.brand || {});
	const waNumber = $derived((brand.whatsappNumber || '212600000000').replace(/\D/g, ''));
	const waBase = $derived(waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/212600000000');

	// --- Header & Drawer State ---
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let query = $state('');
	let drawerOpen = $state(false);

	// --- Selected Pricing Tier State ---
	let selectedTier = $state<'tier_1' | 'tier_2' | 'tier_3'>('tier_2');
	const currentTier = $derived(PRICING_TIERS[selectedTier]);

	// --- Cart state ---
	let cart = $state<Record<string, number>>({});
	let cartReady = $state(false);

	$effect(() => {
		if (!cartReady && typeof localStorage !== 'undefined') {
			try {
				cart = JSON.parse(localStorage.getItem('novavita-cart') || '{}');
			} catch {
				cart = {};
			}
			cartReady = true;
		}
	});

	$effect(() => {
		if (cartReady && typeof localStorage !== 'undefined') {
			localStorage.setItem('novavita-cart', JSON.stringify(cart));
		}
	});

	const cartCount = $derived(
		Object.values(cart).reduce((sum, qty) => sum + qty, 0)
	);

	// --- Flash Upsell Modal State ---
	let isUpsellOpen = $state(false);
	let isSubmitting = $state(false);

	interface ActivePendingOrder {
		orderId: string;
		fullName: string;
		phone: string;
		tier: 'tier_1' | 'tier_2' | 'tier_3';
		items: Array<{ sku: string; title: string; quantity: number; unitPrice: number }>;
		subtotal: number;
		shipping: number;
		total: number;
		hasUpsell: boolean;
		createdAt: string;
	}

	let pendingOrder = $state<ActivePendingOrder | null>(null);

	function scrollToOrder(sku?: string) {
		const el = document.getElementById('order-section');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// 1. COD Form Submission Handler -> Intercept with Timed Flash Upsell
	function handleOrderInitiated(orderData: { fullName: string; phone: string; tier: 'tier_1' | 'tier_2' | 'tier_3' }) {
		const tier = PRICING_TIERS[orderData.tier];
		const orderId = 'NV-' + Math.floor(100000 + Math.random() * 900000);

		// Decompose bundle SKUs
		const items = [];
		if (orderData.tier === 'tier_1') {
			items.push({ sku: 'gummies_biotine', title: 'علكات البيوتين (علبة واحدة)', quantity: 1, unitPrice: 199 });
		} else if (orderData.tier === 'tier_2') {
			items.push(
				{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, unitPrice: 139.5 },
				{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, unitPrice: 139.5 }
			);
		} else {
			items.push(
				{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, unitPrice: 116.33 },
				{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, unitPrice: 116.33 },
				{ sku: 'gumies_vitamine', title: 'علكات الفيتامينات المتعددة', quantity: 1, unitPrice: 116.34 }
			);
		}

		pendingOrder = {
			orderId,
			fullName: orderData.fullName,
			phone: orderData.phone,
			tier: orderData.tier,
			items,
			subtotal: tier.price,
			shipping: tier.shipping,
			total: tier.price + tier.shipping,
			hasUpsell: false,
			createdAt: new Date().toISOString()
		};

		// Launch the 15s Timed Flash Upsell Modal
		isUpsellOpen = true;
	}

	// 2. Accept Upsell Handler (+99 MAD)
	function handleAcceptUpsell() {
		if (!pendingOrder) return;

		pendingOrder.hasUpsell = true;
		pendingOrder.items.push({
			sku: 'gummies_collagen',
			title: 'علبة إضافية (عرض خاطف حصري)',
			quantity: 1,
			unitPrice: 99
		});
		pendingOrder.total += 99;

		finalizeOrderSubmission();
	}

	// 3. Decline Upsell Handler (Proceed with base order)
	function handleDeclineUpsell() {
		finalizeOrderSubmission();
	}

	// 4. Final Server Dispatch & Routing
	async function finalizeOrderSubmission() {
		if (!pendingOrder || isSubmitting) return;
		isSubmitting = true;

		try {
			// Save in local storage for Thank You page & Pixel tracking
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('latestOrder', JSON.stringify(pendingOrder));
			}
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('latestOrder', JSON.stringify(pendingOrder));
			}

			// Resilient server dispatch with keepalive
			try {
				await fetch('/api/orders', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(pendingOrder),
					keepalive: true
				});
			} catch (postErr) {
				console.warn('Orders API network error (proceeding to thank-you):', postErr);
			}

			// Direct smooth redirection to Thank You page
			await goto(
				`/thank-you?orderId=${encodeURIComponent(pendingOrder.orderId)}&total=${pendingOrder.total}&fullName=${encodeURIComponent(pendingOrder.fullName)}&phone=${encodeURIComponent(pendingOrder.phone)}&hasUpsell=${pendingOrder.hasUpsell}`
			);
		} catch (err) {
			console.error('Redirection error:', err);
			// Fallback direct redirection
			window.location.href = `/thank-you?orderId=${pendingOrder.orderId}&total=${pendingOrder.total}`;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{brand.name || 'NOVAVITA'} | العناية بالجمال والصحة من الداخل</title>
	<meta
		name="description"
		content="حلوى الفيتامينات والجمال الطبيعية رقم 1 في المغرب. بيوتين مركز للشعر، كولاجين بحري للبشرة، وملتي فيتامين للحيوية والنشاط اليومي."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div id="top" class="relative min-h-screen bg-[#FAF8F5] font-body text-[#1F2937] pb-16 md:pb-0" dir="rtl">
	<!-- 1. Top Announcement Bar -->
	<AnnouncementBar isStatic={false} />

	<!-- 2. Sticky Header with circular "N" Logo -->
	<Header
		brandName={brand.name || 'NOVAVITA'}
		cartCount={cartCount}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => (drawerOpen = true)}
	/>

	<!-- 3. Hero Section (Above the Fold CRO Powerhouse) -->
	<HeroSection onCtaClick={() => scrollToOrder()} />

	<!-- 4. The 3 Core SKUs Zig-Zag Showcase (Emotional Resonance & Moroccan Pain Points) -->
	<ZigZagShowcase onSelectProduct={(sku) => scrollToOrder(sku)} />

	<!-- 5. Scientific Proof & Clinical Rigor (GMP, Halal, Lab-Tested, Precise Dosages) -->
	<ScientificProofSection onCtaClick={() => scrollToOrder()} />

	<!-- 6. Comparison Table: NOVAVITA vs Traditional Pills -->
	<ComparisonTable />

	<!-- 6. Bundle Pricing Selector & Embedded 1-Step COD Form (#order-section) -->
	<BundlePricingSelector
		bind:selectedTier
		{isSubmitting}
		onSelectTier={(tier) => (selectedTier = tier)}
		onSubmitOrder={handleOrderInitiated}
	/>

	<!-- 7. Verified Moroccan Customer Reviews -->
	<ReviewsSection />

	<!-- 8. Interactive FAQ Accordion -->
	<FaqAccordion />

	<!-- 9. Customer Service & Guarantees Strip -->
	<TrustSection
		whatsappNumber={waNumber}
		brandName={brand.name || 'NOVAVITA'}
		supportHours="طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً"
	/>

	<!-- 10. Global Footer -->
	<footer id="contact" class="mt-10 scroll-mt-24 bg-[#143326] text-stone-300 border-t border-emerald-900/30">
		<div class="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-display text-lg font-bold text-[#E86A7C]">N</div>
					<span class="font-display text-xl font-bold text-white">{brand.name || 'NOVAVITA'}</span>
				</div>
				<p class="text-xs leading-loose text-stone-300">
					NOVAVITA هي علامتك المغربية المتخصصة في المكملات الجمالية الطبيعية بنكهات لذيذة، مصممة للمرأة العصرية لتهتم بجمالها وصحتها بدون عناء الكبسولات المرة.
				</p>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">تسوّقي حسب روتينك</h4>
				<div class="grid gap-2 text-xs">
					<a href="/collection" class="transition-colors hover:text-[#E86A7C]">المجموعة الكاملة</a>
					<a href="/products/gummies_collagen" class="transition-colors hover:text-[#E86A7C]">كولاجين البشرة البحري</a>
					<a href="/products/gummies_biotine" class="transition-colors hover:text-[#E86A7C]">بيوتين الشعر والإنبات</a>
					<a href="/products/gumies_vitamine" class="transition-colors hover:text-[#E86A7C]">فيتامينات الحيوية والمناعة</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">ضمانات الشراء والتوصيل</h4>
				<div class="grid gap-2 text-xs">
					<span class="text-stone-300">🇲🇦 الدفع نقداً بعد الاستلام</span>
					<span class="text-stone-300">📦 فحص ومعاينة الطرد عند الباب</span>
					<span class="text-stone-300">🚚 توصيل مجاني وسريع لكافة المدن</span>
					<span class="text-stone-300">🌿 بكتين نباتي 100% حلال معتمد</span>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">خدمة الزبناء بالمغرب</h4>
				<a
					href={`${waBase}?text=${encodeURIComponent('السلام عليكم NOVAVITA، عندي استفسار بخصوص باقات العروض')}`}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:border-[#E86A7C] hover:text-[#E86A7C]"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					تواصل عبر واتساب
				</a>
				<p class="text-[11px] text-stone-400">متاح لخدمتك: {brand.supportHours || 'طيلة أيام الأسبوع'}</p>
			</div>
		</div>
		<div class="border-t border-white/10 bg-black/30 py-5 text-center text-xs text-stone-400">
			<p>جميع الحقوق محفوظة © NOVAVITA {new Date().getFullYear()}</p>
		</div>
	</footer>

	<!-- 11. Sticky Mobile Bottom CTA Bar -->
	<StickyMobileCTA
		price={currentTier.price}
		tierLabel={currentTier.title}
		onCtaClick={() => scrollToOrder()}
	/>

	<!-- 12. Interactive Slide-Out Cart Drawer -->
	<CartDrawer
		bind:open={drawerOpen}
		bind:items={cart}
		onProceedToCheckout={() => scrollToOrder()}
	/>

	<!-- 13. 15s Timed Flash Upsell Modal (99 MAD Offer) -->
	<TimedUpsellModal
		bind:open={isUpsellOpen}
		orderTotal={pendingOrder?.total || 279}
		onAccept={handleAcceptUpsell}
		onDecline={handleDeclineUpsell}
	/>
</div>
