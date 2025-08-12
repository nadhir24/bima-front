"use client";
import React from "react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Syarat dan Ketentuan</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Identitas Merchant</h2>
          <p>
            Rano Cake merupakan sebuah usaha mikro, kecil, dan menengah (UMKM) yang bergerak di bidang makanan ringan dengan fokus pada penjualan kue dan makanan ringan berkualitas. 
            Alamat bisnis: Jl. Kemanggisan 4D No.45 Blok F, RT.6/RW.6, Kemanggisan, Kec. Palmerah, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11480
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Deskripsi Layanan</h2>
          <p>
            Rano Cake menggunakan layanan Midtrans sebagai payment gateway untuk memproses transaksi pembayaran online. 
            Midtrans akan bertindak sebagai penyedia jasa payment gateway yang memproses transaksi pembayaran atas nama Rano Cake. 
            Seluruh transaksi yang dilakukan melalui platform kami akan diproses secara aman melalui sistem Midtrans.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Kewajiban Rano Cake</h2>
          <p>
            Rano Cake berkomitmen untuk:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Menjaga keamanan dan kerahasiaan informasi pengguna sesuai dengan kebijakan privasi.</li>
            <li>Tidak menjual produk yang dilarang oleh hukum dan peraturan yang berlaku di Indonesia.</li>
            <li>Menyediakan kebijakan pengembalian dana (refund) yang jelas dan transparan.</li>
            <li>Menyelesaikan setiap perselisihan dengan pelanggan secara adil dan profesional.</li>
            <li>Memastikan bahwa produk yang dijual sesuai dengan deskripsi yang tercantum pada platform.</li>
            <li>Memproses pesanan dan pengiriman tepat waktu sesuai dengan ketentuan yang berlaku.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Biaya dan Settlement</h2>
          <p>
            Rano Cake menerapkan sistem pembayaran dengan ketentuan sebagai berikut:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Biaya transaksi akan ditampilkan secara transparan saat proses checkout.</li>
            <li>Settlement (penyelesaian pembayaran) akan dilakukan oleh Midtrans ke rekening Rano Cake dalam waktu 1-2 hari kerja setelah transaksi berhasil.</li>
            <li>Biaya layanan payment gateway ditanggung oleh Rano Cake dan tidak dibebankan kepada pelanggan.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Sanksi dan Penghentian Layanan</h2>
          <p>
            Rano Cake berhak untuk:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Menolak atau membatalkan pesanan yang dicurigai mengandung unsur penipuan atau pelanggaran terhadap syarat dan ketentuan.</li>
            <li>Memblokir akun pengguna yang melakukan tindakan yang merugikan platform atau pengguna lain.</li>
            <li>Menghentikan layanan secara sepihak jika terjadi pelanggaran terhadap ketentuan yang berlaku.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Kerahasiaan dan Data Pribadi</h2>
          <p>
            Rano Cake berkomitmen untuk menjaga kerahasiaan data pribadi pengguna. Informasi yang dikumpulkan hanya akan digunakan untuk:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Memproses pesanan dan pengiriman produk.</li>
            <li>Mengirimkan informasi terkait pesanan dan promosi (jika pengguna menyetujui).</li>
            <li>Meningkatkan layanan dan pengalaman pengguna.</li>
            <li>Memenuhi kewajiban hukum dan peraturan yang berlaku.</li>
          </ul>
          <p>
            Informasi lebih lanjut tentang bagaimana kami mengelola data pribadi dapat dilihat pada <Link href="/kebijakan-privasi" className="text-blue-600 hover:underline">Kebijakan Privasi</Link> kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Kebijakan Pengembalian Dana dan Produk</h2>
          <p>
            Rano Cake memiliki kebijakan pengembalian dana dan produk sebagai berikut:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Pengembalian dana dapat dilakukan dalam waktu 7 hari setelah produk diterima.</li>
            <li>Produk yang dikembalikan harus dalam kondisi asli, belum digunakan, dan dengan kemasan yang utuh.</li>
            <li>Biaya pengiriman untuk pengembalian produk ditanggung oleh pembeli, kecuali jika produk yang dikirim cacat atau tidak sesuai dengan pesanan.</li>
            <li>Proses pengembalian dana akan dilakukan dalam waktu 5-7 hari kerja setelah produk diterima dan diverifikasi oleh tim kami.</li>
          </ul>
          <p>
            Informasi lebih detail tentang prosedur pengembalian dana dapat dilihat pada <Link href="/kebijakan-pengembalian" className="text-blue-600 hover:underline">Kebijakan Pengembalian</Link> kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Ketentuan Hukum</h2>
          <p>
            Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan secara musyawarah mufakat. Jika penyelesaian secara musyawarah tidak tercapai, maka akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) atau pengadilan yang berwenang di wilayah Republik Indonesia.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Perubahan Syarat dan Ketentuan</h2>
          <p>
            Rano Cake berhak untuk mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui platform kami. Dengan tetap menggunakan layanan kami setelah perubahan diumumkan, pengguna dianggap telah menyetujui syarat dan ketentuan yang baru.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Kontak</h2>
          <p>
            Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui:
          </p>
          <p>
            Email: m20180803049@esaunggul.ac.id <br />
            Telepon: 08151831185<br />
            Alamat: Jl. Kemanggisan 4D No.45 Blok F, RT.6/RW.6, Kemanggisan, Kec. Palmerah, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11480
          </p>
        </section>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Terakhir diperbarui: 12 Mei 2025
          </p>
        </div>
      </div>
    </div>
  );
} 