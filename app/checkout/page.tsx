"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  TruckIcon,
  CreditCard,
  ShieldCheck,
  Package,
  AlertCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@heroui/spinner";
import React from "react";

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

interface CheckoutData {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number | null;
  estimatedDays: string;
}

interface SavedAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems: contextCartItems, cartCount, cartTotal, isLoadingCart, fetchCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
  });
  const [saveInfo, setSaveInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<string>("gojek");
  const [totalFromBackend, setTotalFromBackend] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<string>("new_address");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Add a flag to track if user has explicitly chosen to enter a new address
  const [userChoseNewAddress, setUserChoseNewAddress] = useState(false);
  
  // Gunakan useRef untuk menyimpan status sebelumnya dan mencegah fetch ulang yang tidak perlu
  const fetchedRef = React.useRef(false);
  const hasAddressesRef = React.useRef(false);

  // Optimasi pengaturan image agar tidak load ulang dan gunakan memori yang cukup
  const imageLoader = ({ src, width }: { src: string, width: number }) => {
    if (!src || src === '/blurry.svg') return '/blurry.svg';
    // Batasi ukuran gambar yang diminta
    const limitedWidth = Math.min(width, 96); // Batasi ukuran gambar
    if (src.startsWith('http')) {
      return src;
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${src}`;
  };

  const shippingMethods: ShippingMethod[] = React.useMemo(() => [
    {
      id: "free",
      name: "Pengantaran Langsung",
      description: "Gratis (Jarak 1-5km)",
      price: 0,
      estimatedDays: "1-2 hari",
    },
    {
      id: "gojek",
      name: "Gojek",
      description:
        "langsung konfirmasi nomor oreder via Whatsapp jika pesanan sudah jadi akan diberi notifikasidan ongkir ditanggung pembeli",
      price: null,
      estimatedDays: "Instant (1-2 jam)",
    },
  ], []); // Empty dependency array means it's created once

  // Transform cart context data to checkout data format
  useEffect(() => {
    if (!isLoadingCart && contextCartItems.length > 0) {
      const transformedItems = contextCartItems.map(item => ({
        id: item.id.toString(),
        name: item.catalog?.name || "",
        price: typeof item.size?.price === 'string' 
          ? parseInt(item.size.price.replace(/[^0-9]/g, "")) || 0
          : 0,
        quantity: item.quantity,
        size: typeof item.size?.size === 'string' ? item.size.size : "",
        image: item.catalog?.image || "",
      }));
      
      const subtotal = transformedItems.reduce(
        (total: number, item: CartItem) => total + item.price * item.quantity,
        0
      );
      
      const shippingCost =
        shippingMethods.find((method) => method.id === selectedShippingMethod)
          ?.price || 0;
      
      setCheckoutData({
        items: transformedItems,
        subtotal: subtotal,
        shipping: shippingCost,
        total: cartTotal || subtotal + shippingCost,
      });
      
      setTotalFromBackend(cartTotal);
    } else if (!isLoadingCart) {
      setCheckoutData({
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0
      });
      setTotalFromBackend(0);
    }
  }, [contextCartItems, cartTotal, isLoadingCart, selectedShippingMethod, shippingMethods]);

  // Use fetchCart from context instead of local implementation
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const fetchSavedAddresses = useCallback(async (userId: string) => {
    setAddressesLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setAddressesLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch saved addresses");
      }

      const addresses = await response.json();

      // Filter out duplicate addresses by comparing street values
      const uniqueAddresses = addresses.reduce(
        (acc: SavedAddress[], curr: SavedAddress) => {
          // Normalize street by removing extra spaces and lowercasing
          const normalizeText = (text: string) =>
            text?.toLowerCase().replace(/\s+/g, " ").trim() || "";

          const currStreetNormalized = normalizeText(curr.street);

          // Check if we already have an address with the same normalized street
          const isDuplicate = acc.some(
            (addr) => normalizeText(addr.street) === currStreetNormalized
          );

          if (!isDuplicate && currStreetNormalized) {
            acc.push(curr);
          }
          return acc;
        },
        []
      );

      setSavedAddresses(uniqueAddresses);
      
      // Tandai bahwa kita sudah memiliki alamat tersimpan
      if (uniqueAddresses.length > 0) {
        hasAddressesRef.current = true;
      }
    } catch (error) {
      toast.error("Gagal mengambil daftar alamat tersimpan");
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const handleAddressSelect = useCallback((addressId: string) => {
    try {
      console.log("Selecting address:", addressId);
      
      // First update the selection ID to trigger UI update
      setSelectedAddressId(addressId);
      
      if (addressId === "new_address") {
        // Reset semua field saat memilih alamat baru
        console.log("Resetting form fields for new address");
        setShippingAddress({
          firstName: "",
          lastName: "",
          email: user?.email || "",
          address: "",
          city: "",
          province: "",
          postalCode: "",
          phone: "",
        });
        setPhoneSuffix("");
        // Set the flag to true when user deliberately chooses new address
        setUserChoseNewAddress(true);
      } else {
        const selected = savedAddresses.find((addr) => 
          String(addr.id) === addressId
        );
        
        if (selected) {
          console.log("Found selected address:", selected);
          setShippingAddress({
            firstName: selected.firstName || user?.fullName?.split(' ')[0] || "",
            lastName: selected.lastName || user?.fullName?.split(' ').slice(1).join(' ') || "",
            email: selected.email || user?.email || "",
            address: selected.street || "",
            city: selected.city || "",
            province: selected.state || "",
            postalCode: selected.postalCode || "",
            phone: selected.phone || user?.phoneNumber || "",
          });
          // Perbaikan format nomor telepon
          const phoneNumber = selected.phone || user?.phoneNumber || "";
          setPhoneSuffix(phoneNumber.replace(/^\+?62|^0/, ""));
        } else {
          console.warn("Address not found:", addressId, "Available addresses:", savedAddresses.map(a => ({id: a.id, type: typeof a.id})));
        }
      }
    } catch (error) {
      console.error("Error in handleAddressSelect:", error);
      toast.error("Error selecting address");
    }
  }, [savedAddresses, user, setUserChoseNewAddress]);

  useEffect(() => {
    // Mulai dengan status loading
    setAddressesLoading(true);

    // Get userId from user object in localStorage
    let userIdFromStorage = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        userIdFromStorage = userData.id?.toString();
      }
    } catch (error) {
      toast.error("Error parsing user data");
    }

    // Cek jika sudah di-fetch sebelumnya untuk mencegah fetch berlebihan
    if (fetchedRef.current) {
      setAddressesLoading(false);
      return;
    }

    if (userIdFromStorage) {
      setUserId(userIdFromStorage);

      // Fetch full user data untuk pre-fill nama, email, telepon
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userIdFromStorage}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((userData) => {
          if (userData) {
            const nameParts = userData.fullName
              ? userData.fullName.split(" ")
              : ["", ""];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            setShippingAddress((prev) => ({
              ...prev,
              firstName: firstName || "",
              lastName: lastName || "",
              email: userData.email || "",
              phone: userData.phoneNumber || "",
            }));
          }
        })
        .catch((err) => {
          toast.error("Error fetching user data");
        });

      // Fetch saved addresses - hanya jika belum ada
      if (!hasAddressesRef.current) {
        fetchSavedAddresses(userIdFromStorage);
        fetchedRef.current = true;
      } else {
        setAddressesLoading(false);
      }
    } else {
      setAddressesLoading(false);
    }
  }, [fetchSavedAddresses]);

  // Effect untuk menggunakan alamat default ketika savedAddresses berubah - only on initial load
  useEffect(() => {
    try {
      // Only run this effect once when addresses are first loaded
      // AND user has not explicitly chosen to use a new address
      const shouldSetDefaultAddress = savedAddresses.length > 0 && 
                                      !addressesLoading && 
                                      selectedAddressId === "new_address" &&
                                      !shippingAddress.address && 
                                      !userChoseNewAddress; // Don't override if user chose new address
      
      console.log("Checking for default address:", {
        addressCount: savedAddresses.length,
        loading: addressesLoading,
        selectedId: selectedAddressId,
        hasAddress: !!shippingAddress.address,
        userChoseNew: userChoseNewAddress,
        shouldSetDefault: shouldSetDefaultAddress
      });
      
      if (shouldSetDefaultAddress) {
        // Cari alamat default
        const defaultAddress = savedAddresses.find((addr) => addr.isDefault);
        if (defaultAddress) {
          console.log("Found default address:", defaultAddress.id);
          // Gunakan alamat default
          setSelectedAddressId(String(defaultAddress.id));
          
          // Applying address directly here to avoid circular dependency
          const selected = savedAddresses.find((addr) => 
            String(addr.id) === String(defaultAddress.id)
          );
          
          if (selected) {
            setShippingAddress({
              firstName: selected.firstName || user?.fullName?.split(' ')[0] || "",
              lastName: selected.lastName || user?.fullName?.split(' ').slice(1).join(' ') || "",
              email: selected.email || user?.email || "",
              address: selected.street || "",
              city: selected.city || "",
              province: selected.state || "",
              postalCode: selected.postalCode || "",
              phone: selected.phone || user?.phoneNumber || "",
            });
            // Perbaikan format nomor telepon
            const phoneNumber = selected.phone || user?.phoneNumber || "";
            setPhoneSuffix(phoneNumber.replace(/^\+?62|^0/, ""));
          }
        }
      }
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  }, [savedAddresses, addressesLoading, user, selectedAddressId, shippingAddress.address, userChoseNewAddress]);

  // Effect untuk mengatur phoneSuffix saat shippingAddress.phone berubah
  useEffect(() => {
    if (shippingAddress.phone) {
      let initialSuffix = shippingAddress.phone
        .replace(/^\+?62/g, "")
        .replace(/\D/g, "");
      if (initialSuffix.startsWith("8")) {
        setPhoneSuffix(initialSuffix.substring(1)); // Store without the leading 8
      } else {
        setPhoneSuffix(initialSuffix); // Store as is if format is unexpected
      }
    } else {
      setPhoneSuffix("");
    }
  }, [shippingAddress.phone]);

  const validateField = (name: string, value: string) => {
    // Hanya periksa apakah field kosong (trim untuk menghilangkan spasi di awal/akhir)
    if (value.trim() === "" && name !== "lastName") {
      return `${name} tidak boleh kosong`;
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validasi saat input berubah
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ambil nilai dari input
    const inputVal = e.target.value;
    
    // Jika inputnya kosong, hapus nilai
    if (!inputVal.trim()) {
      setPhoneSuffix("");
      handleInputChange({
        target: {
          name: "phone",
          value: "",
        },
      } as React.ChangeEvent<HTMLInputElement>);
      return;
    }
    
    // Filter hanya digit
    const digits = inputVal.replace(/\D/g, "");
    
    // Set nilai ke state
    setPhoneSuffix(digits);
    
    // Format nomor dengan +62 untuk field phone asli
    const fullNumber = `+62${digits}`;
    
    // Perbarui nilai di state utama
    handleInputChange({
      target: {
        name: "phone",
        value: fullNumber,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const createTransaction = async () => {
    setLoading(true);
    try {
      // Validasi field yang required saat metode pengiriman = free
      if (selectedShippingMethod === "free") {
        // Validasi field yang wajib diisi
        const requiredFields = {
          firstName: "Nama Depan",
          address: "Alamat",
          city: "Kota",
          province: "Provinsi",
          postalCode: "Kode Pos",
          phone: "Nomor Telepon",
          email: "Email",
        };

        const currentErrors: { [key: string]: string } = {};
        let hasErrors = false;

        Object.entries(requiredFields).forEach(([field, label]) => {
          const value = shippingAddress[field as keyof ShippingAddress];
          if (!value) {
            currentErrors[field] = `${label} tidak boleh kosong`;
            hasErrors = true;
          }
        });

        if (hasErrors) {
          setErrors(currentErrors);
          toast.error(`Harap isi semua field yang diperlukan`);
          setLoading(false);
          return;
        }
      }

      // Jika checkbox dicentang, simpan informasi pengiriman
      if (saveInfo && userId) {
        await handleSaveInfo(true);
      }
      const selectedMethod = shippingMethods.find(
        (method) => method.id === selectedShippingMethod
      );
      // Pastikan total yang dikirim ke Midtrans sudah benar
      // Gunakan totalFromBackend jika tersedia, jika tidak hitung dari subtotal + shipping
      const finalTotal =
        totalFromBackend ||
        checkoutData.subtotal + (selectedMethod?.price || 0);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/snap/create-transaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Conditionally include userId or guestId
            ...(userId
              ? { userId }
              : { guestId: localStorage.getItem("guestId") }),
            shippingAddress,
            items: checkoutData.items,
            shipping: selectedMethod?.price || 0,
            total: finalTotal,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to create transaction");
      const data = await response.json();
      if (data.success && data.data.paymentLink) {
        window.location.href = data.data.paymentLink;
      }
    } catch (error) {
      toast.error("Gagal membuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async (shouldSave: boolean) => {
    if (!shouldSave || !userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            email: shippingAddress.email,
            phoneNumber: shippingAddress.phone,
            address_street: shippingAddress.address,
            address_city: shippingAddress.city,
            address_state: shippingAddress.province,
            address_postalCode: shippingAddress.postalCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save shipping info");
      }

      toast.success("Informasi pengiriman berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan informasi pengiriman");
      setSaveInfo(false); // Reset checkbox if save fails
    }
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">
            Selesaikan pembelian Anda dengan aman
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Informasi Kontak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="email"
                  name="email"
                  value={shippingAddress.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={`w-full ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                  required
                />
                {errors.email && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" /> Metode Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shippingMethods.map((method) => {
                  const isSelected = selectedShippingMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        try {
                          // Simply update state, don't derive anything
                          console.log("Setting shipping method to:", method.id);
                          setSelectedShippingMethod(method.id);
                        } catch (error) {
                          console.error("Error setting shipping method:", error);
                          toast.error("Error selecting shipping method");
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={method.id}
                          name="shippingMethod"
                          value={method.id}
                          checked={isSelected}
                          onChange={(e) => {
                            // Don't derive state in event handler
                            const newValue = e.target.value;
                            try {
                              console.log("Radio onChange - Setting shipping method to:", newValue);
                              setSelectedShippingMethod(newValue);
                            } catch (error) {
                              console.error("Error in radio onChange:", error);
                              toast.error("Error selecting shipping method");
                            }
                          }}
                          className="h-4 w-4 text-blue-600 mr-3"
                        />
                        <label htmlFor={method.id} className="cursor-pointer">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">
                            {method.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            Estimasi: {method.estimatedDays}
                          </div>
                        </label>
                      </div>
                      <div className="text-right font-medium">
                        {method.price === 0
                          ? "Gratis"
                          : method.price === null
                            ? "Manual Via Aplikasi"
                            : `Rp ${method.price.toLocaleString()}`}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Informasi Pengiriman hanya ditampilkan jika memilih pengantaran langsung */}
            {selectedShippingMethod === "free" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" /> Informasi Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pilih Alamat */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 relative z-10">
                      <label className="text-sm text-gray-600">
                        Pilih Alamat Tersimpan
                      </label>
                      {/* Temporarily replace with a simpler dropdown to avoid React error */}
                      <select 
                        value={selectedAddressId} 
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log("Address dropdown change:", value);
                          
                          // Update the selection state
                          setSelectedAddressId(value);
                          
                          // Handle the selection logic directly here
                          if (value === "new_address") {
                            console.log("Resetting form fields for new address");
                            setShippingAddress({
                              firstName: "",
                              lastName: "",
                              email: user?.email || "",
                              address: "",
                              city: "",
                              province: "",
                              postalCode: "",
                              phone: "",
                            });
                            setPhoneSuffix("");
                            setUserChoseNewAddress(true);
                          } else {
                            setUserChoseNewAddress(false);
                            // Find and apply the selected address
                            // Make sure to compare string with string or number with number
                            const selected = savedAddresses.find((addr) => 
                              String(addr.id) === value
                            );
                            
                            if (selected) {
                              console.log("Found selected address:", selected);
                              setShippingAddress({
                                firstName: selected.firstName || user?.fullName?.split(' ')[0] || "",
                                lastName: selected.lastName || user?.fullName?.split(' ').slice(1).join(' ') || "",
                                email: selected.email || user?.email || "",
                                address: selected.street || "",
                                city: selected.city || "",
                                province: selected.state || "",
                                postalCode: selected.postalCode || "",
                                phone: selected.phone || user?.phoneNumber || "",
                              });
                              // Perbaikan format nomor telepon
                              const phoneNumber = selected.phone || user?.phoneNumber || "";
                              setPhoneSuffix(phoneNumber.replace(/^\+?62|^0/, ""));
                            } else {
                              console.warn("Address not found:", value, "Available addresses:", savedAddresses.map(a => ({id: a.id, type: typeof a.id})));
                            }
                          }
                        }}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      >
                        <option value="new_address">Masukkan alamat baru</option>
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={String(addr.id)}>
                            {addr.street}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tampilkan skeleton loading saat addressesLoading=true */}
                  {addressesLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
                        <div>
                          <Input
                            type="text"
                            name="firstName"
                            value={shippingAddress.firstName}
                            onChange={handleInputChange}
                            placeholder="Nama Depan"
                            className={
                              errors.firstName
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }
                            required
                          />
                          {errors.firstName && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.firstName}
                            </div>
                          )}
                        </div>
                        <Input
                          type="text"
                          name="lastName"
                          value={shippingAddress.lastName}
                          onChange={handleInputChange}
                          placeholder="Nama Belakang"
                          // lastName bisa opsional jika diinginkan
                        />
                      </div>

                      <div className="mb-4">
                        <Input
                          type="text"
                          name="address"
                          value={shippingAddress.address}
                          onChange={handleInputChange}
                          placeholder="Alamat"
                          className={`mb-1 ${
                            errors.address
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                          required
                        />
                        {errors.address && (
                          <div className="flex items-center mt-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.address}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Input
                            type="text"
                            name="city"
                            value={shippingAddress.city}
                            onChange={handleInputChange}
                            placeholder="Kota"
                            className={`mb-1 ${
                              errors.city
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            required
                          />
                          {errors.city && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.city}
                            </div>
                          )}
                        </div>
                        <div>
                          <Input
                            type="text"
                            name="province"
                            value={shippingAddress.province}
                            onChange={handleInputChange}
                            placeholder="Provinsi"
                            className={`mb-1 ${
                              errors.province
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            required
                          />
                          {errors.province && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.province}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Input
                            type="text"
                            name="postalCode"
                            value={shippingAddress.postalCode}
                            onChange={handleInputChange}
                            placeholder="Kode Pos"
                            className={`mb-1 ${
                              errors.postalCode
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            required
                          />
                          {errors.postalCode && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.postalCode}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                              +62
                            </span>
                            <Input
                              type="text" 
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="phone"
                              value={phoneSuffix}
                              onChange={handlePhoneChange}
                              onKeyDown={(e) => {
                                // Hanya biarkan digit, backspace, delete, dan arrow keys
                                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                                const isDigit = /^[0-9]$/.test(e.key);
                                if (!isDigit && !allowedKeys.includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              placeholder="812 3456 7890"
                              className={`pl-14 mb-1 ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`}
                              required
                            />
                          </div>
                          {errors.phone && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Conditionally render the save info checkbox only if userId exists */}
                      {userId && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="saveInfo"
                            checked={saveInfo}
                            onChange={(e) => {
                              setSaveInfo(e.target.checked);
                              // Jangan lakukan save segera, biarkan user klik tombol bayar
                            }}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label
                            htmlFor="saveInfo"
                            className="ml-2 text-sm text-gray-600"
                          >
                            Simpan informasi ini untuk pembelian berikutnya
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border p-4">
                  <div className="flex items-center justify-between p-3 border mb-4 bg-white">
                    <div className="flex items-center">
                      <span className="font-medium">Payments By Midtrans</span>
                    </div>
                    <div className="flex space-x-2 opacity-70">
                      <span className="text-xs px-2 py-1 rounded">
                        {" "}
                        <Image
                          src="/visa.svg"
                          alt="visa"
                          width={45}
                          height={45}
                          className="hover:opacity-80 transition-opacity object-contain h-auto"
                        />
                      </span>
                      <span className="text-xs px-2 py-1 rounded">
                        <Image
                          src="/msc.svg"
                          alt="msc"
                          width={45}
                          height={45}
                          className="hover:opacity-80 transition-opacity object-contain h-auto"
                        />
                      </span>
                      <span className="text-xs px-2 py-1 rounded">
                        {" "}
                        <Image
                          src="/jcb.svg"
                          alt="jcb"
                          width={45}
                          height={45}
                          className="hover:opacity-80 transition-opacity object-contain h-auto"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-4">
                    <p>
                      Setelah mengklik &quot;Bayar Sekarang&quot;, Anda akan diarahkan ke
                    </p>
                    <p>
                      Payments By Midtrans untuk menyelesaikan pembelian Anda
                      dengan aman.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                    {isLoadingCart ? (
                      // Skeleton loader while checking for items
                      (<div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center pb-4 border-b"
                          >
                            <div className="w-16 h-16 rounded-md mr-4 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                            </div>
                            <div className="text-right">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>)
                    ) : checkoutData.items.length === 0 ? (
                      // Empty cart message (only shown after loading)
                      (<div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="text-4xl mb-2">🛒</div>
                        <h3 className="font-semibold text-gray-800">
                          Keranjang Anda kosong
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Silahkan berbelanja untuk melanjutkan checkout
                        </p>
                      </div>)
                    ) : (
                      // Render actual items
                      (checkoutData.items.map((item) => {
                        try {
                          return (
                            <div
                              key={item.id}
                              className="flex items-center pb-4 border-b"
                            >
                              <div className="relative w-16 h-16 rounded-md mr-4 overflow-hidden">
                                <Image
                                  src={imageLoader({ src: item.image, width: 100 }) || "/blurry.svg"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/blurry.svg";
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium line-clamp-1">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  qty: {item.quantity}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Ukuran: {item.size}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Rp {item.price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        } catch (error) {
                          return null;
                        }
                      }))
                    )}
                  </div>

                  {/* Subtotal & Total Section */}
                  <div className="space-y-2 pt-4 border-t">
                    {checkoutData.items.length === 0 ? (
                      // Tidak perlu tampilkan skeleton untuk Subtotal & Total jika keranjang kosong
                      (<div className="text-center text-sm text-gray-500 py-2">Tambahkan produk untuk melihat total
                                              </div>)
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>
                            Rp {checkoutData.subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t text-base font-medium">
                          <span>Total</span>
                          <span>
                            Rp{" "}
                            {totalFromBackend
                              ? totalFromBackend.toLocaleString()
                              : checkoutData.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {checkoutData.items.length === 0 ? (
                    // If cart is empty, only show Lihat Katalog button
                    (<Button
                      onClick={() => router.push("/katalog")}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                      size="lg"
                    >Lihat Katalog
                    </Button>)
                  ) : (
                    // If cart has items, show the Pay button
                    (<Button
                      onClick={createTransaction}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Memproses...
                        </>
                      ) : (
                        "Bayar Sekarang"
                      )}
                    </Button>)
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
