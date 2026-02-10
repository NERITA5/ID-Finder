"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Bell, ChevronLeft, CheckCircle, MessageSquare, Loader2, Info, Sparkles, QrCode, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getNotifications, markNotificationsAsRead, startChat, clearAllNotifications } from "@/lib/actions";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";

// Helper for relative time
const formatRelativeTime = (date: Date) => {
  const diffInSeconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 8400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const loadNotifications = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
      
      // Mark as read if there are unread notifications
      if (data && data.some((n: any) => !n.isRead)) {
        await markNotificationsAsRead();
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(true);
    if (user?.id) {
      const channel = pusherClient.subscribe(`user-alerts-${user.id}`);
      channel.bind("new-notification", () => {
        // Refresh the list when a new match or update arrives
        loadNotifications(false);
      });
      return () => { 
        pusherClient.unsubscribe(`user-alerts-${user.id}`); 
      };
    }
  }, [user?.id, loadNotifications]);

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all alerts?")) return;
    
    setIsClearing(true);
    const result = await clearAllNotifications();
    if (result.success) {
      setNotifications([]);
    }
    setIsClearing(false);
  };

  const handleContact = async (notification: any) => {
    const reportId = notification.metadata?.reportId;
    const senderId = notification.metadata?.senderId;

    if (!reportId || !senderId) {
      alert("Missing contact information for this alert.");
      return;
    }

    if (senderId === "anonymous" || senderId === "system") {
      alert("This report was filed anonymously or by the system. Check 'View Details' for instructions.");
      return;
    }

    setIsStartingChat(notification.id);
    const result = await startChat(reportId, senderId);
    if (result.success) {
      router.push(`/chat/${result.chatId}`);
    } else {
      alert("Could not start conversation.");
      setIsStartingChat(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[#f8f9ff] min-h-screen pb-32 font-sans border-x border-slate-100 antialiased">
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-md p-6 pt-12 flex items-center justify-between border-b border-slate-100 sticky top-0 z-30">
        <button 
          onClick={() => router.back()} 
          className="bg-slate-50 p-2 rounded-full active:scale-90 transition-transform text-slate-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black uppercase italic tracking-tighter text-xl text-slate-800">Alert Center</h1>
        <button 
          onClick={handleClearAll}
          disabled={notifications.length === 0 || isClearing}
          className="text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all p-2"
        >
          {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Interrogating<br/>The Registry</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200/50 mx-2 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell className="w-8 h-8 text-slate-200" />
            </div>
            <p className="font-black uppercase text-xs text-slate-400 italic tracking-tight">System Status: Quiet</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase mt-2 px-10 leading-relaxed">
              We'll broadcast an alert the moment your ID is located.
            </p>
          </div>
        ) : (
          notifications.map(n => {
            const isQRMatch = n.title.toLowerCase().includes("qr");
            const isSystemMatch = n.type === 'MATCH';

            return (
              <div 
                key={n.id} 
                className={`bg-white p-5 rounded-[2.5rem] shadow-sm border-l-4 transition-all hover:shadow-md ${
                  isSystemMatch ? 'border-blue-600 ring-4 ring-blue-50/20' : 'border-orange-500'
                } relative overflow-hidden`}
              >
                {/* Sparkle badge for Matches */}
                {isSystemMatch && (
                  <div className="absolute top-0 right-0 bg-blue-600 px-3 py-1 rounded-bl-2xl">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="flex gap-4">
                  <div className={`${isSystemMatch ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} p-3 rounded-2xl h-fit shadow-inner`}>
                    {isQRMatch ? <QrCode className="w-6 h-6" /> : (isSystemMatch ? <CheckCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-800 uppercase italic leading-none text-sm truncate pr-2">{n.title}</h3>
                      {!n.isRead && <span className="w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-tight font-medium">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                         {formatRelativeTime(n.createdAt)}
                       </p>
                       <span className="text-slate-200">•</span>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">
                         {isSystemMatch ? 'CRITICAL MATCH' : 'SYSTEM UPDATE'}
                       </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-5">
                  <Link 
                    href={`/report/${n.metadata?.reportId || ''}`}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider text-center active:scale-95 transition-all"
                  >
                    View Details
                  </Link>
                  
                  {/* Chat button only if sender is not system/anonymous */}
                  {n.metadata?.senderId && n.metadata?.senderId !== "system" && n.metadata?.senderId !== "anonymous" && (
                    <button 
                      onClick={() => handleContact(n)}
                      disabled={isStartingChat === n.id}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                      {isStartingChat === n.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><MessageSquare className="w-3 h-3" /> Start Chat</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER TIP */}
      {!loading && notifications.length > 0 && (
        <div className="px-12 text-center py-6 opacity-60">
            <div className="h-[1px] bg-slate-100 w-full mb-4"></div>
            <p className="text-[9px] text-slate-400 font-black uppercase leading-relaxed italic">
              "Trust but verify. Confirm item details via chat before making travel plans."
            </p>
        </div>
      )}
    </div>
  );
}