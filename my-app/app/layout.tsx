import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "@/components/SessionProvider"

export const metadata: Metadata = {
  title: "Ng Guan Seng",
  description: "Shipment and Inventory Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
