"use client";
import { useState } from "react";
import { resolveReport } from "@/app/actions/fraud";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

export default function ResolveButton({ reportId }: { reportId: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleResolve = async () => {
    if (status !== 'idle') return;
    
    setStatus('loading');
    const res = await resolveReport(reportId);
    
    if (res.success) {
      setStatus('success');
    } else {
      alert("Update failed. Please try again.");
      setStatus('idle');
    }
  };

  return (
    <button 
      onClick={handleResolve}
      disabled={status !== 'idle'}
      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm 
        ${status === 'success' 
          ? 'bg-green-500 text-white shadow-green-100' 
          : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-slate-100'
        }`}
    >
      {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'success' && <ShieldCheck className="w-3.5 h-3.5 animate-bounce" />}
      {status === 'idle' && <CheckCircle2 className="w-3.5 h-3.5" />}
      
      <span>
        {status === 'loading' ? 'Processing...' : status === 'success' ? 'Resolved' : 'Mark Resolved'}
      </span>
    </button>
  );
}