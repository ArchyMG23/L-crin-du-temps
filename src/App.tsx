import React, { useState, useEffect } from 'react';
import { Product, Category, Order, StoreSettings, OrderStatus, PaymentStatus, UserProfile } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Services
import { seedInitialDataIfEmpty, forceSeedData } from './services/seedService';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
} from './services/productService';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from './services/categoryService';
import {
  getOrders,
  updateOrderStatus,
  updatePaymentStatus
} from './services/orderService';
import {
  getStoreSettings,
  updateStoreSettings
} from './services/settingsService';
import { getAllCustomers } from './services/userService';
import { DEFAULT_SETTINGS } from './data/defaultData';

// UI
import { ToastContainer, ToastMessage } from './components/ui/Toast';

// Public Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/public/HomeView';
import { ShopView } from './components/public/ShopView';
import { AccountView } from './components/public/AccountView';
import { AuthModal } from './components/public/AuthModal';
import { ProductDetailModal } from './components/public/ProductDetailModal';
import { CartDrawer } from './components/public/CartDrawer';
import { CheckoutModal } from './components/public/CheckoutModal';
import { OrderSuccessModal } from './components/public/OrderSuccessModal';
import { MessageSquare } from 'lucide-react';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminProductModal } from './components/admin/AdminProductModal';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminStock } from './components/admin/AdminStock';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminSettings } from './components/admin/AdminSettings';

const MainApp: React.FC = () => {
  const { isAdmin, userProfile } = useAuth();

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation State - parsed immediately from initial URL to support direct access and F5 refresh
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'men' | 'women' | 'account' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (path === '/admin') return 'admin';
    if (path === '/boutique/homme') return 'men';
    if (path === '/boutique/femme') return 'women';
    if (path === '/compte' || path === '/account') return 'account';
    if (path === '/boutique' || path.startsWith('/produit/')) return 'shop';
    return 'home';
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | undefined>(undefined);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState<string>('');
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Modals & Drawers States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedWhatsAppUrl, setCompletedWhatsAppUrl] = useState<string | null>(null);

  // Admin Modals
  const [adminProductModalOpen, setAdminProductModalOpen] = useState(false);
  const [editingAdminProduct, setEditingAdminProduct] = useState<Product | null>(null);

  // Initial Load
  const loadData = async (adminMode = isAdmin) => {
    try {
      setLoading(true);

      const [prodsData, catsData, settingsData, ordersData, customersData] = await Promise.all([
        getProducts(!adminMode),
        getCategories(!adminMode),
        getStoreSettings(),
        adminMode ? getOrders() : Promise.resolve([]),
        adminMode ? getAllCustomers() : Promise.resolve([])
      ]);

      setProducts(prodsData);
      setCategories(catsData);
      setSettings(settingsData);
      setOrders(ordersData);
      setCustomers(customersData);

      // Check URL route on initial load once products are fetched
      handleRouteFromPath(window.location.pathname, prodsData, ordersData);
    } catch (err) {
      console.warn('Données initiales chargées avec secours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(isAdmin);
  }, [isAdmin]);

  // Route parser
  const handleRouteFromPath = (path: string, currentProds = products, currentOrders = orders) => {
    const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';

    if (cleanPath === '/admin') {
      setCurrentView('admin');
      return;
    }

    if (cleanPath.startsWith('/produit/')) {
      const slug = path.split('/produit/')[1];
      if (slug && currentProds.length > 0) {
        const found = currentProds.find(p => p.slug === slug || p.id === slug);
        if (found) {
          setSelectedProduct(found);
          setCurrentView('shop');
          return;
        }
      }
    }

    if (cleanPath === '/panier') {
      setIsCartOpen(true);
      return;
    }

    if (cleanPath === '/commande') {
      setIsCheckoutOpen(true);
      return;
    }

    if (cleanPath.startsWith('/commande/confirmation/')) {
      const orderNum = path.split('/commande/confirmation/')[1];
      if (orderNum && currentOrders.length > 0) {
        const foundOrder = currentOrders.find(o => o.orderNumber === orderNum || o.id === orderNum);
        if (foundOrder) {
          setCompletedOrder(foundOrder);
          return;
        }
      }
    }

    if (cleanPath === '/boutique/homme') {
      setCurrentView('men');
      return;
    }

    if (cleanPath === '/boutique/femme') {
      setCurrentView('women');
      return;
    }

    if (cleanPath === '/compte' || cleanPath === '/account') {
      setCurrentView('account');
      return;
    }

    if (cleanPath === '/boutique') {
      setCurrentView('shop');
      return;
    }

    if (cleanPath === '/' || cleanPath === '/accueil') {
      setCurrentView('home');
      return;
    }
  };

  // Popstate listener for back/forward browser buttons
  useEffect(() => {
    const onPopState = () => {
      handleRouteFromPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [products, orders]);

  // Handlers for Navigation
  const handleNavigate = (view: string, categorySlug?: string) => {
    if (view === 'admin') {
      setCurrentView('admin');
      window.history.pushState(null, '', '/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'account') {
      if (!userProfile) {
        setAuthModalOpen(true);
      } else {
        setCurrentView('account');
        window.history.pushState(null, '', '/compte');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    let nextPath = '/';
    if (view === 'shop') nextPath = '/boutique';
    else if (view === 'men') nextPath = '/boutique/homme';
    else if (view === 'women') nextPath = '/boutique/femme';

    if (view === 'home' || view === 'shop' || view === 'men' || view === 'women') {
      setCurrentView(view as any);
      setSelectedCategoryFilter(categorySlug);
      window.history.pushState(null, '', nextPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    const slug = product.slug || product.id;
    window.history.pushState(null, '', `/produit/${slug}`);
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
    let backPath = '/';
    if (currentView === 'shop') backPath = '/boutique';
    else if (currentView === 'men') backPath = '/boutique/homme';
    else if (currentView === 'women') backPath = '/boutique/femme';
    window.history.pushState(null, '', backPath);
  };

  // Search handler from Navbar
  const handleNavbarSearch = (query: string) => {
    setNavbarSearchQuery(query);
    if (query.trim() && currentView !== 'shop' && currentView !== 'men' && currentView !== 'women') {
      setCurrentView('shop');
      window.history.pushState(null, '', '/boutique');
    }
  };

  // Order Handlers
  const handleOpenCart = () => {
    setIsCartOpen(true);
    window.history.pushState(null, '', '/panier');
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    let backPath = '/';
    if (currentView === 'shop') backPath = '/boutique';
    else if (currentView === 'men') backPath = '/boutique/homme';
    else if (currentView === 'women') backPath = '/boutique/femme';
    window.history.pushState(null, '', backPath);
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    window.history.pushState(null, '', '/commande');
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    let backPath = '/';
    if (currentView === 'shop') backPath = '/boutique';
    else if (currentView === 'men') backPath = '/boutique/homme';
    else if (currentView === 'women') backPath = '/boutique/femme';
    window.history.pushState(null, '', backPath);
  };

  const handleOrderCreated = (order: Order, whatsappUrl: string) => {
    setOrders((prev) => [order, ...prev]);
    // Also refresh products for updated stock in local state
    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (item) {
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        }
        return p;
      })
    );
    setCompletedOrder(order);
    setCompletedWhatsAppUrl(whatsappUrl);
    window.history.pushState(null, '', `/commande/confirmation/${order.orderNumber}`);
  };

  const handleCloseSuccessModal = () => {
    setCompletedOrder(null);
    setCompletedWhatsAppUrl(null);
    window.history.pushState(null, '', '/');
  };

  // Admin CRUD Handlers
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const nowIso = new Date().toISOString();
    if (id) {
      await updateProduct(id, productData);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: nowIso } : p))
      );
      addToast('success', `Montre "${productData.name}" mise à jour avec succès.`);
    } else {
      const newId = await createProduct(productData);
      const newProd: Product = {
        ...productData,
        id: newId,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      setProducts((prev) => [newProd, ...prev]);
      addToast('success', `Nouvelle montre "${productData.name}" créée avec succès.`);
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const cloneData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `${product.name} (Copie)`,
        slug: `${product.slug || product.id}-copie-${Date.now().toString().slice(-4)}`,
        brand: product.brand,
        reference: product.reference ? `${product.reference}-CPY` : '',
        categoryId: product.categoryId,
        gender: product.gender,
        price: product.price,
        promotionalPrice: product.promotionalPrice ?? null,
        currency: product.currency || settings.currency || '€',
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold || 2,
        shortDescription: product.shortDescription,
        description: product.description,
        featured: false,
        active: true,
        images: [...product.images],
        specifications: { ...product.specifications }
      };

      const newId = await createProduct(cloneData);
      const nowIso = new Date().toISOString();
      const duplicated: Product = {
        ...cloneData,
        id: newId,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      setProducts((prev) => [duplicated, ...prev]);
      addToast('success', `Montre dupliquée sous "${duplicated.name}".`);
    } catch (err) {
      addToast('error', 'Erreur lors de la duplication du produit.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find(p => p.id === productId);
    await deleteProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    addToast('info', `Montre "${prod?.name || ''}" supprimée du catalogue.`);
  };

  const handleToggleProductActive = async (productId: string, currentActive: boolean) => {
    await updateProduct(productId, { active: !currentActive });
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, active: !currentActive } : p))
    );
    addToast('info', !currentActive ? 'Montre activée sur la boutique.' : 'Montre désactivée (masquée).');
  };

  const handleToggleProductFeatured = async (productId: string, currentFeatured: boolean) => {
    await updateProduct(productId, { featured: !currentFeatured });
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, featured: !currentFeatured } : p))
    );
    addToast('info', !currentFeatured ? 'Montre mise en avant (Coup de cœur).' : 'Montre retirée des mises en avant.');
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    await updateProductStock(productId, newStock);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    addToast('success', `Stock mis à jour (${newStock} unité${newStock > 1 ? 's' : ''}).`);
  };

  const handleQuickRestock = async (productId: string, addQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const nextStock = prod.stock + addQty;
    await handleUpdateStock(productId, nextStock);
  };

  // Admin Categories CRUD
  const handleSaveCategory = async (
    catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const nowIso = new Date().toISOString();
    if (id) {
      await updateCategory(id, catData);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...catData, updatedAt: nowIso } : c))
      );
      addToast('success', `Collection "${catData.name}" mise à jour.`);
    } else {
      const newId = await createCategory(catData);
      const newCat: Category = {
        ...catData,
        id: newId,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      setCategories((prev) => [...prev, newCat]);
      addToast('success', `Nouvelle collection "${catData.name}" créée.`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    addToast('info', `Collection "${cat?.name || ''}" supprimée.`);
  };

  const handleToggleCategoryActive = async (id: string, currentActive: boolean) => {
    await updateCategory(id, { active: !currentActive });
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
    );
    addToast('info', !currentActive ? 'Collection activée.' : 'Collection masquée.');
  };

  // Admin Orders Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const existingOrder = orders.find((o) => o.id === orderId);
    await updateOrderStatus(orderId, status);

    // If order is cancelled and wasn't already cancelled, automatically restore stock
    if (status === 'cancelled' && existingOrder && existingOrder.status !== 'cancelled') {
      for (const item of existingOrder.items) {
        if (item.productId) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const restoredStock = product.stock + item.quantity;
            await updateProductStock(item.productId, restoredStock).catch(() => {});
            setProducts((prev) =>
              prev.map((p) => (p.id === item.productId ? { ...p, stock: restoredStock } : p))
            );
          }
        }
      }
      addToast('info', 'Le stock des articles a été automatiquement réintégré au catalogue.');
    } else if (existingOrder && existingOrder.status === 'cancelled' && status !== 'cancelled') {
      // Re-deduct stock if reactivated
      for (const item of existingOrder.items) {
        if (item.productId) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await updateProductStock(item.productId, newStock).catch(() => {});
            setProducts((prev) =>
              prev.map((p) => (p.id === item.productId ? { ...p, stock: newStock } : p))
            );
          }
        }
      }
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    addToast('success', `Statut de commande mis à jour : ${status}.`);
  };

  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    await updatePaymentStatus(orderId, paymentStatus);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
    addToast('success', `Statut de paiement actualisé: ${paymentStatus}.`);
  };

  // Admin Settings Handler
  const handleSaveSettings = async (newSettings: Partial<StoreSettings>) => {
    await updateStoreSettings(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('success', 'Paramètres de la boutique enregistrés avec succès.');
  };

  const handleReSeedData = async () => {
    await forceSeedData();
    await loadData();
    addToast('info', 'Données de démonstration réinitialisées.');
  };

  const handleResetData = async () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setCustomers([]);
    await loadData(true);
    setCurrentView('admin');
    setAdminTab('dashboard');
    window.history.replaceState(null, '', '/admin');
    addToast('success', 'Réinitialisation terminée : catalogue et commandes purgés.');
  };

  // Admin Pending Counts
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 2)
  ).length;

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-100 space-y-4">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-serif text-sm uppercase tracking-widest text-amber-400">
          Chargement de l'Écrin Horloger...
        </span>
      </div>
    );
  }

  // ================= ADMIN VIEW RENDERING =================
  if (currentView === 'admin') {
    if (!isAdmin) {
      return <AdminLogin onBackToStore={() => setCurrentView('home')} />;
    }

    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <AdminLayout
          activeTab={adminTab}
          onSelectTab={setAdminTab}
          onExitAdmin={() => setCurrentView('home')}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        >
          {adminTab === 'dashboard' && (
            <AdminDashboard
              products={products}
              orders={orders}
              settings={settings}
              onNavigateTab={setAdminTab}
              onOpenNewProductModal={() => {
                setEditingAdminProduct(null);
                setAdminProductModalOpen(true);
              }}
              onQuickRestock={handleQuickRestock}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {adminTab === 'products' && (
            <AdminProducts
              products={products}
              categories={categories}
              settings={settings}
              onOpenNewModal={() => {
                setEditingAdminProduct(null);
                setAdminProductModalOpen(true);
              }}
              onEditProduct={(product) => {
                setEditingAdminProduct(product);
                setAdminProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onToggleActive={handleToggleProductActive}
              onToggleFeatured={handleToggleProductFeatured}
              onDuplicateProduct={handleDuplicateProduct}
            />
          )}

          {adminTab === 'stock' && (
            <AdminStock
              products={products}
              settings={settings}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {adminTab === 'categories' && (
            <AdminCategories
              categories={categories}
              products={products}
              onCreateCategory={(cat) => handleSaveCategory(cat)}
              onUpdateCategory={(id, cat) => handleSaveCategory(cat as any, id)}
              onDeleteCategory={handleDeleteCategory}
              onToggleActive={handleToggleCategoryActive}
            />
          )}

          {adminTab === 'orders' && (
            <AdminOrders
              orders={orders}
              settings={settings}
              onUpdateStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdateOrderPaymentStatus}
            />
          )}

          {adminTab === 'customers' && (
            <AdminCustomers
              customers={customers}
              orders={orders}
              settings={settings}
            />
          )}

          {adminTab === 'settings' && (
            <AdminSettings
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onReSeedDemoData={handleReSeedData}
              onResetStore={handleResetData}
            />
          )}

          {/* Create/Edit Watch Modal */}
          <AdminProductModal
            isOpen={adminProductModalOpen}
            onClose={() => {
              setAdminProductModalOpen(false);
              setEditingAdminProduct(null);
            }}
            product={editingAdminProduct}
            categories={categories}
            settings={settings}
            onSave={handleSaveProduct}
          />
        </AdminLayout>
      </>
    );
  }

  // ================= PUBLIC STORE RENDERING =================
  const cleanWhatsApp = settings.whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        settings={settings}
        searchQuery={navbarSearchQuery}
        onSearchChange={handleNavbarSearch}
        onOpenCart={handleOpenCart}
      />

      {/* Main Public Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentView === 'home' && (
          <HomeView
            products={products}
            categories={categories}
            settings={settings}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'shop' && (
          <ShopView
            products={products}
            categories={categories}
            settings={settings}
            initialCategory={selectedCategoryFilter}
            initialGender="all"
            searchQuery={navbarSearchQuery}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'men' && (
          <ShopView
            products={products}
            categories={categories}
            settings={settings}
            initialCategory={selectedCategoryFilter}
            initialGender="homme"
            searchQuery={navbarSearchQuery}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'women' && (
          <ShopView
            products={products}
            categories={categories}
            settings={settings}
            initialCategory={selectedCategoryFilter}
            initialGender="femme"
            searchQuery={navbarSearchQuery}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'account' && (
          <AccountView
            settings={settings}
            onNavigate={handleNavigate}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onSelectProduct={handleSelectProduct}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onNavigate={handleNavigate}
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
      />

      {/* Floating WhatsApp Concierge Badge */}
      <aside aria-label="Conciergerie WhatsApp" className="fixed bottom-6 right-6 z-30 group">
        <a
          id="floating-whatsapp-btn"
          href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
            `Bonjour ${settings.storeName} ! J'aimerais des conseils sur votre collection de montres.`
          )}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Contacter la conciergerie WhatsApp"
          className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold py-3.5 px-4 rounded-full shadow-2xl shadow-[#25D366]/30 border-2 border-white/20 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
          </span>
          <MessageSquare className="w-5 h-5 fill-current" />
          <span className="text-xs uppercase tracking-wider hidden sm:inline-block font-sans font-extrabold">
            Conciergerie WhatsApp
          </span>
        </a>
      </aside>

      {/* Public Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setCurrentView('account');
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={handleCloseProductModal}
        settings={settings}
        currency={settings.currency || '€'}
        whatsappNumber={settings.whatsappNumber}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        onCheckout={handleOpenCheckout}
        settings={settings}
        currency={settings.currency || '€'}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        settings={settings}
        currency={settings.currency || '€'}
        whatsappNumber={settings.whatsappNumber}
        storeName={settings.storeName}
        onOrderCreated={handleOrderCreated}
      />

      <OrderSuccessModal
        isOpen={Boolean(completedOrder)}
        onClose={handleCloseSuccessModal}
        order={completedOrder}
        whatsappUrl={completedWhatsAppUrl}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
