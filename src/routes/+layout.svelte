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
		if (typeof window !== 'undefined' && (window as any).snaptr && tracking?.snapchatPixelId) {
			(window as any).snaptr('track', 'PAGE_VIEW');
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
