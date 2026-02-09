"use client";

import { SignedIn, useAuth } from '@clerk/nextjs'
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { userId } = useAuth();

  const mainTabs = ["/dashboard", "/search", "/conversations", "/notifications", "/profile"];
  const isMainTab = mainTabs.includes(pathname);

  return (
    <>
      <SignedIn>
        {userId && <NotificationListener userId={userId} />}
      </SignedIn>

      <main className={`min-h-screen transition-all ${isMainTab ? 'pb-28' : 'pb-10'}`}>
        {children}
      </main>

      <SignedIn>
        {isMainTab && <BottomNav />}
      </SignedIn>
    </>
  );
}