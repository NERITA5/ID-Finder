"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, Bell, User } from "lucide-react";
import { useUser } from "@clerk/nextjs"; // Changed from UserButton to useUser
import { getNotifications } from "@/lib/actions";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser(); // Get user data (image, etc.) directly
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Sync notification badges for Messages
  useEffect(() => {
    async function checkNotifications() {
      try {
        const notifyData = await getNotifications();
        const count = notifyData.filter(
          (n: any) => n.type === "message" && !n.isRead
        ).length;
        setUnreadMessages(count);
      } catch (err) {
        console.error("Nav sync error:", err);
      }
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { icon: Home, path: "/dashboard", label: "Home" },
    { icon: Search, path: "/search", label: "Search" },
    { 
      icon: MessageCircle, 
      path: "/conversations", 
      label: "Messages", 
      hasBadge: unreadMessages > 0 
    },
    { icon: Bell, path: "/notifications", label: "Alerts" },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 flex justify-around items-center z-[9999] h-20 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path === "/conversations" && pathname.startsWith("/chat/"));
        
        // CUSTOM PROFILE SLOT (Replaced UserButton with a direct Link)
        if (item.label === "Profile") {
          return (
            <Link
              key="profile"
              href="/profile"
              className="relative flex flex-col items-center justify-center min-w-[64px] h-full pt-2 group"
            >
              <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${isActive ? 'border-[#0056d2]' : 'border-slate-100'}`}>
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'text-[#0056d2]' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-10 h-1 bg-[#0056d2] rounded-t-full" />
              )}
            </Link>
          );
        }

        // STANDARD NAV ITEMS
        return (
          <Link
            key={item.path}
            href={item.path}
            className="relative flex flex-col items-center justify-center min-w-[64px] h-full pt-2 transition-all"
          >
            <div className="relative">
              <item.icon 
                className={`w-7 h-7 ${isActive ? 'text-[#0056d2]' : 'text-slate-400'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              {item.label === "Messages" && item.hasBadge && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadMessages}
                </span>
              )}

              {item.label === "Alerts" && (
                 <span className="absolute top-0 -right-0.5 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white" />
              )}
            </div>
            
            <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'text-[#0056d2]' : 'text-slate-400'}`}>
              {item.label}
            </span>

            {isActive && (
              <div className="absolute bottom-0 w-10 h-1 bg-[#0056d2] rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}