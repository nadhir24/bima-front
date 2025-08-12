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
import { useToast } from "@/hooks/use-toast";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const router = useRouter();
  const { toast, dismiss } = useToast();
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

  const handleDelete = async (productId: number) => {
    setProductToDelete(productId);

    await Promise.resolve();

    const toastId = toast({
      title: "Delete Product",
      description: "Are you sure you want to delete this product?",
      variant: "destructive",
      duration: 5000,
      action: (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dismiss(toastId.id);
              setProductToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              dismiss(toastId.id);
              await confirmDelete(productId);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    });
  };

  const confirmDelete = async (id: number) => {
    if (!id || typeof id !== "number" || isNaN(id)) {
      toast({
        title: "Error",
        description: "Invalid product ID provided.",
        variant: "destructive",
      });
      setProductToDelete(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
          duration: 3000,
        });
      } else {
        const deleteUrl = `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}`;
        
        console.log(`Attempting to delete product with ID: ${id}`);
        console.log(`Delete URL: ${deleteUrl}`);

        const response = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`Delete response status: ${response.status}`);
        
        // Handle response based on status code
        if (response.status === 400) {
          console.log("Received 400 error, attempting to parse response");
          // Try to get the response text first to check what we're dealing with
          const responseText = await response.text();
          console.log("Response text:", responseText);
          
          let errorMessage = "Bad request. Please check product details.";
          
          // Try to parse as JSON if it looks like JSON
          if (responseText.trim().startsWith('{')) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
              
              // Check if this is a reference constraint error (sizes)
              if (errorMessage.includes("referenced by other data") || errorMessage.includes("sizes")) {
                // Show force delete option for sizes issue
                const forceToastId = toast({
                  title: "Related Data Found",
                  description: "Cannot delete this product because it has related data (sizes). Would you like to force delete this product and all its related data?",
                  variant: "destructive",
                  duration: 10000,
                  action: (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dismiss(forceToastId.id);
                          setProductToDelete(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          dismiss(forceToastId.id);
                          await forceDelete(id);
                        }}
                      >
                        Force Delete
                      </Button>
                    </div>
                  ),
                });
                return;
              }
            } catch (parseError) {
              console.error("Failed to parse JSON from 400 response:", parseError);
            }
          }
          
          toast({
            title: "Delete Failed",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
          setProductToDelete(null);
          return;
        }
        
        // For all other non-success responses
        if (!response.ok) {
          try {
            const responseText = await response.text();
            console.log("Error response text:", responseText);
            
            let responseData = null;
            // Try to parse the response as JSON if it looks like it
            if (responseText.trim().startsWith('{')) {
              try {
                responseData = JSON.parse(responseText);
              } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
              }
            }

            // Cek apakah error karena produk ada di keranjang
            if (
              response.status === 409 &&
              (responseData?.message?.includes("cart") || responseText.includes("cart"))
            ) {
              // Tampilkan dialog untuk konfirmasi force delete
              const forceToastId = toast({
                title: "Product In Cart",
                description:
                  "This product can't be deleted because it's in customer carts. Do you want to force delete it? This will remove the product from all carts.",
                variant: "destructive",
                duration: 10000,
                action: (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        dismiss(forceToastId.id);
                        setProductToDelete(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        dismiss(forceToastId.id);
                        await forceDelete(id);
                      }}
                    >
                      Force Delete
                    </Button>
                  </div>
                ),
              });
              return;
            }

            // Check if this is a reference constraint error (sizes or other relations)
            if (
              responseData?.message?.includes("referenced by other data") || 
              responseData?.message?.includes("sizes") ||
              responseText.includes("referenced by other data") ||
              responseText.includes("sizes")
            ) {
              // Show force delete option for reference constraint issue
              const forceToastId = toast({
                title: "Related Data Found",
                description: "Cannot delete this product because it has related data. Would you like to force delete this product and all its related data?",
                variant: "destructive",
                duration: 10000,
                action: (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        dismiss(forceToastId.id);
                        setProductToDelete(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        dismiss(forceToastId.id);
                        await forceDelete(id);
                      }}
                    >
                      Force Delete
                    </Button>
                  </div>
                ),
              });
              return;
            }

            throw new Error(
              responseData?.message || 
              `Delete failed: ${responseText || response.statusText} (Status: ${response.status})`
            );
          } catch (parseError) {
            console.error("Error handling delete response:", parseError);
            throw new Error(
              `Delete failed (Status: ${response.status}). Please try again.`
            );
          }
        } else {
          let successMessage = "Product deleted successfully";
          
          try {
            const responseData = await response.json();
            console.log("Delete success response:", responseData);
            if (responseData?.message) {
              successMessage = responseData.message;
            }
          } catch (parseError) {
            console.log("No JSON in success response");
          }

          toast({
            title: "Success",
            description: successMessage,
            variant: "default",
            duration: 3000,
          });

          await fetchProducts(currentPage);
        }
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setProductToDelete(null);
    }
  };

  // Tambahkan fungsi baru untuk force delete
  const forceDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const forceDeleteUrl = `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}/force`;
      console.log(`Attempting force delete for product ID: ${id}`);
      console.log(`Force delete URL: ${forceDeleteUrl}`);

      const response = await fetch(forceDeleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Force delete response status: ${response.status}`);

      if (!response.ok) {
        // Get response text first
        const responseText = await response.text();
        console.log("Force delete error response:", responseText);
        
        let errorMessage = `Failed to force delete product (Status: ${response.status})`;
        
        // Try to parse as JSON if possible
        if (responseText.trim().startsWith('{')) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Failed to parse JSON from force delete error:", parseError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Get response data for success message
      let successMessage = "Product successfully removed.";
      let removedCount = 0;
      
      try {
        const responseText = await response.text();
        console.log("Force delete success response:", responseText);
        
        if (responseText.trim().startsWith('{')) {
          const responseData = JSON.parse(responseText);
          removedCount = responseData.count || 0;
        }
      } catch (error) {
        console.log("No parsable JSON in success response");
      }

      toast({
        title: "Success",
        description: `Product deleted successfully${removedCount > 0 ? `. ${removedCount} items were removed from carts.` : ''}`,
        variant: "default",
        duration: 3000,
      });

      await fetchProducts(currentPage);
    } catch (error) {
      console.error("Force delete error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to force delete product",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setProductToDelete(null);
    }
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
                const minPrice = Math.min(
                  ...product.sizes.map((size) => size.price)
                );
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
                        className={`font-bold ${isAvailable ? "text-green-600" : "text-red-600"}`}
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
