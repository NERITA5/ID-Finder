"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { 
  Search, Bell, MapPin, Wallet, QrCode, 
  ChevronRight, ClipboardList, Navigation, HelpCircle, 
  Loader2, MessageCircle, CheckCircle2, Sparkles
} from "lucide-react"; 
import { getRecentReports } from "@/lib/actions";
import { pusherClient } from "@/lib/pusher-client";

export default function Dashboard() {
  const { user, isLoaded: userLoaded } = useUser();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const reportsData = await getRecentReports();
      
      // PRIVATE MATCH LOGIC: 
      const myPrivateMatches = reportsData?.filter((report: any) => 
        report.userId === user?.id && report.status === "matched"
      ) || [];
      
      setReports(myPrivateMatches);
    } catch (err) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userLoaded && user) {
      loadDashboardData();
      const channel = pusherClient.subscribe(`user-alerts-${user.id}`);
      channel.bind("new-notification", () => loadDashboardData());
      return () => { pusherClient.unsubscribe(`user-alerts-${user.id}`); };
    }
  }, [userLoaded, user, loadDashboardData]);

  if (!userLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#f4f7fe]">
        <Loader2 className="w-8 h-8 text-[#0052cc] animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#f4f7fe] relative antialiased pb-24">
      
      {/* HEADER - RESTORED KETTY TEXT */}
      <header className="bg-[#0052cc] pt-14 pb-24 px-6 rounded-b-[3.5rem] shadow-xl text-white shrink-0 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-xl shadow-lg">
                <Search className="w-5 h-5 text-[#0052cc]" />
            </div>
            <span className="text-2xl handwriting font-bold tracking-tight">ID Finder</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/conversations" className="p-2 bg-white/10 rounded-xl border border-white/20">
                <MessageCircle className="w-5 h-5" />
            </Link>
            <Link href="/notifications" className="p-2 bg-white/10 rounded-xl border border-white/20">
                <Bell className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 px-1">
            {/* EXACT TEXT RESTORED */}
            <h2 className="text-4xl handwriting font-bold leading-none">Welcome back, {user?.firstName || "Ketty"}</h2>
            <p className="text-blue-100 text-lg handwriting mt-2 opacity-90">need help finding ur id????</p>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-5 -mt-12 relative z-20 space-y-7">
        
        {/* ACTION CARDS - RESTORED EXACT LABELS */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/report-lost" className="bg-[#0052cc] p-6 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 active:scale-95 transition-all flex flex-col items-start border-4 border-white/10">
            <div className="bg-white/20 p-3 rounded-2xl mb-5">
              <Search className="w-6 h-6" />
            </div>
            <p className="handwriting text-lg leading-none">report lost id</p>
            <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest font-sans">declare your missing id</p>
          </Link>
          
          <Link href="/report-found" className="bg-[#2d8a4e] p-6 rounded-[2.5rem] text-white shadow-2xl shadow-green-200 active:scale-95 transition-all flex flex-col items-start border-4 border-white/10">
            <div className="bg-white/20 p-3 rounded-2xl mb-5">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="handwriting text-lg leading-none">found an id</p>
            <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest font-sans">return a found id</p>
          </Link>
        </div>

        {/* VAULT LINK */}
        <Link href="/generate-qr" className="bg-white p-5 rounded-[2.5rem] flex items-center gap-5 shadow-sm border border-slate-100 active:bg-slate-50 transition-all group">
          <div className="bg-blue-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
            <QrCode className="w-7 h-7 text-[#0052cc]" />
          </div>
          <div className="flex-1">
            <p className="handwriting text-xl text-slate-800 leading-none">Generate QR Sticker</p>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-tight font-sans">Secure your physical ID</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </Link>

        {/* QUICK COMMANDS */}
        <div>
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 ml-2 font-sans">Quick Commands</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'My Reports', icon: <ClipboardList className="w-6 h-6 text-blue-600" />, path: '/my-reports' },
              { label: 'Nearby IDs', icon: <Navigation className="w-6 h-6 text-orange-500" />, path: '/search' },
              { label: 'Help Center', icon: <HelpCircle className="w-6 h-6 text-[#0052cc]" />, path: '/help' }
            ].map((item, i) => (
              <Link key={i} href={item.path} className="bg-white py-5 px-2 rounded-[1.5rem] flex flex-col items-center border border-slate-50 shadow-sm transition-all">
                <div className="mb-2">{item.icon}</div>
                <span className="handwriting text-base text-slate-600 font-bold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* PRIVATE ALERT FEED */}
        <div className="pb-10">
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 ml-2 font-sans">Recent Alerts</h3>
          
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-200 w-8 h-8" /></div>
            ) : reports.length === 0 ? (
               <div className="bg-white p-10 rounded-[2rem] text-center border border-slate-100 opacity-60">
                  <p className="handwriting text-xl text-slate-400">No active alerts.</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">We'll notify you here when your ID is found.</p>
               </div>
            ) : (
              reports.map((match) => (
                <div key={match.id} className="bg-emerald-50 p-5 rounded-[2.5rem] flex items-center justify-between border border-emerald-100 shadow-md">
                  <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="handwriting text-xl text-slate-800 leading-none">Match Found!</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase font-sans">Your {match.idType} is safe</p>
                      </div>
                  </div>
                  <Link href={`/conversations/${match.id}`} className="bg-emerald-500 text-white text-[14px] handwriting px-5 py-2 rounded-xl shadow-lg shadow-emerald-200">
                      Chat
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}