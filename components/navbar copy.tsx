// Mobile menu improvements
"use client";
import {
  Navbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Skeleton } from "@heroui/skeleton";
import Modall from "./modal";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "./theme-switch";
import Link from "next/link";
import { RanoIcon } from "./icons";
import HoverCartModal from "@/function/HoverCartModal";
import { useState, useEffect } from "react";
import { CartItem } from "@/function/CartItem";
import { useAuth } from "@/context/AuthContext";

export default function Navy() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn } = useAuth();
  const [hasGuestId, setHasGuestId] = useState(false);

  // Update guest ID state ketika status login berubah atau localStorage berubah
  useEffect(() => {
    const guestId = localStorage.getItem("guestId");
    setHasGuestId(!!guestId);

    // Fungsi untuk mengecek guestId ketika terjadi perubahan localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guestId" || e.key === "token") {
        setHasGuestId(!!localStorage.getItem("guestId"));
      }
    };

    // Fungsi untuk menangani custom event untuk update guestId dalam tab yang sama
    const handleGuestIdChange = () => {
      setHasGuestId(!!localStorage.getItem("guestId"));
    };

    // Event listener untuk perubahan antar tab/window
    window.addEventListener("storage", handleStorageChange);
    // Event listener untuk perubahan dalam tab yang sama
    window.addEventListener("guestIdChange", handleGuestIdChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("guestIdChange", handleGuestIdChange);
    };
  }, [isLoggedIn]); // Dependensi pada isLoggedIn agar dijalankan ulang saat status login berubah

  // Cek guestInvoiceId hanya jika user belum login
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (error) {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cart") {
        const newCart = e.newValue ? JSON.parse(e.newValue) : [];
        setCartItems(newCart);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Navbar maxWidth="xl" className="sticky top-0 z-50">
      <NavbarContent className="flex items-center justify-between">
        <div className="flex items-center justify-between">
          <NavbarContent className="sm:hidden basis-1 mr-4" justify="start">
            <div className="p-2 cursor-pointer touch-manipulation">
              <NavbarMenuToggle 
                className="scale-125 w-8 h-8 p-0.5" 
                aria-label="Toggle navigation menu"
              />
            </div>
          </NavbarContent>
          <NavbarBrand as="li" className="max-w-fit mr-4">
            <Link href="/" className="flex items-center gap-1 mt-2 mb-2">
              <RanoIcon />
            </Link>
          </NavbarBrand>
        </div>
        <div className="hidden sm:flex items-center">
          <ul className="flex gap-4 justify-start ml-2">
            {siteConfig.navItems
              .filter((item) => {
                // Filter out Invoice menu untuk user yang sudah login
                if (item.href === "/invoice") {
                  return !isLoggedIn && hasGuestId;
                }
                return true; // Keep all other menu items
              })
              .map((item) => (
                <NavbarItem key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </NavbarItem>
              ))}
          </ul>
        </div>
      </NavbarContent>
      <NavbarContent
        className="flex basis-1/5 sm:basis-full px-2 sm:px-4 lg:px-8"
        justify="end"
      >
        {/* Tetap tampilkan keranjang dan theme switch */}
        <NavbarItem className="flex gap-2">
          {isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          ) : (
            <>
              <HoverCartModal />
              <ThemeSwitch />
            </>
          )}
        </NavbarItem>
        {/* Login hanya muncul di layar besar, masuk ke menu hamburger saat mobile */}
        <NavbarItem className="hidden sm:block">
          {isLoading ? (
            <Skeleton className="h-10 w-24 rounded-lg" />
          ) : (
            <Modall />
          )}
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu className="pt-2 pb-6">
        <div className="mx-4 mt-2 flex flex-col gap-4">
          {siteConfig.navMenuItems
            .filter((item) => {
              // Filter juga menu mobile dengan cara yang sama
              if (item.href === "/invoice") {
                return !isLoggedIn && hasGuestId;
              }
              return true; // Keep all other menu items
            })
            .map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  className={
                    `transition-colors duration-200 text-lg font-medium py-2 block`
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          {/* Login dipindahkan ke dalam menu hamburger saat mobile */}
          <NavbarMenuItem key="auth-mobile" className="sm:hidden mt-2">
            <Modall />
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </Navbar>
  );
}
