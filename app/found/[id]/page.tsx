"use client";
import React, { useState } from "react";
import { MapPin, ShieldCheck, Megaphone, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { reportFoundId } from "@/lib/actions"; // Import the server action

export default function DiscoveryPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleFound = async () => {
    setLoading(true);
    try {
      // Using your existing Server Action instead of a fetch API
      const res = await reportFoundId({
        idType: "Scanned ID", // You can refine this by fetching ID details first
        fullName: "Someone", 
        imageUrl: "",
        region: "Detected via QR Scan",
        locationDetail: "Finder is waiting for contact instructions.",
        reporterName: "Anonymous Hero",
      });

      if (res.success) {
        setSent(true);
        // Redirect to the detailed report page to collect more location info
        setTimeout(() => {
            router.push(`/report-found?prefill=${params.id}`);
        }, 2000);
      }
    } catch (err) {
      alert("Failed to notify owner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* HEADER */}
      <div className={`p-8 pt-16 text-white text-center rounded-b-[3rem] shadow-2xl transition-colors duration-500 ${sent ? 'bg-green-500' : 'bg-red-500'}`}>
        <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          {sent ? <CheckCircle2 className="w-10 h-10" /> : <Megaphone className="w-10 h-10" />}
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
          {sent ? "Alert Sent!" : "ID Reported Lost!"}
        </h1>
        <p className="mt-2 text-white/80 font-bold text-sm uppercase">
          {sent ? "The owner is being notified now" : "You are a hero for scanning this."}
        </p>
      </div>

      <div className="p-8 space-y-6 text-center">
        {/* INFO CARD */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Found Item Reference</p>
           <h2 className="text-xl font-black text-slate-800 uppercase italic">Code: {params.id.slice(0,8)}</h2>
           <div className="flex items-center justify-center gap-1 text-slate-500 mt-2">
             <MapPin className="w-4 h-4 text-red-500" />
             <span className="text-xs font-bold uppercase tracking-tight">Owner is waiting for your signal</span>
           </div>
        </div>

        {/* TRIGGER BUTTON */}
        <button 
          onClick={handleFound}
          disabled={loading || sent}
          className={`w-full font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-3 text-xl uppercase tracking-tighter active:scale-95 transition-all ${
            sent ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#2d8a4e] text-white hover:bg-[#246d3e]'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : sent ? (
            "Notification Sent"
          ) : (
            <>I Found This ID <ChevronRight className="w-6 h-6" /></>
          )}
        </button>

        {/* SAFETY CARD */}
        <div className="flex items-start gap-4 text-left bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <ShieldCheck className="text-blue-600 w-12 h-12 shrink-0" />
          <div>
            <h4 className="font-black text-blue-900 text-xs uppercase italic">Safe Return Policy</h4>
            <p className="text-[10px] text-blue-700 font-medium leading-relaxed mt-1">
              Your privacy is priority. Clicking the button alerts the owner securely. You can then provide more details on the next screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}