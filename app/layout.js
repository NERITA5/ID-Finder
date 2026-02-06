"use client";

import { ClerkProvider, SignedIn } from '@clerk/nextjs'
import './globals.css'
import BottomNav from "@/components/BottomNav"; 
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // 1. We define the 5 "Main Hubs" where the BottomNav stays visible
  // This allows users to jump between Home, Search, Messages, Alerts, and Profile
  const mainTabs = ["/dashboard", "/search", "/conversations", "/notifications", "/profile"];
  
  // Check if we are currently on one of those 5 screens
  const isMainTab = mainTabs.includes(pathname);

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-slate-50">
          
          {/* 2. Dynamic Padding:
            When the BottomNav is visible (isMainTab), we add 'pb-28' 
            to push content above the 5-icon bar.
          */}
          <main className={`min-h-screen transition-all ${isMainTab ? 'pb-28' : 'pb-10'}`}>
            {children}
          </main>

          {/* 3. Navigation Logic:
            The bar only appears when the user is Signed In AND on a Main Tab.
            On "Action" screens (like reporting an ID), the bar hides to give room for forms.
          */}
          <SignedIn>
            {isMainTab && <BottomNav />}
          </SignedIn>
          
        </body>
      </html>
    </ClerkProvider>
  )
}