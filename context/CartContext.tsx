"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Import useAuth
import { toast, Toaster } from "sonner"; // Atau react-toastify

// Definisikan tipe CartItem seperti di HoverCartModal atau lebih lengkap
// Ensure cross-site cookies (guest session) are sent on all requests
axios.defaults.withCredentials = true;

export interface CartItem {
  id: number;
  userId: number | null;
  guestId: string | null;
  quantity: number; // Ini adalah quantity di cart, BUKAN stok
  createdAt: string;
  catalog?: { id: number; name: string; image: string | null } | null;
  size?: {
    id: number;
    size: string;
    price: string;
    qty?: number; // Ini adalah stok asli dari produk size
  } | null;
  user?: { id: number; email: string } | null; // Pastikan user ada jika dibutuhkan
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isLoadingCart: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (
    catalogId: number,
    sizeId: number,
    quantity: number
  ) => Promise<void>;
  updateCartItem: (cartId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  clearCart: () => void; // Fungsi untuk membersihkan cart
  forceRefreshCart: () => Promise<number | undefined>; // Force refresh dari server
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Separate utility functions outside component to prevent re-creation on render
const parseTotal = (totalString: any): number => {
  if (typeof totalString === "string" && totalString.startsWith("Rp")) {
    return parseInt(totalString.replace(/[^0-9]/g, ""), 10) || 0;
  } else if (typeof totalString === "number") {
    return totalString;
  }
  return 0;
};

const storeCartData = (items: CartItem[], count: number, total: number) => {
  try {
    // Jika items kosong, paksa count = 0
    if (!items.length && count > 0) {
      count = 0;
      total = 0;
    }

    localStorage.setItem("cart_items", JSON.stringify(items));
    localStorage.setItem("cart_count", count.toString());
    localStorage.setItem("cart_total", total.toString());
  } catch (err) {
    // Silent fail
  }
};

// Format price function to ensure consistency
const formatPrice = (price: string | number | undefined): string => {
  if (!price) return "Rp0";
  if (typeof price === "string") {
    // If already formatted with Rp, return as is
    if (price.includes("Rp")) return price;

    // Otherwise, try to parse it and format
    const numericValue = parseInt(price.replace(/\D/g, "") || "0");
    return `Rp${new Intl.NumberFormat("id-ID").format(numericValue)}`;
  }
  return `Rp${new Intl.NumberFormat("id-ID").format(price)}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get current identifier as a memoized value
  const currentIdentifier = useMemo(() => {
    // For guests, do not send any identifier; server will use session cookie
    return user?.id ? `userId=${user.id}` : '';
  }, [user?.id, guestId]);

  // Fetch cart implementation
  const fetchCartImpl = useCallback(async () => {
    // Always attempt to fetch. If no userId, backend will resolve guest via session.

    // Throttle API calls
    const lastFetchTime = localStorage.getItem("cart_last_fetch_time");
    const now = new Date().getTime();
    if (lastFetchTime && now - parseInt(lastFetchTime) < 1000) {
      return;
    }

    setIsLoadingCart(true);
    localStorage.setItem("cart_last_fetch_time", now.toString());

    try {
      // Add timestamp to prevent caching
      const qs = currentIdentifier ? `${currentIdentifier}&` : "";
      const q = `_t=${now}`;
      const prefix = qs ? `?${qs}${q}` : `?${q}`;
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/findMany${prefix}`
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/count${prefix}`
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/total${prefix}`
        ),
      ]);

      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      const countData = countRes.data.count || 0;
      const totalDataNumber = parseTotal(totalRes.data);

      // Format all prices consistently when loading data
      const formattedItems = itemsData.map((item: any) => {
        return {
          ...item,
          size: item.size
            ? {
                ...item.size,
                price: formatPrice(item.size.price),
                qty:
                  item.size.qty !== undefined
                    ? Number(item.size.qty)
                    : undefined,
              }
            : null,
        };
      });

      // Update localStorage cache
      storeCartData(formattedItems, countData, totalDataNumber);

      // Update state
      setCartItems(formattedItems);
      setCartCount(countData);
      setCartTotal(totalDataNumber);
      console.log("Cart loaded", { count: countData, total: totalDataNumber });
    } catch (error) {
      // Try to restore from localStorage
      try {
        const storedItems = localStorage.getItem("cart_items");
        const storedCount = localStorage.getItem("cart_count");
        const storedTotal = localStorage.getItem("cart_total");

        if (storedItems && storedCount && storedTotal) {
          const storedItemsData = JSON.parse(storedItems);
          const formattedStoredItems = storedItemsData.map((item: any) => ({
            ...item,
            size: item.size
              ? {
                  ...item.size,
                  price: formatPrice(item.size.price),
                }
              : null,
          }));
          setCartItems(formattedStoredItems);
          setCartCount(parseInt(storedCount, 10));
          setCartTotal(parseInt(storedTotal, 10));
        } else {
          setCartItems([]);
          setCartCount(0);
          setCartTotal(0);
        }
      } catch (storageError) {
        setCartItems([]);
        setCartCount(0);
        setCartTotal(0);
      }
    } finally {
      setIsLoadingCart(false);
    }
  }, [currentIdentifier]);

  // Public fetch cart function (stable reference)
  const fetchCart = useCallback(() => {
    return fetchCartImpl();
  }, [fetchCartImpl]);

  // Initialize guest session when needed
  useEffect(() => {
    const storedGuestId = localStorage.getItem("guestId");

    if (isLoggedIn) {
      // Logged-in: drop any guest marker and fetch user cart
      if (storedGuestId) localStorage.removeItem("guestId");
      setGuestId(null);
      fetchCartImpl();
      setHasInitialized(true);
      return;
    }

    // Guest flow: only create a guest session if we don't already have one
    const initGuest = async () => {
      try {
        if (!storedGuestId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/cart/guest-session`,
            { withCredentials: true }
          );
          const newGuestId = response.data?.guestId;
          if (newGuestId) {
            localStorage.setItem("guestId", newGuestId);
            setGuestId(newGuestId);
          }
        } else {
          setGuestId(storedGuestId);
        }
        // Do not clear local storage or state; just fetch current server cart
        await fetchCartImpl();
      } catch (err) {
        // Silent fail
      } finally {
        setHasInitialized(true);
      }
    };
    initGuest();
  }, [isLoggedIn, user?.id, fetchCartImpl]);

  // Separate effect to listen for create_guest_session events
  useEffect(() => {
    const handleCreateGuestSession = (event: CustomEvent) => {
      // Check if we already have a guest ID
      if (localStorage.getItem("guestId")) {
        return;
      }

      // Create a new guest session
      const createGuestSession = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/cart/guest-session`
          );
          if (response.data.guestId) {
            // Clear cart data in localStorage when creating a new guest session
            localStorage.setItem("cart_items", JSON.stringify([]));
            localStorage.setItem("cart_count", "0");
            localStorage.setItem("cart_total", "0");
            
            // Set the new guest ID
            localStorage.setItem("guestId", response.data.guestId);
            setGuestId(response.data.guestId);
            
            // Update state to show empty cart
            setCartItems([]);
            setCartCount(0);
            setCartTotal(0);
            
            window.dispatchEvent(new Event("guestIdChange"));
          }
        } catch (err) {
          // Silent fail
        }
      };

      createGuestSession();
    };

    window.addEventListener(
      "create_guest_session",
      handleCreateGuestSession as EventListener
    );

    return () => {
      window.removeEventListener(
        "create_guest_session",
        handleCreateGuestSession as EventListener
      );
    };
  }, []);

  // Fetch cart when dependencies change
  useEffect(() => {
    if (hasInitialized) {
      // Always fetch; backend derives guest from session cookie when no userId
      fetchCartImpl();
    }
  }, [hasInitialized, currentIdentifier, fetchCartImpl]);

  // Add to cart function
  const addToCart = useCallback(
    async (catalogId: number, sizeId: number, quantity: number) => {
      const identifier = user?.id ? { userId: user.id } : {};

      const payload = { ...identifier, catalogId, sizeId, quantity };
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/add`,
          payload
        );
        if (response.data.success) {
          toast.success("Item ditambahkan!");
          // Call fetchCartImpl to refresh context state immediately
          await fetchCartImpl();
          return Promise.resolve();
        } else {
          toast.error(response.data.message || "Gagal menambahkan.");
          return Promise.reject(
            new Error(response.data.message || "Failed to add")
          );
        }
      } catch (error) {
        toast.error("Gagal menambahkan item ke keranjang.");
        return Promise.reject(error);
      }
    },
    [user?.id, guestId, fetchCartImpl]
  ); // Added fetchCartImpl to dependencies

  // Fungsi utilitas untuk menampilkan error (lebih sederhana)
  const showErrorMessage = (message: string) => {
    // Cek jika pesan berisi "Insufficient stock", format menjadi lebih user-friendly
    if (message.includes("Insufficient stock")) {
      const errorParts =
        /Insufficient stock for (.*?) \((.*?)\). Available: (\d+)/.exec(
          message
        );
      if (errorParts) {
        const [_, productName, size, available] = errorParts;
        const friendlyMessage = `Stok ${productName} (${size}) tidak cukup. Tersedia: ${available}`;

        toast.error(friendlyMessage, {
          duration: 4000,
          position: "top-center",
          style: { fontWeight: "500" },
        });
        return;
      }
    }

    // Untuk pesan error lainnya
    toast.error(message, {
      duration: 4000,
      position: "top-center",
      style: { fontWeight: "500" },
    });
  };

  // Update cart item function
  const updateCartItem = useCallback(
    async (cartId: number, quantity: number) => {
      const payload: { quantity: number; userId?: number } = { quantity };
      if (user?.id) {
        payload.userId = user.id;
      }

      // Do not send guestId; server derives from session. userId in body is enough for logged-in users
      const url = `${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}`;

      try {
        // Use the constructed URL
        const response = await axios.put(url, payload);
        if (response.data.success) {
          await fetchCartImpl(); // Refresh context state
          return Promise.resolve();
        } else {
          // Tangkap secara eksplisit pesan insufficient stock
          const errorMessage = response.data.message || "Gagal memperbarui.";
          showErrorMessage(errorMessage);
          return Promise.reject(new Error(errorMessage));
        }
      } catch (error: any) {
        // Extract error message
        let errorMessage = "Gagal memperbarui keranjang.";

        // Check if error has response data with message
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        // Check if error already has a message property
        else if (error.message) {
          errorMessage = error.message;
        }

        // Tampilkan toast error
        showErrorMessage(errorMessage);

        return Promise.reject(new Error(errorMessage));
      }
    },
    [user?.id, guestId, fetchCartImpl]
  );

  // Remove from cart function
  const removeFromCart = useCallback(
    async (cartId: number) => {
      // No guestId query param; for users, include userId to be explicit, else rely on session
      const identifierParams = user?.id ? `userId=${user.id}` : '';

      try {
        // Pass identifier as query params for DELETE request
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}${identifierParams ? `?${identifierParams}` : ''}`
        );
        if (response.data.success) {
          // toast.success("Item dihapus."); // Already handled optimistically
          await fetchCartImpl(); // Refresh context state
          return Promise.resolve();
        } else {
          toast.error(response.data.message || "Gagal menghapus.");
          return Promise.reject(
            new Error(response.data.message || "Failed to remove")
          );
        }
      } catch (error) {
        toast.error("Gagal menghapus item dari keranjang.");
        return Promise.reject(error);
      }
    },
    [user?.id, guestId, fetchCartImpl]
  ); // Added dependencies

  // Function to clear cart state locally
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartCount(0);
    setCartTotal(0);
    storeCartData([], 0, 0); // Clear local storage as well
  }, []);

  // Force refresh cart from server, ignoring cache
  const forceRefreshCart = useCallback(async () => {
    try {
      // Force timestamp to bypass any caching
      const timestamp = new Date().getTime();
      const qs = currentIdentifier ? `${currentIdentifier}&` : "";
      const q = `_t=${timestamp}&force=true`;
      const prefix = qs ? `?${qs}${q}` : `?${q}`;
      const headers = { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' } as const;
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/findMany${prefix}`,
          { headers }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/count${prefix}`,
          { headers }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/total${prefix}`,
          { headers }
        ),
      ]);

      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      const countData = countRes.data.count || 0;
      const totalDataNumber = parseTotal(totalRes.data);

      // Update state directly
      setCartItems(itemsData);
      setCartCount(countData);
      setCartTotal(totalDataNumber);
      
      // Update localStorage
      storeCartData(itemsData, countData, totalDataNumber);
      
      return itemsData.length;
    } catch (error) {
      console.error("Force refresh failed:", error);
      return 0;
    }
  }, [currentIdentifier]);

  // Listen for custom event to force cart reset (e.g., on logout)
  useEffect(() => {
    const handleForceReset = (event: CustomEvent) => {
      clearCart();
    };

    // Listen for force refresh event
    const handleForceRefresh = (event: CustomEvent) => {
      forceRefreshCart();
    };

    window.addEventListener("FORCE_CART_RESET" as any, handleForceReset);
    window.addEventListener("FORCE_CART_REFRESH" as any, handleForceRefresh);
    
    return () => {
      window.removeEventListener("FORCE_CART_RESET" as any, handleForceReset);
      window.removeEventListener("FORCE_CART_REFRESH" as any, handleForceRefresh);
    };
  }, [clearCart, forceRefreshCart]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Jika terjadi perubahan pada guestId, reset keranjang
      if (event.key === 'guestId') {
        if (event.oldValue !== event.newValue) {
          // Kosongkan keranjang
          setCartItems([]);
          setCartCount(0);
          setCartTotal(0);
          localStorage.setItem("cart_items", JSON.stringify([]));
          localStorage.setItem("cart_count", "0");
          localStorage.setItem("cart_total", "0");

          // Trigger a fresh fetch; server derives guest from session cookie
          window.dispatchEvent(new CustomEvent("FORCE_CART_REFRESH"));
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Context value memoized
  const contextValue = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartTotal,
      isLoadingCart,
      fetchCart,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      forceRefreshCart,
    }),
    [
      cartItems,
      cartCount,
      cartTotal,
      isLoadingCart,
      fetchCart,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      forceRefreshCart,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

// Custom hook to use the Cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
