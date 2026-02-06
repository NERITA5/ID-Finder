"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { 
  Search, Bell, MessageCircle, MapPin, 
  Wallet, QrCode, ChevronRight, 
  ClipboardList, Navigation, HelpCircle, Loader2, Home, User
} from "lucide-react"; 
import { getRecentReports, getNotifications } from "../../lib/actions";

export default function Dashboard() {
  const { user, isLoaded: userLoaded } = useUser();
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [reportsData, notifyData] = await Promise.all([
          getRecentReports(),
          getNotifications()
        ]);
        setReports(reportsData || []);
        setNotifications(notifyData || []);
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    if (userLoaded && user) loadDashboardData();
  }, [userLoaded, user]);

  if (!userLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="animate-pulse text-[#003366] font-bold text-lg tracking-tight">Loading ID Finder...</div>
    </div>
  );

  return (
    // Applied clean sans-serif stack to match reference image
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#f4f7fe] relative border-x border-slate-100 antialiased" style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* 1. HEADER - MATCHING REFERENCE LAYOUT */}
      <header className="bg-[#0052cc] pt-12 pb-16 px-6 rounded-b-[2rem] shadow-lg text-white shrink-0 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ID Finder</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifications" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5" />
            </Link>
            <Link href="/conversations" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight">Welcome Back, {user?.firstName}!</h2>
            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Do you need help with your ID?</p>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 px-5 -mt-8 relative z-20 space-y-6 pb-32">
        
        {/* BIG ACTION CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/report-lost" className="bg-[#0052cc] p-5 rounded-2xl text-white shadow-md active:scale-95 transition-all flex flex-col items-start">
            <div className="bg-white/20 p-2.5 rounded-xl mb-4">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Report Lost ID</p>
            <p className="text-[11px] opacity-70 mt-0.5">Declare your missing ID</p>
          </Link>
          
          <Link href="/report-found" className="bg-[#2d8a4e] p-5 rounded-2xl text-white shadow-md active:scale-95 transition-all flex flex-col items-start">
            <div className="bg-white/20 p-2.5 rounded-xl mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Found an ID</p>
            <p className="text-[11px] opacity-70 mt-0.5">Return a found ID</p>
          </Link>
        </div>

        {/* QR PROTECTION SECTION */}
        <Link href="/generate-qr" className="bg-white p-4 rounded-xl flex items-center gap-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors">
          <div className="bg-blue-50 p-3 rounded-lg">
            <QrCode className="w-6 h-6 text-[#0052cc]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">Generate QR Sticker</p>
            <p className="text-slate-500 text-[11px]">Create and print unique QR codes</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>

        {/* QUICK ACCESS (NEARBY, REPORTS, HELP) */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-4 ml-1">Quick Access</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'My Reports', icon: <ClipboardList className="w-6 h-6 text-blue-600" />, path: '/my-reports' },
              { label: 'Nearby IDs', icon: <Navigation className="w-6 h-6 text-orange-500" />, path: '/search' },
              { label: 'Help Center', icon: <HelpCircle className="w-6 h-6 text-[#0052cc]" />, path: '/help' }
            ].map((item, i) => (
              <Link key={i} href={item.path} className="bg-white p-4 rounded-xl flex flex-col items-center border border-slate-50 shadow-sm active:scale-95 transition-all">
                <div className="mb-2">{item.icon}</div>
                <span className="text-[11px] font-semibold text-slate-600 text-center">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* RECENT ALERTS (LIVE MATCHES) */}
        <div>
          <div className="flex justify-between items-center mb-4 ml-1">
            <h3 className="font-bold text-slate-800 text-sm">Recent Alerts</h3>
            <Link href="/search" className="text-[11px] font-bold text-[#0052cc] hover:underline">See All</Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : (
              reports.map((alert) => (
                <div key={alert.id} className="bg-white p-4 rounded-xl flex items-center justify-between border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#0052cc]" />
                      </div>
                      <div>
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{alert.idType}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{alert.fullName}</p>
                      </div>
                  </div>
                  {/* Matching the orange action button from the reference */}
                  <Link href={`/report/${alert.id}`} className="bg-[#ff8c00] hover:bg-[#e67e00] text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1">
                      View Details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 3. FIXED NAVIGATION - CLEAN & FLAT */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-[100] max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#0052cc]">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-slate-400">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold">Search</span>
        </Link>
        <Link href="/notifications" className="flex flex-col items-center gap-1 text-slate-400">
          <Bell className="w-6 h-6" />
          <span className="text-[10px] font-bold">Notifications</span>
        </Link>
        
        <Link href="/profile" className="flex flex-col items-center gap-1 group">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 group-hover:border-[#0052cc] transition-all bg-slate-100">
             {user?.imageUrl ? (
               <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <User className="w-4 h-4 text-slate-400 m-1.5" />
             )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0052cc]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}