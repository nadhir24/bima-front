"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Added this line
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Size {
  sizeValue: string;
  sizeUnit: string;
  price: string;
  qty: string;
}

const AddProductPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [sizes, setSizes] = useState<Size[]>([{ sizeValue: "", sizeUnit: "gram", price: "", qty: "" }]);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const units = ["gram", "kg", "pcs", "ml", "liter", "cm", "meter", "custom"];
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

  // --- size handlers (keadaan tetap sama seperti yang kamu minta) ---
  const handleSizeChange = (index: number, field: keyof Size, value: string) => {
    const newSizes = [...sizes];
    if (field === "price") {
      newSizes[index].price = value.replace(/\D/g, "");
    } else if (field === "qty") {
      newSizes[index].qty = value.replace(/\D/g, "");
    } else {
      newSizes[index][field] = value;
    }
    setSizes(newSizes);
  };

  const addSize = () => setSizes([...sizes, { sizeValue: "", sizeUnit: "gram", price: "", qty: "" }]);
  const removeSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));

  // --- image handlers (Diperbaiki: preview + validasi + pilih main image) ---
  const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);
    // filter valid types
    const filtered = selected.filter((f) => validTypes.includes(f.type));

    if (filtered.length !== selected.length) {
      toast.error("Only JPG / JPEG / PNG / WEBP / GIF are allowed");
    }

    setImages(filtered);

    // create previews (revoke not strictly necessary here, but ok)
    const urls = filtered.map((f) => URL.createObjectURL(f));
    // Revoke old urls to avoid memory leak
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls(urls);

    // reset main image index to 0 if no images -> else keep 0
    setMainImageIndex(0);
  };

  // allow clicking preview to select main image
  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  // optional: remove selected preview (keinginan tambahan, non-intrusive)
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    // revoke removed url
    URL.revokeObjectURL(previewUrls[index]);
    setImages(newImages);
    setPreviewUrls(newPreviews);
    // adjust mainImageIndex if needed
    if (mainImageIndex >= newImages.length) {
      setMainImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  // --- submit (tetap pakai axios ke NEXT_PUBLIC_API_URL yang kamu minta) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("description", description.trim());
      formData.append("isEnabled", String(isEnabled));
      formData.append("mainImageIndex", String(mainImageIndex));

      const sizesToSend = sizes.map(s => ({
        size: s.sizeUnit === "custom" ? s.sizeValue : `${s.sizeValue} ${s.sizeUnit}`,
        price: Number(s.price),
        qty: Number(s.qty),
      }));
      formData.append("sizes", JSON.stringify(sizesToSend));

      images.forEach((file) => formData.append("images", file));

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/catalog`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product added!");
      router.push("/admin/dashboard/products");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div>
              <Label className="block mb-2">Sizes & Pricing</Label>
              {sizes.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input
                    placeholder="Value"
                    value={s.sizeValue}
                    onChange={e => handleSizeChange(i, "sizeValue", e.target.value)}
                    required
                  />

                  {/* Correct Select structure for unit */}
                  <Select value={s.sizeUnit} onValueChange={v => handleSizeChange(i, "sizeUnit", v)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Price"
                    type="number"
                    value={s.price}
                    onChange={e => handleSizeChange(i, "price", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Qty"
                    type="number"
                    value={s.qty}
                    onChange={e => handleSizeChange(i, "qty", e.target.value)}
                    required
                  />
                  <Button type="button" variant="ghost" onClick={() => removeSize(i)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSize}>
                <PlusCircle size={16} className="mr-2" /> Add Size
              </Button>
            </div>

            {/* === IMAGES SECTION (DIPERBAIKI) === */}
            <div>
              <Label>Images</Label>
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImages}
              />

              {previewUrls.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {previewUrls.map((src, idx) => (
                    <div key={idx} className="relative w-28 h-28 border rounded overflow-hidden">
                      <Image
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        width={112} // Corresponds to w-28
                        height={112} // Corresponds to h-28
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleSetMainImage(idx)}
                        priority
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-white bg-opacity-70 rounded-full p-0.5"
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>

                      {mainImageIndex === idx && (
                        <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Enabled</Label>
              <Checkbox
                id="isEnabled"
                checked={isEnabled}
                onCheckedChange={(checked) => setIsEnabled(checked === true)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default AddProductPage;
