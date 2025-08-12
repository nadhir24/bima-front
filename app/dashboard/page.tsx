"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";

// Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  id?: number;
  fullName: string;
  email?: string;
  phoneNumber: string;
  photoProfile?: string;
  userProfile?: {
    address?: {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

interface Invoice {
  id: number;
  midtransOrderId: string;
  status: string;
  totalAmount: number;
  amount?: number;
  createdAt: string;
  items: Array<{
    id: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
  midtransInvoicePdfUrl?: string;
  shippingAddress?: string;
  shippingDistrict?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, setUserState } = useAuth();

  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: "",
    phoneNumber: "",
    userProfile: {
      address: {
        label: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Indonesia",
      },
    },
  });

  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Avatar preview URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const imageName = user?.photoProfile?.split("/").pop() || "";
  const imageUrl =
    user?.photoProfile && imageName
      ? `${apiBaseUrl}/uploads/users/${imageName}`
      : "/defaultpp.svg";

  // Load user data on mount
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/");
    }

    if (user) {
      if (!user.userProfile) {
        user.userProfile = {
          addresses: [],
        };
      }

      const userAddress = getUserPrimaryAddress(user);
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        userProfile: {
          address: {
            label: userAddress?.label || "Rumah",
            street: userAddress?.street || "",
            city: userAddress?.city || "",
            state: userAddress?.state || "",
            postalCode: userAddress?.postalCode || "12345",
            country: userAddress?.country || "Indonesia",
          },
        },
      });
      setImagePreview(imageUrl);
    }
  }, [user, isLoading, router, imageUrl]);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoadingInvoices(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/invoice/user?userId=${user.id}&page=${currentPage}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil riwayat pesanan");

      const data = await res.json();

      const processedInvoices = data.data.map((invoice: any) => {
        return {
          ...invoice,
          items: Array.isArray(invoice.items)
            ? invoice.items.map((item: any) => ({
                id: item.id,
                productName: item.productName || item.name || "Unnamed Product",
                quantity: item.quantity || 1,
                price: item.price || 0,
              }))
            : [],
          shippingAddress: invoice.shippingAddress || null,
          shippingDistrict: invoice.shippingDistrict || null,
          shippingCity: invoice.shippingCity || null,
          shippingProvince: invoice.shippingProvince || null,
          shippingPostalCode: invoice.shippingPostalCode || null,
          totalAmount:
            invoice.totalAmount ||
            invoice.amount ||
            invoice.total ||
            (Array.isArray(invoice.items)
              ? invoice.items.reduce(
                  (sum: number, item: any) =>
                    sum + (item.price || 0) * (item.quantity || 1),
                  0
                )
              : 0),
        };
      });

      setInvoices(processedInvoices || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error("Gagal memuat riwayat pesanan.");
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [user?.id, currentPage]);

  // Load order history
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getUserPrimaryAddress = (userData: any) => {
    if (
      userData.userProfile?.addresses &&
      Array.isArray(userData.userProfile.addresses) &&
      userData.userProfile.addresses.length > 0
    ) {
      const defaultAddress =
        userData.userProfile.addresses.find((addr: any) => addr.isDefault) ||
        userData.userProfile.addresses[0];
      return defaultAddress;
    }

    if (userData.userProfile?.address) {
      return userData.userProfile.address;
    }

    return {
      label: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Indonesia",
    };
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => {
        const updated = {
          ...prev,
          userProfile: {
            ...prev.userProfile,
            address: {
              ...(prev.userProfile?.address || {}),
              [field]: value,
            },
          },
        };
        return updated;
      });
    } else {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value };
        return updated;
      });
    }
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setImagePreview(imageUrl); // Reset to current profile photo
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = user?.id;
    if (!userId) {
      toast.error("User ID tidak ditemukan. Silakan login ulang.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Sesi tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    // Validate JWT
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      if (Date.now() / 1000 > exp) {
        toast.error("Token telah kadaluarsa. Silakan login kembali.");
        localStorage.removeItem("token");
        router.push("/");
        return;
      }
    } catch (err) {
      toast.error("Token tidak valid. Silakan login kembali.");
      localStorage.removeItem("token");
      router.push("/");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Menyimpan perubahan...");

    try {
      // Prepare FormData for profile update
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName || "");
      formDataToSend.append("phoneNumber", formData.phoneNumber || "");

      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }

      // Update user profile
      const profileResponse = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user address
      const address = formData.userProfile?.address;
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/addresses`,
        {
          label: address?.label,
          street: address?.street,
          city: address?.city,
          state: address?.state,
          postalCode: address?.postalCode || "12345",
          country: address?.country || "Indonesia",
          isDefault: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh user data
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserState(res.data);
      toast.success("Profil dan alamat berhasil diperbarui!");
      setSelectedFile(null);
      // Perbarui imagePreview dengan URL yang benar setelah submit
      const updatedImageName = res.data?.photoProfile?.split("/").pop() || "";
      const newImageUrl = updatedImageName
        ? `${apiBaseUrl}/uploads/users/${updatedImageName}`
        : "/defaultpp.svg";
      setImagePreview(newImageUrl);
      setIsEditing(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat menyimpan data.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  // Format currency and date
  const formatCurrency = (amount: number | undefined | null) => {
    const numAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Filter orders
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.midtransOrderId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.items.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Dashboard Pengguna</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>
                  Perbarui detail pribadi Anda di sini.
                </CardDescription>
              </div>

              {!isEditing && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                >
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Foto Profil */}
                <div className="space-y-3">
                  <Label htmlFor="photo" className="text-md font-medium">
                    Upload Profile Picture
                  </Label>

                  <div className="flex flex-col space-y-3">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={!isEditing}
                      className={
                        !isEditing ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />

                    {imagePreview && (
                      <div className="flex items-center space-x-3">
                        <p className="text-sm text-gray-600">Preview:</p>
                        <Image
                          src={imagePreview}
                          alt="Profile Preview"
                          width={64}
                          height={64}
                          className="rounded-full object-cover border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Nomor Telepon */}
                <div>
                  <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Alamat */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alamat</h3>
                  <div>
                    <Label htmlFor="address.label">Label Alamat</Label>
                    <Input
                      id="address.label"
                      name="address.label"
                      value={formData.userProfile?.address?.label || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.street">Alamat Lengkap</Label>
                    <Input
                      id="address.street"
                      name="address.street"
                      value={formData.userProfile?.address?.street || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.city">Kota</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      value={formData.userProfile?.address?.city || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.state">Provinsi</Label>
                    <Input
                      id="address.state"
                      name="address.state"
                      value={formData.userProfile?.address?.state || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.postalCode">Kode Pos</Label>
                    <Input
                      id="address.postalCode"
                      name="address.postalCode"
                      value={formData.userProfile?.address?.postalCode || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Tombol Aksi */}
                {isEditing && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedFile(null);
                        setImagePreview(imageUrl);
                      }}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pesanan Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pesanan</CardTitle>
              <CardDescription>
                Lihat dan kelola riwayat pesanan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search & Filter */}
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Cari berdasarkan ID atau nama produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border px-3 py-2 rounded-md bg-white dark:bg-black"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SETTLEMENT">SETTLEMENT</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">DELIVERED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRE">EXPIRE</option>
                  <option value="Ditolak">DENY</option>
                </select>
              </div>

              {/* Orders Table */}
              {isLoadingInvoices ? (
                <div className="text-center py-4">Memuat...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-4">
                  Tidak ada pesanan ditemukan
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          ID Pesanan
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Alamat
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4">
                            {invoice.midtransOrderId}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(invoice.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium">
                                {invoice.shippingAddress}
                              </p>
                              <p className="text-gray-500">
                                {invoice.shippingDistrict &&
                                invoice.shippingCity
                                  ? `${invoice.shippingDistrict}, ${invoice.shippingCity}`
                                  : invoice.shippingCity ||
                                    invoice.shippingDistrict ||
                                    ""}
                              </p>
                              <p className="text-gray-500">
                                {invoice.shippingProvince &&
                                invoice.shippingPostalCode
                                  ? `${invoice.shippingProvince} ${invoice.shippingPostalCode}`
                                  : invoice.shippingProvince ||
                                    invoice.shippingPostalCode ||
                                    ""}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {invoice.items.map((item) => (
                              <div key={item.id}>
                                {item.productName} x{item.quantity}
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4">
                            {invoice.totalAmount === 0 &&
                            Array.isArray(invoice.items) &&
                            invoice.items.length > 0
                              ? formatCurrency(
                                  invoice.items.reduce(
                                    (sum, item) =>
                                      sum + item.price * item.quantity,
                                    0
                                  )
                                )
                              : formatCurrency(
                                  invoice.totalAmount || invoice.amount
                                )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-sm ${
                                invoice.status === "PROCESSING"
                                  ? "bg-blue-100 text-blue-700"
                                  : invoice.status === "SHIPPED"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : ["DELIVERED", "SETTLEMENT"].includes(
                                          invoice.status
                                        )
                                      ? "bg-green-100 text-green-700"
                                      : invoice.status === "CANCELLED"
                                        ? "bg-red-100 text-red-700"
                                        : invoice.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {[
                              "SETTLEMENT",
                              "PROCESSING",
                              "SHIPPED",
                              "DELIVERED",
                            ].includes(invoice.status) &&
                              invoice.midtransInvoicePdfUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      invoice.midtransInvoicePdfUrl!,
                                      "_blank"
                                    )
                                  }
                                >
                                  PDF
                                </Button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!pagination.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <span className="py-2 px-4">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(pagination.totalPages, prev + 1)
                        )
                      }
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
