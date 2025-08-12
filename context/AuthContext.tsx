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

  const login = (userData: User) => {
    // Ensure the token exists
    if (!userData.token) {
      // Silent fail
    } else {
      localStorage.setItem("token", userData.token);

      // Verify token was saved
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        // Silent fail
      }
    }

    // Update state
    setUser(userData);
    setIsLoggedIn(true);

    // Save user data
    localStorage.setItem("user", JSON.stringify(userData));

    // Clean up guest ID and invoice data
    localStorage.removeItem("guestId");
    localStorage.removeItem("guestInvoiceId");
    localStorage.removeItem("invoiceData");
  };

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Daftar lengkap semua key yang perlu dihapus dari localStorage
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

      // Hapus satu per satu untuk memastikan semuanya terhapus
      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Silent fail
        }
      });

      // Double-check bahwa token dan user benar-benar sudah dihapus
      if (localStorage.getItem("token") || localStorage.getItem("user")) {
        // Paksa hapus dengan cara alternatif
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("user");
      }

      // Reset state aplikasi
      setUser(null);
      setIsLoggedIn(false);

      // Tambahkan delay kecil untuk memastikan localStorage benar-benar clear
      // sebelum event dipancarkan
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Trigger pembuatan guest session baru
      window.dispatchEvent(new Event("create_guest_session"));

      // Gunakan window.location.href alih-alih router.push
      window.location.href = "/";

      return true;
    } catch (error) {
      return false;
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
