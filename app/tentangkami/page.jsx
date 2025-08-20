import { title } from "@/components/primitives";
import tentangkami from "@/public/tentangkami.webp";
import saa from "@/public/saa.webp";
import duu from "@/public/duu.webp";
import tii from "@/public/tii.webp";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <div className="flex justify-center">
        <h1 className={`${title()}`}>Tentang Kami</h1>
      </div>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-12 py-8">
          <div className="flex justify-center">
            <p>
              Rano Cake didirikan sejak 2021, telah berkiprah di dunia
              bisnis kue dengan menawarkan berbagai jenis kue tradisional, kue
              ulang tahun, kue kering lebaran, dan asinan Betawi. Selamat datang
              di toko Rano Cake, tempat Anda dapat menemukan beragam pilihan kue
              yang menggugah selera.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src={tii}
              alt="Tentang Kami"
              className="rounded-xl"
              layout="intrinsic" // or "fill" based on your need
              width={500} // specify width if using "intrinsic" layout
              height={500} // specify height if using "intrinsic" layout
            />{" "}
          </div>
          <div className="flex justify-center">
            <Image
              src={tentangkami}
              alt="Tentang Kami"
              className="rounded-xl"
              layout="intrinsic" // or "fill" based on your need
              width={500} // specify width if using "intrinsic" layout
              height={500} // specify height if using "intrinsic" layout
            />
          </div>
          <div className="flex justify-between">
            <p>
              Para pelanggan kami sangat puas dengan produk-produk yang kami
              tawarkan. Banyak di antara mereka yang menjadi pelanggan setia dan
              secara rutin memesan ulang. Mereka mengatakan bahwa kue-kue kami
              sangat lezat, dan semakin banyak orang yang mulai menyukai
              produk-produk Rano Cake.
            </p>
          </div>
          <div className="flex justify-center">
            <p>
              Kami selalu menggunakan bahan-bahan berkualitas tinggi dan resep
              tradisional yang diwariskan dari generasi ke generasi untuk
              memastikan setiap kue yang kami buat memiliki rasa yang autentik
              dan tak terlupakan. Selain itu, kami juga terus berinovasi dengan
              menciptakan varian kue baru yang sesuai dengan selera masa kini
              tanpa menghilangkan sentuhan tradisional.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src={duu}
              alt="duu"
              className="rounded-xl"
              layout="intrinsic" // or "fill" based on your need
              width={500} // specify width if using "intrinsic" layout
              height={500} // specify height if using "intrinsic" layout
            />{" "}
          </div>
          <div className="flex justify-center">
            <Image
              src={saa}
              alt="saa "
              className="rounded-xl"
              layout="intrinsic" // or "fill" based on your need
              width={500} // specify width if using "intrinsic" layout
              height={500} // specify height if using "intrinsic" layout
            />
          </div>
          <div className="flex justify-between">
            <p>
              Tidak hanya sekadar menjual kue, Rano Cake juga berkomitmen untuk
              memberikan pengalaman belanja yang menyenangkan bagi setiap
              pelanggan. Dari layanan pelanggan yang ramah hingga kemasan yang
              cantik, setiap detail diperhatikan dengan seksama untuk memastikan
              kepuasan Anda. Kami juga menerima pesanan khusus untuk berbagai
              acara, seperti ulang tahun, pernikahan, dan perayaan lainnya,
              untuk membuat momen spesial Anda semakin berkesan.
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center h-full">
          <p className="text-center">
            Terima kasih telah mempercayakan kebutuhan kue Anda kepada Rano
            Cake. Kami akan terus berusaha memberikan yang terbaik dan menjadi
            bagian dari setiap momen istimewa Anda.
          </p>
        </div>
      </div>
    </>
  );
}
