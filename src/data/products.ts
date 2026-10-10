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
  description: string;
  flavor: string;
  keyBenefits: string[];
  ingredients: string[];
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
    headline: 'كولاجين بتركيبة متطورة لنضارة ومرونة البشرة وتخفيف التجاعيد',
    description: 'حلوى الكولاجين البحري المتحلل الغنية بفيتامين C ومضادات الأكسدة بنكهة التوت الطبيعية. مصممة لترطيب البشرة من الداخل، تحفيز إنتاج الكولاجين الطبيعي، ومنحك إشراقة شبابية نضرة بدون الحاجة لمساحيق أو كبسولات مرة.',
    flavor: 'توت طبيعي منعش (Wild Berry)',
    keyBenefits: [
      'تعزيز مرونة ونضارة البشرة ومحاربة الجفاف والشحوب',
      'تخفيف مظهر الخطوط الدقيقة والتجاعيد التعبيرية',
      'حماية خلايا الجلد بفضل فيتامين C المضاد للأكسدة',
      'بكتين نباتي 100% حلال خفيف وسهل الهضم'
    ],
    ingredients: ['كولاجين بحري متحلل (Hydrolyzed Marine Collagen)', 'فيتامين C', 'فيتامين E', 'بكتين فواكه طبيعي', 'نكهة التوت الطبيعية'],
    wholesaleCost: 53.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.9,
    reviewCount: 420,
    badge: 'الأفضل لنضارة البشرة',
    image: '/images/products/gummies_collagen.svg',
    gallery: [
      '/images/products/gummies_collagen.svg',
      '/images/products/gummies_biotine.svg',
      '/images/products/gumies_vitamine.svg'
    ],
    faq: [
      {
        question: 'متى تظهر نتائج كولاجين البشرة؟',
        answer: 'تبدأ نتائج ترطيب ونضارة البشرة بالظهور بعد أسبوعين إلى 3 أسابيع من الاستعمال اليومي، وتكتمل مرونة البشرة واختفاء الشحوب مع نهاية كورس الشهرين.'
      },
      {
        question: 'هل تناسب جميع أنواع البشرة؟',
        answer: 'نعم، التركيبة طبيعية 100% وتعمل من الداخل عبر الدورة الدموية لتغذية جميع أنواع البشرة (الجافة، المختلطة والدهنية).'
      }
    ]
  },
  {
    id: 'gummies_biotine',
    slug: 'gummies_biotine',
    sku: 'gummies_biotine',
    name: 'علكات البيوتين والزنك (Biotin Gummies)',
    headline: 'بيوتين مركز مع الزنك وفيتامين C لإنبات الشعر وتقوية الأظافر',
    description: 'حلوى البيوتين المركز (5000 mcg) بنكهة الفراولة الطبيعية اللذيذة. تقضي على تساقط الشعر المستمر، تحفز نمو بصيلات جديدة (Baby Hair)، وتقوي الأظافر المتكسرة والهشة من الجذور.',
    flavor: 'فراولة طبيعية حلوة (Sweet Strawberry)',
    keyBenefits: [
      'إيقاف تساقط الشعر وتحفيز نمو البيبي هير بكثافة',
      'تقوية الأظافر الهشة ومنع تكسرها وتلفها',
      'جرعة علمية فعالة من البيوتين المركز (5000 mcg) والزنك',
      'حلوى طرية سهلة المضغ بدون ماء وبدون أي طعم معدني'
    ],
    ingredients: ['بيوتين مركز (Biotin 5000 mcg)', 'زنك نقي (Zinc)', 'فيتامين C', 'فيتامين A', 'فوليك أسيد', 'بكتين نباتي'],
    wholesaleCost: 52.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.9,
    reviewCount: 580,
    badge: 'الأكثر مبيعاً للشعر',
    image: '/images/products/gummies_biotine.svg',
    gallery: [
      '/images/products/gummies_biotine.svg',
      '/images/products/gummies_collagen.svg',
      '/images/products/gumies_vitamine.svg'
    ],
    faq: [
      {
        question: 'هل علكات البيوتين تفتح الشهية أو تزيد الوزن؟',
        answer: 'أبداً، تركيبتنا خالية من السكريات المضافة الضارة وتحتوي الحبتان على أقل من 15 سعرة حرارية، ولا تسبب أي زيادة في الوزن أو شعر الجسم غير المرغوب فيه.'
      },
      {
        question: 'كم حبة أتناول في اليوم؟',
        answer: 'حبتان (2 Gummies) يومياً كل صباح، كتمضغيهم بحال الحلوى بكل بساطة بدون ماء.'
      }
    ]
  },
  {
    id: 'gumies_vitamine',
    slug: 'gumies_vitamine',
    sku: 'gumies_vitamine',
    name: 'علكات الفيتامينات المتعددة (Multivitamin Gummies)',
    headline: 'تركيبة يومية متكاملة لتعزيز المناعة، النشاط والتوازن الصحي الكامل',
    description: 'المكمل اليومي المتكامل للمرأة العصرية بنكهات الفواكه المشكلة. يجمع 13 فيتامين ومعدن أساسي لتعزيز الحيوية والنشاط اليومي، تقوية المناعة، وتزويد الجسم بالعناصر الناقصة في التغذية السريعة.',
    flavor: 'فواكه مشكلة منعشة (Citrus & Berry Blend)',
    keyBenefits: [
      'تزويد الجسم بالطاقة والنشاط ومحاربة الخمول والإرهاق',
      'تعزيز الجهاز المناعي بفيتامينات C و D والزنك',
      'دعم التوازن الهرموني والصحة العامة للمرأة',
      'روتين صحي ولذيذ يغنيك عن الكبسولات الصيدلانية الكبيرة'
    ],
    ingredients: ['فيتامين A, C, D3, E, B6, B12', 'حمض الفوليك', 'زنك', 'يود', 'بيوتين', 'بكتين نباتي حلال'],
    wholesaleCost: 55.00,
    retailPrice: 199.00,
    compareAtPrice: 299.00,
    rating: 4.8,
    reviewCount: 310,
    badge: 'الحيوية والمناعة اليومية',
    image: '/images/products/gumies_vitamine.svg',
    gallery: [
      '/images/products/gumies_vitamine.svg',
      '/images/products/gummies_biotine.svg',
      '/images/products/gummies_collagen.svg'
    ],
    faq: [
      {
        question: 'هل يمكنني الجمع بين البيوتين والملتي فيتامين؟',
        answer: 'نعم بالتأكيد! العديد من عميلاتنا يستخدمن باقة الثنائي أو الثلاثي للجمع بين إنبات الشعر والحيوية اليومية بأمان تام.'
      }
    ]
  }
];

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug || p.id === slug);
}

export function getAllProducts(): CatalogProduct[] {
  return PRODUCTS;
}
