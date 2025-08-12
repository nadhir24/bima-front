"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PencilIcon, Trash2Icon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

interface Size {
  id: number;
  size: string;
  price: number;
  qty: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  image: string;
  isEnabled: boolean;
  productSlug: string;
  sizes: Size[];
}

interface ProductsResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const router = useRouter();

  const ITEMS_PER_PAGE = 10;

  const fetchProducts = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      const data: ProductsResponse = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      setProducts([]);
      toast.error("Failed to fetch products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleDelete = (productId: number) => {
    setProductToDelete(productId);
    toast.error("Are you sure you want to delete this product?", {
      action: {
        label: "Delete",
        onClick: () => confirmDelete(productId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => setProductToDelete(null),
      },
    });
  };

  const forceDelete = async (id: number) => {
    const promise = async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}/force`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to force delete product.");
      }
      return response.json();
    };

    toast.promise(promise(), {
      loading: "Force deleting product...",
      success: (data) => {
        fetchProducts(currentPage);
        return `Product and related data force deleted successfully`;
      },
      error: (err) => err.message,
      finally: () => setProductToDelete(null),
    });
  };

  const confirmDelete = async (id: number) => {
    const promise = async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "An unknown error occurred";

        if (errorMessage.includes("referenced by other data") || errorMessage.includes("sizes") || errorMessage.includes("cart")) {
            toast.error(errorMessage, {
                id: 'action-toast',
                action: { label: "Force Delete", onClick: () => forceDelete(id) },
                cancel: { label: "Cancel", onClick: () => setProductToDelete(null) },
                duration: 10000,
            });
            // Throw a specific error to prevent the default error toast from showing
            throw new Error("ACTION_REQUIRED"); 
        }
        throw new Error(errorMessage);
      }
      return response.json();
    };

    toast.promise(promise(), {
        loading: 'Deleting product...',
        success: (data) => {
            fetchProducts(currentPage);
            return "Product deleted successfully";
        },
        error: (err) => {
            // Don't show a toast if it's the special action-required case
            if (err.message === "ACTION_REQUIRED") return null;
            return err.message || 'Failed to delete product.';
        },
        finally: () => {
            setProductToDelete(null);
        }
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button
          onClick={() => router.push("/admin/dashboard/products/add")}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Add Product"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Starting Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const minPrice =
                  product.sizes.length > 0
                    ? Math.min(...product.sizes.map((size) => size.price))
                    : 0;
                const isAvailable = product.sizes.some((size) => size.qty > 0);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative w-16 h-16">
                        <Image
                          src={
                            product.image
                              ? `${process.env.NEXT_PUBLIC_API_URL}${product.image}`
                              : "/default-product.jpg"
                          }
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatPrice(minPrice)}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          isAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isAvailable ? "Available" : "Out of Stock"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu
                        onOpenChange={(isOpen) => {
                          if (!isOpen && productToDelete === product.id) {
                            setProductToDelete(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingId(product.id);
                              router.push(
                                `/admin/dashboard/products/edit/${product.id}`
                              );
                            }}
                            textValue="Edit"
                          >
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              disabled={editingId === product.id}
                            >
                              {editingId === product.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Editing...
                                </>
                              ) : (
                                <>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Edit
                                </>
                              )}
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 focus:bg-red-100 focus:text-red-700"
                            disabled={productToDelete === product.id}
                            textValue="Delete"
                          >
                            {productToDelete === product.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && products.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
