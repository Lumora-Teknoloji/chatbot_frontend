// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// DEĞİŞİKLİK BURADA: Yolun başına "app/" eklendi
import { AuthProvider } from "@/app/context/authContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "TextilGPT",
    description: "Tekstil verileriniz hakkında sorular sorun",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
        {/* Tüm uygulamayı AuthProvider ile sarmala */}
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}