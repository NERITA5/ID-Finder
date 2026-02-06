"use client";
import React, { useEffect, useState } from "react";
import { Bell, ChevronLeft, MapPin, CheckCircle, MessageSquare, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { getNotifications, markNotificationsAsRead } from "@/lib/actions";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      const data = await getNotifications();
      setNotifications(data || []);
      setLoading(false);
      
      // Once viewed, mark them all as read in the background
      if (data && data.length > 0) {
        await markNotificationsAsRead();
      }
    }
    loadNotifications();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-[#f8f9ff] min-h-screen pb-10 font-sans">
      {/* HEADER */}
      <div className="bg-white p-6 pt-12 flex items-center justify-between border-b border-slate-100 sticky top-0 z-30">
        <Link href="/dashboard" className="bg-slate-50 p-2 rounded-full active:scale-90 transition-transform text-slate-600">
          <ChevronLeft />
        </Link>
        <h1 className="font-black uppercase italic tracking-tighter text-xl text-slate-800">Alert Center</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="font-black text-[10px] uppercase tracking-widest">Checking Signals</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <Bell className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p className="font-black uppercase text-xs text-slate-400 italic">No New Alerts Yet</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase mt-2 px-10 leading-relaxed">
              We'll notify you the moment someone scans your QR code or finds a match.
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`bg-white p-5 rounded-[2.5rem] shadow-sm border-l-4 transition-all ${
                n.type === 'MATCH' ? 'border-blue-600' : 'border-orange-500'
              } relative overflow-hidden`}
            >
              <div className="flex gap-4">
                <div className={`${n.type === 'MATCH' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} p-3 rounded-2xl h-fit`}>
                  {n.type === 'MATCH' ? <CheckCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 uppercase italic leading-none text-sm">{n.title}</h3>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-tight font-medium">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-5">
                <button className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-slate-200">
                  View Details
                </button>
                <button className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100">
                  <MessageSquare className="w-3 h-3" /> Contact
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