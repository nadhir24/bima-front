"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { toast } from "sonner";
// Ensure all requests include cookies (session) by default
axios.defaults.withCredentials = true;

interface User {
  id: number;
  email: string;
  name: string;
  fullName: string;
  phoneNumber?: string;
  photoProfile?: string;
  token?: string;
  roleId?: { roleId: number }[];
  userProfile?: {
    birthDate?: string;
    gender?: string;
    address?: {
      label?: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    addresses?: Array<{
      id: number;
      label?: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
      createdAt: string;
      updatedAt: string | null;
      userProfileId: number;
    }>;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setUserState: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on initial load
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation: check if essential properties exist
        if (
          parsedUser &&
          parsedUser.id &&
          parsedUser.email &&
          parsedUser.fullName
        ) {
          setUser(parsedUser);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (userData: User) => {
    if (!userData.token) {
      // Handle missing token case
      return;
    }

    // 1. Store token and user data
    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));

    // 2. Update auth state
    setUser(userData);
    setIsLoggedIn(true);

    // 3. Sync guest cart to user cart (only if JUST_REGISTERED)
    const guestCartItems = JSON.parse(localStorage.getItem("cart_items") || "[]");
    const guestId = localStorage.getItem("guestId"); // Ambil guestId dari localStorage
    const justRegistered = localStorage.getItem("JUST_REGISTERED") === "1";

    if (guestId) {
      console.log("LOGIN post-action", { guestId, items: guestCartItems.length, justRegistered, hasToken: !!userData.token });
      try {
        if (justRegistered) {
          // Merge only for newly registered users
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/cart/sync`,
            {
              cart: guestCartItems,
              guestId: guestId,
              confirmMerge: true,
            },
            {
              headers: { Authorization: `Bearer ${userData.token}` },
              withCredentials: true,
            }
          );
        } else {
          // Not newly registered: do NOT merge. Clear guest cart to avoid leaking items.
          await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear-guest-cart`, {
            withCredentials: true,
          });
        }
      } catch (error) {
        console.error("Cart sync/clear after login failed:", error);
        toast.error("Cart post-login action failed");
      }
    }

    // 4. Clean up all guest-related and old cart data from localStorage
    const keysToRemove = [
      "guestId",
      "guestInvoiceId",
      "invoiceData",
      "cart_items",
      "cart_count",
      "cart_total",
      "cart_last_fetch_time",
      "JUST_REGISTERED",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // 5. Dispatch event to force a cart refresh from the backend
    window.dispatchEvent(new CustomEvent("FORCE_CART_REFRESH"));
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Panggil endpoint logout di backend untuk menghancurkan session
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`);

      // 2. Hapus semua data dari localStorage
      const keysToRemove = [
        "token",
        "user",
        "guestId",
        "guestInvoiceId",
        "invoiceData",
        "cart_items",
        "cart_count",
        "cart_total",
        "cart_last_fetch_time",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // 3. Reset state aplikasi
      setUser(null);
      setIsLoggedIn(false);

      // 4. Dispatch event untuk mereset cart di CartContext
      window.dispatchEvent(new CustomEvent("FORCE_CART_RESET"));

      // 5. Inisialisasi sesi guest baru agar mendapatkan guestId baru sebelum redirect
      try {
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cart/guest-session`, {
          withCredentials: true,
        });
      } catch (e) {
        // ignore
      }

      // 6. Redirect ke halaman utama untuk memulai sesi guest baru
      setTimeout(() => {
        window.location.href = "/";
      }, 50);
    } catch (error) {
      console.error("Logout failed:", error);
      // Jika logout backend gagal, tetap bersihkan sisi klien sebagai fallback
      localStorage.clear(); // Clear all local storage as a fallback
      setUser(null);
      setIsLoggedIn(false);
      window.dispatchEvent(new CustomEvent("FORCE_CART_RESET"));
      setTimeout(() => {
        window.location.href = "/";
      }, 50);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoggedIn, setIsLoading]);

  const setUserState = (userData: Partial<User>) => {
    // Get the current token from localStorage first
    const currentToken = localStorage.getItem("token");

    // If we don't have a token but userData has one, use it
    if (!currentToken && userData.token) {
      localStorage.setItem("token", userData.token);
    }

    // Get the token again (either existing or new)
    const tokenToUse = localStorage.getItem("token") || userData.token;

    if (!tokenToUse) {
      // Silent fail
    }

    const currentUser = user || ({} as User);
    const updatedUserData = {
      ...currentUser,
      ...userData,
      // Always include the token in the user object
      token: tokenToUse,
    };

    setUser(updatedUserData);
    localStorage.setItem("user", JSON.stringify(updatedUserData));
  };

  // Fiksasi variabel dan fungsi untuk mencegah rekonstruksi berulang
  const refreshToken = useCallback(async () => {
    // TODO: Implement refresh token logic in the future
  }, []);

  // Token check and verification effect
  useEffect(() => {
    // Basic token expiry check function
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded: { exp: number } = jwtDecode(token);
        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const bufferTime = 15 * 60 * 1000; // 15 minutes buffer

        // If token expires within the buffer time
        if (expiryTime - currentTime < bufferTime) {
          refreshToken();
        }
      } catch (e) {
        // Silent fail
      }
    };

    // Token role verification function
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token || !isLoggedIn || !user?.id) return;

      try {
        // Use /auth/profile endpoint which requires valid token
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          // Token is valid - profile was retrieved
          const profileData = await response.json();

          // Check if role has changed
          const profileRoleId = profileData.userRoles?.[0]?.roleId;
          const currentRoleId = user.roleId?.[0]?.roleId;

          if (profileRoleId !== undefined && profileRoleId !== currentRoleId) {
            // Update user data with new role
            const updatedUserData = {
              ...user,
              roleId: profileData.userRoles,
            };

            setUser(updatedUserData);
            localStorage.setItem("user", JSON.stringify(updatedUserData));

            // Force reload page to apply new permissions
            window.location.reload();
          }
        } else if (response.status === 401) {
          logout();
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Check token immediately
    checkTokenExpiry();
    verifyToken();

    // Set interval to check periodically
    const expiryCheckInterval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // Every 5 minutes

    // Add listeners for navigation events
    const handleNavigation = () => {
      verifyToken();
    };

    window.addEventListener("popstate", handleNavigation);

    // Add custom event listener for role changes
    window.addEventListener("user_role_changed", handleNavigation);

    return () => {
      clearInterval(expiryCheckInterval);
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("user_role_changed", handleNavigation);
    };
  }, [user, isLoggedIn, logout, refreshToken]);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, login, logout, setUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
