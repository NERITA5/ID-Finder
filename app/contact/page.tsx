"use client";
import React, { useState } from "react";
import { ChevronLeft, Send, Loader2, CheckCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendSupportEmail } from "@/app/actions/support";

export default function ContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const result = await sendSupportEmail(data);
    if (result.success) {
      setSubmitted(true);
    } else {
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  // SUCCESS STATE ADJUSTED
  if (submitted) {
    return (
      <div className="max-w-md mx-auto h-screen bg-white flex flex-col items-center justify-center p-10 text-center font-sans antialiased">
        <div className="bg-green-100 p-8 rounded-[2.5rem] mb-6 animate-in zoom-in duration-300">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          Ticket Created!
        </h2>
        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest leading-relaxed">
          Your message is in our inbox. <br /> Check your email for updates soon.
        </p>
        
        <button 
          onClick={() => {
            // Use replace to clear the form from history and force navigation
            router.replace("/help");
          }} 
          className="mt-10 bg-slate-900 text-white w-full py-5 rounded-[2rem] font-black uppercase italic text-[11px] tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-200"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-10 font-sans antialiased">
      {/* HEADER */}
      <div className="p-6 pt-12 flex items-center gap-4 border-b border-slate-50 sticky top-0 bg-white z-20">
        <button 
          onClick={() => router.back()} 
          className="bg-slate-50 p-2 rounded-xl active:scale-90 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Contact Desk</h1>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Full Name</label>
          <input 
            name="name" 
            required 
            placeholder="John Doe"
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Email Address</label>
          <input 
            name="email" 
            type="email" 
            required 
            placeholder="john@example.com"
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Subject</label>
          <input 
            name="subject" 
            required 
            placeholder="Matching issue / Account help"
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Your Message</label>
          <textarea 
            name="message" 
            required 
            placeholder="Tell us how we can help..."
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[150px] resize-none" 
          />
        </div>

        <button 
          disabled={loading} 
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <><Send className="w-4 h-4" /> Send Message</>
          )}
        </button>
      </form>
    </div>
  );
}