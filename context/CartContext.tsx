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
    return user?.id
      ? `userId=${user.id}`
      : guestId
        ? `guestId=${guestId}`
        : null;
  }, [user?.id, guestId]);

  // Fetch cart implementation
  const fetchCartImpl = useCallback(async () => {
    if (!currentIdentifier) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      setIsLoadingCart(false);
      return;
    }

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
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/findMany?${currentIdentifier}&_t=${now}`
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/count?${currentIdentifier}&_t=${now}`
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/total?${currentIdentifier}&_t=${now}`
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

    // Handle user login case
    if (isLoggedIn) {
      if (storedGuestId) {
        // Auto-sync cart if user logs in and has a previous guest session
        axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/sync`,
          { userId: user?.id, guestId: storedGuestId }
        )
        .then(() => {
          localStorage.removeItem("guestId");
          setGuestId(null);
          fetchCartImpl(); // Refresh cart after sync
          toast.success("Cart synced successfully");
        })
        .catch(err => {
          console.error("Failed to sync cart", err);
        });
      }
      setGuestId(null);
    }
    // Handle guest user case
    else if (storedGuestId) {
      setGuestId(storedGuestId);
      
      // Otomatis bersihkan keranjang jika browser baru dibuka
      // Ini memastikan tidak ada item dari sesi lain yang terbawa
      const isSessionRestored = localStorage.getItem("session_restored");
      if (!isSessionRestored) {
        // Tandai bahwa sesi telah dibersihkan
        localStorage.setItem("session_restored", "true");
        
        // Bersihkan di server
        axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear-guest-cart?guestId=${storedGuestId}`)
          .then(() => {
            // Bersihkan di lokal
            localStorage.setItem("cart_items", JSON.stringify([]));
            localStorage.setItem("cart_count", "0");
            localStorage.setItem("cart_total", "0");
            setCartItems([]);
            setCartCount(0);
            setCartTotal(0);
          })
          .catch(err => {
            console.error("Failed to clear guest cart:", err);
          });
      }
    }
    // Create new guest session
    else {
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
            localStorage.setItem("session_restored", "true"); // Tandai bahwa ini adalah sesi baru
            
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
    }

    setHasInitialized(true);
  }, [isLoggedIn, user?.id, fetchCartImpl]); // Added user?.id and fetchCartImpl to dependencies

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
    if (hasInitialized && currentIdentifier) {
      fetchCartImpl();
    } else if (hasInitialized) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      setIsLoadingCart(false);
    }
  }, [hasInitialized, currentIdentifier, fetchCartImpl]);

  // Add to cart function
  const addToCart = useCallback(
    async (catalogId: number, sizeId: number, quantity: number) => {
      const identifier = user?.id
        ? { userId: user.id }
        : guestId
          ? { guestId }
          : null;
      if (!identifier) {
        toast.error("Sesi tidak valid. Silakan refresh.");
        // Return a rejected promise for consistency
        return Promise.reject(new Error("No identifier"));
      }

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

      // Construct URL with guestId query parameter if applicable
      const identifierParams =
        !user?.id && guestId ? `?guestId=${guestId}` : "";
      const url = `${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}${identifierParams}`;

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
      const identifierParams = user?.id
        ? `userId=${user.id}`
        : guestId
          ? `guestId=${guestId}`
          : null;
      if (!identifierParams) {
        toast.error("Sesi tidak valid. Silakan refresh.");
        return Promise.reject(new Error("No identifier"));
      }

      try {
        // Pass identifier as query params for DELETE request
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}?${identifierParams}`
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
    if (!currentIdentifier) return;
    
    try {
      // Force timestamp to bypass any caching
      const timestamp = new Date().getTime();
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/findMany?${currentIdentifier}&_t=${timestamp}&force=true`,
          { headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/count?${currentIdentifier}&_t=${timestamp}&force=true`,
          { headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cart/total?${currentIdentifier}&_t=${timestamp}&force=true`,
          { headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' } }
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
          
          // Jika ada guestId baru, kirim perintah clear ke server
          if (event.newValue) {
            axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear-guest-cart?guestId=${event.newValue}`)
              .catch(err => console.error("Failed to clear cart for new guest:", err));
          }
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
