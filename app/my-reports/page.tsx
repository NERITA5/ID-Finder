"use client";

import React, { useEffect, useState } from "react";
import { 
  ChevronLeft, Plus, MapPin, Calendar, Trash2, 
  CheckCircle, Loader2, Wallet, Search 
} from "lucide-react";
import Link from "next/link";
import { getUserReports, deleteReport, markAsRecovered } from "@/lib/actions";

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LOST" | "AVAILABLE" | "RETURNED">("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUserReports();
      const combined = [
        ...data.lost.map((item: any) => ({ ...item, type: 'LOST' })),
        ...data.found.map((item: any) => ({ ...item, type: 'FOUND' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReports(combined);
    } catch (error) {
      console.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, type: 'LOST' | 'FOUND', action: "delete" | "recover") => {
    setIsProcessing(id);
    if (action === "delete") {
      if (!confirm("Permanently delete this report?")) {
        setIsProcessing(null);
        return;
      }
      const res = await deleteReport(id, type);
      if (res.success) setReports(prev => prev.filter(r => r.id !== id));
    } else {
      const res = await markAsRecovered(id);
      if (res.success) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: "RETURNED" } : r));
      }
    }
    setIsProcessing(null);
  };

  const filteredReports = reports.filter(r => 
    filter === "ALL" ? true : r.status === filter || r.type === filter
  );

  return (
    <div className="max-w-md mx-auto bg-[#f4f7fe] min-h-screen pb-32 antialiased">
      
      {/* HEADER - Updated to Blue Handwriting Style */}
      <div className="bg-[#0052cc] p-6 pt-12 pb-16 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <Link href="/dashboard" className="bg-white/10 p-2 rounded-full active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl handwriting font-bold">My Activity</h1>
          <Link href="/report-lost" className="bg-white text-[#0052cc] p-2 rounded-xl shadow-lg active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-blue-100 text-center text-xs font-bold uppercase tracking-widest mt-4 opacity-70">Registry History</p>
      </div>

      {/* FILTER TABS */}
      <div className="flex p-4 gap-2 overflow-x-auto no-scrollbar -mt-8 relative z-20">
        {["ALL", "LOST", "AVAILABLE", "RETURNED"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border ${
              filter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-white'
            }`}
          >
            {t === "AVAILABLE" ? "Found" : t}
          </button>
        ))}
      </div>

      {/* LISTING */}
      <div className="px-4 space-y-4 mt-2">
        {loading ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#0052cc]" />
            <p className="font-black text-[10px] uppercase tracking-widest">Syncing Records...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-slate-100 mx-2 shadow-sm">
             <p className="handwriting text-2xl text-slate-300">No reports here yet</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white p-3 rounded-[2.5rem] shadow-sm border transition-all ${
                report.status === 'RETURNED' ? 'opacity-60 grayscale bg-slate-50' : 'border-white'
              }`}
            >
              {/* IMAGE PREVIEW FOR FOUND ITEMS */}
              {report.imageUrl && (
                <div className="w-full h-44 rounded-[2rem] overflow-hidden mb-3 relative">
                   <img src={report.imageUrl} className="w-full h-full object-cover" alt="ID Preview" />
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm text-blue-600">
                     Proof Attached
                   </div>
                </div>
              )}

              <div className="px-3 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    report.type === 'LOST' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {report.type === 'LOST' ? <Search className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                    <span className="text-[9px] font-black uppercase tracking-tighter">{report.type}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleAction(report.id, report.type, "delete")}
                    disabled={isProcessing === report.id}
                    className="text-slate-200 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="handwriting text-2xl text-slate-800 leading-none">{report.idType}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{report.fullName}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold truncate uppercase">{report.lastLocation || report.region || 'Buea'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 justify-end">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                   {report.status === 'LOST' && (
                     <button 
                      onClick={() => handleAction(report.id, 'LOST', "recover")}
                      disabled={isProcessing === report.id}
                      className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-100"
                     >
                       {isProcessing === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                       Mark Recovered
                     </button>
                   )}
                   <Link 
                     href={`/report/${report.id}`} 
                     className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase text-center active:scale-95"
                   >
                     View Details
                   </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}