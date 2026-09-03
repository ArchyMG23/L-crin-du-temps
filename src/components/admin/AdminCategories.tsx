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
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] tracking-wide">
            Collections & Catégories ({categories.length})
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
            Organisez votre vitrine en univers horlogers (Chronographes, Automatiques, Pièces Joaillières...).
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          id="admin-add-category-btn"
          onClick={handleOpenCreate}
          icon={Plus}
          className="font-bold shadow-md self-start sm:self-auto"
        >
          Nouvelle Collection
        </Button>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <div className="bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl p-12 text-center text-xs text-[var(--text-muted)] space-y-3 shadow-sm">
          <Layers className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-[var(--text)] font-semibold text-sm">Aucune collection créée.</p>
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
                className="bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] overflow-hidden flex flex-col justify-between group hover:border-[var(--or)]/50 transition-all shadow-sm"
              >
                {/* Visual banner */}
                <div className="relative h-44 bg-[var(--bg-2)] overflow-hidden">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-2)]">
                      <Layers className="w-12 h-12 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--carte-bg)] via-[var(--carte-bg)]/40 to-transparent" />

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => onToggleActive(cat.id, cat.active)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs ${
                        cat.active
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                          : 'bg-[var(--bg)]/80 text-[var(--text-soft)] border border-[var(--sep)]'
                      }`}
                    >
                      {cat.active ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Masquée</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-serif text-base sm:text-lg font-bold text-[var(--text)] drop-shadow">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--or)] bg-[var(--bg)]/90 px-2.5 py-0.5 rounded-lg border border-[var(--badge-border)] font-bold">
                      {count} montre{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Description & actions */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between bg-[var(--carte-bg)]">
                  <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed line-clamp-2">
                    {cat.description || 'Aucune description rédigée pour cette collection.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--sep)]">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono font-medium">
                      /{cat.slug}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 text-[var(--text-soft)] hover:text-[var(--or)] hover:bg-[var(--bg-2)] rounded-xl transition-colors border border-[var(--sep)]"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(cat)}
                        className="p-2 text-[var(--text-soft)] hover:text-rose-500 hover:bg-rose-500/15 rounded-xl transition-colors border border-[var(--sep)]"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <form onSubmit={handleSubmit} className="space-y-4 text-[var(--text)] text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm text-[var(--text)] font-semibold mb-1">
              Nom de la collection <span className="text-[var(--or)]">*</span>
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
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-[var(--text)] font-semibold mb-1">
              Slug d'URL
            </label>
            <input
              type="text"
              id="admin-category-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Ex: chronographes-exception"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none font-mono shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-[var(--text)] font-semibold mb-1">
              Photo d'ambiance / Bannière
            </label>
            <div className="space-y-2">
              <input
                type="url"
                id="admin-category-image-url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none shadow-xs"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] text-[var(--text)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[var(--sep)]">
                  <Upload className="w-3.5 h-3.5 text-[var(--or)]" />
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
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Image configurée
                  </span>
                )}
              </div>
            </div>

            {image && (
              <div className="mt-2.5 h-24 w-full rounded-xl overflow-hidden border border-[var(--sep)] relative bg-[var(--bg-2)]">
                <img src={image} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
              Description de l'univers
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Chefs-d'œuvre de précision horlogère suisse avec complications..."
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cat-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded bg-[var(--bg-2)] border-[var(--sep)] text-[var(--or)] focus:ring-[var(--or)]"
            />
            <label htmlFor="cat-active" className="text-xs text-[var(--text-soft)] cursor-pointer">
              Collection active et visible dans le catalogue
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--sep)]">
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
          <div className="space-y-4 text-[var(--text)] text-xs">
            {blockingMessage ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Suppression bloquée</span>
                </div>
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{blockingMessage}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleActive(categoryToDelete.id, true);
                      setCategoryToDelete(null);
                    }}
                    className="text-[11px] text-[var(--or)] hover:underline"
                  >
                    Préférer désactiver la collection à la place
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Confirmer la suppression</span>
                </div>
                <p className="text-rose-800 dark:text-rose-200">
                  Êtes-vous certain de vouloir supprimer la collection{' '}
                  <strong className="text-[var(--text)]">"{categoryToDelete.name}"</strong> ?
                </p>
                <p className="text-[var(--text-soft)] text-[11px]">
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
