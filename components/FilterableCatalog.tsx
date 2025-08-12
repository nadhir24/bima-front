"use client";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button as NextUIButton } from "@heroui/button";
import { Input } from "@heroui/input";
import { Slider } from "@heroui/slider";
import { Skeleton } from "@heroui/skeleton";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";

interface Size {
  size: string;
  price: string;
}

interface Catalog {
  id: number;
  name: string;
  categorySlug: string;
  image: string | null;
  sizes: Size[];
  qty: string;
  productSlug: string;
  description: string;
  isEnabled: boolean;
}

interface FilterableCatalogProps {
  initialCategory?: string | null;
}

// Memisahkan komponen katalog item ke komponen terpisah dengan memo
const CatalogItem = memo(
  ({
    catalog,
    onViewDetails,
    isLoading,
    isDisabled,
  }: {
    catalog: Catalog;
    onViewDetails: (
      id: number,
      categorySlug: string,
      productSlug: string
    ) => void;
    isLoading: boolean;
    isDisabled: boolean;
  }) => {
    return (
      <Card
        key={`catalog-${catalog.id}`}
        className="shadow-lg dark:bg-zinc-800"
      >
        <CardBody>
          <div className="relative w-full aspect-square mb-4">
            {catalog.image ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}${catalog.image}`}
                alt={catalog.name || "Product Image"}
                width={500}
                height={500}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  borderRadius: "0.5rem"
                }}
                priority={false}
                unoptimized={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">
                  No Image
                </span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2 capitalize truncate">
            {catalog.name}
          </h3>
          <h1>
            Starting from{" "}
            <span className="font-bold">
              {(() => {
                if (!catalog.sizes || catalog.sizes.length === 0) return "-";
                const minPrice = Math.min(
                  ...catalog.sizes.map(
                    (size) => parseInt(size.price.replace(/[^0-9]/g, "")) || 0
                  )
                );
                return `Rp${minPrice.toLocaleString("id-ID")}`;
              })()}
            </span>
          </h1>
          <p className="text-sm  mb-4 line-clamp-2">{catalog.description}</p>
        </CardBody>
        <CardFooter>
          <NextUIButton
            color="primary"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onPress={() =>
              onViewDetails(
                catalog.id,
                catalog.categorySlug,
                catalog.productSlug
              )
            }
            isDisabled={isDisabled}
            isLoading={isLoading}
          >
            View Details
          </NextUIButton>
        </CardFooter>
      </Card>
    );
  }
);

CatalogItem.displayName = "CatalogItem";

// Filter Sidebar Komponen Terpisah
const FilterSidebar = memo(
  ({
    filter,
    priceRange,
    filterByQuantity,
    onFilterChange,
    onPriceRangeChange,
    onQuantityFilterChange,
  }: {
    filter: string;
    priceRange: number[];
    filterByQuantity: boolean;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPriceRangeChange: (value: number | number[]) => void;
    onQuantityFilterChange: () => void;
  }) => {
    return (
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-4">
          <Card className="shadow-lg p-4 dark:bg-zinc-800">
            <h3 className="text-xl font-semibold mb-4">Filter Options</h3>
            <Input
              placeholder="Search products or categories..."
              value={filter}
              onChange={onFilterChange}
              className="mb-4 w-full"
            />
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Price Range</h4>
              <div className="px-2">
                <Slider
                  label="Select price range"
                  step={50000}
                  maxValue={10000000}
                  minValue={0}
                  value={priceRange}
                  onChange={onPriceRangeChange}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Rp {priceRange[0].toLocaleString("id-ID")}</span>
                  <span>Rp {priceRange[1].toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                id="available-products-checkbox"
                type="checkbox"
                checked={filterByQuantity}
                onChange={onQuantityFilterChange}
                className="mr-2 w-4 h-4 rounded dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-zinc-800"
              />
              <label htmlFor="available-products-checkbox" className="text-sm">Show only available products</label>
            </div>
          </Card>
        </div>
      </div>
    );
  }
);

FilterSidebar.displayName = "FilterSidebar";

export default function FilterableCatalog({
  initialCategory,
}: FilterableCatalogProps) {
  const [filter, setFilter] = useState(initialCategory || "");
  const [filterByQuantity, setFilterByQuantity] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [filteredCatalogs, setFilteredCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [loadingItems, setLoadingItems] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Effect to apply initial filter immediately when catalogs are loaded and initialCategory exists
  useEffect(() => {
    if (initialCategory && catalogs.length > 0) {
      // Normalisasi initialCategory (yang merupakan search query dari home)
      const normalizedSearchQuery = initialCategory
        .toLowerCase()
        .replace(/-/g, " "); // Tetap normalisasi spasi jika ada

      // Filter berdasarkan nama produk ATAU categorySlug
      const filtered = catalogs.filter((catalog) => {
        const catalogNameNormalized = catalog.name.toLowerCase();
        const catalogCategoryNormalized = catalog.categorySlug
          .toLowerCase()
          .replace(/-/g, " ");
        // Cek apakah nama produk ATAU slug kategori mengandung query pencarian
        return (
          catalogNameNormalized.includes(normalizedSearchQuery) ||
          catalogCategoryNormalized.includes(normalizedSearchQuery)
        );
      });

      setFilteredCatalogs(filtered);
    }
  }, [initialCategory, catalogs]);

  // Fetch catalog data from the API
  useEffect(() => {
    const fetchCatalogs = async () => {
      if (catalogs.length > 0) return; // Hanya fetch jika belum ada data

      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/catalog/`
        );

        // Filter hanya produk yang enabled
        const enabledCatalogs = response.data.filter(
          (catalog: Catalog) => catalog.isEnabled
        );
        setCatalogs(enabledCatalogs);

        // Set filteredCatalogs berdasarkan initialCategory jika ada setelah fetch
        if (initialCategory) {
          const normalizedSearchQuery = initialCategory
            .toLowerCase()
            .replace(/-/g, " ");
          const filtered = enabledCatalogs.filter((catalog: Catalog) => {
            const catalogNameNormalized = catalog.name.toLowerCase();
            const catalogCategoryNormalized = catalog.categorySlug
              .toLowerCase()
              .replace(/-/g, " ");
            return (
              catalogNameNormalized.includes(normalizedSearchQuery) ||
              catalogCategoryNormalized.includes(normalizedSearchQuery)
            );
          });
          setFilteredCatalogs(filtered);
        } else {
          setFilteredCatalogs(enabledCatalogs); // Tampilkan semua jika tidak ada initialCategory
        }
      } catch (error) {
        setError("Gagal memuat katalog. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []); // Fetch hanya sekali saat komponen di-mount

  // Membuat handler terpisah untuk debounce
  const debouncedFilter = useCallback(
    debounce((value: string) => {
      const filtered = catalogs.filter((catalog) => {
        const catalogNameNormalized = catalog.name.toLowerCase();
        const catalogCategoryNormalized = catalog.categorySlug
          .toLowerCase()
          .replace(/-/g, " ");
        const searchValueNormalized = value.toLowerCase();

        return (
          catalogNameNormalized.includes(searchValueNormalized) ||
          catalogCategoryNormalized.includes(searchValueNormalized)
        );
      });
      setFilteredCatalogs(filtered);

      // Update URL dengan delay untuk mengurangi perubahan URL yang terlalu sering
      const currentParams = new URLSearchParams(window.location.search);
      if (value) {
        currentParams.set("search", value);
      } else {
        currentParams.delete("search");
      }

      router.replace(
        `${window.location.pathname}?${currentParams.toString()}`,
        {
          scroll: false,
        }
      );
    }, 300),
    [catalogs, router]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setFilter(searchValue);
      debouncedFilter(searchValue);
    },
    [debouncedFilter]
  );

  // Handle price range changes
  const handlePriceRangeChange = useCallback(
    (value: number | number[]) => {
      if (Array.isArray(value)) {
        setPriceRange(value);

        const filtered = catalogs.filter((catalog) =>
          catalog.sizes.some((size) => {
            const price = parseFloat(size.price.replace(/[^0-9.-]+/g, ""));
            return price >= value[0] && price <= value[1];
          })
        );
        setFilteredCatalogs(filtered);
      }
    },
    [catalogs]
  );

  // Handle quantity filter
  const handleQuantityFilter = useCallback(() => {
    setFilterByQuantity((prev) => {
      const newValue = !prev;

      const filtered = newValue
        ? catalogs.filter((catalog) => parseInt(catalog.qty) > 0)
        : catalogs;
      setFilteredCatalogs(filtered);

      return newValue;
    });
  }, [catalogs]);

  // Navigate to product detail page
  const handleViewDetails = useCallback(
    (catalogId: number, categorySlug: string, productSlug: string) => {
      setLoadingItems((prev) => ({ ...prev, [catalogId]: true }));
      setProcessingItemId(catalogId);

      setTimeout(() => {
        router.push(`/katalog/${categorySlug}/${productSlug}`);
      }, 100);
    },
    [router]
  );

  // Memoized item status untuk mencegah re-render yang tidak perlu
  const getItemStatus = useCallback(
    (catalogId: number) => {
      return {
        isLoading: loadingItems[catalogId] || false,
        isDisabled:
          loadingItems[catalogId] ||
          (processingItemId !== null && processingItemId !== catalogId),
      };
    },
    [loadingItems, processingItemId]
  );

  // Memoize catalog grid untuk mencegah re-render yang tidak perlu
  const catalogGrid = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="shadow-lg dark:bg-zinc-800">
              <CardBody>
                <div className="w-full aspect-square rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 rounded-md dark:bg-gray-700" />
                  <Skeleton className="h-4 w-full rounded-md dark:bg-gray-700" />
                  <Skeleton className="h-4 w-1/2 rounded-md dark:bg-gray-700" />
                </div>
              </CardBody>
              <CardFooter className="pt-0">
                <Skeleton className="h-10 w-full rounded-md dark:bg-gray-700" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-500">
          <p>{error}</p>
        </div>
      );
    }

    if (filteredCatalogs.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <p>No products match your filters.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCatalogs.map((catalog) => {
          const status = getItemStatus(catalog.id);
          return (
            <CatalogItem
              key={`catalog-${catalog.id}`}
              catalog={catalog}
              onViewDetails={handleViewDetails}
              isLoading={status.isLoading}
              isDisabled={status.isDisabled}
            />
          );
        })}
      </div>
    );
  }, [filteredCatalogs, isLoading, error, getItemStatus, handleViewDetails]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4 relative">
        <FilterSidebar
          filter={filter}
          priceRange={priceRange}
          filterByQuantity={filterByQuantity}
          onFilterChange={handleFilterChange}
          onPriceRangeChange={handlePriceRangeChange}
          onQuantityFilterChange={handleQuantityFilter}
        />

        <div className="flex-1 min-h-screen">{catalogGrid}</div>
      </div>
    </div>
  );
}
