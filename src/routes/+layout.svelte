<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import FloatingWhatsApp from '$lib/components/shared/FloatingWhatsApp.svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const tracking = $derived(data?.settings?.tracking);
	const brand = $derived(data?.settings?.brand);
	const isAdmin = $derived($page.url?.pathname?.startsWith('/admin') ?? false);
	const pixelId = $derived(tracking?.facebookPixelId || '2180716089518389');

	let isFirstNav = true;
	afterNavigate(() => {
		if (isFirstNav) {
			isFirstNav = false;
			return;
		}
		if (typeof window !== 'undefined') {
			try {
				if (typeof (window as any).gtag === 'function') {
					(window as any).gtag('event', 'page_view', {
						page_path: window.location.pathname + window.location.search,
						page_location: window.location.href,
						page_title: document.title
					});
					console.log('📄 [GTAG SUCCESS] SPA page_view fired for', window.location.pathname);
				}
			} catch (e) {
				console.warn('Gtag SPA page_view error:', e);
			}

			try {
				if ((window as any).snaptr) {
					(window as any).snaptr('track', 'PAGE_VIEW');
					console.log('📄 [SNAP SUCCESS] SPA PAGE_VIEW fired');
				}
			} catch (e) {}

			try {
				if ((window as any).ttq && typeof (window as any).ttq.page === 'function') {
					(window as any).ttq.page();
					console.log('📄 [TIKTOK SUCCESS] SPA PageView fired');
				}
			} catch (e) {}

			try {
				if (typeof (window as any).fbq === 'function') {
					(window as any).fbq('track', 'PageView');
					console.log('📄 [Meta Pixel] SPA PageView fired');
				}
			} catch (e) {}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="NOVAVITA" />
	<meta name="apple-mobile-web-app-title" content="NOVAVITA" />

	<!-- Meta Pixel is hardcoded in app.html for rock-solid zero-blocking initialization -->




	<!-- Google Analytics (GA4) -->
	{#if tracking?.googleAnalyticsId}
		<script async src="https://www.googletagmanager.com/gtag/js?id={tracking.googleAnalyticsId}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', '{tracking.googleAnalyticsId}');
		</script>
	{/if}

	<!-- Google Ads Tag -->
	{#if tracking?.googleAdsId}
		<script async src="https://www.googletagmanager.com/gtag/js?id={tracking.googleAdsId}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', '{tracking.googleAdsId}');
		</script>
	{/if}

	<!-- Custom Head Scripts -->
	{#if tracking?.customHeadScripts}
		{@html tracking.customHeadScripts}
	{/if}
</svelte:head>

<!-- Custom Body Scripts -->
{#if tracking?.customBodyScripts}
	{@html tracking.customBodyScripts}
{/if}

{@render children()}

{#if !isAdmin}
	<FloatingWhatsApp whatsappNumber={brand?.whatsappNumber} />
{/if}
