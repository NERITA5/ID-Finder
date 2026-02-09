"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, Bell, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getNotifications } from "@/lib/actions";
import { pusherClient } from "@/lib/pusher-client"; // Use the client helper

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  
  // State for different types of badges
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Initial Load of counts
    async function syncCounts() {
      try {
        const notifyData = await getNotifications();
        
        // Count unread chat messages
        const msgCount = notifyData.filter(
          (n: any) => n.type === "message" && !n.isRead
        ).length;
        
        // Count unread ID matches / general alerts
        const alertCount = notifyData.filter(
          (n: any) => n.type === "MATCH" && !n.isRead
        ).length;

        setUnreadMessages(msgCount);
        setUnreadAlerts(alertCount);
      } catch (err) {
        console.error("Nav sync error:", err);
      }
    }

    syncCounts();

    // 2. REAL-TIME PUSHER LISTENER
    // Instead of an interval, we listen for the "new-notification" event
    const channel = pusherClient.subscribe(`user-alerts-${user.id}`);

    channel.bind("new-notification", () => {
      // When a new notification arrives, refresh the counts immediately
      syncCounts();
    });

    return () => {
      pusherClient.unsubscribe(`user-alerts-${user.id}`);
    };
  }, [user?.id]);

  const navItems = [
    { icon: Home, path: "/dashboard", label: "Home" },
    { icon: Search, path: "/search", label: "Search" },
    { 
      icon: MessageCircle, 
      path: "/conversations", 
      label: "Messages", 
      count: unreadMessages 
    },
    { 
      icon: Bell, 
      path: "/notifications", 
      label: "Alerts", 
      count: unreadAlerts 
    },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 flex justify-around items-center z-[9999] h-20 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path === "/conversations" && pathname.startsWith("/chat/"));
        
        // PROFILE SLOT
        if (item.label === "Profile") {
          return (
            <Link
              key="profile"
              href="/profile"
              className="relative flex flex-col items-center justify-center min-w-[64px] h-full pt-2 group"
            >
              <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${isActive ? 'border-[#0056d2]' : 'border-slate-100'}`}>
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'text-[#0056d2]' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {isActive && <div className="absolute bottom-0 w-10 h-1 bg-[#0056d2] rounded-t-full" />}
            </Link>
          );
        }

        // STANDARD ITEMS (Home, Search, Messages, Alerts)
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
              
              {/* DYNAMIC BADGE */}
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
                  {item.count > 9 ? "9+" : item.count}
                </span>
              )}
            </div>
            
            <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'text-[#0056d2]' : 'text-slate-400'}`}>
              {item.label}
            </span>

            {isActive && <div className="absolute bottom-0 w-10 h-1 bg-[#0056d2] rounded-t-full" />}
          </Link>
        );
      })}
    </nav>
  );
}