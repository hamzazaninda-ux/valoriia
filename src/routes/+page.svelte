<script lang="ts">
	import Logo from '$lib/components/brand/Logo.svelte';

	let { data } = $props();

	// Store name kept as "Lhamza Shop" (required by scripts/verify-store-identity.js).
	const STORE_NAME = 'Lhamza Shop';

	const brand = $derived(data.settings.brand);
	const commerce = $derived(data.settings.commerce);
	const products = $derived(data.products);
	const cur = $derived(commerce.currencySymbol || 'درهم');

	const waNumber = $derived((brand.whatsappNumber || '212626558375').replace(/\D/g, ''));
	const wa = (text: string) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

	let menuOpen = $state(false);

	const threats = [
		{
			id: 'rain',
			name: 'الشتا',
			harm: 'الماء كيتسرب من الجوانات ديال البيبان والكوفر، والرطوبة كتجيب الريحة والصدا.',
			fix: 'شريط العزل ديال البيبان، غطاء الكوفر'
		},
		{
			id: 'dust',
			name: 'الغبرة والشركي',
			harm: 'الغبرة كتدخل للصالون، وصوت الريح كيعيّيك فالطريق السيار.',
			fix: 'شريط العزل ديال البيبان'
		},
		{
			id: 'sun',
			name: 'الشمس',
			harm: 'الصيف ديالنا كيشقق الطابلو وكيبهّت الصباغة ديال الطوموبيل.',
			fix: 'غطاء الطوموبيل، كاش طابلو'
		},
		{
			id: 'road',
			name: 'الطريق',
			harm: 'الطين والحجر كيضربو البودي، وعجلة ناقصة فبلاصة خاوية كتوقفك.',
			fix: 'الغياسة، منفاخ العجلات المحمول'
		}
	];

	const carMakes = ['Dacia', 'Renault', 'Peugeot', 'Hyundai', 'Kia', 'Toyota', 'Volkswagen', 'Fiat'];

	const promises = [
		{ id: 'cod', title: 'الدفع عند الاستلام', body: 'كتخلص للموزع ملي يوصلك الطلب، ماشي قبل.' },
		{ id: 'ship', title: 'التوصيل فـ 24 حتى 72 ساعة', body: 'لجميع المدن المغربية، ومن بعد التأكيد معاك فالتيليفون.' },
		{ id: 'swap', title: 'استبدال واسترجاع 7 أيام', body: 'إلا ما ناسبكش المنتج، كنبدلوه ليك ولا كنرجعو ليك فلوسك.' },
		{ id: 'help', title: 'واتساب من 9:00 حتى 22:00', body: 'سولنا على أي منتج قبل ما تطلب، طيلة أيام الأسبوع.' }
	];

	const year = new Date().getFullYear();
</script>

<svelte:head>
	<title>{STORE_NAME} | إكسسوارات حماية الطوموبيل فالمغرب</title>
	<meta
		name="description"
		content="Lhamza Shop: إكسسوارات كتحمي طوموبيلتك من الشتا، الغبرة والشمس. الدفع عند الاستلام والتوصيل لجميع المدن المغربية."
	/>
	<meta property="og:title" content="{STORE_NAME} | إكسسوارات حماية الطوموبيل" />
	<meta name="theme-color" content="#2F4858" />
</svelte:head>

<div class="lz" id="top">
	<!-- Service strip -->
	<p class="strip">
		<span>الدفع عند الاستلام</span>
		<span class="strip-sep" aria-hidden="true"></span>
		<span>التوصيل لجميع المدن</span>
		<span class="strip-sep strip-wide" aria-hidden="true"></span>
		<span class="strip-wide">استبدال 7 أيام</span>
	</p>

	<!-- Header -->
	<header class="head">
		<div class="wrap head-row">
			<a href="/" class="head-logo" aria-label={STORE_NAME}>
				<Logo size={34} tone="light" />
			</a>

			<nav class="head-nav" aria-label="التنقل الرئيسي">
				<a href="#products">المنتجات</a>
				<a href="#threats">علاش الحماية</a>
				<a href="#advisor">شنو يناسب طوموبيلتك</a>
				<a href="#promise">الضمانات</a>
			</nav>

			<div class="head-actions">
				<a class="head-wa" href={wa('سلام، بغيت نسول على منتج')} target="_blank" rel="noopener">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>
					<span>واتساب</span>
				</a>
				<button
					type="button"
					class="head-menu"
					aria-label="القائمة"
					aria-expanded={menuOpen}
					onclick={() => (menuOpen = !menuOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						{#if menuOpen}
							<path d="M6 6l12 12M18 6 6 18" />
						{:else}
							<path d="M4 7h16M4 12h16M4 17h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>

		{#if menuOpen}
			<nav class="head-drawer" aria-label="القائمة">
				{#each [['المنتجات', '#products'], ['علاش الحماية', '#threats'], ['شنو يناسب طوموبيلتك', '#advisor'], ['الضمانات', '#promise'], ['تواصل معنا', '/contact']] as [label, href]}
					<a {href} onclick={() => (menuOpen = false)}>{label}</a>
				{/each}
			</nav>
		{/if}
	</header>

	<main>
		<!-- Hero -->
		<section class="hero">
			<div class="wrap hero-grid">
				<div class="hero-copy">
					<h1>الشتا، الغبرة والشمس بقاو برا طوموبيلتك.</h1>
					<p class="hero-sub">
						إكسسوارات حماية مختارة لطرقان المغرب وللجو ديالو. كتشوف الطلب فيدك قبل ما تخلص.
					</p>
					<div class="hero-ctas">
						<a class="btn btn-amber" href="#products">شوف المنتجات</a>
						<a class="btn btn-ghost" href="#advisor">شنو يناسب طوموبيلتك؟</a>
					</div>
				</div>

				<figure class="hero-art" aria-hidden="true">
					<svg viewBox="0 0 320 170" role="presentation">
						<defs>
							<pattern id="rain" width="14" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(14)">
								<line x1="7" y1="0" x2="7" y2="9" stroke="#9FB6C3" stroke-width="1.4" stroke-linecap="round" />
							</pattern>
							<mask id="outside-shield">
								<rect width="320" height="170" fill="#fff" />
								<path d="M18 140 Q160 -16 302 140 Z" fill="#000" />
							</mask>
						</defs>
						<rect width="320" height="140" fill="url(#rain)" mask="url(#outside-shield)" opacity="0.75" />
						<path class="shield" d="M18 140 Q160 -16 302 140" fill="none" stroke="#F5A300" stroke-width="3.5" stroke-linecap="round" />
						<line x1="0" y1="140.5" x2="320" y2="140.5" stroke="#4E6878" stroke-width="1.5" />
						<g class="car" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
							<path d="M66 128 H52 Q46 128 46 121 V110 Q46 101 56 99 L96 94 L120 74 Q127 68 138 68 H190 Q200 68 207 75 L228 94 L262 99 Q274 101 274 112 V121 Q274 128 267 128 H254" />
							<path d="M106 128 H214" />
							<path d="M108 94 L126 78 Q130 75 136 75 H160 V94 Z M168 75 H188 Q195 75 200 80 L214 94 H168 Z" stroke-width="2" />
							<circle cx="86" cy="128" r="14" fill="#2F4858" />
							<circle cx="234" cy="128" r="14" fill="#2F4858" />
							<circle cx="86" cy="128" r="5" />
							<circle cx="234" cy="128" r="5" />
						</g>
					</svg>
				</figure>
			</div>
		</section>

		<!-- Products -->
		<section class="products" id="products" aria-labelledby="products-title">
			<div class="wrap">
				<div class="sec-head">
					<h2 id="products-title">المنتجات</h2>
					<p>كل منتج جربناه وكنعرفو مزيان شنو كيدير. ثمن واحد واضح، بلا مفاجآت.</p>
				</div>

				{#if products.length}
					<ul class="grid">
						{#each products as p (p.slug)}
							<li>
								<a class="card" href="/{p.slug}">
									<span class="card-img">
										{#if p.heroImage}
											<img src={p.heroImage} alt={p.title} loading="lazy" decoding="async" />
										{:else}
											<Logo size={44} showWord={false} />
										{/if}
									</span>
									<span class="card-body">
										<span class="card-title">{p.title}</span>
										{#if p.subtitle}<span class="card-sub">{p.subtitle}</span>{/if}
										{#if p.startingPrice}
											<span class="card-price"><b>{p.startingPrice}</b> {cur}</span>
										{/if}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="empty">
						<p class="empty-title">المجموعة الأولى كتوجد دابا.</p>
						<p>صيفط لينا الموديل ديال طوموبيلتك فواتساب، ونعلموك أول واحد ملي تكون واجدة.</p>
						<a class="btn btn-ink" href={wa('سلام، بغيت تعلموني ملي تخرج المجموعة الأولى. الطوموبيل ديالي: ')} target="_blank" rel="noopener">علمني فواتساب</a>
					</div>
				{/if}
			</div>
		</section>

		<!-- Threats -->
		<section class="threats" id="threats" aria-labelledby="threats-title">
			<div class="wrap">
				<div class="sec-head">
					<h2 id="threats-title">أربعة حوايج كياكلو طوموبيلتك كل نهار</h2>
					<p>ماشي غير الكيلومترات. الجو والطريق فالمغرب كيخسرو الطوموبيل بشوية بشوية، وكل واحد عندو الحل ديالو.</p>
				</div>

				<ol class="threat-list">
					{#each threats as t (t.id)}
						<li class="threat">
							<span class="threat-icon" aria-hidden="true">
								{#if t.id === 'rain'}
									<svg viewBox="0 0 24 24"><path d="M7 15a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 7.5a3.8 3.8 0 0 1 0 7.5" /><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" /></svg>
								{:else if t.id === 'dust'}
									<svg viewBox="0 0 24 24"><path d="M3 9h11a3 3 0 1 0-3-3" /><path d="M3 14h15a3 3 0 1 1-3 3" /><path d="M3 19h6" /></svg>
								{:else if t.id === 'sun'}
									<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
								{:else}
									<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5" /></svg>
								{/if}
							</span>
							<div class="threat-text">
								<h3>{t.name}</h3>
								<p>{t.harm}</p>
							</div>
							<p class="threat-fix"><span>الحل:</span> {t.fix}</p>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<!-- Advisor -->
		<section class="advisor" id="advisor" aria-labelledby="advisor-title">
			<div class="wrap advisor-box">
				<div>
					<h2 id="advisor-title">ما عرفتيش شنو يناسب طوموبيلتك؟</h2>
					<p>
						اختار الماركة وصيفط لينا الموديل والعام فواتساب. كنقولو ليك شنو كيدخل ليها بالضبط، باش ما
						تطلبش شي حاجة ما تجيش على القياس.
					</p>
				</div>
				<ul class="makes">
					{#each carMakes as make (make)}
						<li>
							<a href={wa(`سلام، عندي ${make}. الموديل والعام: `)} target="_blank" rel="noopener">{make}</a>
						</li>
					{/each}
					<li>
						<a href={wa('سلام، الطوموبيل ديالي: ')} target="_blank" rel="noopener">ماركة أخرى</a>
					</li>
				</ul>
			</div>
		</section>

		<!-- Promise -->
		<section class="promise" id="promise" aria-labelledby="promise-title">
			<div class="wrap">
				<div class="sec-head">
					<h2 id="promise-title">كيفاش كنخدمو معاك</h2>
				</div>
				<dl class="promise-list">
					{#each promises as item (item.id)}
						<div class="promise-item">
							<dt>{item.title}</dt>
							<dd>{item.body}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>
	</main>

	<footer class="foot">
		<div class="wrap foot-grid">
			<div class="foot-brand">
				<Logo size={30} tone="light" />
				<p>{STORE_NAME}: إكسسوارات حماية الطوموبيل، مختارة للمغرب.</p>
			</div>
			<nav class="foot-links" aria-label="روابط المتجر">
				<a href="/shipping-policy">سياسة الشحن</a>
				<a href="/refund-policy">الاستبدال والاسترجاع</a>
				<a href="/privacy">الخصوصية</a>
				<a href="/terms">الشروط</a>
				<a href="/contact">تواصل معنا</a>
			</nav>
			<div class="foot-contact">
				<a href={wa('سلام')} target="_blank" rel="noopener" dir="ltr">+212 626-558375</a>
				<a href="mailto:contact@lhamza.shop" dir="ltr">contact@lhamza.shop</a>
				<span>كل يوم من 9:00 حتى 22:00</span>
			</div>
		</div>
		<p class="wrap foot-copy">© {year} {STORE_NAME}</p>
	</footer>
</div>

<style>
	.lz {
		--lz-ink: #17232b;
		--lz-storm: #2f4858;
		--lz-storm-deep: #24394a;
		--lz-rain: #eef2f3;
		--lz-line: #d5dee2;
		--lz-mute: #56687a;
		--lz-amber: #f5a300;
		--lz-amber-deep: #d98f00;

		background: var(--lz-rain);
		color: var(--lz-ink);
		font-family: 'Readex Pro', system-ui, sans-serif;
		min-height: 100vh;
		overflow-x: clip;
	}

	.wrap {
		width: 100%;
		max-width: 1120px;
		margin-inline: auto;
		padding-inline: 16px;
	}

	h1,
	h2,
	h3 {
		margin: 0;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	p {
		margin: 0;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	:focus-visible {
		outline: 3px solid var(--lz-amber);
		outline-offset: 2px;
	}

	/* Strip */
	.strip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 7px 16px;
		background: var(--lz-ink);
		color: #dfe7eb;
		font-size: 12px;
		font-weight: 500;
	}

	.strip-sep {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--lz-amber);
	}

	.strip-wide {
		display: none;
	}

	/* Header */
	.head {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--lz-storm);
		color: #fff;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		height: 60px;
	}

	.head-nav {
		display: none;
	}

	.head-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.head-wa {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 38px;
		padding-inline: 12px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		font-size: 13px;
		font-weight: 600;
	}

	.head-wa svg {
		width: 18px;
		height: 18px;
	}

	.head-menu {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 10px;
		background: transparent;
		color: #fff;
		cursor: pointer;
	}

	.head-menu svg {
		width: 24px;
		height: 24px;
	}

	.head-drawer {
		display: grid;
		padding: 8px 16px 14px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.head-drawer a {
		padding: 12px 4px;
		font-size: 15px;
		font-weight: 500;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 50px;
		padding-inline: 22px;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 700;
		transition: background-color 0.15s ease, transform 0.1s ease;
	}

	.btn:active {
		transform: scale(0.98);
	}

	.btn-amber {
		background: var(--lz-amber);
		color: var(--lz-ink);
	}

	.btn-amber:hover {
		background: var(--lz-amber-deep);
	}

	.btn-ghost {
		color: #fff;
		box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.35);
	}

	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.btn-ink {
		background: var(--lz-ink);
		color: #fff;
	}

	.btn-ink:hover {
		background: var(--lz-storm);
	}

	/* Hero */
	.hero {
		background: var(--lz-storm);
		color: #fff;
		padding-block: 36px 0;
	}

	.hero-grid {
		display: grid;
		gap: 28px;
	}

	.hero h1 {
		font-size: clamp(34px, 9vw, 60px);
		line-height: 1.15;
		max-width: 14ch;
	}

	.hero-sub {
		margin-top: 16px;
		max-width: 38ch;
		font-size: 17px;
		line-height: 1.7;
		color: #cfdbe2;
	}

	.hero-ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 26px;
	}

	.hero-art {
		margin: 0;
		align-self: end;
	}

	.hero-art svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.shield {
		stroke-dasharray: 360;
		stroke-dashoffset: 360;
		animation: draw-shield 1.4s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
	}

	@keyframes draw-shield {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shield {
			animation: none;
			stroke-dashoffset: 0;
		}
	}

	/* Section heads */
	.sec-head {
		max-width: 60ch;
		margin-bottom: 26px;
	}

	.sec-head h2 {
		font-size: clamp(26px, 6vw, 38px);
		line-height: 1.25;
	}

	.sec-head p {
		margin-top: 10px;
		font-size: 16px;
		line-height: 1.75;
		color: var(--lz-mute);
	}

	/* Products */
	.products {
		padding-block: 56px;
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
		border-radius: 14px;
		overflow: hidden;
		border: 1px solid var(--lz-line);
		transition: border-color 0.15s ease;
	}

	.card:hover {
		border-color: var(--lz-storm);
	}

	.card-img {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		background: #f6f8f9;
	}

	.card-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		flex: 1;
	}

	.card-title {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.5;
	}

	.card-sub {
		font-size: 12.5px;
		line-height: 1.6;
		color: var(--lz-mute);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-price {
		margin-top: auto;
		font-size: 13px;
		color: var(--lz-mute);
	}

	.card-price b {
		font-size: 19px;
		color: var(--lz-ink);
	}

	.empty {
		display: grid;
		justify-items: start;
		gap: 10px;
		padding: 26px 22px;
		border-radius: 14px;
		border: 1.5px dashed #b7c6ce;
		background: #fff;
		font-size: 15.5px;
		line-height: 1.75;
		color: var(--lz-mute);
	}

	.empty-title {
		font-size: 19px;
		font-weight: 700;
		color: var(--lz-ink);
	}

	.empty .btn {
		margin-top: 6px;
	}

	/* Threats */
	.threats {
		padding-block: 56px;
		background: #fff;
		border-block: 1px solid var(--lz-line);
	}

	.threat-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 2px solid var(--lz-ink);
	}

	.threat {
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: 4px 14px;
		padding-block: 20px;
		border-bottom: 1px solid var(--lz-line);
	}

	.threat-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--lz-rain);
		color: var(--lz-storm);
	}

	.threat-icon svg {
		width: 24px;
		height: 24px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.threat h3 {
		font-size: 19px;
		line-height: 1.4;
	}

	.threat-text p {
		margin-top: 4px;
		font-size: 15px;
		line-height: 1.7;
		color: var(--lz-mute);
	}

	.threat-fix {
		grid-column: 2;
		margin-top: 8px;
		font-size: 14.5px;
		font-weight: 600;
		line-height: 1.6;
	}

	.threat-fix span {
		color: var(--lz-amber-deep);
	}

	/* Advisor */
	.advisor {
		padding-block: 56px;
	}

	.advisor-box {
		display: grid;
		gap: 22px;
	}

	.advisor h2 {
		font-size: clamp(24px, 5.5vw, 34px);
		line-height: 1.3;
	}

	.advisor p {
		margin-top: 10px;
		max-width: 52ch;
		font-size: 16px;
		line-height: 1.75;
		color: var(--lz-mute);
	}

	.makes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-content: start;
	}

	.makes a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding-inline: 16px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid var(--lz-line);
		font-size: 15px;
		font-weight: 600;
		transition: border-color 0.15s ease, background-color 0.15s ease;
	}

	.makes a:hover {
		border-color: var(--lz-storm);
		background: var(--lz-storm);
		color: #fff;
	}

	/* Promise */
	.promise {
		padding-block: 56px;
		background: var(--lz-ink);
		color: #fff;
	}

	.promise .sec-head h2 {
		color: #fff;
	}

	.promise-list {
		margin: 0;
		display: grid;
		gap: 0;
	}

	.promise-item {
		padding-block: 18px;
		border-top: 1px solid rgba(255, 255, 255, 0.14);
	}

	.promise-item dt {
		font-size: 18px;
		font-weight: 700;
		color: var(--lz-amber);
	}

	.promise-item dd {
		margin: 6px 0 0;
		font-size: 15px;
		line-height: 1.7;
		color: #c3d0d8;
	}

	/* Footer */
	.foot {
		background: var(--lz-storm-deep);
		color: #c3d0d8;
		padding-block: 40px 24px;
		font-size: 14px;
	}

	.foot-grid {
		display: grid;
		gap: 28px;
	}

	.foot-brand p {
		margin-top: 12px;
		max-width: 34ch;
		line-height: 1.7;
	}

	.foot-links,
	.foot-contact {
		display: grid;
		gap: 10px;
		align-content: start;
	}

	.foot a:hover {
		color: #fff;
	}

	.foot-contact a {
		justify-self: start;
	}

	.foot-copy {
		margin-top: 32px;
		padding-top: 18px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 12.5px;
		color: #8fa3b0;
	}

	/* Larger screens */
	@media (min-width: 640px) {
		.strip-wide {
			display: inline;
		}

		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 16px;
		}

		.threat {
			grid-template-columns: 52px 1fr 1fr;
			align-items: start;
			gap: 0 24px;
			padding-block: 24px;
		}

		.threat-icon {
			width: 52px;
			height: 52px;
		}

		.threat-fix {
			grid-column: 3;
			margin-top: 0;
			padding-top: 4px;
		}

		.promise-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 40px;
		}
	}

	@media (min-width: 960px) {
		.head-nav {
			display: flex;
			gap: 26px;
			font-size: 14.5px;
			font-weight: 500;
			color: #d7e2e8;
		}

		.head-nav a:hover {
			color: #fff;
		}

		.head-menu {
			display: none;
		}

		.hero {
			padding-top: 64px;
		}

		.hero-grid {
			grid-template-columns: 1.05fr 1fr;
			align-items: end;
			gap: 48px;
		}

		.hero-copy {
			padding-bottom: 64px;
		}

		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.advisor-box {
			grid-template-columns: 1fr 1fr;
			gap: 48px;
			align-items: center;
		}

		.promise-list {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			column-gap: 28px;
		}

		.foot-grid {
			grid-template-columns: 1.4fr 1fr 1fr;
		}
	}
</style>
