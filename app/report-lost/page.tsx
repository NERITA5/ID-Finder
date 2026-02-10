"use client";
import React, { useState } from "react";
import { 
  Camera, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Loader2, 
  ChevronLeft, 
  CheckCircle, 
  Hash, 
  Info, 
  Baby, 
  CalendarDays,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function ReportLostPage() {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    idType: "National ID",
    fullName: "",
    idNumber: "", 
    dateOfBirth: "",   // CRITICAL for matching
    placeOfBirth: "",  // CRITICAL for matching
    dateOfIssue: "",   // CRITICAL for matching
    lastLocation: "",
    dateLost: "",
    description: "",
    imageUrl: "",
  });

  const uploadImage = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: "dkndxbeao", 
          uploadPreset: "ml_default", 
          sources: ["local", "camera"],
          multiple: false,
          theme: "minimal",
          styles: {
            palette: {
              window: "#FFFFFF",
              sourceBg: "#F4F4F5",
              windowBorder: "#90A0B3",
              tabIcon: "#0056D2",
              inactiveTabIcon: "#6E7075",
              menuIcons: "#0056D2",
              link: "#0056D2",
              action: "#0056D2",
              inProgress: "#0056D2",
              complete: "#10B981",
              error: "#EF4444",
              textDark: "#000000",
              textLight: "#FFFFFF"
            }
          }
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            setFormData({ ...formData, imageUrl: result.info.secure_url });
            setImageLoaded(true);
          }
        }
      );
      widget.open();
    } else {
      alert("Upload tool is still initializing. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/report-lost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push("/dashboard?status=reported");
      }
    } catch (err) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 font-sans antialiased">
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        strategy="afterInteractive" 
        onLoad={() => setScriptLoaded(true)}
      />
      
      {/* Header Section */}
      <div className="bg-[#0056d2] p-6 pt-12 text-white rounded-b-[3.5rem] relative shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <Link href="/dashboard" className="absolute top-12 left-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all z-10">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="text-center mt-4 relative z-10">
          <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-blue-200" />
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Report Lost ID</h1>
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Secured Registry Entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-4 -translate-y-8">
        
        {/* Core Identity Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-slate-100">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Document Identity</label>
          
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 appearance-none cursor-pointer"
              value={formData.idType}
              onChange={(e) => setFormData({...formData, idType: e.target.value})}
            >
              <option>National ID</option>
              <option>Driver's License</option>
              <option>Passport</option>
              <option>Student ID</option>
              <option>Voter's Card</option>
            </select>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input 
              placeholder="Full Name as written on ID" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-300"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              placeholder="ID Number"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-300 border-2 border-transparent focus:border-blue-100 transition-all"
              onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
            />
          </div>
        </div>

        {/* Verification Details Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Verification Credentials</label>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Baby className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input 
                placeholder="Place of Birth"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-300"
                onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4" />
                <input 
                  placeholder="DOB (YYYY-MM-DD)"
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-[11px] text-slate-800 placeholder:text-slate-300"
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-4 h-4" />
                <input 
                  placeholder="Date of Issue"
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-[11px] text-slate-800 placeholder:text-slate-300"
                  onChange={(e) => setFormData({...formData, dateOfIssue: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Incident Details Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-slate-100">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
            <input 
              placeholder="Last Known Location" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-300"
              onChange={(e) => setFormData({...formData, lastLocation: e.target.value})}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input 
              type="date" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-500 uppercase text-xs"
              onChange={(e) => setFormData({...formData, dateLost: e.target.value})}
            />
          </div>
        </div>

        {/* Reference Image Button */}
        <button 
          type="button" 
          onClick={uploadImage}
          className={`w-full border-4 border-dashed p-8 rounded-[2.5rem] flex flex-col items-center gap-2 transition-all ${
            imageLoaded 
              ? 'border-green-500 bg-green-50 text-green-600' 
              : 'border-slate-100 bg-white text-slate-400 hover:border-blue-200 hover:bg-blue-50 shadow-sm'
          }`}
        >
          {imageLoaded ? (
            <>
              <CheckCircle className="w-8 h-8 animate-in zoom-in" />
              <span className="text-[10px] font-black uppercase italic">Reference Photo Stored</span>
            </>
          ) : (
            <>
              <Camera className={`w-8 h-8 ${!scriptLoaded ? 'animate-pulse' : ''}`} />
              <div className="text-center">
                <span className="text-[10px] font-black uppercase block">Reference Photo</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase">Helps verify ownership visually</span>
              </div>
            </>
          )}
        </button>

        {/* Submit Button */}
        <button 
          type="submit" disabled={loading}
          className="w-full bg-[#0056d2] hover:bg-blue-800 text-white font-black py-6 rounded-3xl shadow-2xl active:scale-95 transition-all flex justify-center items-center text-lg uppercase italic tracking-tighter border-b-4 border-blue-900"
        >
          {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "BROADCAST LOSS"}
        </button>

        <div className="flex items-center gap-3 px-6 py-4 bg-blue-50/50 rounded-3xl border border-blue-100">
           <Info className="w-5 h-5 text-blue-400 shrink-0" />
           <p className="text-[9px] font-black text-blue-900/60 uppercase leading-tight">
             Detailed credentials like <span className="text-blue-600">Place of Birth</span> allow our AI to match your ID with 99% accuracy.
           </p>
        </div>
      </form>
    </div>
  );
}