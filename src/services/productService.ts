import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { ensureAdminAuth } from './adminService';
import {
  cleanupReplacedProductImages,
  isBrokenOrBlobUrl,
  saveProductImagesToIDB,
  getAllProductImagesFromIDB,
  deleteProductImagesFromIDB
} from './storageService';
import { withTimeout } from '../utils/async';

const PRODUCTS_COLLECTION = 'products';
const LOCAL_CUSTOM_PRODUCTS_KEY = 'hp_custom_products';

/**
 * Compacts a product object before saving to Firestore or localStorage so base64 Data URLs
 * are stored ONLY ONCE in `images[]` instead of being triplicated across `images[0]`, `coverImage`, and `image`.
 */
function compactProductPayload(product: any): any {
  const copy: any = { ...product };
  const cleanImages: string[] = Array.isArray(copy.images)
    ? copy.images.filter((u: string) => !isBrokenOrBlobUrl(u))
    : [];
  const primary =
    cleanImages[0] ||
    (!isBrokenOrBlobUrl(copy.image) ? copy.image : '') ||
    (!isBrokenOrBlobUrl(copy.coverImage) ? copy.coverImage : '') ||
    '';

  if (cleanImages.length === 0 && primary) {
    cleanImages.push(primary);
  }

  copy.images = cleanImages;
  // Avoid triplicating large data: URLs in the same document (keeps Firestore docs < 1MB and localStorage < 5MB)
  if (primary.startsWith('data:')) {
    copy.coverImage = '';
    copy.image = '';
  } else {
    copy.coverImage = primary;
    copy.image = primary;
  }

  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) {
      delete copy[key];
    }
  });

  return copy;
}

/**
 * Hydrates a product object in memory so `image`, `coverImage`, and `images[]` are always populated.
 */
export function hydrateProductInMemory(raw: any): Product {
  const rawImages: string[] = Array.isArray(raw.images) ? raw.images : [];
  const validImages = rawImages.filter((u) => !isBrokenOrBlobUrl(u));
  const validPrimary = !isBrokenOrBlobUrl(raw.image)
    ? raw.image
    : !isBrokenOrBlobUrl(raw.coverImage)
    ? raw.coverImage
    : validImages[0] || '';
  const images = validImages.length > 0 ? validImages : validPrimary ? [validPrimary] : [];
  const coverImage = validPrimary || images[0] || '';

  return {
    ...raw,
    images,
    coverImage,
    image: coverImage
  } as Product;
}

export function saveProductsCacheSafely(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    const compacted = products.map((p) => compactProductPayload(p));
    localStorage.setItem('hp_products_cache', JSON.stringify(compacted));
  } catch {
    // If localStorage is still near 5MB quota, strip data: URLs from localStorage (they are safely stored in IndexedDB)
    try {
      const ultraCompact = products.map((p) => {
        const c = compactProductPayload(p);
        if (Array.isArray(c.images) && c.images.some((u: string) => u.startsWith('data:'))) {
          saveProductImagesToIDB(c.id, c.images).catch(() => {});
          c.images = c.images.filter((u: string) => !u.startsWith('data:'));
        }
        return c;
      });
      localStorage.setItem('hp_products_cache', JSON.stringify(ultraCompact));
    } catch {}
  }
}

export function getLocalCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_PRODUCTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(hydrateProductInMemory) : [];
  } catch {
    return [];
  }
}

export function persistLocalProduct(product: Product): void {
  if (typeof window === 'undefined') return;
  if (product.id && Array.isArray(product.images) && product.images.length > 0) {
    saveProductImagesToIDB(product.id, product.images).catch(() => {});
  }
  try {
    const existing = getLocalCustomProducts();
    const filtered = existing.filter((p) => p.id !== product.id);
    const next = [hydrateProductInMemory(product), ...filtered];
    localStorage.setItem(
      LOCAL_CUSTOM_PRODUCTS_KEY,
      JSON.stringify(next.map((p) => compactProductPayload(p)))
    );
  } catch {}
}

export function removeLocalProduct(id: string): void {
  if (typeof window === 'undefined') return;
  deleteProductImagesFromIDB(id).catch(() => {});
  try {
    const existing = getLocalCustomProducts();
    const filtered = existing.filter((p) => p.id !== id);
    localStorage.setItem(
      LOCAL_CUSTOM_PRODUCTS_KEY,
      JSON.stringify(filtered.map((p) => compactProductPayload(p)))
    );
  } catch {}
}

/**
 * Fetch all products, with optional filtering for public active ones
 */
export async function getProducts(onlyActive = true): Promise<Product[]> {
  console.log('[FIRESTORE] products started');
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = onlyActive ? query(colRef, where('active', '==', true)) : colRef;

    const [initialSnapshot, idbImagesMap] = await Promise.all([
      withTimeout(getDocs(q), 3500, null, 'firestore-products'),
      getAllProductImagesFromIDB()
    ]);

    let snapshot = initialSnapshot;
    if (!snapshot) {
      if (onlyActive) {
        try {
          const activeQ = query(colRef, where('isActive', '==', true));
          snapshot = await withTimeout(getDocs(activeQ), 2500, null, 'firestore-products-isActive');
        } catch {
          snapshot = null;
        }
      }
    }

    const localProds = getLocalCustomProducts();
    const localById = new Map<string, Product>();
    for (const lp of localProds) {
      if (lp && lp.id) {
        const idbEntry = idbImagesMap[lp.id];
        if (idbEntry && idbEntry.images.length > 0 && (!lp.images || lp.images.length === 0)) {
          lp.images = idbEntry.images;
          lp.coverImage = idbEntry.images[0];
          lp.image = idbEntry.images[0];
        }
        localById.set(lp.id, hydrateProductInMemory(lp));
      }
    }

    if (!snapshot || snapshot.empty) {
      console.log('[FIRESTORE] products finished', { count: localById.size });
      return Array.from(localById.values());
    }

    let products = snapshot.docs.map((d) => {
      const firestoreData = d.data();
      const localMatch = localById.get(d.id);
      const idbEntry = idbImagesMap[d.id];

      // If local backup has a newer update timestamp, merge its updated fields
      const isLocalNewer =
        localMatch &&
        localMatch.updatedAt &&
        (!firestoreData.updatedAt || localMatch.updatedAt >= firestoreData.updatedAt);

      const data: any = isLocalNewer ? { ...firestoreData, ...localMatch } : { ...firestoreData };

      const isActive =
        data.isActive !== undefined
          ? Boolean(data.isActive)
          : data.active !== undefined
          ? Boolean(data.active)
          : true;
      const isFeatured =
        data.isFeatured !== undefined
          ? Boolean(data.isFeatured)
          : data.featured !== undefined
          ? Boolean(data.featured)
          : false;
      const promo =
        data.promoPrice !== undefined
          ? data.promoPrice
          : data.promotionalPrice !== undefined
          ? data.promotionalPrice
          : null;

      const rawImages: string[] = Array.isArray(data.images) ? data.images : [];
      let validImages = rawImages.filter((u) => !isBrokenOrBlobUrl(u));
      let validPrimary = !isBrokenOrBlobUrl(data.image)
        ? data.image
        : !isBrokenOrBlobUrl(data.coverImage)
        ? data.coverImage
        : validImages[0] || '';

      // Restore from localMatch or IndexedDB if Firestore had missing/expired blob images or if IDB is newer
      if (
        idbEntry &&
        idbEntry.images.length > 0 &&
        (validImages.length === 0 ||
          (idbEntry.updatedAt && (!firestoreData.updatedAt || idbEntry.updatedAt >= firestoreData.updatedAt)))
      ) {
        validImages = idbEntry.images;
        validPrimary = idbEntry.images[0];
      } else if (
        validImages.length === 0 &&
        localMatch &&
        Array.isArray(localMatch.images) &&
        localMatch.images.length > 0
      ) {
        validImages = localMatch.images.filter((u) => !isBrokenOrBlobUrl(u));
        validPrimary = validImages[0] || '';
      }

      const images = validImages.length > 0 ? validImages : validPrimary ? [validPrimary] : [];
      const coverImage = validPrimary || images[0] || '';

      const firestoreRawImages: string[] = Array.isArray(firestoreData.images) ? firestoreData.images : [];
      const firestoreValidImages = firestoreRawImages.filter((u) => !isBrokenOrBlobUrl(u));
      const hadBlobUrls =
        firestoreRawImages.some((u) => typeof u === 'string' && u.startsWith('blob:')) ||
        (typeof firestoreData.image === 'string' && firestoreData.image.startsWith('blob:')) ||
        (typeof firestoreData.coverImage === 'string' && firestoreData.coverImage.startsWith('blob:'));

      // Cache valid Firestore images in IndexedDB so they never disappear
      if (images.length > 0 && !idbEntry) {
        saveProductImagesToIDB(d.id, images).catch(() => {});
      }

      // If Firestore had broken/blob/missing images but we recovered valid images from IDB/local, heal Firestore in background
      if (images.length > 0 && (hadBlobUrls || firestoreValidImages.length === 0)) {
        const healPayload = compactProductPayload({
          images,
          coverImage,
          image: coverImage,
          updatedAt: new Date().toISOString()
        });
        setDoc(doc(db, PRODUCTS_COLLECTION, d.id), healPayload, { merge: true }).catch(() => {});
      }

      const rawCol = data.collectionId || data.categoryId;
      const collectionId = rawCol && String(rawCol).trim() !== '' ? String(rawCol) : null;
      const categoryId = collectionId;

      return {
        id: d.id,
        ...data,
        collectionId,
        categoryId,
        collectionName: data.collectionName || null,
        price: Number(data.price) || 0,
        promoPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        promotionalPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 2,
        images,
        coverImage,
        image: coverImage,
        hasBrokenImages: images.length === 0,
        isActive,
        active: isActive,
        isFeatured,
        featured: isFeatured,
        isArchived: Boolean(data.isArchived),
        archivedAt: data.archivedAt,
        isPopular: Boolean(
          data.isPopular ||
            (data.totalOrders && data.totalOrders > 3) ||
            (data.orderCount && data.orderCount > 3)
        ),
        totalOrders: Number(data.totalOrders ?? data.orderCount ?? 0),
        totalQuantitySold: Number(data.totalQuantitySold ?? 0)
      } as Product;
    });

    // Add any custom local products not yet in Firestore
    if (localById.size > 0) {
      const existingIds = new Set(products.map((p) => p.id));
      for (const lp of localById.values()) {
        if (!existingIds.has(lp.id) && !lp.isArchived) {
          products.unshift(lp);
        }
      }
    }

    // Exclude archived/deleted products from standard catalog
    products = products.filter((p) => !p.isArchived);

    if (onlyActive) {
      products = products.filter((p) => p.isActive && p.active);
    }

    // Sort by featured first, then name
    const sorted = products.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
    console.log('[FIRESTORE] products finished', { count: sorted.length });
    return sorted;
  } catch (error) {
    console.warn('Firestore products fetch notice:', error);
    const fallback = getLocalCustomProducts();
    console.log('[FIRESTORE] products finished (local fallback)', { count: fallback.length });
    return fallback;
  }
}

/**
 * Fetch a single product by its URL-friendly slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      const data = docData.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      const isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : (data.featured !== undefined ? Boolean(data.featured) : false);
      const promo = data.promoPrice !== undefined ? data.promoPrice : (data.promotionalPrice !== undefined ? data.promotionalPrice : null);
      const images = Array.isArray(data.images) ? data.images : [];
      const coverImage = data.coverImage || images[0] || '';
      const collectionId = data.collectionId || data.categoryId || '';

      return {
        id: docData.id,
        ...data,
        collectionId,
        categoryId: collectionId,
        collectionName: data.collectionName || '',
        price: Number(data.price) || 0,
        promoPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        promotionalPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 2,
        images,
        coverImage,
        isActive,
        active: isActive,
        isFeatured,
        featured: isFeatured,
        isPopular: Boolean(data.isPopular),
        totalOrders: Number(data.totalOrders ?? data.orderCount ?? 0),
        totalQuantitySold: Number(data.totalQuantitySold ?? 0)
      } as Product;
    }

    return null;
  } catch (error) {
    console.warn('Error fetching product by slug:', error);
    return null;
  }
}

/**
 * Fetch a single product by its unique document ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      const isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : (data.featured !== undefined ? Boolean(data.featured) : false);
      const promo = data.promoPrice !== undefined ? data.promoPrice : (data.promotionalPrice !== undefined ? data.promotionalPrice : null);
      const images = Array.isArray(data.images) ? data.images : [];
      const coverImage = data.coverImage || images[0] || '';
      const collectionId = data.collectionId || data.categoryId || '';

      return {
        id: snap.id,
        ...data,
        collectionId,
        categoryId: collectionId,
        collectionName: data.collectionName || '',
        price: Number(data.price) || 0,
        promoPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        promotionalPrice: promo !== null && promo !== undefined ? Number(promo) : null,
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 2,
        images,
        coverImage,
        isActive,
        active: isActive,
        isFeatured,
        featured: isFeatured,
        isPopular: Boolean(data.isPopular),
        totalOrders: Number(data.totalOrders ?? data.orderCount ?? 0),
        totalQuantitySold: Number(data.totalQuantitySold ?? 0)
      } as Product;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching product by id:', error);
    return null;
  }
}

/**
 * Create a new product in Firestore according to Master Prompt architectural specifications
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  preferredId?: string
): Promise<string> {
  await ensureAdminAuth();

  const docRef = preferredId
    ? doc(db, PRODUCTS_COLLECTION, preferredId)
    : doc(collection(db, PRODUCTS_COLLECTION));
  const nowIso = new Date().toISOString();

  // Validate mandatory fields
  if (!productData.name || !productData.name.trim()) {
    throw new Error('Le nom du garde-temps est obligatoire.');
  }

  const cleanImages = Array.isArray(productData.images)
    ? productData.images.filter((img) => !isBrokenOrBlobUrl(img))
    : [];

  if (cleanImages.length === 0 && isBrokenOrBlobUrl(productData.coverImage) && isBrokenOrBlobUrl(productData.image)) {
    throw new Error(
      "Aucune URL d'image permanente valide n'a été fournie (les liens blob: temporaires sont interdits)."
    );
  }

  const rawPromo = productData.promoPrice !== undefined ? productData.promoPrice : productData.promotionalPrice;
  const promoPrice = rawPromo !== null && rawPromo !== undefined && Number(rawPromo) > 0 ? Number(rawPromo) : null;
  const collectionId = productData.collectionId || productData.categoryId || null;
  const coverImage =
    (!isBrokenOrBlobUrl(productData.coverImage) ? productData.coverImage : '') ||
    (!isBrokenOrBlobUrl(productData.image) ? productData.image : '') ||
    cleanImages[0] ||
    '';

  const newProduct: any = {
    id: docRef.id,
    name: productData.name.trim(),
    brand: productData.brand ? productData.brand.trim() : 'Maison Horlogère',
    reference: productData.reference ? productData.reference.trim() : '',
    collectionId,
    collectionName: productData.collectionName || null,
    categoryId: collectionId, // Dual-key compatibility
    gender: productData.gender || 'homme',
    description: productData.description ? productData.description.trim() : '',
    shortDescription: productData.shortDescription || productData.description || '',
    price: Math.max(0, Number(productData.price) || 0),
    promoPrice,
    promotionalPrice: promoPrice, // Dual-key compatibility
    currency: 'FCFA',
    stock: Math.max(0, Math.floor(Number(productData.stock) || 0)),
    lowStockThreshold: Math.max(0, Math.floor(Number(productData.lowStockThreshold) || 2)),
    images: cleanImages,
    coverImage,
    productUrl: productData.productUrl || null,
    isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
    active: productData.isActive !== undefined ? Boolean(productData.isActive) : true, // Dual-key compatibility
    isFeatured: Boolean(productData.isFeatured || productData.featured),
    featured: Boolean(productData.isFeatured || productData.featured), // Dual-key compatibility
    isPopular: Boolean(productData.isPopular),
    totalOrders: Number(productData.totalOrders ?? 0),
    totalQuantitySold: Number(productData.totalQuantitySold ?? 0),
    slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    specifications: {
      movement: productData.specifications?.movement?.trim() || 'Automatique Suisse',
      caseDiameter: productData.specifications?.caseDiameter?.trim() || '41 mm',
      caseMaterial: productData.specifications?.caseMaterial?.trim() || 'Acier 316L',
      waterResistance: productData.specifications?.waterResistance?.trim() || '10 ATM',
      glass: productData.specifications?.glass?.trim() || 'Verre Saphir',
      strapMaterial: productData.specifications?.strapMaterial?.trim() || 'Cuir véritable'
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Remove any remaining undefined properties to satisfy Firestore constraints
  Object.keys(newProduct).forEach(key => {
    if (newProduct[key] === undefined) {
      delete newProduct[key];
    }
  });

  // Synchronize immediately to resilient IndexedDB & local store so data is never lost
  if (cleanImages.length > 0) {
    await saveProductImagesToIDB(docRef.id, cleanImages);
  }
  persistLocalProduct(newProduct);

  const firestorePayload = compactProductPayload(newProduct);

  try {
    await Promise.race([
      setDoc(docRef, firestorePayload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Le délai d'écriture Firestore a expiré (timeout 4.5s).")), 4500)
      )
    ]);
    console.log(`[WATCH CREATE] FIRESTORE WRITE SUCCESS for ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.warn(
      '[WATCH CREATE] Firestore write notice (product safely persisted in IndexedDB & local store):',
      error?.code || error?.message || error
    );
    return docRef.id;
  }
}

/**
 * Update existing product attributes
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  await ensureAdminAuth();

  const normalizedUpdates: any = { ...updates };
  if (updates.isActive !== undefined) normalizedUpdates.active = updates.isActive;
  if (updates.active !== undefined) normalizedUpdates.isActive = updates.active;
  if (updates.isFeatured !== undefined) normalizedUpdates.featured = updates.isFeatured;
  if (updates.featured !== undefined) normalizedUpdates.isFeatured = updates.featured;
  if (updates.promoPrice !== undefined) normalizedUpdates.promotionalPrice = updates.promoPrice;
  if (updates.promotionalPrice !== undefined) normalizedUpdates.promoPrice = updates.promotionalPrice;
  if (updates.collectionId !== undefined) normalizedUpdates.categoryId = updates.collectionId;
  if (updates.categoryId !== undefined) normalizedUpdates.collectionId = updates.categoryId;

  if (updates.price !== undefined) normalizedUpdates.price = Number(updates.price);
  if (updates.stock !== undefined) normalizedUpdates.stock = Math.floor(Number(updates.stock));
  if (updates.lowStockThreshold !== undefined)
    normalizedUpdates.lowStockThreshold = Math.floor(Number(updates.lowStockThreshold));

  let cleanImgs: string[] | undefined;
  if (updates.images && Array.isArray(updates.images)) {
    cleanImgs = updates.images.filter((img) => !isBrokenOrBlobUrl(img));
    normalizedUpdates.images = cleanImgs;
    const primaryImg =
      (!isBrokenOrBlobUrl(updates.coverImage) ? updates.coverImage : '') ||
      (!isBrokenOrBlobUrl(updates.image) ? updates.image : '') ||
      cleanImgs[0] ||
      '';
    normalizedUpdates.coverImage = primaryImg;
    normalizedUpdates.image = primaryImg;
  }

  normalizedUpdates.updatedAt = new Date().toISOString();

  // 1. Persist images immediately in IndexedDB & local backup so they never disappear on reload
  if (cleanImgs && cleanImgs.length > 0) {
    await saveProductImagesToIDB(id, cleanImgs);
  }
  const existingLocal = getLocalCustomProducts().find((p) => p.id === id);
  persistLocalProduct({
    ...(existingLocal || {}),
    ...normalizedUpdates,
    id
  } as Product);

  // 2. Build compact Firestore payload (no undefined keys, no 3x duplication of data: URLs)
  const firestoreUpdates: any = { ...normalizedUpdates };
  if (cleanImgs) {
    const primary = cleanImgs[0] || '';
    if (primary.startsWith('data:')) {
      firestoreUpdates.coverImage = '';
      firestoreUpdates.image = '';
    }
  }
  Object.keys(firestoreUpdates).forEach((key) => {
    if (firestoreUpdates[key] === undefined) {
      delete firestoreUpdates[key];
    }
  });

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);

    // Non-blocking check for old Firebase Storage URLs to clean up
    let previousUrls: string[] = [];
    if (cleanImgs) {
      try {
        const oldSnap = await withTimeout(getDoc(docRef), 1500, null, 'old-product-snap');
        if (oldSnap && oldSnap.exists()) {
          const oldData = oldSnap.data();
          previousUrls = [
            ...(Array.isArray(oldData.images) ? oldData.images : []),
            oldData.image,
            oldData.coverImage
          ].filter(Boolean);
        }
      } catch {}
    }

    await Promise.race([
      setDoc(docRef, firestoreUpdates, { merge: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Le délai d'écriture Firestore a expiré (timeout 4.5s).")), 4500)
      )
    ]);

    if (previousUrls.length > 0 && cleanImgs) {
      cleanupReplacedProductImages(previousUrls, cleanImgs).catch(() => {});
    }
  } catch (error: any) {
    console.warn(
      '[ADMIN NOTICE] products.update Firestore write deferred (images safely persisted in IndexedDB):',
      error?.code || error?.message || error
    );
  }
}

/**
 * Delete or safely archive a product from Firestore.
 * Preserves historical orders: If orders reference this product, marks as isArchived: true
 * instead of breaking historical customer receipts.
 * Otherwise, permanently removes the document via deleteDoc().
 */
export async function deleteProduct(id: string): Promise<{ archived: boolean }> {
  await ensureAdminAuth();
  const path = `${PRODUCTS_COLLECTION}/${id}`;

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);

    // 1. Check if the product is referenced in historical customer orders
    let isReferencedInOrders = false;
    try {
      const ordersRef = collection(db, 'orders');
      const ordersSnap = await getDocs(ordersRef);
      if (!ordersSnap.empty) {
        isReferencedInOrders = ordersSnap.docs.some(d => {
          const items = d.data()?.items;
          return Array.isArray(items) && items.some((it: any) => it?.productId === id);
        });
      }
    } catch (orderCheckErr) {
      console.warn('Could not inspect orders prior to product delete, will proceed with direct delete:', orderCheckErr);
    }

    if (isReferencedInOrders) {
      // Archive to preserve historical order invoice details
      await updateDoc(docRef, {
        active: false,
        isActive: false,
        isArchived: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('[SUPPRESSION PRODUIT]', {
        id,
        collection: PRODUCTS_COLLECTION,
        statut: 'ARCHIVÉ (Garde-temps référencé dans l\'historique des commandes)',
      });

      return { archived: true };
    } else {
      // Permanent deletion from Firestore
      await deleteDoc(docRef);
      removeLocalProduct(id);

      console.log('[SUPPRESSION PRODUIT]', {
        id,
        collection: PRODUCTS_COLLECTION,
        statut: 'SUCCÈS (Supprimé définitivement de Firestore)',
      });

      return { archived: false };
    }
  } catch (error: any) {
    console.error('[SUPPRESSION PRODUIT]', {
      id,
      collection: PRODUCTS_COLLECTION,
      statut: 'ÉCHEC',
      erreur: error?.message || String(error)
    });
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update stock level directly (used by admin stock controller)
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  await ensureAdminAuth();
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      stock: Math.max(0, Math.floor(newStock)),
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\nproducts.updateStock\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Atomic stock deduction within a Firestore transaction.
 * Guarantees that multiple concurrent buyers cannot cause negative stock.
 */
export async function decrementStock(productId: string, quantityToDeduct: number): Promise<boolean> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(productRef);
      if (!sfDoc.exists()) {
        throw new Error(`Produit #${productId} introuvable`);
      }
      const currentStock = sfDoc.data().stock ?? 0;
      const currentOrderCount = sfDoc.data().totalOrders ?? sfDoc.data().orderCount ?? 0;
      const currentSold = sfDoc.data().totalQuantitySold ?? 0;
      const newStock = Math.max(0, currentStock - quantityToDeduct);

      transaction.update(productRef, {
        stock: newStock,
        totalOrders: currentOrderCount + 1,
        orderCount: currentOrderCount + 1,
        totalQuantitySold: currentSold + quantityToDeduct,
        updatedAt: new Date().toISOString()
      });
    });
    return true;
  } catch (e) {
    console.error("Stock decrement transaction failed:", e);
    return false;
  }
}

/**
 * Decrement orderCount when an order is cancelled
 */
export async function decrementProductOrderCount(productId: string, quantityToRestore: number): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(productRef);
      if (sfDoc.exists()) {
        const currentOrderCount = sfDoc.data().totalOrders ?? sfDoc.data().orderCount ?? 0;
        const currentSold = sfDoc.data().totalQuantitySold ?? 0;
        const newCount = Math.max(0, currentOrderCount - 1);
        const newSold = Math.max(0, currentSold - quantityToRestore);

        transaction.update(productRef, {
          totalOrders: newCount,
          orderCount: newCount,
          totalQuantitySold: newSold,
          updatedAt: new Date().toISOString()
        });
      }
    });
  } catch (e) {
    console.warn("Order count decrement notice:", e);
  }
}


