"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RefundPolicyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Anda harus login terlebih dahulu untuk mengajukan pengembalian dana.");
      return;
    }
    
    if (!orderId || !reason) {
      toast.error("Nomor pesanan dan alasan pengembalian wajib diisi.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Request to get the payment ID from order ID
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/snap/order-detail?orderId=${orderId}`
      );
      
      if (!orderResponse.ok) {
        throw new Error("Pesanan tidak ditemukan");
      }
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success || !orderData.data?.payment?.id) {
        throw new Error("Informasi pembayaran tidak ditemukan");
      }
      
      if (orderData.data.status !== "SETTLEMENT") {
        throw new Error("Hanya pesanan yang sudah selesai yang dapat diajukan pengembalian dana");
      }
      
      // Create refund request
      const refundResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            paymentId: orderData.data.payment.id,
            amount: orderData.data.amount,
            reason: reason,
          }),
        }
      );
      
      if (!refundResponse.ok) {
        const errorData = await refundResponse.json();
        throw new Error(errorData.message || "Gagal mengajukan pengembalian dana");
      }
      
      const refundData = await refundResponse.json();
      
      toast.success("Permintaan pengembalian dana berhasil diajukan. Tim kami akan meninjau permintaan Anda.");
      
      // Redirect to dashboard or refund status page
      setTimeout(() => {
        router.push("/dashboard/invoice");
      }, 2000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat mengajukan pengembalian dana");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Kebijakan Pengembalian Dana</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ketentuan Umum</h2>
          <p>
            Rano Cake menyediakan kebijakan pengembalian dana (refund) untuk memastikan kepuasan pelanggan. 
            Kebijakan ini berlaku untuk semua produk yang dibeli melalui platform kami dengan ketentuan sebagai berikut:
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Jangka Waktu Pengembalian</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Permintaan pengembalian dana harus diajukan dalam waktu <strong>7 hari kalender</strong> sejak produk diterima.</li>
            <li>Melewati batas waktu tersebut, Rano Cake berhak untuk menolak permintaan pengembalian dana.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Syarat Pengembalian Produk</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Produk harus dalam kondisi asli, belum digunakan, tidak rusak, dan dengan kemasan yang utuh.</li>
            <li>Semua label, tag, dan aksesoris yang menyertai produk masih terpasang dan dalam kondisi baik.</li>
            <li>Bukti pembelian (invoice) harus disertakan saat pengembalian produk.</li>
            <li>Produk yang dibeli dengan diskon atau selama promosi khusus mungkin memiliki ketentuan pengembalian berbeda yang akan diinformasikan saat pembelian.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Alasan Pengembalian yang Diterima</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Produk cacat atau rusak saat diterima.</li>
            <li>Produk yang diterima tidak sesuai dengan deskripsi atau spesifikasi yang ditampilkan di website.</li>
            <li>Ukuran produk tidak sesuai (khusus untuk pakaian).</li>
            <li>Produk yang diterima tidak lengkap atau ada komponen yang hilang.</li>
            <li>Produk yang diterima berbeda dengan yang dipesan.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Biaya Pengembalian</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Jika pengembalian dilakukan karena kesalahan Rano Cake (produk cacat, salah kirim, dll), biaya pengiriman untuk pengembalian akan ditanggung oleh Rano Cake.</li>
            <li>Jika pengembalian dilakukan karena alasan lain (berubah pikiran, salah ukuran yang bukan karena informasi yang tidak akurat, dll), biaya pengiriman untuk pengembalian ditanggung oleh pembeli.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Proses Pengembalian Dana</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Pengembalian dana akan diproses dalam waktu 5-7 hari kerja setelah produk diterima dan diverifikasi oleh tim kami.</li>
            <li>Pengembalian dana akan dilakukan melalui metode pembayaran yang sama dengan yang digunakan saat pembelian.</li>
            <li>Untuk pembayaran dengan kartu kredit/debit, waktu pengembalian dana tergantung pada kebijakan bank penerbit, biasanya membutuhkan waktu 7-14 hari kerja.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cara Mengajukan Pengembalian Dana</h2>
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>Hubungi customer service Rano Cake melalui email supportRanoCake@gmail.com atau chat dalam waktu 7 hari setelah menerima produk.</li>
            <li>Sertakan nomor pesanan, alasan pengembalian, dan foto produk (jika diperlukan).</li>
            <li>Tim kami akan merespons permintaan Anda dalam waktu 1-2 hari kerja dengan instruksi selanjutnya.</li>
            <li>Setelah mendapat persetujuan, kirimkan produk ke alamat yang diberikan dengan menyertakan formulir pengembalian.</li>
            <li>Setelah produk diterima dan diverifikasi, pengembalian dana akan diproses.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pengecualian</h2>
          <p>Beberapa produk tidak dapat dikembalikan kecuali cacat saat diterima:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Produk dengan segel yang sudah dibuka.</li>
            <li>Produk personal seperti pakaian dalam.</li>
            <li>Produk yang sudah digunakan atau dicuci.</li>
            <li>Produk yang telah diubah atau diperbaiki oleh pembeli.</li>
            <li>Produk diskon dengan label &quot;tidak dapat dikembalikan&quot;.</li>
          </ul>
        </section>

        {user && (
          <section className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Form Pengajuan Pengembalian Dana</h2>
            <form onSubmit={handleRefundRequest} className="space-y-4">
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Pesanan
                </label>
                <input
                  type="text"
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Contoh: order-1234567890-abcdef"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Masukkan nomor pesanan yang dimulai dengan &quot;order-&quot;
                </p>
              </div>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Pengembalian
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan Anda mengajukan pengembalian dana"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Ajukan Pengembalian Dana"}
              </button>
            </form>
          </section>
        )}
        
        {!user && (
          <section className="mt-12 p-6 bg-gray-50 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">Ingin Mengajukan Pengembalian Dana?</h2>
            <p className="mb-4">Anda harus login terlebih dahulu untuk mengajukan pengembalian dana.</p>
            <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
              Login ke Akun Anda
            </Link>
          </section>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Terakhir diperbarui: 12 Mei 2025
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Jika Anda memiliki pertanyaan tentang kebijakan pengembalian kami, silakan hubungi kami di <a href="mailto:support@gmail.com" className="text-blue-600 hover:underline">support@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
} 