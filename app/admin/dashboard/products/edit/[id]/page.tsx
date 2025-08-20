"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, PlusCircle, Trash2, LucideEdit, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Helper Functions ---

// Parses a size string like "100 gram" into value and unit
const parseSizeString = (
  sizeStr: string | null | undefined
): { value: string; unit: string } => {
  if (!sizeStr) return { value: "", unit: "gram" }; // Default unit
  
  // If there's no space, assume it's a custom size name (no unit)
  if (!sizeStr.includes(' ')) {
    return { value: sizeStr, unit: "custom" };
  }
  
  const match = sizeStr.match(/^(\d*\.?\d+)\s*([a-zA-Z%]+)$/);
  if (match) {
    return { value: match[1], unit: match[2] || "gram" };
  }
  
  // Try to extract unit if there's a space
  const parts = sizeStr.split(' ');
  const lastPart = parts[parts.length - 1].toLowerCase();
  
  // Check if last part is a known unit
  if (['gram', 'kg', 'pcs', 'ml', 'liter', 'cm', 'meter'].includes(lastPart)) {
    return { 
      value: parts.slice(0, -1).join(' '), 
      unit: lastPart 
    };
  }
  
  // If no known unit or no space, treat as custom
  return { value: sizeStr, unit: "custom" };
};

// Formats a number string with thousand separators (e.g., 100000 -> 100.000)
const formatNumber = (value: string): string => {
  if (!value) return "";
  const numberValue = parseInt(value.replace(/\D/g, ''), 10);
  if (isNaN(numberValue)) return "";
  return new Intl.NumberFormat('id-ID').format(numberValue);
};

// Removes formatting from currency string (e.g., "100.000" -> "100000")
const unformatCurrency = (value: string): string => {
  return String(value).replace(/\D/g, ""); // Remove everything except digits
};

// --- Interfaces ---
interface Size {
  id?: number;
  sizeValue: string;
  sizeUnit: string;
  price: string;
  qty: string;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  description: string;
  isEnabled: boolean;
  image: string | null;
  blurDataURL?: string | null;
  categorySlug: string;
  productSlug: string;
  sizes: {
    id: number;
    size: string;
    price: string;
    qty: number;
  }[];
  productImages: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// --- Component ---
const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Partial<Omit<CatalogItem, "sizes" | "productImages">>>({});
  const [sizes, setSizes] = useState<Size[]>([
    { sizeValue: "", sizeUnit: "gram", price: "", qty: "" },
  ]);
  
  // Image state variables
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [isExistingMainImage, setIsExistingMainImage] = useState<boolean>(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableUnits = ["gram", "kg", "pcs", "ml", "liter", "cm", "meter", "custom"];

  // --- Dedupe helper: merge duplicates by normalized label (value+unit) and numeric price ---
  const dedupeSizes = (list: Size[]): Size[] => {
    const map = new Map<string, Size>();
    const num = (v: any) => {
      const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };
    for (const s of list) {
      const label = s.sizeUnit === 'custom'
        ? String(s.sizeValue ?? '').trim().toLowerCase()
        : `${String(s.sizeValue ?? '').trim()} ${String(s.sizeUnit ?? '').trim().toLowerCase()}`;
      const key = `${label}|${num(s.price)}`;
      if (!map.has(key)) {
        map.set(key, { ...s });
      } else {
        const ex = map.get(key)!;
        const mergedQty = num(ex.qty) + num(s.qty);
        map.set(key, { ...ex, qty: String(mergedQty) });
      }
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}`;

      try {
        const response = await axios.get<CatalogItem>(url);
        const { sizes: backendSizes, productImages, ...productData } = response.data;
        setProduct(productData);

        // Parse backend sizes into frontend format
        setSizes(
          dedupeSizes(
            backendSizes?.map((s) => {
              const parsedSize = parseSizeString(s.size);
              const price = unformatCurrency(s.price);
              return {
                id: s.id,
                sizeValue: parsedSize.value,
                sizeUnit: parsedSize.unit,
                price: price,
                qty: String(s.qty),
              };
            }) || [{ sizeValue: "", sizeUnit: "gram", price: "", qty: "" }]
          )
        );

        // Handle existing images
        if (productImages && productImages.length > 0) {
          setExistingImages(productImages);
          
          // Find main image index
          const mainImageIndex = productImages.findIndex(img => img.isMain);
          if (mainImageIndex !== -1) {
            setMainImageIndex(mainImageIndex);
            setIsExistingMainImage(true);
          } else {
            setMainImageIndex(0);
            setIsExistingMainImage(true);
          }
        } else {
          setExistingImages([]);
          setIsExistingMainImage(false);
        }
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load product data.";
        setError(`Failed to load product data: ${message}`);
        toast.error(`Load failed: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    console.log("Current sizes state:", sizes);
  }, [sizes]);

  const handleInputChange = (
    field: keyof Omit<CatalogItem, "sizes" | "productImages">,
    value: string | boolean
  ) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSizeChange = (
    index: number,
    field: keyof Size,
    value: string
  ) => {
    const newSizes = [...sizes];
    const currentSize = { ...newSizes[index] };

    // For numeric fields, store only digits. For others (like custom size name or unit), store as is.
    if (field === "price" || field === "qty") {
      currentSize[field] = unformatCurrency(value);
    } else if (field === "sizeValue") {
      // Only strip non-digits if the unit is not 'custom'
      if (currentSize.sizeUnit !== 'custom') {
        currentSize.sizeValue = unformatCurrency(value);
      } else {
        currentSize.sizeValue = value; // Allow any text for custom size name
      }
    } else if (field === "sizeUnit") {
      currentSize.sizeUnit = value;
    }

    newSizes[index] = currentSize;
    setSizes(newSizes);
  };

  const handleUnitChange = (index: number, unit: string) => {
    const newSizes = [...sizes];
    newSizes[index].sizeUnit = unit;
    setSizes(newSizes);
  };

  const addSizeField = () => {
    console.log("Adding size field. Current count:", sizes.length);
    const newSizes = [
      ...sizes,
      { sizeValue: "", sizeUnit: "gram", price: "", qty: "" },
    ];
    console.log("New sizes count:", newSizes.length);
    setSizes(newSizes);
    
    // Show alert to verify function is called
    toast.success(`Size field added. Total: ${newSizes.length}`);
  };

  const removeSizeField = (index: number) => {
    const sizeToRemove = sizes[index];

    // If it's a new, unsaved size, just remove it from local state.
    if (!sizeToRemove.id) {
      if (sizes.length > 1) {
        const newSizes = sizes.filter((_, i) => i !== index);
        setSizes(newSizes);
        toast.success("Size field removed.");
      } else {
        toast.error("At least one size entry is required.");
      }
      return;
    }

    // If it's a saved size, confirm and call the backend to delete.
    if (sizeToRemove.id) {
      toast.promise(
        async () => {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Authentication token not found.");

          const response = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/catalog/size/${sizeToRemove.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status !== 200) {
            throw new Error(response.data.message || "Failed to delete size.");
          }

          return response.data;
        },
        {
          loading: "Deleting size...",
          success: () => {
            // On successful deletion, remove it from the local state
            const newSizes = sizes.filter((_, i) => i !== index);
            setSizes(newSizes);
            return "Size deleted successfully!";
          },
          error: (err) => err.message || "An unexpected error occurred.",
        }
      );
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setNewImages(prevImages => [...prevImages, ...selectedFiles]);
      
      // Create preview URLs for new images
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setNewImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      
      // If this is the first image and no existing main image, set as main
      if (newPreviews.length > 0 && !isExistingMainImage && mainImageIndex === -1) {
        setMainImageIndex(0);
        setIsExistingMainImage(false);
      }
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prevImages => prevImages.filter((_, i) => i !== index));
    setNewImagePreviews(prevPreviews => {
      // Release the object URL to prevent memory leaks
      URL.revokeObjectURL(prevPreviews[index]);
      return prevPreviews.filter((_, i) => i !== index);
    });
    
    // Adjust mainImageIndex if necessary
    if (!isExistingMainImage && index === mainImageIndex) {
      if (newImagePreviews.length > 1) {
        setMainImageIndex(0); // Reset to first image if main image is removed
      } else {
        setMainImageIndex(-1); // No images left
      }
    } else if (!isExistingMainImage && index < mainImageIndex) {
      setMainImageIndex(mainImageIndex - 1); // Decrease index if an image before the main one is removed
    }
  };
  
  const markExistingImageForDeletion = (id: number, index: number) => {
    setImagesToDelete(prev => [...prev, id]);
    
    // If we're deleting the main image, set a new main image
    if (isExistingMainImage && index === mainImageIndex) {
      // If we have other existing images not marked for deletion
      const remainingImages = existingImages.filter(
        (img, i) => i !== index && !imagesToDelete.includes(img.id)
      );
      
      if (remainingImages.length > 0) {
        // Use the first remaining existing image
        const newMainIndex = existingImages.findIndex(
          img => img.id === remainingImages[0].id
        );
        setMainImageIndex(newMainIndex);
      } else if (newImagePreviews.length > 0) {
        // If no existing images left, use the first new image
        setMainImageIndex(0);
        setIsExistingMainImage(false);
      } else {
        // No images left at all
        setMainImageIndex(-1);
        setIsExistingMainImage(false);
      }
    }
  };
  
  const unmarkExistingImageForDeletion = (id: number) => {
    setImagesToDelete(prev => prev.filter(imgId => imgId !== id));
  };
  
  const setAsMainImage = (index: number, isExisting: boolean) => {
    setMainImageIndex(index);
    setIsExistingMainImage(isExisting);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setIsUpdating(true);
    setError(null);

    // --- Start Validation ---
    let validationError: string | null = null;
    // Dedupe right before submit to avoid sending duplicates
    const uniqueSizes = dedupeSizes(sizes);
    const sizesToSend: Array<{ id?: number; size: string; price: string; qty: string }> = [];
    
    console.log("Submitting sizes - total count: ", sizes.length);

    for (let i = 0; i < uniqueSizes.length; i++) {
      const s = uniqueSizes[i];
      console.log(`Processing size #${i+1}:`, s);
      const priceNum = parseFloat(s.price);
      const qtyNum = parseInt(s.qty, 10);
      const sizeValueNum = parseFloat(s.sizeValue);

      if (s.sizeUnit === "custom") {
        // For custom sizes, just make sure the size name is not empty
        if (!s.sizeValue || s.sizeValue.trim() === "") {
          validationError = `Size row #${i + 1}: Size name cannot be empty.`;
          break;
        }
      } else {
        // For numeric sizes, validate that it's a positive number
      if (!s.sizeValue || isNaN(sizeValueNum) || sizeValueNum <= 0) {
        validationError = `Size row #${i + 1}: Invalid Size value. Please enter a positive number.`;
        break;
      }
      }
      
      if (!s.sizeUnit) {
        validationError = `Size row #${i + 1}: Please select a Unit.`;
        break;
      }
      if (s.price === "" || isNaN(priceNum) || priceNum < 0) {
        validationError = `Size row #${i + 1}: Invalid Price. Please enter a non-negative number.`;
        break;
      }
      if (s.qty === "" || isNaN(qtyNum) || qtyNum < 0) {
        validationError = `Size row #${i + 1}: Invalid Qty. Please enter a whole non-negative number.`;
        break;
      }

      sizesToSend.push({
        id: s.id,
        size: s.sizeUnit === "custom" ? s.sizeValue : `${s.sizeValue} ${s.sizeUnit}`,
        price: String(priceNum),
        qty: String(qtyNum),
      });
    }

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setIsUpdating(false);
      return;
    }
    // --- End Validation ---

    const formData = new FormData();

    if (product.name !== undefined) formData.append("name", product.name);
    if (product.category !== undefined)
      formData.append("category", product.category);
    if (product.description !== undefined)
      formData.append("description", product.description);
    if (product.isEnabled !== undefined)
      formData.append("isEnabled", String(product.isEnabled));

    formData.append("sizes", JSON.stringify(sizesToSend));
    
    // Handle mainImageIndex
    if (isExistingMainImage) {
      // If the main image is from existing images
      const effectiveIndex = existingImages.findIndex((_, i) => i === mainImageIndex);
      if (effectiveIndex !== -1) {
        formData.append("mainImageIndex", String(effectiveIndex));
      }
    } else {
      // If the main image is from new images
      formData.append("mainImageIndex", String(mainImageIndex));
    }
    
    // Add images to delete
    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    // Add new images
    if (newImages.length > 0) {
      newImages.forEach(image => {
        formData.append("images", image);
      });
    }

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Product updated successfully!");
      router.push("/admin/dashboard/products");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update product.";
      setError(message);
      toast.error(`Update failed: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-32" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error && !product.id) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-red-600 text-xl mb-4">Error loading product data!</p>
        <p className="text-gray-700 mb-6">{error}</p>
        <Link href="/admin/dashboard/products">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  // --- Main Form Render ---
  return (
    <div className="container mx-auto py-10">
      <Link
        href="/admin/dashboard/products"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Products
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <LucideEdit size={36} className="text-blue-600" />
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              Product Details {product.id ? `(ID: ${product.id})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={product.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={product.category || ""}
                onChange={(e) => handleInputChange("category", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                required
              />
            </div>

            <div className="grid gap-4">
              <Label className="text-base font-medium">Sizes and Pricing</Label>
              {sizes.length > 0 ? (
                sizes.map((sizeItem, index) => (
                  <div
                    key={sizeItem.id || `new-${index}`}
                    className="flex flex-wrap items-end gap-3 p-3 border rounded-md bg-gray-50/80 relative"
                  >
                    {sizeItem.id && <input type="hidden" value={sizeItem.id} />}

                    <div className="grid gap-1.5 flex-1 min-w-[100px]">
                      <Label htmlFor={`sizeValue-${index}`} className="text-xs">
                        {sizeItem.sizeUnit === "custom" ? "Size Name" : "Value"}
                      </Label>
                      <Input
                        id={`sizeValue-${index}`}
                        type="text"
                        value={
                          sizeItem.sizeUnit === "custom" 
                            ? sizeItem.sizeValue 
                            : formatNumber(sizeItem.sizeValue)
                        }
                        onChange={(e) =>
                          handleSizeChange(index, "sizeValue", e.target.value)
                        }
                        required
                        className="text-sm"
                        placeholder={sizeItem.sizeUnit === "custom" ? "e.g., Large" : "e.g., 100"}
                      />
                    </div>

                    <div className="grid gap-1.5 min-w-[100px]">
                      <Label htmlFor={`sizeUnit-${index}`} className="text-xs">
                        Unit
                      </Label>
                      <Select
                        value={sizeItem.sizeUnit}
                        onValueChange={(value) =>
                          handleUnitChange(index, value)
                        }
                        required
                      >
                        <SelectTrigger
                          id={`sizeUnit-${index}`}
                          className="text-sm w-full"
                        >
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1.5 flex-1 min-w-[150px]">
                      <Label htmlFor={`price-${index}`} className="text-xs">
                        Price (IDR)
                      </Label>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                          Rp
                        </span>
                        <Input
                          id={`price-${index}`}
                          type="text"
                          value={formatNumber(sizeItem.price)}
                          onChange={(e) =>
                            handleSizeChange(index, "price", e.target.value)
                          }
                          required
                          className="text-sm rounded-l-none"
                          placeholder="e.g., 100.000"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5 w-24">
                      <Label htmlFor={`qty-${index}`} className="text-xs">
                        Qty
                      </Label>
                      <Input
                        id={`qty-${index}`}
                        type="text"
                        value={formatNumber(sizeItem.qty)}
                        onChange={(e) =>
                          handleSizeChange(index, "qty", e.target.value)
                        }
                        required
                        className="text-sm"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 self-center mt-4"
                      onClick={() => removeSizeField(index)}
                      aria-label="Remove size"
                      disabled={sizes.length <= 1 && !!sizeItem.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No sizes added yet.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSizeField}
                className="mt-2 w-fit"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Size
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="images">
                Product Images (Select files to add more images)
              </Label>
              <Input
                id="images"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                multiple
              />
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mt-4">
                  <Label className="block mb-2">Current Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingImages.map((img, index) => (
                      <div 
                        key={`existing-${img.id}`} 
                        className={`relative border rounded-md overflow-hidden ${
                          isExistingMainImage && index === mainImageIndex ? 'ring-2 ring-blue-500' : ''
                        } ${imagesToDelete.includes(img.id) ? 'opacity-50' : ''}`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${img.imageUrl}`}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          {imagesToDelete.includes(img.id) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 bg-white/90"
                              onClick={() => unmarkExistingImageForDeletion(img.id)}
                              title="Restore image"
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markExistingImageForDeletion(img.id, index)}
                                title="Mark for deletion"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant={isExistingMainImage && index === mainImageIndex ? "default" : "outline"}
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setAsMainImage(index, true)}
                                title="Set as main image"
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                        {isExistingMainImage && index === mainImageIndex && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 text-center">
                            Main Image
                          </div>
                        )}
                        {imagesToDelete.includes(img.id) && (
                          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs py-1 text-center">
                            Will be deleted
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Images */}
              {newImagePreviews.length > 0 && (
                <div className="mt-4">
                  <Label className="block mb-2">New Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {newImagePreviews.map((src, index) => (
                      <div 
                        key={`new-${index}`} 
                        className={`relative border rounded-md overflow-hidden ${
                          !isExistingMainImage && index === mainImageIndex ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={src}
                            alt={`New product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeNewImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant={!isExistingMainImage && index === mainImageIndex ? "default" : "outline"}
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setAsMainImage(index, false)}
                            title="Set as main image"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        </div>
                        {!isExistingMainImage && index === mainImageIndex && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 text-center">
                            Main Image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {existingImages.length === 0 && newImagePreviews.length === 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">No images uploaded.</p>
                  <Image
                    src="/placeholder-image.webp"
                    alt="No image placeholder"
                    width={200}
                    height={200}
                    className="mt-2 rounded-md object-cover border bg-gray-100"
                    priority
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEnabled"
                checked={!!product.isEnabled}
                onCheckedChange={(checked) =>
                  handleInputChange("isEnabled", Boolean(checked))
                }
              />
              <Label
                htmlFor="isEnabled"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Product Enabled
              </Label>
            </div>
            {error && !isLoading && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                Update Error: {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Link href="/admin/dashboard/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default EditProductPage;
