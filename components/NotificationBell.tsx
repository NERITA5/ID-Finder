"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, MessageSquare, ShieldCheck, MapPin, X } from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";
import { getNotifications, markNotificationsAsRead } from "@/lib/actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell({ currentUserId }: { currentUserId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 1. Fetch data and setup Pusher
  useEffect(() => {
    const loadInitial = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };
    loadInitial();

    const channel = pusherClient.subscribe(`user-alerts-${currentUserId}`);
    channel.bind("new-notification", async () => {
      // Re-fetch to get the full object including message/metadata
      const updated = await getNotifications();
      setNotifications(updated);
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      pusherClient.unsubscribe(`user-alerts-${currentUserId}`);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentUserId]);

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      await markNotificationsAsRead();
      // Optimistically mark as read in local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* The Bell Icon */}
      <button 
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-blue-600 animate-pulse" : "text-slate-600"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black italic uppercase tracking-tighter text-slate-800">Notifications</h3>
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400">All caught up!</p>
              </div>
            ) : (
              notifications.map((note) => (
                <div 
                  key={note.id}
                  className={`p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors ${!note.isRead ? "bg-blue-50/30" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    note.type === 'MATCH' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {note.type === 'MATCH' ? <ShieldCheck className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-black text-slate-800 leading-tight">{note.title}</p>
                    <p className="text-[11px] font-medium text-slate-500 leading-snug">{note.message}</p>
                    <span className="text-[9px] font-bold uppercase text-slate-300 tracking-wider mt-1">
                      {formatDistanceToNow(new Date(note.createdAt))} ago
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link 
            href="/notifications" 
            className="block p-4 text-center text-[10px] font-black uppercase tracking-widest text-blue-600 bg-slate-50 hover:bg-blue-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            View All Activity
          </Link>
        </div>
      )}
    </div>
  );
}