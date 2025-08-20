"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: number;
  midtransOrderId: string;
  status: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  midtransInvoicePdfUrl?: string;
  midtransInvoiceUrl?: string;
  paymentUrl?: string;
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // Clear invoice data when component unmounts or when login state changes
  useEffect(() => {
    return () => {
      // Cleanup function when component unmounts
      if (!isLoggedIn) {
        // Only save data if we're in guest mode
        localStorage.removeItem("invoiceData");
      }
    };
  }, [isLoggedIn]);

  // Listen for storage events (such as login/logout that clear localStorage)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedGuestId = localStorage.getItem("guestId");
      setGuestId(storedGuestId);

      if (!storedGuestId) {
        setInvoices([]);
      }
    };

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Listen for auth events
    window.addEventListener("cart_clear_needed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cart_clear_needed", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (typeof isLoggedIn === "boolean") {
      if (isLoggedIn) {
        router.push("/");
        toast.info(
          "Anda sudah login, silakan gunakan menu Dashboard untuk melihat invoice."
        );
      } else {
        const storedGuestId = localStorage.getItem("guestId");
        setGuestId(storedGuestId);

        // Fallback: if no guestId, try to show last invoice using orderId kept at checkout
        if (!storedGuestId) {
          const doFallback = async () => {
            try {
              const invoiceDataRaw = localStorage.getItem("invoiceData");
              if (invoiceDataRaw) {
                const { orderId } = JSON.parse(invoiceDataRaw || "{}");
                if (orderId) {
                  setLoading(true);
                  const r = await fetch(`/api/invoice/order-detail?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
                  if (r.ok) {
                    const json = await r.json();
                    const inv = json?.data;
                    if (inv) {
                      setInvoices([
                        {
                          id: inv.id,
                          midtransOrderId: inv.midtransOrderId,
                          status: inv.status,
                          amount: inv.amount,
                          createdAt: inv.createdAt,
                          updatedAt: inv.updatedAt,
                          midtransInvoicePdfUrl: inv.midtransInvoicePdfUrl,
                          midtransInvoiceUrl: inv.midtransInvoiceUrl,
                          paymentUrl: inv.paymentUrl,
                        },
                      ]);
                      setLoading(false);
                      return;
                    }
                  }
                }
              }
            } catch {
              // ignore and show empty state
            }
            setLoading(false);
          };
          doFallback();
          return;
        }

        const fetchGuestInvoices = async () => {
          setLoading(true);
          try {
            // Call our Next.js API proxy to avoid cross-site cookie issues
            const response = await fetch(
              `/api/invoice/guest-list?guestId=${encodeURIComponent(storedGuestId)}`,
              { cache: "no-store" }
            );

            if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                throw new Error("Unauthorized: sesi tamu tidak dikenali. Coba muat ulang.");
              }
              throw new Error("Failed to fetch invoices");
            }

            const result = await response.json();
            setInvoices(result.data || []);
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Gagal mengambil data invoice";
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        };

        fetchGuestInvoices();
      }
    }
  }, [isLoggedIn, router]);

  // Function to get status badge color based on invoice status
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <div className="flex items-center text-orange-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Menunggu Pembayaran</span>
          </div>
        );
      case "SETTLEMENT":
      case "PAID":
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Pembayaran Berhasil</span>
          </div>
        );
      case "EXPIRED":
        return (
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Kedaluwarsa</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{status}</span>
          </div>
        );
    }
  };

  // Function to format the date to DD MMM YYYY format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Invoice</h1>

      {loading ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="w-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !guestId ? (
        // No guestId found
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tidak Ada ID Tamu</h2>
            <p className="text-gray-500 mb-4">
              Anda adalah User. Silahkan lakukan pembelian untuk melihat invoice
              Anda.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push("/katalog")} variant="outline">
                Belanja Sekarang
              </Button>
              <Button onClick={() => router.push("/")} variant="default">
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        // No invoices found for this guest
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tidak Ada Invoice</h2>
            <p className="text-gray-500 mb-4">
              Anda belum memiliki invoice. Silahkan lakukan pembelian untuk
              mendapatkan invoice.
            </p>
            <Button onClick={() => router.push("/katalog")} variant="default">
              Belanja Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        // List of invoices
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="w-full hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Invoice #{invoice.midtransOrderId}
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-500">
                      <span>{formatDate(invoice.createdAt)}</span>
                      <span className="hidden md:inline">•</span>
                      <span>Rp {invoice.amount.toLocaleString("id-ID")}</span>
                      <span className="hidden md:inline">•</span>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {invoice.midtransInvoicePdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() =>
                          window.open(invoice.midtransInvoicePdfUrl, "_blank")
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}

                    {invoice.status === "PENDING" && invoice.paymentUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          window.open(invoice.paymentUrl, "_blank")
                        }
                      >
                        Bayar Sekarang
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
