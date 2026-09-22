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
import { withTimeout } from '../utils/async';

const PRODUCTS_COLLECTION = 'products';
const LOCAL_CUSTOM_PRODUCTS_KEY = 'hp_custom_products';

export function getLocalCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistLocalProduct(product: Product): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalCustomProducts();
    const filtered = existing.filter(p => p.id !== product.id);
    localStorage.setItem(LOCAL_CUSTOM_PRODUCTS_KEY, JSON.stringify([product, ...filtered]));
  } catch {}
}

export function removeLocalProduct(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalCustomProducts();
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_CUSTOM_PRODUCTS_KEY, JSON.stringify(filtered));
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
    
    let snapshot = await withTimeout(getDocs(q), 3500, null, 'firestore-products');
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
    
    if (!snapshot || snapshot.empty) {
      console.log('[FIRESTORE] products finished', { count: 0 });
      return getLocalCustomProducts();
    }

    let products = snapshot.docs.map(d => {
      const data = d.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      const isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : (data.featured !== undefined ? Boolean(data.featured) : false);
      const promo = data.promoPrice !== undefined ? data.promoPrice : (data.promotionalPrice !== undefined ? data.promotionalPrice : null);
      const images = Array.isArray(data.images) ? data.images : [];
      const coverImage = data.coverImage || images[0] || '';
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
        isActive,
        active: isActive,
        isFeatured,
        featured: isFeatured,
        isArchived: Boolean(data.isArchived),
        archivedAt: data.archivedAt,
        isPopular: Boolean(data.isPopular || (data.totalOrders && data.totalOrders > 3) || (data.orderCount && data.orderCount > 3)),
        totalOrders: Number(data.totalOrders ?? data.orderCount ?? 0),
        totalQuantitySold: Number(data.totalQuantitySold ?? 0)
      } as Product;
    });

    // Merge any custom local products
    const localProds = getLocalCustomProducts();
    if (localProds.length > 0) {
      const existingIds = new Set(products.map(p => p.id));
      for (const lp of localProds) {
        if (!existingIds.has(lp.id) && !lp.isArchived) {
          products.unshift(lp);
        }
      }
    }

    // Exclude archived/deleted products from standard catalog
    products = products.filter(p => !p.isArchived);

    if (onlyActive) {
      products = products.filter(p => p.isActive && p.active);
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
    console.log('[FIRESTORE] products finished (local fallback)', { count: getLocalCustomProducts().length });
    return getLocalCustomProducts();
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
    ? productData.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : [];

  const rawPromo = productData.promoPrice !== undefined ? productData.promoPrice : productData.promotionalPrice;
  const promoPrice = rawPromo !== null && rawPromo !== undefined && Number(rawPromo) > 0 ? Number(rawPromo) : null;
  const collectionId = productData.collectionId || productData.categoryId || null;
  const coverImage = productData.coverImage || cleanImages[0] || '';

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

  // Synchronize immediately to resilient local store so data is never lost
  persistLocalProduct(newProduct);

  try {
    await Promise.race([
      setDoc(docRef, newProduct),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Le délai d\'écriture Firestore a expiré (timeout 10s).')), 10000)
      )
    ]);
    console.log(`[WATCH CREATE] FIRESTORE WRITE SUCCESS for ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error(
      '[WATCH CREATE] ERROR\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${docRef.id}`);
  }
}

/**
 * Update existing product attributes
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  await ensureAdminAuth();
  const path = `${PRODUCTS_COLLECTION}/${id}`;

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
  if (updates.lowStockThreshold !== undefined) normalizedUpdates.lowStockThreshold = Math.floor(Number(updates.lowStockThreshold));

  if (updates.images && Array.isArray(updates.images)) {
    const cleanImgs = updates.images.filter(Boolean);
    normalizedUpdates.images = cleanImgs;
    if (!updates.coverImage && cleanImgs.length > 0) {
      normalizedUpdates.coverImage = cleanImgs[0];
    }
  }

  normalizedUpdates.updatedAt = new Date().toISOString();

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, normalizedUpdates);
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\nproducts.update\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.UPDATE, path);
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


