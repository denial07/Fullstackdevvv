"use client"

import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"

export function Navbar() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <Link href="/">
              <img src="/NGSlogo.png" alt="NGS Logo" className="h-12 w-auto cursor-pointer" />
            </Link>
            <p className="text-slate-600">Shipment, Inventory & Order Management Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/shipments">Shipments</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/inventory">Inventory</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/inbox">Inbox</Link>
            </Button>
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}
