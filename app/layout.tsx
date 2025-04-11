import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import InitStorage from "@/app/init";
import "./globals.css";

// Load Google fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Roobert is already defined in globals.css as a local font

export const metadata: Metadata = {
  title: "Client-Side Experimentation",
  description: "Manage and deploy client-side experiments with Statsig integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="antialiased"
      >
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
              <Sidebar />
              <main className="flex-1 overflow-auto max-w-full">
                <InitStorage />
                {children}
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
