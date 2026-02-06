"use client";
import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, MapPin, Calendar, 
  ShieldCheck, MessageSquare, Share2, AlertTriangle, Loader2 
} from "lucide-react";
import { getReportById, startChat } from "@/lib/actions"; // Added startChat
import { useUser } from "@clerk/nextjs";

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadReport() {
      const data = await getReportById(id);
      setReport(data);
      setLoading(false);
    }
    loadReport();
  }, [id]);

  // Handler to start/join chat
  const handleContact = async () => {
    if (!user) return router.push("/sign-in");
    
    setChatLoading(true);
    // Note: If this is a LOST report, the finder is the current user.
    // If this is a FOUND report, the finder is report.reporterId.
    const targetUserId = report.userId || report.reporterId;
    
    const result = await startChat(id, targetUserId);
    
    if (result.success) {
      router.push(`/chat/${result.chatId}`);
    } else {
      alert("Failed to initiate chat. Please try again.");
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9ff]">
      <Loader2 className="animate-spin text-[#0056d2] w-10 h-10 mb-2" />
      <div className="text-[#0056d2] font-black italic uppercase text-xs tracking-widest">Loading Details...</div>
    </div>
  );

  if (!report) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-orange-500 mb-4" />
      <h2 className="font-black uppercase italic text-xl">Report Not Found</h2>
      <Link href="/search" className="mt-4 text-[#0056d2] font-bold underline uppercase text-sm">
        Go back to search
      </Link>
    </div>
  );

  const isLost = report.status === "LOST";

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-32 font-sans relative">
      {/* HEADER IMAGE / STATUS BANNER */}
      <div className={`h-64 relative flex items-center justify-center overflow-hidden ${isLost ? 'bg-orange-500' : 'bg-green-600'}`}>
        <Link href="/search" className="absolute top-12 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white z-20 hover:bg-white/30 transition-all">
          <ChevronLeft />
        </Link>
        
        {report.imageUrl ? (
          <img src={report.imageUrl} alt="ID Document" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="bg-white/10 p-8 rounded-full backdrop-blur-xl border border-white/20">
            <ShieldCheck className="w-16 h-16 text-white" />
          </div>
        )}

        <div className="absolute -bottom-1 w-full h-12 bg-white rounded-t-[3rem] z-10" />
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-xl border border-slate-100 z-20">
           <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLost ? 'text-orange-500' : 'text-green-600'}`}>
             ID {report.status}
           </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 leading-tight">{report.idType}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-tighter mt-1">{report.fullName}</p>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <MapPin className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
            <p className="text-xs font-bold text-slate-800 uppercase truncate">{report.lastLocation}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <Calendar className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged On</p>
            <p className="text-xs font-bold text-slate-800 uppercase">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest ml-1">Additional Details</h3>
          <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 italic relative">
            <span className="text-4xl text-slate-200 absolute top-2 left-2 font-serif">“</span>
            <p className="relative z-10 px-2">{report.description || 'No additional description provided for this item.'}</p>
          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 flex gap-4 items-start">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
          </div>
          <p className="text-[10px] text-blue-800 font-bold leading-normal uppercase">
            Safety Tip: Always meet in a public place. Verify the ID details before handover.
          </p>
        </div>
      </div>

      {/* FIXED ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-3 z-50">
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: report.idType, url: window.location.href });
            }
          }}
          className="bg-slate-100 p-4 rounded-2xl active:scale-90 transition-transform hover:bg-slate-200"
        >
          <Share2 className="w-6 h-6 text-slate-600" />
        </button>
        
        <button 
          onClick={handleContact}
          disabled={chatLoading}
          className="flex-1 bg-slate-900 text-white font-black uppercase italic py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-200 hover:bg-black disabled:opacity-50"
        >
          {chatLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              Secure Chat with {isLost ? 'Owner' : 'Finder'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}