import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Upload, Loader2,
  Eye, Star, ZoomIn, ChevronLeft, ChevronRight, Link as LinkIcon, CheckCircle2
} from 'lucide-react';
import { collection, doc } from 'firebase/firestore';
import { db, activeFirebaseConfig } from '../../lib/firebase';
import { Product, Category, Gender, StoreSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { uploadProductImage } from '../../services/storageService';

export interface ProductModalImage {
  id: string;
  previewUrl: string;
  file?: File;
  isNew: boolean;
}

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  settings: StoreSettings;
  onSave: (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string,
    targetDocId?: string
  ) => Promise<void>;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  settings,
  onSave
}) => {
  const availableCategories = categories || [];

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    reference: '',
    categoryId: '',
    gender: 'homme' as Gender,
    price: 0,
    promotionalPrice: '' as string | number,
    currency: settings?.currency || '€',
    stock: 1,
    lowStockThreshold: settings?.defaultLowStockThreshold || 2,
    shortDescription: '',
    description: '',
    featured: false,
    active: true,
    specifications: {
      movement: '',
      caseDiameter: '',
      caseMaterial: '',
      waterResistance: '',
      glass: '',
      strapMaterial: ''
    }
  });

  const [imageItems, setImageItems] = useState<ProductModalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultCatId = (categories && categories.length > 0 ? categories[0]?.id : '') || '';

    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        brand: product.brand || '',
        reference: product.reference || '',
        categoryId: product.categoryId || defaultCatId,
        gender: product.gender || 'homme',
        price: product.price || 0,
        promotionalPrice: product.promotionalPrice ?? '',
        currency: product.currency || settings.currency || '€',
        stock: product.stock ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 2,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        featured: product.featured ?? false,
        active: product.active ?? true,
        specifications: {
          movement: product.specifications?.movement || '',
          caseDiameter: product.specifications?.caseDiameter || '',
          caseMaterial: product.specifications?.caseMaterial || '',
          waterResistance: product.specifications?.waterResistance || '',
          glass: product.specifications?.glass || '',
          strapMaterial: product.specifications?.strapMaterial || ''
        }
      });

      if (product.images && product.images.length > 0) {
        setImageItems(
          product.images.filter(Boolean).map((url, i) => ({
            id: `existing_${i}_${url.slice(-10)}`,
            previewUrl: url,
            isNew: false
          }))
        );
      } else {
        setImageItems([]);
      }
    } else {
      setFormData({
        name: '',
        slug: '',
        brand: '',
        reference: '',
        categoryId: defaultCatId,
        gender: 'homme',
        price: 950,
        promotionalPrice: '',
        currency: settings?.currency || '€',
        stock: 5,
        lowStockThreshold: settings?.defaultLowStockThreshold || 2,
        shortDescription: '',
        description: '',
        featured: false,
        active: true,
        specifications: {
          movement: 'Automatique Suisse',
          caseDiameter: '41 mm',
          caseMaterial: 'Acier 316L',
          waterResistance: '10 ATM',
          glass: 'Verre Saphir',
          strapMaterial: 'Cuir véritable'
        }
      });
      setImageItems([]);
    }
  }, [product, categories, settings, isOpen]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    if (!product) {
      setFormData(prev => ({
        ...prev,
        name,
        slug: generateSlug(name)
      }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setError(null);

    const fileList = Array.from(files);
    const newItems: ProductModalImage[] = fileList.map((file, idx) => ({
      id: `new_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      previewUrl: URL.createObjectURL(file),
      file,
      isNew: true
    }));

    setImageItems((prev) => [...prev, ...newItems]);
    setUploadNotice(`${newItems.length} photo(s) sélectionnée(s). Téléversement Storage lors de la validation.`);
    setTimeout(() => setUploadNotice(null), 3500);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;
    setImageItems((prev) => [
      ...prev,
      {
        id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: trimmed,
        isNew: false
      }
    ]);
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (index: number) => {
    setImageItems((prev) => {
      const item = prev[index];
      if (item?.isNew && item.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      }
      return prev.filter((_, i) => i !== index);
    });
    if (previewImageIndex === index) {
      setPreviewImageIndex(null);
    } else if (previewImageIndex !== null && previewImageIndex > index) {
      setPreviewImageIndex(previewImageIndex - 1);
    }
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setImageItems((prev) => {
      const updated = [...prev];
      const selected = updated.splice(index, 1)[0];
      updated.unshift(selected);
      return updated;
    });
    if (previewImageIndex !== null) {
      setPreviewImageIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      console.log('[WATCH_CREATE] START');

      // 1. Validation
      if (!formData.name.trim()) {
        setError('Le nom de la montre est obligatoire.');
        return;
      }
      const priceNum = Number(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Le prix public doit être supérieur à 0.');
        return;
      }

      const promoNum = formData.promotionalPrice !== '' && formData.promotionalPrice !== null && Number(formData.promotionalPrice) > 0
        ? Number(formData.promotionalPrice)
        : null;

      if (promoNum !== null && promoNum >= priceNum) {
        setError('Le prix promotionnel doit être strictement inférieur au prix standard.');
        return;
      }

      const stockNum = Math.max(0, Math.floor(Number(formData.stock) || 0));
      const lowStockThresholdNum = Math.max(0, Math.floor(Number(formData.lowStockThreshold) || 2));

      const chosenCategoryId = formData.categoryId || (availableCategories.length > 0 ? availableCategories[0]?.id : '');
      if (availableCategories.length > 0 && !chosenCategoryId) {
        setError('Veuillez sélectionner une collection.');
        return;
      }

      console.log('[WATCH_CREATE] FORM VALIDATED');

      // 2. Target Firestore document ID
      const targetDocId = product?.id || doc(collection(db, 'products')).id;

      // 3. Upload images if needed
      console.log('[WATCH_CREATE] IMAGE UPLOAD START');
      const finalImages: string[] = [];

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        if (item.isNew && item.file) {
          try {
            const downloadUrl = await uploadProductImage(item.file, targetDocId, i);
            finalImages.push(downloadUrl);
          } catch (uploadErr: any) {
            console.error('[WATCH_CREATE] ERROR\ncode:', uploadErr?.code || 'storage-error', '\nmessage:', uploadErr?.message);
            throw new Error(`Échec du téléversement de l'image "${item.file.name}" sur Firebase Storage : ${uploadErr?.message || uploadErr?.code || 'Erreur Storage'}`);
          }
        } else if (item.previewUrl && !item.previewUrl.startsWith('blob:')) {
          finalImages.push(item.previewUrl);
        }
      }

      console.log('[WATCH_CREATE] IMAGE UPLOAD SUCCESS');

      // 4. Construction du document
      console.log('[WATCH_CREATE] FIRESTORE WRITE START');
      const descText = formData.shortDescription.trim() || formData.description.trim() || '';
      const chosenCollection = availableCategories.find(c => c.id === chosenCategoryId);
      const collectionName = chosenCollection ? chosenCollection.name : (chosenCategoryId ? '' : 'Générale');

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        brand: formData.brand.trim() || 'Maison Horlogère',
        reference: formData.reference ? formData.reference.trim() : '',
        collectionId: chosenCategoryId || null,
        collectionName,
        categoryId: chosenCategoryId || null, // Dual-key compatibility
        gender: formData.gender,
        price: priceNum,
        promoPrice: promoNum,
        promotionalPrice: promoNum, // Dual-key compatibility
        currency: formData.currency,
        stock: stockNum,
        lowStockThreshold: lowStockThresholdNum,
        shortDescription: descText,
        description: descText,
        images: finalImages,
        coverImage: finalImages[0] || '',
        productUrl: null,
        isActive: formData.active,
        active: formData.active, // Dual-key compatibility
        isFeatured: formData.featured,
        featured: formData.featured, // Dual-key compatibility
        isPopular: product?.isPopular || false,
        totalOrders: product?.totalOrders || 0,
        totalQuantitySold: product?.totalQuantitySold || 0,
        specifications: {
          movement: formData.specifications.movement.trim() || 'Automatique Suisse',
          caseDiameter: formData.specifications.caseDiameter.trim() || '41 mm',
          caseMaterial: formData.specifications.caseMaterial.trim() || 'Acier 316L',
          waterResistance: formData.specifications.waterResistance.trim() || '10 ATM',
          glass: formData.specifications.glass.trim() || 'Verre Saphir',
          strapMaterial: formData.specifications.strapMaterial.trim() || 'Cuir véritable'
        }
      };

      // 5. Écriture Firestore & Confirmation
      await onSave(payload, product?.id, targetDocId);

      console.log('[WATCH_CREATE] FIRESTORE WRITE SUCCESS');
      console.log('[WATCH_CREATE] COMPLETE');

      onClose();
    } catch (err: any) {
      console.error(
        '[WATCH_CREATE] ERROR\ncode:',
        err?.code || 'unknown',
        '\nmessage:',
        err?.message || String(err)
      );
      let userMessage = err?.message || 'Erreur lors de l\'enregistrement de la montre.';
      try {
        if (userMessage.startsWith('{') && userMessage.endsWith('}')) {
          const parsed = JSON.parse(userMessage);
          if (parsed.error) userMessage = parsed.error;
        }
      } catch {}

      if (userMessage.includes('permission') || userMessage.includes('Missing or insufficient permissions')) {
        userMessage = 'Permission Firestore refusée : un compte administrateur est requis pour créer un produit.';
      } else if (userMessage.includes('not-found') || userMessage.includes('does not exist')) {
        userMessage = `La base Firestore "(default)" n'existe pas sur le projet "${activeFirebaseConfig.projectId}". Veuillez vérifier le projet Firebase.`;
      }
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? `Modifier la montre : ${product.name}` : 'Ajouter une nouvelle montre'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic identification */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text)] font-semibold mb-1">
              Nom de la montre <span className="text-[var(--or)]">*</span>
            </label>
            <input
              type="text"
              required
              id="admin-product-name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Chronographe Royal Ébène"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Marque / Maison
              </label>
              <input
                type="text"
                id="admin-product-brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ex: Vanguard Genève"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text)] font-semibold mb-1">
                Collection / Catégorie <span className="text-[var(--or)]">*</span>
              </label>
              <select
                id="admin-product-category"
                required={availableCategories.length > 0}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none shadow-xs cursor-pointer"
              >
                {availableCategories.length === 0 ? (
                  <option value="">-- Aucune collection enregistrée (Générale) --</option>
                ) : (
                  <>
                    <option value="">Sélectionner une collection</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Genre
              </label>
              <select
                id="admin-product-gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="mixte">Mixte / Unisexe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stocks */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)]">
          <div>
            <label className="block text-xs text-[var(--text)] font-semibold mb-1">
              Prix ({formData.currency}) <span className="text-[var(--or)]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              id="admin-product-price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none font-mono font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text)] font-medium mb-1">
              Prix Promo ({formData.currency})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              id="admin-product-promo-price"
              value={formData.promotionalPrice}
              onChange={(e) => setFormData({ ...formData, promotionalPrice: e.target.value })}
              placeholder="Facultatif"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none font-mono shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text)] font-semibold mb-1">
              Stock numérique <span className="text-[var(--or)]">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              id="admin-product-stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none font-mono shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text)] font-medium mb-1">
              Seuil Stock Faible
            </label>
            <input
              type="number"
              min="1"
              id="admin-product-low-stock"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none font-mono shadow-xs"
            />
          </div>
        </div>

        {/* Photos & Image Uploader */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="block text-xs text-[var(--text)] font-semibold">
                Galerie Photos de la montre <span className="text-[var(--or)]">*</span>
              </label>
              <p className="text-[11px] text-[var(--text-soft)]">
                La première photo sera la couverture principale affichée sur la boutique.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-[var(--text-soft)] hover:text-[var(--text)] flex items-center gap-1 font-medium px-2.5 py-1.5 bg-[var(--carte-bg)] hover:bg-[var(--carte-bg-subtle)] rounded-lg border border-[var(--sep)] transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{showUrlInput ? 'Masquer URL' : '+ Lien URL'}</span>
              </button>
            </div>
          </div>

          {/* Optional URL input box */}
          {showUrlInput && (
            <div className="flex items-center gap-2 p-3 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)]">
              <input
                type="url"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrlImage();
                  }
                }}
                placeholder="Coller un lien URL d'image (ex: https://images.unsplash.com/...)"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                disabled={!urlInputValue.trim()}
                className="px-3 py-2 bg-[var(--or)] text-black font-semibold text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
              >
                Ajouter
              </button>
            </div>
          )}

          {/* Hidden native input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[var(--or)] bg-[var(--or)]/10 scale-[0.99]'
                : 'border-[var(--sep)] hover:border-[var(--or)]/60 bg-[var(--carte-bg-subtle)]/40 hover:bg-[var(--carte-bg-subtle)]'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--or)]/10 flex items-center justify-center text-[var(--or)]">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--text)]">
                  Cliquez pour importer des photos ou glissez-déposez ici
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Formats acceptés : JPG, PNG, WEBP, GIF. Import multiple supporté.
                </p>
              </div>
            </div>
          </div>

          {/* Upload notice message */}
          {uploadNotice && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* Interactive Photo Gallery with Previews */}
          {imageItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-soft)]">
                <span>
                  {imageItems.length} photo{imageItems.length > 1 ? 's' : ''} dans la galerie (cliquez pour prévisualiser en grand)
                </span>
                <span className="text-[var(--text-muted)]">
                  ⭐ Première = Couverture
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageItems.map((item, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 aspect-square bg-black/5 dark:bg-black/30 ${
                        isMain
                          ? 'border-[var(--or)] ring-2 ring-[var(--or)]/30 shadow-md'
                          : 'border-[var(--sep)] hover:border-[var(--or)]/50'
                      }`}
                    >
                      {/* Watch Image */}
                      <img
                        src={item.previewUrl}
                        alt={`Photo montre ${idx + 1}`}
                        onClick={() => setPreviewImageIndex(idx)}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Main Cover Badge */}
                      {isMain && (
                        <div className="absolute top-1.5 left-1.5 bg-black/85 text-[var(--or)] px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-sm pointer-events-none backdrop-blur-xs">
                          <Star className="w-2.5 h-2.5 fill-[var(--or)]" />
                          <span>Principale</span>
                        </div>
                      )}

                      {/* Hover / Overlay Action Bar */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none">
                        <div className="flex justify-end gap-1 pointer-events-auto">
                          {/* Zoom / Preview Button */}
                          <button
                            type="button"
                            title="Aperçu grand format"
                            onClick={() => setPreviewImageIndex(idx)}
                            className="p-1.5 bg-black/75 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Supprimer la photo"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Set as main photo button */}
                        {!isMain && (
                          <div className="pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              className="w-full py-1 px-2 bg-black/80 hover:bg-[var(--or)] text-white hover:text-black text-[10px] font-medium rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Star className="w-2.5 h-2.5" />
                              <span>Définir principale</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Description de la montre */}
        <div>
          <label className="block text-xs text-[var(--text)] font-semibold mb-1">
            Description de la montre <span className="text-[var(--text-soft)] font-normal text-[11px]">(accroche & finitions)</span>
          </label>
          <textarea
            rows={2}
            id="admin-product-short-desc"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value, description: e.target.value })}
            placeholder="Ex: Chronographe automatique en acier brossé avec cadran noir soleillé et bracelet en cuir véritable."
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none resize-none shadow-xs"
          />
        </div>

        {/* Specifications Table */}
        <div className="p-4 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)] space-y-3">
          <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[var(--or)]">
            Spécifications Horlogères (Fiche technique)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Mouvement</label>
              <input
                type="text"
                value={formData.specifications.movement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, movement: e.target.value }
                  })
                }
                placeholder="Ex: Automatique Suisse 28 800 alt/h"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Diamètre du boîtier</label>
              <input
                type="text"
                value={formData.specifications.caseDiameter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, caseDiameter: e.target.value }
                  })
                }
                placeholder="Ex: 41 mm"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Matière du boîtier</label>
              <input
                type="text"
                value={formData.specifications.caseMaterial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, caseMaterial: e.target.value }
                  })
                }
                placeholder="Ex: Acier inoxydable 316L"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Étanchéité</label>
              <input
                type="text"
                value={formData.specifications.waterResistance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, waterResistance: e.target.value }
                  })
                }
                placeholder="Ex: 10 ATM (100m)"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Verre</label>
              <input
                type="text"
                value={formData.specifications.glass}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, glass: e.target.value }
                  })
                }
                placeholder="Ex: Verre Saphir inrayable"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-soft)] mb-0.5">Bracelet</label>
              <input
                type="text"
                value={formData.specifications.strapMaterial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, strapMaterial: e.target.value }
                  })
                }
                placeholder="Ex: Cuir véritable / Acier"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--or)] focus:outline-none shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Toggles: Active & Featured */}
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text)]">
            <input
              type="checkbox"
              id="admin-product-active-toggle"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-[var(--input-bg)] border-[var(--sep)] focus:ring-0 accent-amber-500"
            />
            <span>Produit Actif (Visible sur la boutique publique)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--or)]">
            <input
              type="checkbox"
              id="admin-product-featured-toggle"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-[var(--input-bg)] border-[var(--sep)] focus:ring-0 accent-amber-500"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--or)]" />
              <span>Pièce Vedette (Mise en avant sur l'accueil)</span>
            </span>
          </label>
        </div>

        {/* Error notification right above buttons so it is immediately visible without scrolling */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Impossible d'enregistrer la montre</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Actions & Firebase Project Diagnostics */}
        <div className="pt-4 border-t border-[var(--sep)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>[Firebase] projectId = <strong className="text-[var(--text)]">{activeFirebaseConfig.projectId}</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="md"
              loading={loading}
              id="admin-product-save-btn"
            >
              {product ? 'Enregistrer les modifications' : 'Créer la montre'}
            </Button>
          </div>
        </div>
      </form>

      {/* Fullscreen HD Preview Lightbox */}
      {previewImageIndex !== null && imageItems[previewImageIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
          onClick={() => setPreviewImageIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--or)]">
                Aperçu HD de la montre
              </span>
              <span className="text-xs text-white/60">
                Photo {previewImageIndex + 1} sur {imageItems.length}
              </span>
              {previewImageIndex === 0 && (
                <span className="bg-[var(--or)] text-black font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-black" />
                  Couverture principale
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewImageIndex(null)}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Image with navigation arrows */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev arrow */}
            {imageItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewImageIndex(
                    (prev) => (prev! - 1 + imageItems.length) % imageItems.length
                  )
                }
                className="absolute left-2 sm:left-4 z-10 p-3 bg-black/60 hover:bg-black text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
                title="Photo précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main high-res picture */}
            <img
              src={imageItems[previewImageIndex]?.previewUrl}
              alt={`Aperçu grand format ${previewImageIndex + 1}`}
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {/* Next arrow */}
            {imageItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewImageIndex(
                    (prev) => (prev! + 1) % imageItems.length
                  )
                }
                className="absolute right-2 sm:right-4 z-10 p-3 bg-black/60 hover:bg-black text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
                title="Photo suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Controls */}
          <div
            className="w-full max-w-md flex items-center justify-center gap-3 py-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {previewImageIndex !== 0 && (
              <button
                type="button"
                onClick={() => handleSetMainImage(previewImageIndex)}
                className="px-4 py-2 bg-[var(--or)] text-black font-semibold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-black" />
                <span>Définir comme couverture</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRemoveImage(previewImageIndex)}
              className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer cette photo</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
