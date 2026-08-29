import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Product, Category, Gender, StoreSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { uploadImageFile } from '../../services/storageService';

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
    images: [''] as string[],
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        brand: product.brand || '',
        reference: product.reference || '',
        categoryId: product.categoryId || (categories[0]?.id || ''),
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
        images: product.images && product.images.length > 0 ? product.images : [''],
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
        categoryId: categories[0]?.id || '',
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

  const handleImageChange = (index: number, val: string) => {
    const updated = [...formData.images];
    updated[index] = val;
    setFormData({ ...formData, images: updated });
  };

  const handleAddImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const handleRemoveImageField = (index: number) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated.length > 0 ? updated : [''] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      setError(null);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageFile(file, 'products');
        newUrls.push(url);
      }

      setFormData(prev => {
        const existingClean = prev.images.filter(Boolean);
        return {
          ...prev,
          images: [...existingClean, ...newUrls]
        };
      });
    } catch (err: any) {
      setError("Erreur lors de l'envoi de l'image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    const updated = [...formData.images];
    const selected = updated.splice(index, 1)[0];
    updated.unshift(selected);
    setFormData({ ...formData, images: updated });
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

    if (!formData.categoryId) {
      setError('Veuillez sélectionner une collection.');
      return;
    }

    const cleanImages = formData.images.map(img => img.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      cleanImages.push('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000');
    }

    try {
      setLoading(true);

      const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        brand: formData.brand.trim() || 'Maison Horlogère',
        reference: formData.reference.trim(),
        categoryId: formData.categoryId || categories[0]?.id || 'cat-general',
        gender: formData.gender,
        price: Number(formData.price),
        promotionalPrice: promoNum,
        currency: formData.currency,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
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
      <form onSubmit={handleSubmit} className="space-y-6 text-stone-100">
        {error && (
          <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic identification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Nom de la montre <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              id="admin-product-name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Chronographe Royal Ébène"
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Marque / Maison
            </label>
            <input
              type="text"
              id="admin-product-brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Vanguard Genève"
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Référence modèle
            </label>
            <input
              type="text"
              id="admin-product-reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ex: VG-8840-BK"
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Collection / Catégorie
            </label>
            <select
              id="admin-product-category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Genre
            </label>
            <select
              id="admin-product-gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="mixte">Mixte / Unisexe</option>
            </select>
          </div>
        </div>

        {/* Pricing & Stocks */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-stone-950 rounded-xl border border-stone-800">
          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Prix ({formData.currency}) <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              id="admin-product-price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full bg-stone-900 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
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
              className="w-full bg-stone-900 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Stock numérique <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              id="admin-product-stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="w-full bg-stone-900 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Seuil Stock Faible
            </label>
            <input
              type="number"
              min="1"
              id="admin-product-low-stock"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
              className="w-full bg-stone-900 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Photos & Image Uploader */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-stone-300 font-medium">
              Galerie Photos (Upload direct ou Liens HD)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium px-2 py-1 bg-amber-400/10 rounded-md border border-amber-400/20 transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploadingImage ? 'Téléversement...' : 'Importer fichier'}</span>
              </button>
              <button
                type="button"
                onClick={handleAddImageField}
                className="text-xs text-stone-400 hover:text-white flex items-center gap-1 font-medium px-2 py-1 bg-stone-900 rounded-md border border-stone-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lien URL</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="space-y-2">
            {formData.images.map((imgUrl, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  value={imgUrl}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none"
                />
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt="Aperçu"
                    className="w-8 h-8 rounded-md object-cover border border-stone-800 shrink-0"
                  />
                )}
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImageField(idx)}
                    className="p-2 text-stone-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Descriptions */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Description courte (accroche catalogue)
            </label>
            <input
              type="text"
              id="admin-product-short-desc"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Ex: Chronographe automatique en acier brossé avec cadran noir soleillé."
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Description détaillée
            </label>
            <textarea
              rows={3}
              id="admin-product-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description complète, finitions, histoire et caractéristiques..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Specifications Table */}
        <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-3">
          <h4 className="text-xs font-serif font-semibold uppercase tracking-wider text-amber-400">
            Spécifications Horlogères (Fiche technique)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Mouvement</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Diamètre du boîtier</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Matière du boîtier</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Étanchéité</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Verre</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-400 mb-0.5">Bracelet</label>
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
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Toggles: Active & Featured */}
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-200">
            <input
              type="checkbox"
              id="admin-product-active-toggle"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-stone-950 border-stone-800 focus:ring-0"
            />
            <span>Produit Actif (Visible sur la boutique publique)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-300">
            <input
              type="checkbox"
              id="admin-product-featured-toggle"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-stone-950 border-stone-800 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pièce Vedette (Mise en avant sur l'accueil)</span>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
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
    </Modal>
  );
};
