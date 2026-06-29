import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PiaSmart -TK Tadika Mesra",
  description:
    "PiaSmart - Buku penghubung digital dan portal akademik cerdas TK Tadika Mesra. Pantau absensi, jurnal aktivitas harian, laporan perkembangan, dan administrasi ananda secara real-time.",
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
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"></header>

        {children}
      </body>
    </html>
  );
}
