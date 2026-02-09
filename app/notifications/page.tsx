"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Bell, ChevronLeft, CheckCircle, MessageSquare, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getNotifications, markNotificationsAsRead, startChat } from "@/lib/actions";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const router = useRouter();

  // Memoized load function for initial fetch and Pusher updates
  const loadNotifications = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
      
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
        loadNotifications(false); // Silent refresh when new alert hits
      });

      return () => {
        pusherClient.unsubscribe(`user-alerts-${user.id}`);
      };
    }
  }, [user?.id, loadNotifications]);

  const handleContact = async (notification: any) => {
    const reportId = notification.metadata?.reportId;
    const senderId = notification.metadata?.senderId;

    if (!reportId || !senderId || senderId === "anonymous") {
      alert("This reporter is anonymous or contact info is missing.");
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
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">Checking Signals</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200/50 mx-2 shadow-sm">
            <Bell className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p className="font-black uppercase text-xs text-slate-400 italic tracking-tight">No New Alerts Yet</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase mt-2 px-10 leading-relaxed">
              We'll notify you the moment someone scans your QR code or finds a match.
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`bg-white p-5 rounded-[2.5rem] shadow-sm border-l-4 transition-all hover:shadow-md ${
                n.type === 'MATCH' ? 'border-blue-600' : 'border-orange-500'
              } relative overflow-hidden`}
            >
              <div className="flex gap-4">
                <div className={`${n.type === 'MATCH' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} p-3 rounded-2xl h-fit`}>
                  {n.type === 'MATCH' ? <CheckCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 uppercase italic leading-none text-sm truncate">{n.title}</h3>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shrink-0"></span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-tight font-medium">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-5">
                <Link 
                  href={`/report/${n.metadata?.reportId || ''}`}
                  className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider text-center active:scale-95 transition-all shadow-lg shadow-slate-200"
                >
                  View Details
                </Link>
                <button 
                  onClick={() => handleContact(n)}
                  disabled={isStartingChat === n.id}
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isStartingChat === n.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <><MessageSquare className="w-3 h-3" /> Contact</>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER TIP */}
      {!loading && notifications.length > 0 && (
        <div className="px-10 text-center py-4">
            <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed italic">
              "Security Tip: Always meet in public places like a police station for document handovers."
            </p>
        </div>
      )}
    </div>
  );
}