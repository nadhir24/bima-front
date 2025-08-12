// Home.tsx
"use client";

import { title, subtitle } from "@/components/primitives";
import Image from "next/image";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody } from "@heroui/react";
import { ShoppingCart, ArrowUp } from "lucide-react";
import Tombol from "@/components/button";
import dynamic from "next/dynamic";

// Dynamically import components with proper loading handling
const InfoSection = dynamic(() => import("@/components/InfoSection"), {
  loading: () => (
    <div className="h-80 bg-gray-100 animate-pulse rounded-xl mb-16"></div>
  ),
  ssr: false,
});

const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  loading: () => (
    <div className="h-80 bg-gray-100 animate-pulse rounded-xl mb-16"></div>
  ),
  ssr: false,
});

// Import static images - preload directly with webpack
import kueultah from "@/public/kueultah.webp";
import lidahk from "@/public/lidahk.webp";
import wkwkwkwk from "@/public/wkwkwkwk.webp";

// Define the Product interface
interface Product {
  image: any;
  title: string;
  subTitle: string;
  description: string;
}

// Preload critical images
const CARD_IMAGE_SIZE = {
  width: 350,
  height: 350,
};

export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  // State to track which featured product button is being processed
  const [processingProductIndex, setProcessingProductIndex] = useState<
    number | null
  >(null);
  const router = useRouter();

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prefetch the /katalog route
  useEffect(() => {
    router.prefetch("/katalog");
  }, [router]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stats = [
    { value: 260, label: "Kue Terjual" },
    { value: 20, label: "Pelanggan Puas" },
    { value: 2, label: "Tahun Pengalaman" },
  ];

  // Static product data
  const featuredProducts: Product[] = [
    {
      image: kueultah,
      title: "Kue Ulang Tahun",
      subTitle: "Spesial",
      description:
        "Kue ulang tahun custom dengan desain menarik dan rasa yang lezat",
    },
    {
      image: lidahk,
      title: "Kue Kering",
      subTitle: "Homemade",
      description: "Kue kering renyah dan lezat, perfect untuk oleh-oleh",
    },
    {
      image: wkwkwkwk,
      title: "Nasi and Asinan",
      subTitle: "Fresh",
      description: "Menu nasi dan asinan segar untuk acara apapun",
    },
  ];

  // Hero button click handler
  const handleClick = () => {
    setIsButtonLoading(true);
    // Navigate without resetting loading state
    // State akan otomatis reset saat komponen unmount ketika halaman beralih
    router.push("/katalog");
    // Tidak perlu reset isButtonLoading karena komponen akan unmount
  };

  // Featured product button click handler
  const handleFeaturedProductClick = (index: number, searchParam: string) => {
    setProcessingProductIndex(index); // Set processing state for this button
    router.push(`/katalog?search=${encodeURIComponent(searchParam)}`);
    // No need to reset state here, navigation will handle unmount/remount
  };

  // Track whether to show the heavy components
  const [showComponents, setShowComponents] = useState(false);

  useEffect(() => {
    // Delay loading heavy components until after initial render
    const timer = setTimeout(() => {
      setShowComponents(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center shadow-2xl p-8 rounded-xl mb-16 bg-white/90">
          <h1
            className="text-6xl font-bold mb-4 text-purple-900"
            id="main-title"
          >
            Rano Cake
          </h1>
          <p className="text-2xl mb-8 text-purple-700">
            Kue Lezat untuk Setiap Momen Spesial
          </p>
          <div className="flex justify-center">
            <Tombol
              size="lg"
              color="default"
              variant="ghost"
              radius="lg"
              className=" bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              startContent={<ShoppingCart size={20} />}
              label={isButtonLoading ? "Loading..." : "Pesan Sekarang"}
              isLoading={isButtonLoading}
              onPress={handleClick}
            />
          </div>
        </div>

        {/* Stats Section */}
        <section className="mb-16">
          <div className="bg-pink-500 w-20 h-20">test</div>
          <h2 className="text-3xl font-bold text-center mb-12 text-purple-900 font-serif">
            Rano Cake dalam Angka
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index}>
                <Card
                  shadow="md"
                  className="p-6 text-center bg-white/90 border-2 border-purple-200 rounded-xl overflow-hidden"
                >
                  <CardBody>
                    <div className="text-5xl font-extrabold text-purple-600">
                      {stat.value.toLocaleString()}
                    </div>
                    <p className="mt-4 text-lg font-medium text-gray-700">
                      {stat.label}
                    </p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className={`${title({ color: "pink" })} font-serif`}>
              Koleksi Rano Cake
            </h2>
            <p className={`${subtitle()} mt-2 text-gray-600`}>
              Temukan berbagai pilihan kue lezat untuk setiap momen spesial Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <div key={index}>
                <Card
                  shadow="md"
                  className="group bg-white/90 border-2 border-purple-200 rounded-xl hover:shadow-lg dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <CardBody className="p-0">
                    <div className="relative overflow-hidden rounded-t-xl">
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={CARD_IMAGE_SIZE.width}
                        height={CARD_IMAGE_SIZE.height}
                        className="w-full h-64 object-cover"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {product.subTitle}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {product.description}
                      </p>
                      <Button
                        color="primary"
                        variant="shadow"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onPress={() =>
                          handleFeaturedProductClick(index, product.title)
                        }
                        // Disable if another product button is being processed
                        isDisabled={
                          processingProductIndex !== null &&
                          processingProductIndex !== index
                        }
                        // Menampilkan spinner saat tombol sedang diproses
                        isLoading={processingProductIndex === index}
                      >
                        Lihat Detail Produk
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Load heavy components after initial render */}
        {showComponents && (
          <>
            <InfoSection />
            <Testimonials />
          </>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
