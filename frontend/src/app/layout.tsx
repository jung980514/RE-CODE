import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// 필요 CSS만 전역 로드: datepicker 스타일은 유지, Bootstrap 코어 CSS는 제거
import "bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css";
import "flatpickr/dist/flatpickr.min.css";
// Tailwind가 포함된 글로벌 CSS
import "./globals.css";
import localFont from "next/font/local"
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

const paperlogy = localFont({
  src: "../fonts/Paperlogy-7Bold.ttf",
  display: "swap",
  weight: "45 920",
  variable: "--font-Paperlogy-7Bold",
});

export const metadata: Metadata = {
  title: "RE:CODE",
  description: "RE:CODE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} ${geistSans.variable} ${geistMono.variable} ${paperlogy.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
