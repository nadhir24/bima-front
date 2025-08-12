import { Card, CardBody } from "@heroui/react";
import { Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { title } from "@/components/primitives";
import jaja1 from "@/public/jaja1.webp";

// Pre-define avatar to avoid network requests
const avatarPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Ccircle cx="25" cy="25" r="25" fill="%23f3f4f6"/%3E%3Ccircle cx="25" cy="20" r="8" fill="%23d1d5db"/%3E%3Cpath d="M10,35 C10,30 20,25 25,25 C30,25 40,30 40,35 C40,40 30,45 25,45 C20,45 10,40 10,35 Z" fill="%23d1d5db"/%3E%3C/svg%3E';

const HEADER_HEIGHT = 320; // 80vh equivalent

const testimonials = [
  {
    name: "Nauval",
    role: "Pelanggan Setia Rano Cake",
    rating: 5,
    text: "Saya merupakan pelanggan yang cukup sering memesan kue disini karena permintaan para tamu yang bilang kue nya lezat saya ingin merekomendasikan Rano cake pada semua orang.",
  },
  {
    name: "Tina Salsabila",
    role: "Pelanggan Setia Rano Cake",
    rating: 5,
    text: "Kue-kue dari Rano Cake selalu lezat dan finishingnya menawan. Pelayanan yang ramah dan responsif membuat saya selalu kembali untuk memesan kue di sini!",
  },
  {
    name: "Budi",
    role: "Pelanggan Setia Rano Cake",
    rating: 5,
    text: "Rano Cake benar-benar memahami kebutuhan pelanggannya. Setiap pesanan saya selalu tepat waktu dan sesuai dengan harapan. Terima kasih Rano Cake!",
  },
];

export default function Testimonials() {
  return (
    <section className="mb-32">
      <div className="relative">
        {/* Header with gradient background instead of image */}
        <div 
          className="w-full h-64 relative flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600"
        >
          {/* Background Image - loaded with CSS to avoid Next.js hydration penalty */}
          <div 
            className="absolute inset-0 z-0 opacity-60 bg-blend-multiply"
            style={{ 
              backgroundImage: `url(${jaja1.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            aria-hidden="true"
          />
          
          <h1 className={`${title({ color: "foreground" })} text-white relative z-10`}>
            Apa Kata Mereka?
          </h1>
        </div>

        <div className="relative -mt-28 z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index}>
              <Card
                shadow="lg"
                className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-purple-200 rounded-xl"
              >
                <CardBody>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden">
                      {/* Use Next/Image component */}
                      <Image 
                        src={avatarPlaceholder} 
                        alt={`${testimonial.name} - ${testimonial.role}`}
                        width={50} 
                        height={50}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-purple-900">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-1 mb-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm">{testimonial.text}</p>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 