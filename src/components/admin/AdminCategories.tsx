import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { Category, Product } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { uploadImageFile } from '../../services/storageService';

interface AdminCategoriesProps {
  categories: Category[];
  products: Product[];
  onCreateCategory: (cat: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onToggleActive: (id: string, currentActive: boolean) => Promise<void>;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  products,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleActive
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Deletion state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setActive(true);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setActive(cat.active);
    setError(null);
    setModalOpen(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setError(null);
      const url = await uploadImageFile(file, 'categories');
      setImage(url);
    } catch (err) {
      setError("Erreur lors de l'envoi de la photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom de la collection est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      const categoryData = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        description: description.trim(),
        image: image.trim() || undefined,
        active
      };

      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, categoryData);
      } else {
        await onCreateCategory(categoryData);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError("Erreur lors de l'enregistrement de la collection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (cat: Category) => {
    const associatedProducts = products.filter((p) => p.categoryId === cat.id);
    setCategoryToDelete(cat);

    if (associatedProducts.length > 0) {
      setBlockingMessage(
        `Cette collection est actuellement associée à ${associatedProducts.length} montre(s). Pour préserver l'intégrité de votre boutique, désactivez la collection ou réassignez ces montres avant de la supprimer.`
      );
    } else {
      setBlockingMessage(null);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || blockingMessage) return;
    try {
      setDeleting(true);
      await onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Collections & Catégories ({categories.length})
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Organisez votre vitrine en univers horlogers (Chronographes, Automatiques, Pièces Joaillières...).
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          id="admin-add-category-btn"
          onClick={handleOpenCreate}
          icon={Plus}
        >
          Nouvelle Collection
        </Button>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-12 text-center text-xs text-stone-400 space-y-3">
          <Layers className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-stone-300 font-medium">Aucune collection créée.</p>
          <Button variant="gold" size="sm" onClick={handleOpenCreate} icon={Plus}>
            Créer votre première collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <div
                key={cat.id}
                className="bg-stone-900/60 rounded-xl border border-stone-800 overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37]/40 transition-all shadow-lg"
              >
                {/* Visual banner */}
                <div className="relative h-40 bg-stone-950 overflow-hidden">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-700">
                      <Layers className="w-10 h-10 text-stone-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => onToggleActive(cat.id, cat.active)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md ${
                        cat.active
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                          : 'bg-stone-900/80 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {cat.active ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Masquée</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-white drop-shadow">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#D4AF37] bg-black/60 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                      {count} montre{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Description & actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-stone-900/30">
                  <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                    {cat.description || 'Aucune description rédigée pour cette collection.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                    <span className="text-[10px] text-stone-500 font-mono">
                      slug: /{cat.slug}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-stone-400 hover:text-[#D4AF37] hover:bg-stone-800 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(cat)}
                        className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Edit/Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Modifier la collection : ${editingCategory.name}` : `Créer une collection`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-stone-100 text-xs">
          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Nom de la collection <span className="text-[#D4AF37]">*</span>
            </label>
            <input
              type="text"
              required
              id="admin-category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingCategory) setSlug(generateSlug(e.target.value));
              }}
              placeholder="Ex: Chronographes d'Exception"
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Slug d'URL
            </label>
            <input
              type="text"
              id="admin-category-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Ex: chronographes-exception"
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Photo d'ambiance / Bannière
            </label>
            <div className="space-y-2">
              <input
                type="url"
                id="admin-category-image-url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3 h-3 text-[#D4AF37]" />
                  <span>{uploadingImage ? 'Envoi en cours...' : 'Téléverser un fichier'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                {image && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Image configurée
                  </span>
                )}
              </div>
            </div>

            {image && (
              <div className="mt-2 h-20 w-full rounded-lg overflow-hidden border border-stone-800 relative bg-stone-950">
                <img src={image} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Description de l'univers
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Chefs-d'œuvre de précision horlogère suisse avec complications..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cat-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded bg-stone-950 border-stone-800 text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <label htmlFor="cat-active" className="text-xs text-stone-300 cursor-pointer">
              Collection active et visible dans le catalogue
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={loading}
            >
              {editingCategory ? 'Sauvegarder' : 'Créer la collection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Block Modal */}
      <Modal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Suppression de collection"
        maxWidth="sm"
      >
        {categoryToDelete && (
          <div className="space-y-4 text-stone-200 text-xs">
            {blockingMessage ? (
              <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Suppression bloquée</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">{blockingMessage}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleActive(categoryToDelete.id, true);
                      setCategoryToDelete(null);
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Préférer désactiver la collection à la place
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Confirmer la suppression</span>
                </div>
                <p className="text-rose-200/90">
                  Êtes-vous certain de vouloir supprimer la collection{' '}
                  <strong className="text-white">"{categoryToDelete.name}"</strong> ?
                </p>
                <p className="text-stone-400 text-[11px]">
                  Cette collection ne contient aucune montre et peut être supprimée sans risque.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                disabled={deleting}
              >
                {blockingMessage ? 'Fermer' : 'Annuler'}
              </Button>
              {!blockingMessage && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={confirmDelete}
                  loading={deleting}
                >
                  Supprimer définitivement
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
