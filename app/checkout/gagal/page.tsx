"use client";
import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Tombol from "@/components/button";

export default function GagalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Pembayaran Gagal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Maaf, pembayaran Anda tidak dapat diproses. Silakan periksa
            informasi pembayaran Anda dan coba lagi.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Kemungkinan Penyebab:</p>
            <ul className="text-sm text-gray-700 list-disc list-inside text-left">
              <li>Saldo tidak mencukupi</li>
              <li>Informasi kartu tidak valid</li>
              <li>Koneksi terputus</li>
              <li>Batas transaksi terlampaui</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Jika Anda memiliki pertanyaan, silakan hubungi layanan pelanggan
            kami untuk bantuan lebih lanjut.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Tombol className="w-full" variant="solid">
            <Link href="/checkout" className="w-full">
              Coba Lagi
            </Link>
          </Tombol>
          <Tombol variant="faded" className="w-full">
            <Link href="/katalog" className="w-full">
              Kembali ke Katalog
            </Link>
          </Tombol>
        </CardFooter>
      </Card>
    </div>
  );
}
