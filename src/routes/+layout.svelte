<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { captureAdClickIds, ensureCurrentUrlHasSnapClickId } from '$lib/utils/tracking';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const tracking = $derived(data?.settings?.tracking);

	onMount(() => {
		captureAdClickIds();
		ensureCurrentUrlHasSnapClickId();
	});

	let isFirstNav = true;
	afterNavigate(() => {
		captureAdClickIds();
		ensureCurrentUrlHasSnapClickId();

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
				}
			} catch (e) {
				console.warn('Gtag SPA page_view error:', e);
			}

			try {
				if ((window as any).snaptr) {
					(window as any).snaptr('track', 'PAGE_VIEW');
				}
			} catch (e) {}

			try {
				if ((window as any).ttq) {
					(window as any).ttq.page();
				}
			} catch (e) {}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Lhamza Shop" />
	<meta name="apple-mobile-web-app-title" content="Lhamza Shop" />

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
	{#if tracking?.googleAdsId && tracking.googleAdsId !== 'AW-18531557898'}
		<script async src="https://www.googletagmanager.com/gtag/js?id={tracking.googleAdsId}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', '{tracking.googleAdsId}', {
				allow_enhanced_conversions: true
			});
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
