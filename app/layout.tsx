import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image"; // <-- ini yang baru
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Absensi TK Tadika Mesra",
  description: "Aplikasi absensi sederhana dengan notifikasi WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* LOGO DI ATAS APLIKASI */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
          <Image
            src="/piasmart.svg"
            alt="PIA Smart"
            width={80}
            height={80}
            priority
            className="drop-shadow-xl"
          />
        </header>

        {children}
      </body>
    </html>
  );
}
