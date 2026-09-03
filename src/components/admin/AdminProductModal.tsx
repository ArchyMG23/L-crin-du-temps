import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Upload, Loader2,
  Eye, Star, ZoomIn, ChevronLeft, ChevronRight, Link as LinkIcon, CheckCircle2
} from 'lucide-react';
import { Product, Category, Gender, StoreSettings } from '../../types';
import { DEFAULT_CATEGORIES } from '../../data/defaultData';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { uploadImageFile, compressImageToDataUrl } from '../../services/storageService';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  settings: StoreSettings;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  settings,
  onSave
}) => {
  const availableCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    reference: '',
    categoryId: '',
    gender: 'homme' as Gender,
    price: 0,
    promotionalPrice: '' as string | number,
    currency: settings.currency || '€',
    stock: 1,
    lowStockThreshold: settings.defaultLowStockThreshold || 2,
    shortDescription: '',
    description: '',
    featured: false,
    active: true,
    images: [] as string[],
    specifications: {
      movement: '',
      caseDiameter: '',
      caseMaterial: '',
      waterResistance: '',
      glass: '',
      strapMaterial: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultCatId = (categories && categories.length > 0 ? categories[0]?.id : DEFAULT_CATEGORIES[0]?.id) || '';

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
        images: product.images && product.images.length > 0 ? product.images : [],
        specifications: {
          movement: product.specifications?.movement || '',
          caseDiameter: product.specifications?.caseDiameter || '',
          caseMaterial: product.specifications?.caseMaterial || '',
          waterResistance: product.specifications?.waterResistance || '',
          glass: product.specifications?.glass || '',
          strapMaterial: product.specifications?.strapMaterial || ''
        }
      });
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
        currency: settings.currency || '€',
        stock: 5,
        lowStockThreshold: settings.defaultLowStockThreshold || 2,
        shortDescription: '',
        description: '',
        featured: false,
        active: true,
        images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1000'],
        specifications: {
          movement: 'Automatique Suisse',
          caseDiameter: '41 mm',
          caseMaterial: 'Acier 316L',
          waterResistance: '10 ATM',
          glass: 'Verre Saphir',
          strapMaterial: 'Cuir véritable'
        }
      });
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

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      setError(null);
      setUploadNotice("Prévisualisation instantanée et optimisation...");

      const fileList = Array.from(files);
      // Instant high-res compressed local previews (0ms perceptible lag)
      const previewUrls = await Promise.all(
        fileList.map((f) => compressImageToDataUrl(f, 1280, 0.85))
      );
      const validPreviews = previewUrls.filter(Boolean);

      if (validPreviews.length === 0) {
        setError("Impossible de charger les photos sélectionnées.");
        return;
      }

      // Add to gallery immediately so user sees the preview immediately
      setFormData((prev) => {
        const existingClean = prev.images.filter((img) => img && img.trim().length > 0);
        return {
          ...prev,
          images: [...existingClean, ...validPreviews]
        };
      });

      setUploadNotice(`${validPreviews.length} photo(s) ajoutée(s) avec succès !`);
      setTimeout(() => setUploadNotice(null), 3000);

      // In background, upload to Firebase Storage if available (non-blocking)
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const localPreview = validPreviews[i];
        if (!file || !localPreview) continue;

        try {
          const storageUrl = await uploadImageFile(file, 'products');
          if (storageUrl && storageUrl !== localPreview) {
            setFormData((prev) => ({
              ...prev,
              images: prev.images.map((img) => (img === localPreview ? storageUrl : img))
            }));
          }
        } catch {
          // Optimized local data URL is already safely preserved
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError("Erreur lors de l'importation de l'image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images.filter(Boolean), trimmed]
    }));
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: updated };
    });
    if (previewImageIndex === index) {
      setPreviewImageIndex(null);
    } else if (previewImageIndex !== null && previewImageIndex > index) {
      setPreviewImageIndex(previewImageIndex - 1);
    }
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const updated = [...prev.images];
      const selected = updated.splice(index, 1)[0];
      updated.unshift(selected);
      return { ...prev, images: updated };
    });
    if (previewImageIndex !== null) {
      setPreviewImageIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Le nom de la montre est obligatoire.');
      return;
    }
    if (Number(formData.price) <= 0 || isNaN(Number(formData.price))) {
      setError('Le prix public doit être supérieur à 0.');
      return;
    }

    const promoNum = formData.promotionalPrice !== '' && Number(formData.promotionalPrice) > 0
      ? Number(formData.promotionalPrice)
      : null;

    if (promoNum !== null && promoNum >= Number(formData.price)) {
      setError('Le prix promotionnel doit être strictement inférieur au prix standard.');
      return;
    }

    if (Number(formData.stock) < 0 || isNaN(Number(formData.stock)) || !Number.isInteger(Number(formData.stock))) {
      setError('Le stock doit être un nombre entier positif ou nul (ex: 0, 1, 2...).');
      return;
    }

    const chosenCategoryId = formData.categoryId || availableCategories[0]?.id || '';
    if (!chosenCategoryId) {
      setError('Veuillez sélectionner une collection.');
      return;
    }

    const cleanImages = formData.images.map(img => img.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      cleanImages.push('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000');
    }

    try {
      setLoading(true);

      const descText = formData.shortDescription.trim() || formData.description.trim() || '';

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        brand: formData.brand.trim() || 'Maison Horlogère',
        reference: formData.reference ? formData.reference.trim() : '',
        categoryId: chosenCategoryId,
        gender: formData.gender,
        price: Number(formData.price),
        promotionalPrice: promoNum,
        currency: formData.currency,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        shortDescription: descText,
        description: descText,
        featured: formData.featured,
        active: formData.active,
        images: cleanImages,
        specifications: {
          movement: formData.specifications.movement.trim(),
          caseDiameter: formData.specifications.caseDiameter.trim(),
          caseMaterial: formData.specifications.caseMaterial.trim(),
          waterResistance: formData.specifications.waterResistance.trim(),
          glass: formData.specifications.glass.trim(),
          strapMaterial: formData.specifications.strapMaterial.trim()
        }
      };

      await onSave(payload, product?.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erreur lors de l\'enregistrement de la montre.');
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
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="">Sélectionner une collection</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--text)]">
                  {uploadingImage
                    ? 'Chargement et optimisation des photos...'
                    : 'Cliquez pour importer des photos ou glissez-déposez ici'}
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
          {formData.images.filter(Boolean).length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-soft)]">
                <span>
                  {formData.images.filter(Boolean).length} photo{formData.images.filter(Boolean).length > 1 ? 's' : ''} dans la galerie (cliquez pour prévisualiser en grand)
                </span>
                <span className="text-[var(--text-muted)]">
                  ⭐ Première = Couverture
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.images.filter(Boolean).map((imgUrl, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div
                      key={`${imgUrl.slice(0, 40)}-${idx}`}
                      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 aspect-square bg-black/5 dark:bg-black/30 ${
                        isMain
                          ? 'border-[var(--or)] ring-2 ring-[var(--or)]/30 shadow-md'
                          : 'border-[var(--sep)] hover:border-[var(--or)]/50'
                      }`}
                    >
                      {/* Watch Image */}
                      <img
                        src={imgUrl}
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--sep)]">
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
      </form>

      {/* Fullscreen HD Preview Lightbox */}
      {previewImageIndex !== null && formData.images.filter(Boolean)[previewImageIndex] && (
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
                Photo {previewImageIndex + 1} sur {formData.images.filter(Boolean).length}
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
            {formData.images.filter(Boolean).length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewImageIndex(
                    (prev) =>
                      (prev! - 1 + formData.images.filter(Boolean).length) %
                      formData.images.filter(Boolean).length
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
              src={formData.images.filter(Boolean)[previewImageIndex]}
              alt={`Aperçu grand format ${previewImageIndex + 1}`}
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {/* Next arrow */}
            {formData.images.filter(Boolean).length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewImageIndex(
                    (prev) => (prev! + 1) % formData.images.filter(Boolean).length
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
