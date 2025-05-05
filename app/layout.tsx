import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ConnectionProvider } from "@/contexts/connection-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gậy Thông Minh Cho Người Mù",
  description: "Hệ thống hỗ trợ người khiếm thị di chuyển an toàn",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ConnectionProvider>
            {children}
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
