<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';
	import { afterNavigate } from '$app/navigation';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const tracking = $derived(data?.settings?.tracking);

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
				if ((window as any).ttq) {
					(window as any).ttq.page();
					console.log('📄 [TIKTOK SUCCESS] SPA PageView fired');
				}
			} catch (e) {}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="NOVAVITA" />
	<meta name="apple-mobile-web-app-title" content="NOVAVITA" />

	<!-- Meta / Facebook Pixel Code -->
	{#if tracking?.facebookPixelId}
		<script>
			!function(f,b,e,v,n,t,s)
			{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
			n.callMethod.apply(n,arguments):n.queue.push(arguments)};
			if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
			n.queue=[];t=b.createElement(e);t.async=!0;
			t.src=v;s=b.getElementsByTagName(e)[0];
			s.parentNode.insertBefore(t,s)}(window, document,'script',
			'https://connect.facebook.net/en_US/fbevents.js');
			fbq('init', '{tracking.facebookPixelId}');
			fbq('track', 'PageView');
		</script>
	{/if}




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
