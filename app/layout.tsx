import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import clsx from "clsx";
import Link from "next/link";
import {
  GoogleMapsIcon,
  HeartFilledIcon,
  Logo,
  RanoIcon,
  WhatsappIcon,
} from "@/components/icons";
import { title } from "@/components/primitives";
import Navy from "@/components/navbar";
import { Divider } from "@heroui/react";
import Image from "next/image";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from '@vercel/speed-insights/next';
import ClientInit from './components/client-init';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFD500" }, // Gold for light mode
    { media: "(prefers-color-scheme: dark)", color: "#8B0000" }, // Dark red for dark mode
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
        {/* RanoIcon as favicon */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='140' height='50' viewBox='0 0 278 102' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M177.061 38.7666C177.061 58.1329 158.805 74.5333 135.357 74.5333C111.909 74.5333 93.6533 58.1329 93.6533 38.7666C93.6533 19.4004 111.909 3 135.357 3C158.805 3 177.061 19.4004 177.061 38.7666Z' fill='%2399281E' stroke='%23A8A239' stroke-width='6'/%3E%3Crect x='96.9175' y='17.7313' width='76.8494' height='41.9414' rx='20.9707' fill='black' fill-opacity='0.2'/%3E%3Cpath d='M47.1908 32.2618L94.3694 21.3497C86.8423 34.491 90.9145 55.9336 106.901 69.8129L100.248 71.1263L98.5954 80.1517C84.3929 82.117 76.194 83.484 61.0517 86.5064L59.2158 92.9531C58.4679 98.2386 27.278 97.7188 20.1116 97.3737C17.874 97.8558 0.598839 75.3075 4.59845 56.1147L10.6109 56.9435L16.6235 57.7724V47.4576L47.5103 40.6425L47.1908 32.2618Z' fill='%2399281E' stroke='%23A8A239' stroke-width='7'/%3E%3Cpath d='M58 93.041C41.2715 93.709 34.7475 93.8709 31.9276 92.517L31.7228 92.2849C24.0846 83.6289 19.2268 72.8753 17.781 61.4219L13.4749 61C11.6406 76.4953 14.5633 84.3926 32.1646 96C47.8533 95.5389 53.821 94.9298 58 93.041Z' fill='%23711C18' stroke='url(%23paint0_radial_101_2)' stroke-width='2'/%3E%3Cpath d='M86.7979 81.1198C70.0311 81.9301 61.5771 82.2085 59.1545 82.2085L58.7814 81.8651C48.1717 72.1007 45.0332 56.6265 51 43.5L44 45L38.5 46C36.6615 64.7975 42.739 71.6656 60.3805 85.7467C71.9157 83.025 81.7353 82.1177 86.7979 81.1198Z' fill='%23711C18' stroke='url(%23paint1_radial_101_2)' stroke-width='2'/%3E%3Cpath d='M60.1892 84.0797L32.3555 92.4796C32.1444 92.5433 32.0175 92.755 32.1966 92.8836C34.291 94.3871 52.5295 94.2275 58.5797 93.2588C58.7839 93.2261 58.934 93.0687 58.9738 92.8657C59.6431 89.4454 60.0234 88.2973 60.8204 84.6635C60.902 84.2917 60.5536 83.9698 60.1892 84.0797Z' fill='%23231D0E' stroke='black'/%3E%3Cpath d='M99.2819 70L59.0762 81.5794C74.2468 81.8246 87.9395 80.4755 97.9927 78.8855C99.0145 74.8628 98.5442 74.396 99.2819 70Z' fill='%23231D0E' stroke='black' stroke-opacity='0.9'/%3E%3Cpath d='M89.9346 33.9964L92.2639 23L78.3777 26.3429C70.3499 45.849 73.6371 55.5989 85.9927 72L99.431 68.5691L104 67.5135L102.835 66.5458L97.908 60.7316L94.414 55.0829L92.5326 50.5325L90.9201 46.4529L90.2929 42.6871L89.9346 39.392L89.6658 36.7235L89.9346 33.9964Z' fill='%23711C18' stroke='%23711C18' stroke-width='2'/%3E%3Cpath d='M227.903 27.9073L170.66 15.5911C185.583 34.8101 179.978 53.3363 162.176 68.3473L168.82 69.941L170.66 79.7024C186.476 81.8279 195.606 83.3064 212.468 86.5752L214.512 93.5476C215.345 99.2641 250.078 98.702 258.058 98.3287C260.55 98.8502 279.787 74.4631 275.334 53.7052L268.638 54.6017L261.943 55.4981V44.3423L227.547 36.9714L227.903 27.9073Z' fill='%2399281E' stroke='%23A8A239' stroke-width='4'/%3E%3Cpath d='M216 93.6183C234.587 94.3817 241.836 94.5667 244.969 93.0194C252.817 82.5705 258.262 70.3224 260.688 57.4822L265.472 57C267.511 74.7089 264.263 83.7343 244.706 97C227.274 96.4731 220.643 95.7769 216 93.6183Z' fill='%23711C18' stroke='url(%23paint2_radial_101_2)' stroke-width='2'/%3E%3Cpath d='M183.839 80.4616C202.454 81.3272 211.84 81.6245 214.53 81.6245L221.958 60.4982L226.863 39.0812L237.083 41.2132C239.124 61.2923 232.756 70.3628 213.169 85.404C200.362 82.4967 189.459 81.5276 183.839 80.4616Z' fill='%23711C18' stroke='url(%23paint3_radial_101_2)' stroke-width='2'/%3E%3Cpath d='M213.519 85.9078L244.708 92.9728C244.708 94.4654 222.253 94.3415 215.768 93.4704C214.95 90.2861 214.541 89.4901 213.519 85.9078Z' fill='black'/%3E%3Cpath d='M169.854 69.0912L214.644 81.3993C197.743 81.6599 182.489 80.226 171.29 78.5359C170.151 74.26 170.675 73.7638 169.854 69.0912Z' fill='%23231D0E' stroke='black'/%3E%3Cpath d='M178.999 29.0842L173.782 18L194.091 22.2753C203.364 43.5822 199.075 53.0848 184.802 71L169.278 67.2524L164 66.0993L165.345 65.0422L171.348 59.5649L175.459 53.786L178.254 47.9272L179.465 43.9686L180.041 40.1683V36.5264L179.744 32.4094L178.999 29.0842Z' fill='%23711C18' stroke='%23711C18' stroke-width='2'/%3E%3C/svg%3E" />
      </head>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthProvider>
            <CartProvider>
              <ClientInit />
              <div className="relative flex flex-col min-h-screen bg-gradient-custom">
                <Navy />
                <main className="container mx-auto pt-16 px-6 flex-grow">
                  {children}
                </main>

                {/* Footer */}
                <footer className="w-full bg-gradient-to-t from-red-600 to-yellow-500 text-white mt-32">
                  <div className="container mx-auto max-w-7xl px-6 py-12">
                    <Divider className="mb-8 border-gray-200" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div>
                        <h3 className="text-xl font-bold mb-6">Tentang Kami</h3>
                        <p className="text-gray-100">
                          Rano cake adalah produsen makanan ringan berkualitas
                          baik.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-6">Kontak</h3>
                        <p className="text-gray-100">
                          Email: info@ranocake.com
                        </p>
                        <Link
                          href={siteConfig.links.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Hubungi via WhatsApp"
                        >
                          <WhatsappIcon
                            className="text-white hover:text-gray-300 transition-colors"
                            size={45}
                          />
                        </Link>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-6">
                          Kebijakan Pengembalian
                        </h3>
                        <p className="text-gray-100">
                          Silakan buka <Link href="/kebijakan-pengembalian" className="text-white hover:text-gray-300 transition-colors">kebijakan pengembalian </Link> kami.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-6">
                          Syarat & Ketentuan
                        </h3>
                        <p className="text-gray-100">
                          Silakan baca <Link href="/syarat-ketentuan" className="text-white hover:text-gray-300 transition-colors">Syarat & Ketentuan</Link> kami.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-6">
                          Support Pembayaran
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                          <div className="flex justify-center">
                            <Image
                              src="/GoPay.svg"
                              alt="GoPay"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-12"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Image
                              src="/QRIS.svg"
                              alt="QRIS"
                              width={11}
                              height={11}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Image
                              src="/bri.svg"
                              alt="BRI"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Image
                              src="/cimb.svg"
                              alt="CIMB"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Image
                              src="/danamon.svg"
                              alt="Danamon"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Image
                              src="/mandiri.svg"
                              alt="Mandiri"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                          <div className="flex justify-center sm:col-span-1 md:col-span-2 lg:col-span-1">
                            <Image
                              src="/permata.svg"
                              alt="Permata"
                              width={70}
                              height={70}
                              className="hover:opacity-80 transition-opacity object-contain h-auto w-auto max-h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-12">
                      <p className="text-gray-100">
                        &copy; {new Date().getFullYear()} Rano Cake. All rights
                        reserved.
                      </p>
                    </div>
                  </div>
                </footer>
                <Toaster />
                <SpeedInsights />
              </div>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
