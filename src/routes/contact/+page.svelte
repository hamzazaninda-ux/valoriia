<script lang="ts">
	import Header from '$lib/components/shared/Header.svelte';
	import AnnouncementBar from '$lib/components/shared/AnnouncementBar.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { cart, cartUi } from '$lib/stores/cart.svelte';

	let { data } = $props();

	const brand = $derived(data?.brand || {
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000',
		supportHours: 'طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً'
	});

	const cleanPhone = $derived((brand.whatsappNumber || '212600000000').replace(/\D/g, ''));
	const waBase = $derived(`https://wa.me/${cleanPhone}`);

	// --- Header State ---
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let query = $state('');

	// --- Form State ---
	let fullName = $state('');
	let phone = $state('');
	let subject = $state('consultation');
	let message = $state('');
	let formSubmitted = $state(false);

	const subjects = [
		{ id: 'consultation', label: 'استشارة لاختيار المكمل المناسب (كولاجين، بيوتين، ملتي فيتامين)' },
		{ id: 'tracking', label: 'تتبع طلبية سابقة ومعرفة وقت التوصيل' },
		{ id: 'modification', label: 'تعديل أو تأكيد عنوان التسليم' },
		{ id: 'other', label: 'استفسار عام أو اقتراح' }
	];

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const selectedLabel = subjects.find(s => s.id === subject)?.label || subject;
		const text = `السلام عليكم NOVAVITA،\nالاسم: ${fullName || 'زبونة مهتمة'}\nالهاتف: ${phone || 'غير محدد'}\nالموضوع: ${selectedLabel}\nالرسالة: ${message || 'أريد استشارة سريعة'}`;
		const targetUrl = `${waBase}?text=${encodeURIComponent(text)}`;
		formSubmitted = true;
		if (typeof window !== 'undefined') {
			window.open(targetUrl, '_blank', 'noopener,noreferrer');
		}
	}
</script>

<svelte:head>
	<title>اتصل بنا | NOVAVITA المغرب</title>
	<meta
		name="description"
		content="تواصل مع فريق خدمة عملاء واستشارات NOVAVITA المغرب. استشارة مجانية وسريعة عبر واتساب، تتبع طلبيتك، ومعلومات التوصيل لجميع المدن المغربية."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="relative min-h-screen bg-[#FAF8F5] font-body text-[#1F2937]" dir="rtl">
	<!-- 1. Top Announcement Bar -->
	<AnnouncementBar isStatic={false} />

	<!-- 2. Sticky Header -->
	<Header
		brandName={brand.name || 'NOVAVITA'}
		cartCount={cart.count}
		bind:searchOpen
		bind:menuOpen
		bind:query
		onOpenCart={() => cartUi.openDrawer()}
	/>

	<!-- 3. Main Contact Page Container -->
	<main class="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-14">
		
		<!-- Breadcrumbs -->
		<nav class="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6" aria-label="مسار التنقل">
			<a href="/" class="hover:text-[#1B4332] transition-colors">الرئيسية</a>
			<span class="text-stone-300">/</span>
			<span class="text-[#1B4332] font-bold">اتصل بنا</span>
		</nav>

		<!-- Hero Intro Header -->
		<header class="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
			<span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1B4332]/10 text-xs font-bold text-[#1B4332]">
				<span>💬</span>
				<span>خدمة عملاء راقية • استشارة مجانية</span>
			</span>
			<h1 class="font-display text-2xl sm:text-4xl font-black text-[#1B4332] leading-tight">
				تواصل مع فريق NOVAVITA
			</h1>
			<p class="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
				فريق استشارات العناية بالجمال والصحة رهن إشارتك للإجابة على جميع تساؤلاتك ومساعدتك في اختيار الروتين الملائم أو تتبع طلبيتك.
			</p>
		</header>

		<!-- 2-Column Responsive Layout -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
			
			<!-- Column 1: Direct Support Channels & Delivery Details (5 cols) -->
			<div class="lg:col-span-5 space-y-6">
				
				<!-- Primary WhatsApp Card -->
				<div class="bg-gradient-to-br from-[#143427] via-[#1B4332] to-[#143427] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-800/40 space-y-5">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
								💬
							</div>
							<div>
								<h2 class="font-display text-lg font-bold text-white">الدردشة الفورية عبر WhatsApp</h2>
								<p class="text-[11px] text-emerald-200">الاستجابة الأسرع والأكثر تفضيلاً</p>
							</div>
						</div>
						<span class="inline-flex items-center gap-1 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[10px] font-black px-2.5 py-0.5 rounded-full">
							⚡ رد خلال 15 دقيقة
						</span>
					</div>

					<p class="text-xs sm:text-sm text-stone-300 leading-relaxed">
						تواصلي مباشرة مع مستشارة العناية المعتمدة للحصول على استشارة شخصية حول منتجات الكولاجين، البيوتين، أو الملتي فيتامين.
					</p>

					<a
						href={`${waBase}?text=${encodeURIComponent('السلام عليكم NOVAVITA، أريد استشارة بخصوص منتجات العناية بالجمال والصحة')}`}
						target="_blank"
						rel="noopener"
						class="w-full min-h-13 rounded-2xl bg-[#25D366] hover:bg-[#20ba56] active:scale-[0.98] font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
					>
						<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
						<span>تحدثي معنا عبر WhatsApp</span>
					</a>

					<div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
						<span>🕒 أوقات العمل والرد:</span>
						<span class="font-bold text-white">{brand.supportHours || 'طيلة أيام الأسبوع 9:00 - 22:00'}</span>
					</div>
				</div>

				<!-- Moroccan Delivery & Guarantees Card -->
				<div class="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
					<h3 class="font-display text-base font-bold text-[#1B4332] flex items-center gap-2">
						<span>🚚</span>
						<span>معلومات الشحن والتسليم بالمغرب</span>
					</h3>

					<div class="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
						<div class="flex items-start gap-2.5">
							<span class="text-base shrink-0 mt-0.5">⏱️</span>
							<div>
								<span class="font-bold text-stone-800">المدن الكبرى:</span>
								<span>الدار البيضاء، الرباط، مراكش، طنجة، فاس، أكادير، سلا، مكناس، القنيطرة (خلال 24 ساعة).</span>
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<span class="text-base shrink-0 mt-0.5">📦</span>
							<div>
								<span class="font-bold text-stone-800">باقي الأقاليم والمناطق:</span>
								<span>التسليم خلال 24 إلى 48 ساعة كحد أقصى إلى باب منزلك أو مقر عملك.</span>
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<span class="text-base shrink-0 mt-0.5">🔍</span>
							<div>
								<span class="font-bold text-stone-800">معاينة الطرد أولاً:</span>
								<span>لكِ كامل الحق في فتح العلبة وفحص المنتجات مع الموزع قبل دفع أي درهم.</span>
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<span class="text-base shrink-0 mt-0.5">💵</span>
							<div>
								<span class="font-bold text-stone-800">الدفع عند الاستلام (COD):</span>
								<span>راحة بال وضمان 100% بدون أي دفع مسبق.</span>
							</div>
						</div>
					</div>
				</div>

			</div>

			<!-- Column 2: Direct Inquiry / Contact Form (7 cols) -->
			<div class="lg:col-span-7">
				<div class="bg-white rounded-3xl p-6 sm:p-9 border border-stone-200/80 shadow-sm space-y-6">
					
					<div>
						<h2 class="font-display text-xl font-bold text-[#1B4332]">
							أرسلي استفساركِ مباشرة
						</h2>
						<p class="text-xs sm:text-sm text-stone-500 mt-1">
							املئي البيانات أدناه وسيتم فتح محادثة فورية مجهزة بنص رسالتك مع فريق الدعم الفني.
						</p>
					</div>

					{#if formSubmitted}
						<div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2 text-emerald-900">
							<div class="text-2xl">✓</div>
							<div class="font-bold text-sm">تم إعداد رسالتك بنجاح!</div>
							<p class="text-xs text-emerald-700">
								تم فتح المحادثة عبر WhatsApp، أو يمكنكِ النقر على الزر أدناه إذا لم تفتح تلقائياً.
							</p>
							<a
								href={`${waBase}?text=${encodeURIComponent(`السلام عليكم NOVAVITA، الاسم: ${fullName}، الموضوع: ${subject}، الرسالة: ${message}`)}`}
								target="_blank"
								rel="noopener"
								class="inline-block mt-2 text-xs font-bold text-emerald-800 underline"
							>
								إعادة فتح المحادثة عبر WhatsApp ←
							</a>
						</div>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-4">
						
						<!-- Full Name -->
						<div>
							<label for="contact-name" class="block text-xs font-bold text-stone-700 mb-1.5">
								الاسم الكامل <span class="text-[#E86A7C]">*</span>
							</label>
							<input
								id="contact-name"
								type="text"
								bind:value={fullName}
								required
								placeholder="مثال: مريم العلمي"
								class="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#1B4332] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332] transition-colors"
							/>
						</div>

						<!-- Phone Number -->
						<div>
							<label for="contact-phone" class="block text-xs font-bold text-stone-700 mb-1.5">
								رقم الهاتف (WhatsApp) <span class="text-[#E86A7C]">*</span>
							</label>
							<input
								id="contact-phone"
								type="tel"
								bind:value={phone}
								required
								placeholder="06 XX XX XX XX"
								class="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#1B4332] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332] transition-colors"
								dir="ltr"
							/>
						</div>

						<!-- Inquiry Subject -->
						<div>
							<label for="contact-subject" class="block text-xs font-bold text-stone-700 mb-1.5">
								موضوع الاستفسار
							</label>
							<select
								id="contact-subject"
								bind:value={subject}
								class="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332] transition-colors"
							>
								{#each subjects as s}
									<option value={s.id}>{s.label}</option>
								{/each}
							</select>
						</div>

						<!-- Message Content -->
						<div>
							<label for="contact-message" class="block text-xs font-bold text-stone-700 mb-1.5">
								نص الرسالة أو الاستفسار
							</label>
							<textarea
								id="contact-message"
								bind:value={message}
								rows="4"
								placeholder="اكتبي تفاصيل استفسارك هنا (مثلاً: أريد معرفة الجرعة الموصى بها، أو حالة طلبيتي رقم...)"
								class="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#1B4332] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332] transition-colors resize-y"
							></textarea>
						</div>

						<!-- Action Button -->
						<button
							type="submit"
							class="w-full min-h-13 rounded-2xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] font-bold text-white text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer pt-1"
						>
							<span>إرسال الرسالة عبر WhatsApp</span>
							<span class="text-lg">←</span>
						</button>

						<p class="text-[11px] text-center text-stone-400 font-medium pt-1">
							🔒 نلتزم بحماية خصوصيتكِ التامة. لن تتم مشاركة بياناتكِ مع أي طرف ثالث.
						</p>

					</form>
				</div>
			</div>

		</div>

	</main>

	<!-- 4. Global Footer -->
	<footer id="contact" class="mt-16 bg-[#143326] text-stone-300 border-t border-emerald-900/30">
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
					<a href="/contact" class="transition-colors text-[#E86A7C] font-bold">اتصل بنا</a>
				</div>
			</div>
			<div class="space-y-3">
				<h4 class="text-sm font-bold text-white">ضمانات الشراء والتوصيل</h4>
				<div class="grid gap-2.5 text-xs">
					<span class="flex items-center gap-2 text-stone-300">
						<svg class="h-4 w-4 text-[#C99738] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v8.25m0 0a60.11 60.11 0 0 0 15.797 2.101c.727.198 1.453-.342 1.453-1.096V14.25m-17.25 0h17.25"/>
						</svg>
						الدفع نقداً بعد الاستلام
					</span>
					<span class="flex items-center gap-2 text-stone-300">
						<svg class="h-4 w-4 text-[#C99738] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
						</svg>
						فحص ومعاينة الطرد عند الباب
					</span>
					<span class="flex items-center gap-2 text-stone-300">
						<svg class="h-4 w-4 text-[#C99738] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
						</svg>
						توصيل مجاني وسريع لكافة المدن
					</span>
					<span class="flex items-center gap-2 text-stone-300">
						<svg class="h-4 w-4 text-[#C99738] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
							<path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/>
						</svg>
						بكتين نباتي 100% حلال معتمد
					</span>
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

	<!-- 5. Interactive Slide-Out Cart Drawer -->
	<CartDrawer />
</div>
