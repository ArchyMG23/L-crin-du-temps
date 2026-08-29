import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (p: Product | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hp_luxury_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    if (product.stock <= 0) {
      return { success: false, message: 'Cette montre est actuellement en rupture de stock.' };
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > product.stock) {
        return {
          success: false,
          message: `Stock maximal atteint (${product.stock} pièce${product.stock > 1 ? 's' : ''} disponible${product.stock > 1 ? 's' : ''}).`
        };
      }
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty
      };
    } else {
      if (quantity > product.stock) {
        return {
          success: false,
          message: `Stock insuffisant (${product.stock} disponible).`
        };
      }
      updatedCart.push({ product, quantity });
    }

    setCart(updatedCart);
    setIsCartOpen(true);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return true;
    }

    const item = cart.find(i => i.product.id === productId);
    if (!item) return false;

    if (quantity > item.product.stock) {
      return false;
    }

    setCart(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i))
    );
    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const effectivePrice = item.product.promotionalPrice && item.product.promotionalPrice > 0
      ? item.product.promotionalPrice
      : item.product.price;
    return sum + effectivePrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        itemCount,
        subtotal,
        selectedProductForDetail,
        setSelectedProductForDetail
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
