<script lang="ts">
	import { validateBrandSettings, validateCommerceSettings } from '$lib/utils/clientValidation';
	import { toasts } from '$lib/stores/toast';

	let { data } = $props();

	let settings = $state(data.settings);
	let saving = $state(false);
	let validationErrors = $state<Record<string, string>>({});
	let copiedScript = $state(false);

	// Production Apps Script Code provided by User for Google Sheets
	const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var date_order    = data.date || new Date().toLocaleString("ar-MA");
    var full_name     = data.fullName || "";
    var phone         = data.phoneNumber || "";
    var address       = data.address || "";
    var sku           = data.sku || "pack-pack-alpha-vital---sleep-&-relax";
    var qte           = data.qte !== undefined ? data.qte : 1;
    var price         = data.price !== undefined ? data.price : 0;
    var note          = data.orderId || "";
    var delivery_note = "";
    
    var lastRow = sheet.getLastRow();
    var targetRow = lastRow + 1;
    
    if (targetRow < 5) {
      targetRow = 5;
    }
    
    var range = sheet.getRange(targetRow, 1, 1, 9);
    range.setValues([[
      date_order,
      full_name,
      phone,
      address,
      sku,
      qte,
      price,
      note,
      delivery_note
    ]]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", orderId: data.orderId }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      });
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}`;

	function copyAppsScript() {
		navigator.clipboard.writeText(appsScriptCode);
		copiedScript = true;
		toasts.success('تم نسخ سكريبت Google Apps Script بنجاح! 📋');
		setTimeout(() => (copiedScript = false), 3000);
	}

	function validateField() {
		const newErrors: Record<string, string> = {};

		const brandErrors = validateBrandSettings(settings.brand);
		brandErrors.forEach(err => {
			newErrors[err.field] = err.message;
		});

		const commerceErrors = validateCommerceSettings(settings.commerce);
		commerceErrors.forEach(err => {
			newErrors[err.field] = err.message;
		});

		validationErrors = newErrors;
	}

	async function handleSave() {
		validateField();

		if (Object.keys(validationErrors).length > 0) {
			toasts.error(Object.values(validationErrors)[0]);
			return;
		}

		saving = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			if (response.ok) {
				toasts.success('تم حفظ المسودة بنجاح ✅');
			} else {
				const errorData = await response.json();
				if (errorData.details) {
					toasts.error(errorData.details.map((e: any) => e.message).join(' | '));
				} else {
					toasts.error(errorData.error || 'فشل في الحفظ');
				}
			}
		} catch {
			toasts.error('حدث خطأ أثناء الحفظ');
		} finally {
			saving = false;
		}
	}

	async function handlePublish() {
		if (!confirm('هل أنت متأكد من نشر الإعدادات للعملاء؟')) return;

		validateField();

		if (Object.keys(validationErrors).length > 0) {
			toasts.error(Object.values(validationErrors)[0]);
			return;
		}

		saving = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			if (response.ok) {
				const publishResponse = await fetch('/api/settings/publish', {
					method: 'POST'
				});

				if (publishResponse.ok) {
					toasts.success('تم نشر الإعدادات بنجاح 🚀');
				} else {
					toasts.error('فشل في النشر');
				}
			} else {
				const errorData = await response.json();
				if (errorData.details) {
					toasts.error(errorData.details.map((e: any) => e.message).join(' | '));
				} else {
					toasts.error('فشل في الحفظ قبل النشر');
				}
			}
		} catch {
			toasts.error('حدث خطأ أثناء النشر');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>الإعدادات العامة - Valoriia Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
		<div>
			<h1 class="text-2xl font-extrabold text-gray-900">⚙️ الإعدادات العامة للمتجر</h1>
			<p class="text-sm text-gray-500 mt-0.5">إدارة البيكسلات، ربط Google Sheets، وإعدادات المتجر العامة لكل القوالب والمنتجات</p>
		</div>
		<div class="flex gap-3">
			<button
				onclick={handleSave}
				disabled={saving}
				class="px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
			>
				{saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
			</button>
			<button
				onclick={handlePublish}
				disabled={saving}
				class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
			>
				{saving ? 'جاري النشر...' : '🚀 نشر الإعدادات'}
			</button>
		</div>
	</div>

	<!-- 1. Google Sheets Global Connection Section -->
	<div class="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-6">
		<div class="flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold">
					📊
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-900">ربط Google Sheets العام لكل الطلبيات</h2>
					<p class="text-xs text-gray-500">يتم إرسال كافة طلبات المنتجات من جميع القوالب إلى نفس الـ Sheet، ومفروزة عبر رمز الـ SKU</p>
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<div>
				<label class="block text-sm font-bold text-gray-800 mb-1">رابط Google Sheets Webhook URL</label>
				<input
					type="url"
					bind:value={settings.commerce.googleSheetsUrl}
					class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono dir-ltr"
					placeholder="https://script.google.com/macros/s/AKfycb.../exec"
				/>
				<p class="mt-1 text-xs text-gray-500">انسخ رابط الـ Web App الناتج من Google Apps Script وضعه هنا لتفعيل ربط جميع الطلبات تلقائياً.</p>
			</div>

			<!-- Embedded Google Apps Script Box -->
			<div class="bg-gray-900 rounded-2xl p-5 text-white space-y-3 relative">
				<div class="flex items-center justify-between border-b border-gray-800 pb-3">
					<div class="flex items-center gap-2">
						<span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
						<span class="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
						<span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
						<span class="text-xs font-mono text-gray-400 mr-2">GoogleAppsScript.gs</span>
					</div>
					<button
						onclick={copyAppsScript}
						class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
					>
						<span>{copiedScript ? '✓ تم النسخ' : '📋 نسخ السكريبت'}</span>
					</button>
				</div>

				<pre class="text-xs font-mono text-emerald-400 overflow-x-auto p-2 bg-gray-950/60 rounded-xl max-h-56"><code>{appsScriptCode}</code></pre>

				<div class="bg-gray-800/60 p-4 rounded-xl text-xs text-gray-300 space-y-2 border border-gray-700/50">
					<p class="font-bold text-amber-400 flex items-center gap-1">
						<span>📌 طريقة الربط في 4 خطوات بسيطة:</span>
					</p>
					<ol class="list-decimal list-inside space-y-1.5 text-gray-300">
						<li>افتح جدول **Google Sheets** الخاص بك.</li>
						<li>من القائمة العلوية اضغط على **Extensions** ثم اختر **Apps Script**.</li>
						<li>امسح أي كود مكتوب، والصق هذا السكريبت الذي نسخته أعلاه.</li>
						<li>اضغط **Deploy** ➔ **New deployment** ➔ اختر **Web app** (واجعل Access: **Anyone**) واجمع الرابط وضعه في الحقل أعلاه ثم اضغط **نشر**.</li>
					</ol>
				</div>
			</div>
		</div>
	</div>

	<!-- 2. Global Pixels & Tracking Section -->
	<div class="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-6">
		<div class="flex items-center gap-3 border-b pb-4">
			<div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
				🎯
			</div>
			<div>
				<h2 class="text-lg font-bold text-gray-900">البيكسلات والتتبع العام (Global Tracking Pixels)</h2>
				<p class="text-xs text-gray-500">تُطبق هذه الشفرات والـ Pixels عالمياً على كامل الموقع وكافة القوالب والصفحات تلقائياً</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			<!-- Meta Facebook Pixel -->
			<div class="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
				<label class="block text-xs font-extrabold text-blue-900">Meta / Facebook Pixel ID</label>
				<input
					type="text"
					bind:value={settings.tracking.facebookPixelId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500"
					placeholder="مثال: 123456789012345"
				/>
				<p class="text-[11px] text-blue-700">يتم تفعيل تتبع الزيارات والطلبات (PageView / Purchase) تلقائياً للموقع.</p>
			</div>

			<!-- TikTok Pixel -->
			<div class="p-4 bg-gray-900/5 border border-gray-200 rounded-xl space-y-2">
				<label class="block text-xs font-extrabold text-gray-900">TikTok Pixel ID</label>
				<input
					type="text"
					bind:value={settings.tracking.tiktokPixelId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-gray-800"
					placeholder="مثال: C1234567890ABC"
				/>
				<p class="text-[11px] text-gray-600">يتتبع إعلانات تيك توك ومبيعات التوصيل.</p>
			</div>

			<!-- Snapchat Pixel -->
			<div class="p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl space-y-2">
				<label class="block text-xs font-extrabold text-yellow-900">Snapchat Pixel ID</label>
				<input
					type="text"
					bind:value={settings.tracking.snapchatPixelId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-yellow-500"
					placeholder="XXXXXXXXXXXX"
				/>
				<p class="text-[11px] text-yellow-700">معرّف Snapchat Pixel لتتبع الزيارات والأحداث والإجراءات على الموقع.</p>
			</div>

			<!-- Google Tag Manager -->
			<div class="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
				<label class="block text-xs font-extrabold text-amber-900">Google Tag Manager (GTM Container ID)</label>
				<input
					type="text"
					bind:value={settings.tracking.gtmContainerId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500"
					placeholder="GTM-XXXXXXX"
				/>
				<p class="text-[11px] text-amber-700">معرف حاوية GTM للتحكم في جميع التاجات.</p>
			</div>

			<!-- Google Analytics GA4 -->
			<div class="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2">
				<label class="block text-xs font-extrabold text-orange-900">Google Analytics ID (GA4)</label>
				<input
					type="text"
					bind:value={settings.tracking.googleAnalyticsId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-orange-500"
					placeholder="G-XXXXXXXXXX"
				/>
				<p class="text-[11px] text-orange-700">قياس إحصائيات زوار الموقع والتفاعل.</p>
			</div>

			<!-- Google Ads Conversion ID -->
			<div class="p-4 bg-green-50/50 border border-green-100 rounded-xl space-y-2 md:col-span-2">
				<label class="block text-xs font-extrabold text-green-900">Google Ads Conversion ID</label>
				<input
					type="text"
					bind:value={settings.tracking.googleAdsId}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-green-500"
					placeholder="AW-XXXXXXXXX"
				/>
			</div>
		</div>

		<!-- Custom Head & Body Scripts -->
		<div class="space-y-4 border-t pt-4">
			<div>
				<label class="block text-xs font-bold text-gray-800 mb-1">سكربتات مخصصة في &lt;head&gt; (Custom Head Scripts)</label>
				<textarea
					bind:value={settings.tracking.customHeadScripts}
					rows="3"
					class="w-full p-3 border border-gray-300 rounded-xl text-xs font-mono dir-ltr focus:ring-2 focus:ring-emerald-500"
					placeholder="<!-- ضع أي سكريبتات إضافية هنا لتظهر في الهيدر -->"
				></textarea>
			</div>

			<div>
				<label class="block text-xs font-bold text-gray-800 mb-1">سكربتات مخصصة في &lt;body&gt; (Custom Body Scripts)</label>
				<textarea
					bind:value={settings.tracking.customBodyScripts}
					rows="3"
					class="w-full p-3 border border-gray-300 rounded-xl text-xs font-mono dir-ltr focus:ring-2 focus:ring-emerald-500"
					placeholder="<!-- ضع أي سكريبتات تود إدراجها في بداية الجسم -->"
				></textarea>
			</div>
		</div>
	</div>

	<!-- 3. Brand & General Settings -->
	<div class="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-6">
		<h2 class="text-lg font-bold text-gray-900 border-b pb-3">العلامة التجارية والمعلومات العامة</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">اسم المتجر / العلامة</label>
				<input
					type="text"
					bind:value={settings.brand.name}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['brand.name'] ? 'border-red-500' : ''}"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">الشعار اللفظي (Tagline)</label>
				<input
					type="text"
					bind:value={settings.brand.tagline}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['brand.tagline'] ? 'border-red-500' : ''}"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">رقم واتساب المعتمد</label>
				<input
					type="text"
					bind:value={settings.brand.whatsappNumber}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm dir-ltr focus:ring-2 focus:ring-emerald-500 {validationErrors['brand.whatsappNumber'] ? 'border-red-500' : ''}"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">ساعات الدعم والعمل</label>
				<input
					type="text"
					bind:value={settings.brand.supportHours}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['brand.supportHours'] ? 'border-red-500' : ''}"
				/>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 items-stretch pt-1">
			<div class="shrink-0 w-full sm:w-40 aspect-video rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
				{#if settings.brand.heroImage}
					<img src={settings.brand.heroImage} alt="صورة الواجهة" class="w-full h-full object-cover" />
				{:else}
					<span class="text-gray-400 text-xs text-center px-2">بلاصة صورة الواجهة الرئيسية</span>
				{/if}
			</div>
			<div class="flex-1">
				<label class="block text-sm font-medium text-gray-700 mb-1">صورة الواجهة الرئيسية (Hero — كتبان فوق الموقع)</label>
				<input
					type="text"
					bind:value={settings.brand.heroImage}
					onblur={validateField}
					dir="ltr"
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 {validationErrors['brand.heroImage'] ? 'border-red-500' : ''}"
					placeholder="https://..."
				/>
				<p class="mt-1 text-[11px] text-gray-400">من الأفضل مقاس عريض (مثال: 1600×900). خليها خاوية إلا بغيتي الواجهة بلا صورة.</p>
			</div>
		</div>
	</div>

	<!-- 4. Commerce Settings -->
	<div class="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-6">
		<h2 class="text-lg font-bold text-gray-900 border-b pb-3">إعدادات الدفع والشحن</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">رمز العملة (مثال: د.م / DH)</label>
				<input
					type="text"
					bind:value={settings.commerce.currencySymbol}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['commerce.currencySymbol'] ? 'border-red-500' : ''}"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">رسالة الشحن المجاني</label>
				<input
					type="text"
					bind:value={settings.commerce.freeShippingText}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['commerce.freeShippingText'] ? 'border-red-500' : ''}"
				/>
			</div>

			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع المعروضة</label>
				<input
					type="text"
					bind:value={settings.commerce.paymentMethod}
					onblur={validateField}
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 {validationErrors['commerce.paymentMethod'] ? 'border-red-500' : ''}"
				/>
			</div>
		</div>
	</div>

	<!-- 5. Post-Order Upsell Image Setting -->
	<div class="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-4">
		<div class="border-b pb-3 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-bold text-gray-900">صورة العرض بعد إتمام الطلب (Post-Order Upsell Image)</h2>
				<p class="text-xs text-gray-500 mt-0.5">الصورة المخصصة لعرض ما بعد الطلب (حامل جداري للمكانس والممسحات — 99 DH).</p>
			</div>
			<span class="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
				مقاس مربع 1:1
			</span>
		</div>

		<div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
			<!-- 1:1 Square Preview Box -->
			<div class="w-48 h-48 sm:w-52 sm:h-52 aspect-square rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex flex-col items-center justify-center shrink-0 relative group">
				{#if settings.commerce.postOrderUpsellImage}
					<img
						src={settings.commerce.postOrderUpsellImage}
						alt="معاينة صورة العرض"
						class="w-full h-full object-cover"
					/>
					<button
						type="button"
						onclick={() => (settings.commerce.postOrderUpsellImage = '')}
						class="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 transition-colors cursor-pointer"
						title="حذف الصورة"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				{:else}
					<div class="text-center p-4">
						<svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span class="text-xs text-gray-400 font-medium block">المعاينة (1:1)</span>
						<span class="text-[11px] text-gray-300 block mt-0.5">لا توجد صورة حالياً</span>
					</div>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex-1 space-y-3 w-full">
				<label class="block text-sm font-semibold text-gray-800">
					رابط الصورة أو رفع صورة من جهازك
				</label>
				
				<input
					type="text"
					bind:value={settings.commerce.postOrderUpsellImage}
					dir="ltr"
					class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
					placeholder="https://... أو مسار الصورة"
				/>

				<div class="flex items-center gap-3">
					<label class="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
						<span>رفع الصورة (1:1)</span>
						<input
							type="file"
							accept="image/*"
							class="hidden"
							onchange={(e) => {
								const file = e.currentTarget.files?.[0];
								if (file) {
									const reader = new FileReader();
									reader.onload = (ev) => {
										settings.commerce.postOrderUpsellImage = ev.target?.result as string;
									};
									reader.readAsDataURL(file);
								}
							}}
						/>
					</label>

					{#if settings.commerce.postOrderUpsellImage}
						<button
							type="button"
							onclick={() => (settings.commerce.postOrderUpsellImage = '')}
							class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
						>
							إزالة الصورة
						</button>
					{/if}
				</div>

				<div class="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 space-y-1">
					<p class="font-bold">💡 متطلبات الصورة:</p>
					<ul class="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
						<li>المقاس الموصى به: <strong>مربع بنسبة 1:1</strong> (مثال: 800×800 بكسل).</li>
						<li>في حال لم تقم برفع أي صورة، ستبقى خانة الصورة في العرض <strong>فارغة</strong> كما هو مطلوب.</li>
						<li>بعد رفع أو تعديل الصورة، اضغط على <strong>"حفظ التغييرات"</strong> في الأسفل لحفظ الإعدادات.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
