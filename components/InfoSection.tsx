import { Accordion, AccordionItem } from "@heroui/react";
import dynamic from 'next/dynamic';

const faqs = [
  {
    question: "Apakah Rano Cake menerima pesanan custom?",
    answer:
      "Ya, kami menerima pesanan custom untuk berbagai jenis acara seperti ulang tahun, pernikahan, dan lainnya.",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk memproses pesanan?",
    answer:
      "Waktu pemrosesan tergantung jenis pesanan. Untuk pesanan biasa, rata-rata 1-2 hari kerja.",
  },
  {
    question: "Apakah tersedia pengiriman ke luar kota?",
    answer:
      "Saat ini kami melayani pengiriman dalam kota. Namun, Anda bisa menghubungi kami untuk diskusi lebih lanjut.",
  },
  {
    question: "Apakah bahan-bahan yang digunakan halal?",
    answer:
      "Ya, kami hanya menggunakan bahan-bahan yang 100% halal dan berkualitas tinggi.",
  },
];

// Lazy load the map component
const Map = dynamic(
  () => import('@/components/Map'),
  { 
    loading: () => <div className="w-full h-[450px] bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false
  }
);

export default function InfoSection() {
  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-purple-900 font-serif">
          Informasi Seputar Rano Cake
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="w-full">
            <h3 className="text-2xl font-semibold mb-6 text-purple-800">
              Pertanyaan Seputar Rano Cake
            </h3>
            <Accordion
              className="pt-4"
              variant="bordered"
              itemClasses={{
                title: "text-lg font-medium text-purple-900",
                content: "text-gray-700",
                trigger: "px-4 py-3 hover:bg-purple-50",
                indicator: "text-purple-600",
              }}
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  title={faq.question}
                  className="text-lg font-medium"
                >
                  <p className="text-gray-700">{faq.answer}</p>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="w-full">
            <h3 className="text-2xl font-semibold mb-6 text-purple-800">
              Alamat Kami
            </h3>
            <Map />
          </div>
        </div>
      </div>
    </section>
  );
} 