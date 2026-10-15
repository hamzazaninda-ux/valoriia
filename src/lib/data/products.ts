// =============================================================================
// NOVAVITA Core Product Catalog & Space Seller SKU Mapping
// Single Source of Truth for Storefront & Fulfillment
// =============================================================================

export interface CatalogProduct {
  id: string;
  slug: string;
  sku: 'gummies_collagen' | 'gummies_biotine' | 'gumies_vitamine';
  name: string;
  headline: string;
  subtitle?: string;
  description: string;
  flavor: string;
  keyBenefits: string[];
  ingredients: string[];
  usage?: string;
  sellingPoints?: string[];
  wholesaleCost: number; // MAD (Space Seller COGS)
  retailPrice: number;    // MAD (Standard single unit price)
  compareAtPrice: number; // MAD
  rating: number;
  reviewCount: number;
  badge: string;
  image: string;
  gallery: string[];
  faq: Array<{ question: string; answer: string }>;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    id: 'gummies_collagen',
    slug: 'gummies_collagen',
    sku: 'gummies_collagen',
    name: 'علكات الكولاجين البحري (Collagen Gummies)',
    headline: 'كولاجين بحري متحلل مع حمض الهيالورونيك لمرونة البشرة وملء الخطوط',
    description: 'تركيبة صيدلانية متطورة تجمع بين الكولاجين البحري المتحلل سريع الامتصاص وحمض الهيالورونيك المرطب. مصممة لتعويض النقص الطبيعي في الكولاجين بعد سن الـ 25 (1% سنوياً)، محاربة الشحوب والجفاف، ومنح بشرتكِ امتلاءً ونضارة شبابية تدوم بدون بودرة كريهة الطعم أو كبسولات عسيرة البلع.',
    flavor: 'توت بري طبيعي منعش (Wild Berry)',
    keyBenefits: [
      'تعويض النقص الطبيعي للكولاجين واستعادة مرونة وشباب البشرة',
      'ترطيب خلوي عميق بفضل جزيئات حمض الهيالورونيك المركزة',
      'تخفيف مظهر الخطوط التعبيرية الدقيقة ومحاربة شحوب البشرة',
      '25 علكة مضغ شهية سهلة الهضم ببكتين الفواكه الحلال 100%'
    ],
    ingredients: [
      'كولاجين بحري متحلل (Hydrolyzed Marine Collagen)',
      'حمض الهيالورونيك (Hyaluronic Acid)',
      'فيتامين C (معزز الامتصاص)',
      'فيتامين E (مضاد أكسدة)',
      'بكتين فواكه نباتي 100% حلال',
      'نكهة التوت البري الطبيعية'
    ],
    wholesaleCost: 53.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.9,
    reviewCount: 420,
    badge: 'الأفضل لنضارة البشرة',
    image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752600/mockup-collagen_gummies-main_1.png',
    gallery: [
      '/images/products/gummies_collagen.svg',
      '/images/products/gummies_biotine.svg',
      '/images/products/gumies_vitamine.svg'
    ],
    faq: [
      {
        question: 'لماذا تبدأ البشرة بفقدان نضارتها بعد سن الـ 25؟',
        answer: 'علمياً، يفقد الجسم حوالي 1% من مخزونه الطبيعي للكولاجين سنوياً بعد عمر 25 عاماً، مما يؤدي إلى ظهور الخطوط وفقدان المرونة. علكات NOVAVITA تعوض هذا الفقد من الداخل مباشرة عبر كولاجين بحري متحلل سريع الامتصاص.'
      },
      {
        question: 'متى تظهر نتائج كولاجين البشرة؟',
        answer: 'تبدأ نتائج ترطيب ونضارة البشرة بالظهور بعد أسبوعين إلى 3 أسابيع من الاستعمال اليومي، وتكتمل مرونة البشرة واختفاء الشحوب مع نهاية كورس الشهرين.'
      },
      {
        question: 'هل تناسب جميع أنواع البشرة؟',
        answer: 'نعم، التركيبة طبيعية 100% وتعمل من الداخل عبر الدورة الدموية لتغذية جميع أنواع البشرة (الجافة، المختلطة والدهنية) بدون أي انسداد للمسام.'
      }
    ]
  },
  {
    id: 'gummies_biotine',
    slug: 'gummies_biotine',
    sku: 'gummies_biotine',
    name: 'علكات البيوتين 3000mcg + فيتامين C والزنك',
    headline: 'دعم طبيعي لصحة الشعر والبشرة والأظافر – تركيبة متطورة لتكملة مفعول الكولاجين',
    subtitle: 'دعم طبيعي لصحة الشعر والبشرة والأظافر – تركيبة متطورة لتكملة مفعول الكولاجين',
    description: 'تركيبة علاجية متطورة مصممة خصيصاً لتكملة ومضاعفة مفعول الكولاجين. بينما يقوم الكولاجين ببناء وترطيب خلايا البشرة، يعمل البيوتين المركز (3000 ميكروغرام) مع فيتامين C والزنك على تثبيت الكولاجين في بصيلات الشعر والأظافر، إيقاف التساقط، تحفيز إنبات الخلفة (Baby Hair)، وتقوية الأظافر من الجذور.',
    flavor: 'فراولة طبيعية شهية (Sweet Strawberry)',
    keyBenefits: [
      'تعزيز صحة الشعر وتقليل التقصف والتساقط',
      'بشرة أكثر نضارة وإشراقاً بفضل تحفيز الكولاجين',
      'تقوية الأظافر ومنع تكسرها',
      'دعم الطاقة والتمثيل الغذائي والجهاز العصبي'
    ],
    ingredients: [
      'البيوتين (3000 ميكروغرام - فيتامين B7)',
      'فيتامين C (لدعم إنتاج الكولاجين الطبيعي)',
      'الزنك',
      'بكتين نباتي طبيعي 100% حلال',
      'نكهة الفراولة الطبيعية'
    ],
    sellingPoints: [
      'المكمّل الأساسي لمضاعفة مفعول الكولاجين',
      'مناسبة للنباتيين (بكتين نباتي)',
      'خالية من الغلوتين وبدون GMO',
      'نكهات طبيعية وبدون ملونات صناعية'
    ],
    usage: 'يمضغ علكتان يوميًا، ويفضل تناولهما أثناء إحدى الوجبات.',
    wholesaleCost: 52.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.9,
    reviewCount: 580,
    badge: 'المكمّل الأساسي للكولاجين',
    image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752602/mockup-Biotine_gummies-main.png',
    gallery: [
      '/images/products/gummies_biotine.svg',
      '/images/products/gummies_collagen.svg',
      '/images/products/gumies_vitamine.svg'
    ],
    faq: [
      {
        question: 'علاش البيوتين ضروري مع الكولاجين؟',
        answer: 'الكولاجين كيبني البشرة، والبيوتين مع فيتامين C والزنك كيثبّتو الكولاجين، يحبسو تساقط الشعر، ينبتو الخلفة ويقويو الأظافر من الجذور.'
      },
      {
        question: 'طريقة الاستعمال الصحيحة؟',
        answer: 'يمضغ علكتان يوميًا، ويفضل تناولهما أثناء إحدى الوجبات.'
      },
      {
        question: 'هل علكات البيوتين تفتح الشهية أو تزيد شعر الجسم؟',
        answer: 'إطلاقاً! الجرعة الصيدلانية (3000 mcg) والتركيبة الخالية من السكر المضاف تعمل حصرياً على تعزيز الكيراتين في فروة الرأس والأظافر، ولا تحتوي على أي هرمونات تؤثر على شعر الجسم أو الوزن.'
      }
    ]
  },
  {
    id: 'gumies_vitamine',
    slug: 'gumies_vitamine',
    sku: 'gumies_vitamine',
    name: 'علكات الملتي فيتامين (تغذية وطاقة متكاملة)',
    headline: 'تغذية متكاملة وحيوية يومية – الوقود الأساسي لخلايا البشرة والجسم',
    subtitle: 'تغذية متكاملة وحيوية يومية – الوقود الأساسي لخلايا البشرة والجسم',
    description: 'المكمل اليومي المتكامل لتغذية خلايا الجسم والبشرة وتسريع امتصاص الكولاجين. جسمك ما غاديش يمتص الكولاجين 100% إلا كان عيان وناقصينو فيتامينات! تركيبة متكاملة تضم 13 فيتامين ومعدن أساسي كتقضي على الخمول، تقوي المناعة، وتضاعف نضارة وحيوية البشرة.',
    flavor: 'فواكه استوائية وحمضيات منعشة (Tropical Citrus)',
    keyBenefits: [
      'تعزيز المناعة الطبيعية',
      'زيادة الطاقة وتقليل التعب والإرهاق اليومي',
      'الحفاظ على نضارة البشرة وصحة الشعر',
      'تقوية العظام والأسنان',
      'دعم صحة العين',
      'مضادات أكسدة قوية (C و E) لحماية الخلايا'
    ],
    ingredients: [
      'فيتامين A',
      'فيتامين C',
      'فيتامين D3',
      'فيتامين E',
      'فيتامين K1',
      'مجموعة فيتامينات B (B1, B2, B3, B5, B6, B12)',
      'البيوتين',
      'حمض الفوليك'
    ],
    sellingPoints: [
      'مناسبة للنباتيين (بكتين نباتي)',
      'خالية من الغلوتين وبدون GMO',
      'نكهات طبيعية وبدون ملونات صناعية'
    ],
    usage: 'يمضغ علكتان يوميًا، ويفضل تناولهما أثناء إحدى الوجبات.',
    wholesaleCost: 55.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.8,
    reviewCount: 310,
    badge: 'لتسريع الامتصاص وطرد التعب',
    image: 'https://res.cloudinary.com/uqfy0kku/image/upload/v1791752600/mockup-Melatonine_Gummies-main.png',
    gallery: [
      '/images/products/gumies_vitamine.svg',
      '/images/products/gummies_biotine.svg',
      '/images/products/gummies_collagen.svg'
    ],
    faq: [
      {
        question: 'علاش الملتي فيتامين مهم مع الكولاجين؟',
        answer: 'جسمك ما غاديش يمتص الكولاجين 100% إلا كان عيان وناقصينو فيتامينات! تركيبة متكاملة كتقضي على الخمول، تقوي المناعة وتضاعف نضارة البشرة وتسريع الامتصاص.'
      },
      {
        question: 'طريقة الاستعمال الصحيحة؟',
        answer: 'يمضغ علكتان يوميًا، ويفضل تناولهما أثناء إحدى الوجبات.'
      },
      {
        question: 'هل تناسب النباتيين ومن يعانون من حساسية الغلوتين؟',
        answer: 'نعم، مناسبة للنباتيين (بكتين نباتي 100%)، خالية من الغلوتين وبدون GMO، بنكهات طبيعية وبدون ملونات صناعية.'
      }
    ]
  }
];

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  const normalized = (slug || '').toLowerCase().trim().replace(/-/g, '_');
  if (
    normalized === 'gummies_collagen' ||
    normalized === 'collagen' ||
    normalized.includes('collagen')
  ) {
    return PRODUCTS.find((p) => p.sku === 'gummies_collagen');
  }
  if (
    normalized === 'gummies_biotine' ||
    normalized === 'biotine' ||
    normalized === 'biotin' ||
    normalized.includes('biotin')
  ) {
    return PRODUCTS.find((p) => p.sku === 'gummies_biotine');
  }
  if (
    normalized === 'gumies_vitamine' ||
    normalized === 'gummies_multivitamines' ||
    normalized === 'gummies_vitamine' ||
    normalized === 'multivitamines' ||
    normalized === 'multivitamin' ||
    normalized.includes('vitamine') ||
    normalized.includes('multivit')
  ) {
    return PRODUCTS.find((p) => p.sku === 'gumies_vitamine');
  }
  return PRODUCTS.find((p) => p.slug === slug || p.id === slug || p.sku === slug);
}

export function getAllProducts(): CatalogProduct[] {
  return PRODUCTS;
}

/**
 * Normalizes any SKU, slug, or title to a clean Arabic product name
 */
export function getProductShortName(skuOrSlugOrTitle?: string): string {
  const norm = (skuOrSlugOrTitle || '').toLowerCase().trim().replace(/-/g, '_');
  if (norm.includes('biotin') || norm.includes('بيوتين')) return 'بيوتين';
  if (norm.includes('vitamin') || norm.includes('فيتامين') || norm.includes('multivit')) return 'مالتي فيتامين';
  if (norm.includes('collagen') || norm.includes('كولاجين')) return 'كولاجين';
  return 'كولاجين';
}

/**
 * Normalizes any SKU, slug, or title to the exact fulfillment upsell label in Arabic
 */
export function getUpsellItemLabel(skuOrSlugOrTitle?: string): string {
  const shortName = getProductShortName(skuOrSlugOrTitle);
  return `علبة ${shortName} (العرض الخاطف)`;
}

/**
 * Builds the exact fulfillment order label for Google Sheets & Space Seller
 * Examples:
 * - "NOVAVITA كولاجين - باقة التجربة (1 علبة) + علبة بيوتين (العرض الخاطف)"
 * - "NOVAVITA كولاجين - باقة التجربة (1 علبة) + علبة مالتي فيتامين (العرض الخاطف)"
 * - "NOVAVITA بيوتين - باقة التجربة (1 علبة) + علبة كولاجين (العرض الخاطف)"
 * - "NOVAVITA كولاجين - باقة الثنائي الأكثر طلباً (2 علب) + علبة بيوتين (العرض الخاطف)"
 */
export function buildOrderFulfillmentLabel(params: {
  tier?: string;
  mainSku?: string;
  mainTitle?: string;
  items?: Array<{ sku?: string; slug?: string; title?: string; isUpsell?: boolean }>;
  hasUpsell?: boolean;
}): string {
  // If mainTitle already contains a specific upsell (e.g. "علبة بيوتين (العرض الخاطف)"), keep it
  if (
    params.mainTitle &&
    params.mainTitle.includes('(العرض الخاطف)') &&
    (params.mainTitle.includes('بيوتين') || params.mainTitle.includes('مالتي فيتامين') || params.mainTitle.includes('كولاجين'))
  ) {
    // If it doesn't contain generic placeholder, it's already well-formed
    if (!params.mainTitle.includes('+ علبة العرض الخاطف')) {
      return params.mainTitle.trim();
    }
  }

  const rawTier = String(params.tier || 'tier_2');
  const tierText =
    rawTier === 'tier_1' || rawTier.includes('1') || rawTier.includes('التجربة')
      ? 'باقة التجربة (1 علبة)'
      : rawTier === 'tier_3' || rawTier.includes('3') || rawTier.includes('التحول')
        ? 'باقة التحول الشامل (3 علب)'
        : 'باقة الثنائي الأكثر طلباً (2 علب)';

  // 1. Determine main product SKU or title
  let mainSku = params.mainSku;
  if (!mainSku && Array.isArray(params.items)) {
    const mainItem = params.items.find((it) => !it.isUpsell);
    if (mainItem) {
      mainSku = mainItem.sku || mainItem.slug;
    }
  }

  const mainName = getProductShortName(mainSku || params.mainTitle);
  const baseLabel = `NOVAVITA ${mainName} - ${tierText}`;

  // 2. Determine upsell items dynamically from cart items
  const upsellLabels: string[] = [];
  if (Array.isArray(params.items)) {
    const upsellItems = params.items.filter(
      (it) => it.isUpsell || (it.title && (it.title.includes('عرض') || it.title.includes('خاطف')))
    );
    for (const up of upsellItems) {
      const upIdentifier = up.sku || up.slug || up.title;
      if (upIdentifier) {
        upsellLabels.push(getUpsellItemLabel(upIdentifier));
      }
    }
  }

  // Deduplicate upsell labels
  const uniqueUpsells = Array.from(new Set(upsellLabels));

  if (uniqueUpsells.length > 0) {
    return `${baseLabel} + ${uniqueUpsells.join(' + ')}`;
  }

  // 3. Fallback when hasUpsell is true but specific upsell line was not in items array
  if (params.hasUpsell) {
    // If main is collagen, default upsell is biotine; otherwise collagen
    const fallbackUpsell = mainName === 'كولاجين' ? 'علبة بيوتين (العرض الخاطف)' : 'علبة كولاجين (العرض الخاطف)';
    return `${baseLabel} + ${fallbackUpsell}`;
  }

  return baseLabel;
}
