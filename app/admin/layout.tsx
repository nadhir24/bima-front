"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Assuming you use AuthContext
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner"; // Or your preferred toast library
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

interface DecodedToken {
  userId: number;
  email: string;
  roleId: Array<{ userId: number; roleId: number }>;
  iat: number;
  exp: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Use auth context if available to potentially speed up check or get user info
  const { user, logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Main authorization check function
  const checkAdminAuthorization = useCallback(() => {
    setCheckingAuth(true);

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Akses ditolak. Silakan login terlebih dahulu.");
      router.replace("/");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);

      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.replace("/");
        return;
      }

      const userRoleId =
        decoded.roleId &&
        Array.isArray(decoded.roleId) &&
        decoded.roleId.length > 0
          ? decoded.roleId[0].roleId
          : undefined;

      if (userRoleId === 1) {
        setIsAuthorized(true);
      } else {
        toast.error("Akses ditolak. Anda tidak memiliki izin admin.");
        if (userRoleId === 3) {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }
        return;
      }
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Token tidak valid. Silakan login kembali.");
      router.replace("/");
      return;
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  // Force recheck auth on any route change within admin
  useEffect(() => {
    checkAdminAuthorization();
  }, [pathname, checkAdminAuthorization]);

  // Show loading state while checking authorization
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="mb-4">Memeriksa otorisasi admin...</p>
        <Skeleton className="h-4 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[150px] mb-2" />
        <Skeleton className="h-4 w-[180px]" />
      </div>
    );
  }

  // If authorized, render the children (the actual admin page content)
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Fallback (should be handled by redirects, but good for safety)
  // Returning null prevents rendering anything before redirect completes
  return null;
}
