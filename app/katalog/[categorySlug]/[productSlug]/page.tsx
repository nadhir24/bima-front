"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  RadioGroup,
  Radio,
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Image,
} from "@heroui/react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

// Define TypeScript interfaces for data structures
interface Size {
  id: number;
  size: string;
  price: string;
  qty?: number;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

interface Catalog {
  id: number;
  name: string;
  image: string | null;
  sizes: Size[];
  qty: string;
  description: string;
  productImages?: ProductImage[];
}

const ProductDetailPage = () => {
  // State management
  const [product, setProduct] = useState<Catalog | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Hooks for routing and context
  const params = useParams();
  const router = useRouter();
  const { addToCart: contextAddToCart, cartItems } = useCart();

  // Extract slugs from URL parameters
  const categorySlug = params.categorySlug as string;
  const productSlug = Array.isArray(params.productSlug)
    ? params.productSlug.join("/")
    : params.productSlug;

  // Effect to fetch product details when slugs change
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<Catalog>(
          `${process.env.NEXT_PUBLIC_API_URL}/catalog/${categorySlug}/${productSlug}`
        );
        const productData = response.data;

        // Sort sizes numerically if possible, otherwise alphabetically
        if (productData.sizes && productData.sizes.length > 0) {
          productData.sizes.sort((a, b) => {
            const aNum = parseFloat(a.size);
            const bNum = parseFloat(b.size);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return a.size.localeCompare(b.size);
          });
        }

        setProduct(productData);
        // Set the first size as the default selected size
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        
        // Reset image selection to the main image
        setSelectedImageIndex(0);
      } catch (error) {
        toast.error("Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug && productSlug) {
      fetchProductDetail();
    }
  }, [categorySlug, productSlug]);

  // Handler for changing the selected size
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sizeId = event.target.value;
    const selected = product?.sizes.find(
      (size) => size.id.toString() === sizeId
    );
    setSelectedSize(selected || null);
  };

  // Handler for adding the product to the cart
  const handleAddToCart = async () => {
    if (!selectedSize || !product) {
      toast.error("Silakan pilih ukuran terlebih dahulu");
      return;
    }

    // Check for available stock
    const cartQty = cartItems
      .filter(
        (item) =>
          item.catalog?.id === product.id && item.size?.id === selectedSize.id
      )
      .reduce((sum, item) => sum + item.quantity, 0);

    const availableStock = Number.isFinite(selectedSize.qty)
      ? Number(selectedSize.qty)
      : 0;
      
    if (cartQty >= availableStock) {
      toast.warning(
        `Stok tidak cukup. Stok tersedia: ${availableStock}.`
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      await contextAddToCart(product.id, selectedSize.id, 1);
      setIsCartModalOpen(true);
    } catch (error) {
      toast.error("Gagal menambahkan ke keranjang");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handler to close the cart confirmation modal
  const handleCloseCartModal = () => {
    setIsCartModalOpen(false);
  };
  
  // Helper function to navigate to the category page
  const navigateToCategory = (category: string) => {
    router.push(`/katalog?search=${category.replace(/-/g, " ")}`);
  };

  // Helper function to get the URL of the currently displayed image
  const getCurrentImageUrl = () => {
    if (product?.productImages && product.productImages.length > 0) {
      return `${process.env.NEXT_PUBLIC_API_URL}${product.productImages[selectedImageIndex].imageUrl}`;
    }
    if (product?.image) {
      return `${process.env.NEXT_PUBLIC_API_URL}${product.image}`;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs Navigation */}
      <nav className="flex mb-4">
        <ol className="flex items-center space-x-2 text-gray-600">
          <li>
            <a href="/" className="hover:text-blue-600">Home</a>
          </li>
          <li>/</li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateToCategory(categorySlug);
              }}
              className="hover:text-blue-600 capitalize"
            >
              {categorySlug?.replace(/-/g, " ")}
            </a>
          </li>
          <li>/</li>
          <li className="font-semibold text-gray-800 capitalize">
            {product?.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row lg:space-x-12 bg-white rounded-lg shadow-sm p-6">
        {/* Image Section */}
        <div className="lg:w-1/2 w-full">
          <div className="relative aspect-square w-full max-w-[500px] mx-auto mb-3">
            {isLoading ? (
              <div className="w-full h-full rounded-xl bg-gray-200 animate-pulse"></div>
            ) : (
              getCurrentImageUrl() && (
                <Image
                  src={getCurrentImageUrl() as string}
                  alt={product?.name || "Product Image"}
                  className="object-contain rounded-lg w-full h-auto max-h-[60vh] sm:max-h-[500px]"
                  width={500}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )
            )}
          </div>

          {/* Thumbnails Section */}
          {!isLoading &&
            product?.productImages &&
            product.productImages.length > 1 && (
              <div className="flex overflow-x-auto gap-2 pb-2 mt-2 max-w-[500px] mx-auto">
                {product.productImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative min-w-[70px] h-[70px] border rounded-md overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-blue-500"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${img.imageUrl}`}
                      alt={`${product.name} image ${index + 1}`}
                      className="object-cover w-full h-full"
                      width={70}
                      height={70}
                      sizes="70px"
                    />
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Product Info Section */}
        <div className="lg:w-1/2 w-full mt-6 lg:mt-0">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded-md w-3/4 animate-pulse" />
              <div className="h-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded-md w-1/4 animate-pulse" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold capitalize">{product?.name}</h1>
              <p className="text-gray-600 mt-2 text-justify">
                {product?.description}
              </p>

              {product?.sizes && product.sizes.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold">Pilih Ukuran:</h2>
                  <RadioGroup
                    className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
                    value={selectedSize?.id.toString() || ""}
                    onChange={handleSizeChange}
                  >
                    {product.sizes.map((size) => (
                      <Radio
                        key={size.id}
                        value={size.id.toString()}
                        className="mb-1 p-3 border rounded-md flex justify-between items-center hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-sm capitalize">
                          {size.size}
                        </span>
                        <span className="ml-2 text-primary font-semibold text-sm">
                          {`Rp${new Intl.NumberFormat("id-ID").format(
                            parseInt(size.price?.replace(/\D/g, "") || "0")
                          )}`}
                        </span>
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                className="mt-4 w-full sm:w-auto"
                color="primary"
                isLoading={isAddingToCart}
                isDisabled={!selectedSize || isAddingToCart}
              >
                {isAddingToCart ? "Menambahkan..." : "Add to Cart"}
              </Button>
              <p className="text-sm text-gray-400 mt-2">
                *Penambahan quantity ada di halaman keranjang.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Cart Confirmation Modal */}
      <Modal
        isDismissable={false}
        hideCloseButton
        aria-labelledby="modal-title"
        isOpen={isCartModalOpen}
        onClose={handleCloseCartModal}
        className="max-w-[400px] w-full"
      >
        <ModalBody className="text-center p-6">
          <div className="text-green-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 id="modal-title" className="text-xl font-bold mb-2">
            Berhasil Ditambahkan!
          </h3>
          <p className="text-gray-600">
            Anda telah menambahkan ukuran{" "}
            <span className="font-semibold">{selectedSize?.size}</span> produk{" "}
            <span className="font-semibold capitalize">{product?.name}</span> ke keranjang.
          </p>
        </ModalBody>
        <ModalFooter className="flex justify-center gap-3 p-4">
          <Button variant="flat" color="default" onPress={handleCloseCartModal}>
            Lanjut Belanja
          </Button>
          <Button color="primary" onPress={() => router.push("/cart")}>
            Lihat Keranjang
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;