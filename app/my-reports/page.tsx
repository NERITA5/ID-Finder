"use client";
import React, { useEffect, useState } from "react";
import { ChevronLeft, Plus, MapPin, Calendar, Trash2, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUserReports, deleteReport, markAsRecovered } from "@/lib/actions";

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LOST" | "FOUND" | "RECLAIMED">("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUserReports();
      setReports(data || []);
    } catch (error) {
      console.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: "delete" | "recover") => {
    setIsProcessing(id);
    if (action === "delete") {
      if (!confirm("Permanently delete this report?")) {
        setIsProcessing(null);
        return;
      }
      const res = await deleteReport(id);
      if (res.success) setReports(prev => prev.filter(r => r.id !== id));
    } else {
      const res = await markAsRecovered(id);
      if (res.success) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: "RECLAIMED" } : r));
      }
    }
    setIsProcessing(null);
  };

  const filteredReports = reports.filter(r => 
    filter === "ALL" ? true : r.status === filter
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-32">
      {/* HEADER */}
      <div className="bg-white p-6 pt-12 flex items-center justify-between border-b border-slate-100 sticky top-0 z-30">
        <Link href="/dashboard" className="bg-slate-50 p-2 rounded-full active:scale-95 transition-transform">
          <ChevronLeft />
        </Link>
        <h1 className="font-bold text-lg tracking-tight">My Activity</h1>
        <Link href="/report-lost" className="bg-[#0056d2] text-white p-2 rounded-lg shadow-lg active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* FILTER TABS */}
      <div className="flex p-4 gap-2 overflow-x-auto no-scrollbar">
        {["ALL", "LOST", "FOUND", "RECLAIMED"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border ${
              filter === t ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LISTING */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
            <p className="font-bold text-[10px] uppercase tracking-widest">Syncing Records...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 mx-2">
             <p className="text-slate-400 font-bold text-xs uppercase">No {filter !== "ALL" ? filter : ""} items found</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white p-5 rounded-[1.5rem] shadow-sm border transition-all ${
                report.status === 'RECLAIMED' ? 'opacity-60 grayscale border-slate-200' : 'border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase ${
                  report.status === 'LOST' ? 'bg-red-50 text-red-500' : 
                  report.status === 'FOUND' ? 'bg-green-50 text-green-500' : 
                  'bg-slate-100 text-slate-500'
                }`}>
                  {report.status}
                </span>
                
                <button 
                  onClick={() => handleAction(report.id, "delete")}
                  disabled={isProcessing === report.id}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-slate-800 text-base">{report.idType}</h3>
              <p className="text-[11px] text-slate-500 font-medium uppercase mt-0.5">{report.fullName}</p>

              <div className="mt-4 space-y-2 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-[#0056d2]" />
                  <span className="text-[11px] font-semibold">{report.lastLocation || report.location || "Location not set"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-[#0056d2]" />
                  <span className="text-[11px] font-semibold">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                 <Link 
                   href={`/report/${report.id}`} 
                   className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-[10px] uppercase text-center active:scale-95 border border-slate-200"
                 >
                   View Details
                 </Link>
                 
                 {report.status !== 'RECLAIMED' && (
                   <button 
                    onClick={() => handleAction(report.id, "recover")}
                    disabled={isProcessing === report.id}
                    className="flex-1 bg-[#ff8c00] text-white py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-orange-50"
                   >
                     {isProcessing === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                     Mark Recovered
                   </button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}