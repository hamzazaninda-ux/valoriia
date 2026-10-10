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
    image: '/images/products/gummies_collagen.svg',
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
    name: 'علكات البيوتين والزنك (Biotin Gummies)',
    headline: 'بيوتين مركز (3000 mcg) مع الزنك وفيتامين C لإنبات الشعر وإيقاف التساقط',
    description: 'الحل العلمي النهائي لتساقط الشعر وتلفه الناتج عن مياه الكالكير القاسية بالمغرب، الصبغات المتكررة والضغط اليومي. جرعة علاجية دقيقة (3000 mcg) من البيوتين النقي مع الزنك وفيتامين C لتحفيز إنبات بصيلات البيبي هير وتقوية الأظافر الهشة.',
    flavor: 'فراولة طبيعية شهية (Sweet Strawberry)',
    keyBenefits: [
      'محاربة تساقط الشعر الناتج عن الكالكير، الصبغات والتوتر',
      'تسريع إنبات بصيلات جديدة (Baby Hair) وتكثيف الفراغات',
      'تقوية الأظافر المتكسرة والهشة وزيادة لمعان وحيوية الشعر',
      'جرعة صيدلانية مدروسة (3000 mcg) آمنة تماماً بدون زيادة شعر الجسم'
    ],
    ingredients: [
      'بيوتين نقي مركز (Biotin 3000 mcg)',
      'زنك نقي (Zinc Citrate)',
      'فيتامين C (مضاد أكسدة وداعم لامتصاص الكيراتين)',
      'فيتامين A وفيتامين E',
      'حمض الفوليك (Folic Acid)',
      'بكتين فواكه نباتي 100% حلال'
    ],
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
        question: 'كيف تحمي العلكات شعري من أثر "الكالكير" والماء القاسي؟',
        answer: 'ماء الصنبور الغني بالكلس يسبب جفاف وتقصف ألياف الشعر من الخارج. تركيبة البيوتين (3000 mcg) مع الزنك تغذي بصيلات الشعر من الداخل عبر مجرى الدم، مما يقوي جذور الشعرة ويمنع تساقطها مهما كانت قساوة الماء.'
      },
      {
        question: 'هل علكات البيوتين تفتح الشهية أو تزيد شعر الجسم؟',
        answer: 'إطلاقاً! الجرعة الصيدلانية (3000 mcg) والتركيبة الخالية من السكر المضاف تعمل حصرياً على تعزيز الكيراتين في فروة الرأس والأظافر، ولا تحتوي على أي هرمونات تؤثر على شعر الجسم أو الوزن.'
      },
      {
        question: 'كم حبة أتناول في اليوم؟',
        answer: 'علكتان شهيتان (2 Gummies) يومياً كل صباح، تمضغينها مثل الحلوى بكل سهولة ومتعة بدون الحاجة لشرب الماء.'
      }
    ]
  },
  {
    id: 'gumies_vitamine',
    slug: 'gumies_vitamine',
    sku: 'gumies_vitamine',
    name: 'علكات الفيتامينات المتعددة (Multivitamin Gummies)',
    headline: '13 فيتامين ومعدن أساسي مع B-Complex لرفع الطاقة ومحاربة الإرهاق',
    description: 'المكمل اليومي المتكامل للمرأة النشيطة. يجمع 13 فيتامين ومعدن حيوي مع فيتامينات B المركبة وحمض الفوليك لتعويض النقص الغذائي، طرد الخمول والإرهاق اليومي، وتقوية الجهاز المناعي بروتين ممتع يغنيك تماماً عن ابتلاع الكبسولات الصيدلانية الضخمة.',
    flavor: 'فواكه استوائية وحمضيات منعشة (Tropical Citrus)',
    keyBenefits: [
      'تزويد الجسم بالطاقة الحيوية والنشاط وطرد التعب المستمر',
      'تعزيز مناعة الجسم ومقاومة تقلبات الطقس بفيتامين C و D3 والزنك',
      'دعم التوازن الهرموني والصحة العصبية بمجموعة B-Complex',
      'بديل لذيذ وسلس ينهي معاناة بلع الأقراص الصيدلانية الكبيرة الغثة'
    ],
    ingredients: [
      'فيتامينات A, C, D3, E',
      'مجموعة B-Complex كاملة (B6, B12, Niacin)',
      'حمض الفوليك (Folic Acid)',
      'زنك نقي ويود مغذي للغدة',
      'بكتين نباتي طبيعي 100% حلال',
      'نكهات فواكه استوائية طبيعية'
    ],
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
        question: 'علاش علكات الملتي فيتامين أحسن من الكبسولات الصيدلانية؟',
        answer: 'معظم النساء يعانين من صعوبة بلع الكبسولات الضخمة والشعور بالغثيان في المعدة. علكات NOVAVITA تمتص بسرعة أكبر عبر الغشاء المخاطي للفم والمعدة، وتقدم لكِ روتيناً يومياً لذيذاً تحبين الالتزام به كل صباح.'
      },
      {
        question: 'هل يمكنني الجمع بين البيوتين والملتي فيتامين؟',
        answer: 'نعم بالتأكيد! التركيبتان متكاملتان وآمنتان معاً. العديد من عميلاتنا يفضلن الجمع بينهما للحصول على كثافة الشعر مع طاقة ونشاط طوال النهار.'
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
