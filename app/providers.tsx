"use client";
import * as React from "react";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { AuthProvider } from "../context/AuthContext"; // adjust path as needed
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
