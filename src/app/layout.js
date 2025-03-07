import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pesagem",
  description: "Gestão de Ordens de Produção",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark:bg-gray-900">
      <body className="dark:bg-gray-900 dark:text-gray-100">{children}</body>
    </html>
  );
}
