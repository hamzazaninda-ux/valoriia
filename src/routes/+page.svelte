<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import TrustSection from '$lib/components/sections/TrustSection.svelte';
	import HeroSection from '$lib/components/home/HeroSection.svelte';
	import ZigZagShowcase from '$lib/components/home/ZigZagShowcase.svelte';
	import ScientificProofSection from '$lib/components/home/ScientificProofSection.svelte';
	import ComparisonTable from '$lib/components/home/ComparisonTable.svelte';
	import ReviewsSection from '$lib/components/home/ReviewsSection.svelte';
	import FaqAccordion from '$lib/components/home/FaqAccordion.svelte';
	import StickyMobileCTA from '$lib/components/home/StickyMobileCTA.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { cart, cartUi } from '$lib/stores/cart.svelte';

	let { data } = $props();

	const brand = $derived(data?.settings?.brand || {});
	const waNumber = $derived((brand.whatsappNumber || '212600000000').replace(/\D/g, ''));
	const waBase = $derived(waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/212600000000');

	// --- Header State ---
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let query = $state('');

	function scrollToProducts(sku?: string) {
		if (sku) {
			goto(`/products/${sku}`);
			return;
		}
		const el = document.getElementById('showcase');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			goto('/products/gummies_biotine');
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
		cartCount={cart.count}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => cartUi.openDrawer()}
	/>

	<!-- 3. Hero Section (Above the Fold CRO Powerhouse) -->
	<HeroSection onCtaClick={() => scrollToProducts()} />

	<!-- 4. The 3 Core SKUs Zig-Zag Showcase (Emotional Resonance & Moroccan Pain Points) -->
	<ZigZagShowcase onSelectProduct={(sku) => scrollToProducts(sku)} />

	<!-- 5. Scientific Proof & Clinical Rigor (GMP, Halal, Lab-Tested, Precise Dosages) -->
	<ScientificProofSection onCtaClick={() => scrollToProducts()} />

	<!-- 6. Comparison Table: NOVAVITA vs Traditional Pills -->
	<ComparisonTable />

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
					href={`${waBase}?text=${encodeURIComponent('السلام عليكم NOVAVITA، عندي استفسار بخصوص منتجات العناية')}`}
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
		price={199}
		tierLabel="علكات الفيتامينات الطبيعية"
		onCtaClick={() => scrollToProducts()}
	/>

	<!-- 12. Interactive Slide-Out Cart Drawer -->
	<CartDrawer />
</div>
