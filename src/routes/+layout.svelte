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

	<!-- Snapchat Pixel Code -->
	{#if tracking?.snapchatPixelId}
		<script>
			(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
			{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
			a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
			r.src=n;var u=t.getElementsByTagName(s)[0];
			u.parentNode.insertBefore(r,u);})(window,document,
			'https://sc-static.net/scevent.min.js');

			snaptr('init', '{tracking.snapchatPixelId}');
			snaptr('track', 'PAGE_VIEW');
		</script>
	{/if}

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

	<!-- TikTok Pixel Code -->
	{#if tracking?.tiktokPixelId}
		<script>
			!function (w, d, t) {
			w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq.methods[i],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
			ttq.load('{tracking.tiktokPixelId}');
			ttq.page();
			}(window, document, 'ttq');
		</script>
	{/if}

	<!-- Google Tag Manager -->
	{#if tracking?.gtmContainerId}
		<script>
			(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
			new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
			j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
			'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
			})(window,document,'script','dataLayer','{tracking.gtmContainerId}');
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
