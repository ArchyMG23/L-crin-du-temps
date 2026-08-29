import { Product, Category, StoreSettings } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "L'Écrin du Temps",
  logo: '/logo-dark.svg',
  whatsappNumber: '+33612345678', // Format international personnalisable dans l'admin
  currency: '€',
  defaultLowStockThreshold: 2,
  shippingEnabled: true,
  shippingFee: 0, // Offerte pour le prestige
  shippingMessage: 'Livraison sécurisée sous écrin avec certificat d\'authenticité et numéro de suivi remis en main propre.',
  socialLinks: {
    instagram: 'https://instagram.com/lecrindutemps_officiel',
    facebook: 'https://facebook.com/lecrindutemps',
    tiktok: 'https://tiktok.com/@lecrindutemps'
  },
  contactInformation: {
    email: 'contact@lecrindutemps-horlogerie.com',
    phone: '+33 6 12 34 56 78',
    address: '8 Place Vendôme, 75001 Paris'
  }
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-chronographes',
    name: 'Chronographes',
    slug: 'chronographes',
    description: 'Complications de précision sportive et compteurs de temps.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat-plongee',
    name: 'Montres de Plongée',
    slug: 'montres-de-plongee',
    description: 'Robustesse aquatique, lunettes tournantes et étanchéité absolue.',
    image: 'https://images.unsplash.com/photo-1547996160-71dfabb18a51?auto=format&fit=crop&q=80&w=800',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat-habillees',
    name: 'Classiques & Habillées',
    slug: 'classiques-habillees',
    description: 'Lignes épurées, boîtiers extra-plats et élégance intemporelle.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat-squelette',
    name: 'Squelettes & Haute Horlogerie',
    slug: 'squelettes-haute-horlogerie',
    description: 'Mécanismes apparents et finitions manuelles d\'exception.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-royal-chronograph',
    name: 'Chronographe Royal Ébène',
    slug: 'chronographe-royal-ebene',
    brand: 'Vanguard Genève',
    reference: 'VG-8840-BK',
    shortDescription: 'Chronographe automatique en acier brossé avec cadran noir soleillé.',
    description: 'Une pièce maîtresse de notre collection. Le Chronographe Royal Ébène associe la pureté de l\'acier 316L chirurgical à un cadran noir texturé "tapisserie" réfléchissant subtilement la lumière. Doté d\'une réserve de marche de 48 heures et d\'une précision chronométrique certifiée.',
    price: 1450,
    promotionalPrice: 1290,
    currency: '€',
    categoryId: 'cat-chronographes',
    gender: 'homme',
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 5,
    lowStockThreshold: 2,
    featured: true,
    active: true,
    specifications: {
      movement: 'Automatique Calibre VG-2100 (28 800 alt/h)',
      caseDiameter: '42 mm',
      caseMaterial: 'Acier inoxydable 316L haute résistance',
      waterResistance: '10 ATM (100 mètres)',
      glass: 'Verre Saphir inrayable avec traitement antireflet double face',
      strapMaterial: 'Acier intégré avec fermoir déployant papillon'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-abyssal-submariner',
    name: 'Abyssal Diver 300M Vert Forêt',
    slug: 'abyssal-diver-300m-vert-foret',
    brand: 'Nautilus Heritage',
    reference: 'NH-300-GR',
    shortDescription: 'Montre de plongée professionnelle étanche 300 mètres avec lunette céramique.',
    description: 'Conçue pour explorer les profondeurs avec distinction. Son cadran vert émeraude soleillé et sa lunette unidirectionnelle en céramique inaltérable font de l\'Abyssal Diver une référence incontournable de polyvalence sportive et de luxe.',
    price: 1150,
    promotionalPrice: null,
    currency: '€',
    categoryId: 'cat-plongee',
    gender: 'homme',
    images: [
      'https://images.unsplash.com/photo-1547996160-71dfabb18a51?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 2, // Stock faible pour démonstration
    lowStockThreshold: 3,
    featured: true,
    active: true,
    specifications: {
      movement: 'Automatique à rotor bidirectionnel 42h',
      caseDiameter: '41 mm',
      caseMaterial: 'Acier inoxydable et insert lunette céramique',
      waterResistance: '30 ATM (300 mètres / Valve hélium)',
      glass: 'Saphir bombé résistant aux pressions extrêmes',
      strapMaterial: 'Bracelet acier Oyster avec rallonge plongée rapide'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-elegance-diamant-rose',
    name: 'Élégance Impériale Or Rose & Nacre',
    slug: 'elegance-imperiale-or-rose-nacre',
    brand: 'Aura Joaillerie',
    reference: 'AJ-882-RG',
    shortDescription: 'Garde-temps féminin en or rose brossé et cadran en nacre naturelle serti.',
    description: 'Une ode à la délicatesse et à la féminité. Le modèle Élégance Impériale combine un boîtier aux courbes fluides en or rose 18k avec un cadran en nacre naturelle sélectionnée à la main, rehaussé d\'index sertis de zirconiums étincelants.',
    price: 980,
    promotionalPrice: 890,
    currency: '€',
    categoryId: 'cat-habillees',
    gender: 'femme',
    images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 4,
    lowStockThreshold: 2,
    featured: true,
    active: true,
    specifications: {
      movement: 'Mouvement manufacture ultra-plat à quartz haute fréquence',
      caseDiameter: '34 mm',
      caseMaterial: 'Acier traité PVD Or Rose 18k 5 microns',
      waterResistance: '5 ATM (50 mètres)',
      glass: 'Verre Saphir pur biseauté',
      strapMaterial: 'Cuir d\'alligator véritable taupe façon sellier'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-tourbillon-skeleton',
    name: 'Grand Squelette Mécano-Titanium',
    slug: 'grand-squelette-mecano-titanium',
    brand: 'Atelier Horloger',
    reference: 'AH-SKEL-TIT',
    shortDescription: 'Haute complication à cœur ouvert et ponts anglés au diamant.',
    description: 'L\'art du squelettage poussé à son paroxysme. Chaque pont et rouage est ajouré avec précision pour dévoiler la pulsation vivante du balancier spiral. Boîtier en titane grade 5 d\'une légèreté et d\'un confort absolus.',
    price: 2400,
    promotionalPrice: null,
    currency: '€',
    categoryId: 'cat-squelette',
    gender: 'homme',
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 1, // Stock très faible
    lowStockThreshold: 2,
    featured: true,
    active: true,
    specifications: {
      movement: 'Mouvement mécanique à remontage manuel squelette 60h',
      caseDiameter: '43 mm',
      caseMaterial: 'Titane Grade 5 satiné et brossé',
      waterResistance: '5 ATM (50 mètres)',
      glass: 'Double saphir avant et arrière fond transparent',
      strapMaterial: 'Caoutchouc FKM vulcanisé structuré'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-petite-vendome-gold',
    name: 'Petite Vendôme Cadran Saphir',
    slug: 'petite-vendome-cadran-saphir',
    brand: 'Aura Joaillerie',
    reference: 'AJ-VEND-30',
    shortDescription: 'Design rectangulaire intemporel inspiré de l\'art déco parisien.',
    description: 'Inspirée par l\'architecture géométrique de la Place Vendôme, cette montre pour femme offre un profil fuselé et un port majestueux. Son bracelet maille milanaise or jaune épouse délicatement le poignet.',
    price: 850,
    promotionalPrice: null,
    currency: '€',
    categoryId: 'cat-habillees',
    gender: 'femme',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 6,
    lowStockThreshold: 2,
    featured: false,
    active: true,
    specifications: {
      movement: 'Quartz suisse de haute précision',
      caseDiameter: '28 x 36 mm',
      caseMaterial: 'PVD Or Jaune 18 carats poli miroir',
      waterResistance: '3 ATM (30 mètres)',
      glass: 'Verre minéral durci inrayable',
      strapMaterial: 'Maille milanaise tissée ajustable'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-monaco-racing-chrono',
    name: 'Monaco GT Chrono Panda',
    slug: 'monaco-gt-chrono-panda',
    brand: 'Vanguard Genève',
    reference: 'VG-GT-PANDA',
    shortDescription: 'Inspiration sport automobile avec cadran bicompax noir et blanc.',
    description: 'Hommage à l\'âge d\'or des courses de grand tourisme. Le cadran Panda vintage offre un contraste saisissant pour une lisibilité instantanée des temps au tour. Livré avec un bracelet cuir racing perforé.',
    price: 1320,
    promotionalPrice: 1190,
    currency: '€',
    categoryId: 'cat-chronographes',
    gender: 'mixte',
    images: [
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1000'
    ],
    stock: 0, // Rupture de stock pour démonstration
    lowStockThreshold: 2,
    featured: false,
    active: true,
    specifications: {
      movement: 'Mécanique automatique chronographe roue à colonnes',
      caseDiameter: '40 mm',
      caseMaterial: 'Acier inoxydable 316L',
      waterResistance: '10 ATM (100 mètres)',
      glass: 'Verre Saphir "Glassbox" rétro',
      strapMaterial: 'Cuir de veau vintage perforé marron'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
