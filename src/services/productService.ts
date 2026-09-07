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

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch all products, with optional filtering for public active ones
 */
export async function getProducts(onlyActive = true): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = onlyActive ? query(colRef, where('active', '==', true)) : colRef;
    
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (permError) {
      if (onlyActive) {
        // Try fallback query with isActive if active was not indexed or differs
        try {
          const activeQ = query(colRef, where('isActive', '==', true));
          snapshot = await getDocs(activeQ);
        } catch {
          throw permError;
        }
      } else {
        // If full access query fails because user is not yet logged in as admin, fallback to active
        const activeQ = query(colRef, where('active', '==', true));
        snapshot = await getDocs(activeQ);
      }
    }
    
    if (snapshot.empty) {
      return [];
    }

    let products = snapshot.docs.map(d => {
      const data = d.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      const isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : (data.featured !== undefined ? Boolean(data.featured) : false);
      const promo = data.promoPrice !== undefined ? data.promoPrice : (data.promotionalPrice !== undefined ? data.promotionalPrice : null);
      const images = Array.isArray(data.images) ? data.images : [];
      const coverImage = data.coverImage || images[0] || '';
      const collectionId = data.collectionId || data.categoryId || '';
      const categoryId = collectionId;

      return {
        id: d.id,
        ...data,
        collectionId,
        categoryId,
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
        isPopular: Boolean(data.isPopular || (data.totalOrders && data.totalOrders > 3) || (data.orderCount && data.orderCount > 3)),
        totalOrders: Number(data.totalOrders ?? data.orderCount ?? 0),
        totalQuantitySold: Number(data.totalQuantitySold ?? 0)
      } as Product;
    });

    if (onlyActive) {
      products = products.filter(p => p.isActive && p.active);
    }
    
    // Sort by featured first, then name
    return products.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.warn('Firestore products fetch error:', error);
    return [];
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
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await ensureAdminAuth();

  const docRef = doc(collection(db, PRODUCTS_COLLECTION));
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
  const collectionId = productData.collectionId || productData.categoryId || 'classiques';
  const coverImage = productData.coverImage || cleanImages[0] || '';

  const newProduct: Product = {
    ...productData,
    id: docRef.id,
    name: productData.name.trim(),
    brand: productData.brand ? productData.brand.trim() : 'Maison Horlogère',
    collectionId,
    collectionName: productData.collectionName || '',
    categoryId: collectionId, // Dual-key compatibility
    gender: productData.gender || 'unisex',
    description: productData.description ? productData.description.trim() : '',
    shortDescription: productData.shortDescription || productData.description || '',
    price: Math.max(0, Number(productData.price) || 0),
    promoPrice,
    promotionalPrice: promoPrice, // Dual-key compatibility
    currency: productData.currency || 'FCFA',
    stock: Math.max(0, Math.floor(Number(productData.stock) || 0)),
    lowStockThreshold: Math.max(0, Math.floor(Number(productData.lowStockThreshold) || 2)),
    images: cleanImages,
    coverImage,
    isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
    active: productData.isActive !== undefined ? Boolean(productData.isActive) : true, // Dual-key compatibility
    isFeatured: Boolean(productData.isFeatured || productData.featured),
    featured: Boolean(productData.isFeatured || productData.featured), // Dual-key compatibility
    isPopular: Boolean(productData.isPopular),
    totalOrders: Number(productData.totalOrders ?? 0),
    totalQuantitySold: Number(productData.totalQuantitySold ?? 0),
    slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(docRef, newProduct);
    return docRef.id;
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\nproducts.create\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error),
      '\ndetails:',
      error
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
 * Delete a product from Firestore
 */
export async function deleteProduct(id: string): Promise<void> {
  await ensureAdminAuth();
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\nproducts.delete\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
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


