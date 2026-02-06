"use client";
import React, { useState } from "react";
import { 
  ChevronLeft, Search, HelpCircle, ShieldCheck, 
  AlertTriangle, ChevronDown, Mail, ChevronRight 
} from "lucide-react";
import { useRouter } from "next/navigation";

const FAQS = [
  {
    category: "Security",
    icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,
    questions: [
      { q: "Is my ID data safe?", a: "We never show your full ID number. We only display your name and ID type to help finders identify you." },
      { q: "How do I meet a finder?", a: "Always meet in public, well-lit places like a Police Station or a busy Shopping Mall. Never go alone." }
    ]
  },
  {
    category: "Process",
    icon: <HelpCircle className="w-4 h-4 text-purple-600" />,
    questions: [
      { q: "How does matching work?", a: "Our system automatically compares 'Lost' reports with 'Found' reports based on name and ID type." },
      { q: "What if someone asks for money?", a: "Report them immediately. This platform is for community help; we do not support forced rewards." }
    ]
  }
];

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => setOpenIndex(openIndex === id ? null : id);

  return (
    <div className="max-w-md mx-auto bg-[#fcfcfd] min-h-screen pb-24 font-sans antialiased">
      
      {/* 1. HEADER */}
      <div className="bg-white p-6 pt-12 border-b border-slate-50 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="bg-slate-50 p-2 rounded-xl active:scale-90 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="font-black uppercase italic tracking-tighter text-xl text-slate-800">Support Center</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search for help..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* 2. REPORT FRAUD BANNER */}
        <button 
          onClick={() => router.push("/report-fraud")}
          className="w-full bg-orange-600 p-5 rounded-[2rem] shadow-lg shadow-orange-100 flex items-center justify-between text-white active:scale-[0.98] transition-all group text-left"
        >
          <div className="space-y-1">
            <h3 className="font-black uppercase italic text-sm tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Report Fraud
            </h3>
            <p className="text-[10px] font-bold opacity-80 uppercase leading-tight">Something suspicious? Let us know immediately.</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* 3. CATEGORIZED FAQS */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Frequently Asked Questions</p>
          
          {FAQS.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-2">
              <div className="flex items-center gap-2 px-2 mb-3">
                {cat.icon}
                <span className="text-xs font-black uppercase italic text-slate-600">{cat.category}</span>
              </div>
              
              {cat.questions.map((item, qIdx) => {
                const id = `${catIdx}-${qIdx}`;
                const isOpen = openIndex === id;
                return (
                  <div key={id} className="bg-white border border-slate-50 rounded-[1.5rem] overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleFAQ(id)} 
                      className="w-full p-4 flex items-center justify-between text-left active:bg-slate-50"
                    >
                      <span className="text-[11px] font-black uppercase text-slate-800 pr-4">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 4. CONTACT SECTION */}
        <div className="bg-slate-900 rounded-[3rem] p-8 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="relative z-10 space-y-4">
            <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/10">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="font-black uppercase italic text-lg leading-tight tracking-tight">Need further help?</h2>
            <button 
              onClick={() => router.push("/contact")}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-5 rounded-[2rem] text-[11px] font-black uppercase italic tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Mail className="w-4 h-4" />
              Send Us An Email
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}