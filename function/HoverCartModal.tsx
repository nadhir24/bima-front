"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";

// Custom hook to detect screen size (simple example)
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

const HoverCartModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { cartItems, cartCount, cartTotal, isLoadingCart, fetchCart, forceRefreshCart, clearCart } =
    useCart();
  const isMobile = useMediaQuery("(max-width: 640px)"); // Check for mobile (adjust breakpoint if needed, sm: 640px)

  // Fetch when modal opens (keep this for initial load if needed)
  useEffect(() => {
    if (isModalOpen) {
      fetchCart();
    }
  }, [isModalOpen, fetchCart]);
  
  // Handle forced refresh cart
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefreshCart();
      // Trigger additional browser cache clearing
      localStorage.setItem("cart_last_fetch_time", "0");
      window.dispatchEvent(new Event("FORCE_CART_REFRESH"));
    } catch (error) {
      console.error("Error refreshing cart:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle force clear cart
  const handleClearCart = () => {
    clearCart();
    // Trigger local cache clearing
    localStorage.setItem("cart_items", "[]");
    localStorage.setItem("cart_count", "0");
    localStorage.setItem("cart_total", "0");
    window.dispatchEvent(new Event("FORCE_CART_RESET"));
  };

  // Skeleton component for cart item
  const CartItemSkeleton = () => (
    <div className="flex items-center gap-3 border-b py-3">
      <Skeleton className="w-12 h-12 rounded flex-shrink-0" />
      <div className="flex flex-col flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );

  // Function to get full image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
  };

  return (
    <>
      <Button onPress={() => setIsModalOpen(true)} className="relative">
        {cartCount > 0 ? `Keranjang (${cartCount})` : "Keranjang"}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        placement={isMobile ? "bottom" : "auto"}
        className={`fixed ${isMobile ? "bottom-0 w-full rounded-t-xl" : "right-0 top-0 h-auto sm:w-96 rounded-xl"} max-h-screen bg-white shadow-lg z-50 overflow-hidden flex flex-col`}
        classNames={{
          base: isMobile ? "m-0 rounded-b-none" : "",
        }}
      >
        <ModalContent className="flex flex-col flex-grow overflow-hidden bg-white dark:bg-zinc-800">
          <ModalHeader className="border-b p-4 pr-6 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold">
              Keranjang Belanja
              {isLoadingCart && (
                <span className="ml-2 inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></span>
              )}
            </h2>
            <Link href="/cart" className="mr-4">
              <Button
                as="a"
                href="/cart"
                color="primary"
                size="sm"
                isDisabled={cartCount === 0 || isLoadingCart}
                className={isLoadingCart ? "cursor-not-allowed opacity-50" : ""}
              >
                {isLoadingCart ? (
                  <>
                    <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-t-transparent animate-spin"></span>
                    Memuat...
                  </>
                ) : (
                  "Selengkapnya"
                )}
              </Button>
            </Link>
          </ModalHeader>

          <ModalBody className="p-4 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-white">
            {isLoadingCart ? (
              <div className="space-y-3">
                <CartItemSkeleton />
                <CartItemSkeleton />
                <CartItemSkeleton />
              </div>
            ) : cartCount === 0 ? (
              <p className="text-center text-gray-500 py-8">Keranjang kosong</p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b py-3"
                >
                  {item.catalog?.image && (
                    <Image
                      src={getImageUrl(item.catalog.image)}
                      alt={item.catalog.name ?? "Product Image"}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                      width={48}
                      height={48}
                    />
                  )}
                  <div className="flex flex-col flex-1 min-w-0 capitalize">
                    <h3 className="text-sm font-semibold truncate">
                      {item.catalog?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Ukuran: {item.size?.size}
                    </p>
                    <p className="text-xs font-medium text-gray-900">
                      {typeof item.size?.price === 'string' 
                        ? item.size.price.includes('Rp') 
                          ? item.size.price 
                          : `Rp${new Intl.NumberFormat('id-ID').format(parseInt(item.size.price.replace(/\D/g, '') || '0'))}`
                        : `Rp${new Intl.NumberFormat('id-ID').format(item.size?.price || 0)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Jumlah: {item.quantity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </ModalBody>

          {cartCount > 0 && (
            <ModalFooter className="flex justify-between items-center p-4 border-t flex-shrink-0">
              <div className="text-md font-semibold">Total:</div>
              <div className="text-md font-bold">
                Rp{new Intl.NumberFormat("id-ID").format(cartTotal)}
              </div>
            </ModalFooter>
          )}
          
          {/* Tombol troubleshooting telah diganti dengan sistem otomatis */}
        </ModalContent>
      </Modal>
    </>
  );
};

export default HoverCartModal;
