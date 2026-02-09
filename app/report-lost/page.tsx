"use client";
import React, { useState } from "react";
import { Camera, MapPin, Calendar, CreditCard, Loader2, ChevronLeft, CheckCircle, Hash, Info, Baby, CalendarDays } from "lucide-react";
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
    placeOfBirth: "", // NEW: Critical matching field
    dateOfIssue: "",  // NEW: Critical matching field
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
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 font-sans">
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        strategy="afterInteractive" 
        onLoad={() => setScriptLoaded(true)}
      />
      
      <div className="bg-[#0056d2] p-6 pt-12 text-white rounded-b-[2.5rem] relative shadow-xl">
        <Link href="/dashboard" className="absolute top-12 left-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="text-center mt-4">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Report Lost ID</h1>
          <p className="text-blue-100 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Registry Portal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-4 -translate-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-4 border border-slate-100">
          
          {/* ID Category Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Category</label>
            <select 
              className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 appearance-none cursor-pointer"
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

          {/* Full Name */}
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input 
              placeholder="Full Name on ID" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          {/* ID Number */}
          <div className="space-y-1">
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                placeholder="ID Number (Recommended)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400 border-2 border-transparent focus:border-blue-100 transition-all"
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
              />
            </div>
          </div>

          {/* NEW: Place of Birth & Date of Issue */}
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-50">
            <div className="relative">
              <Baby className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 w-5 h-5" />
              <input 
                placeholder="Place of Birth"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
              />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
              <input 
                placeholder="Date of Issue (DD/MM/YYYY)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, dateOfIssue: e.target.value})}
              />
            </div>
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
            <input 
              placeholder="Last Known Location" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, lastLocation: e.target.value})}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input 
              type="date" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-500"
              onChange={(e) => setFormData({...formData, dateLost: e.target.value})}
            />
          </div>
        </div>

        {/* Photo Button */}
        <button 
          type="button" 
          onClick={uploadImage}
          className={`w-full border-2 border-dashed p-8 rounded-[2.5rem] flex flex-col items-center gap-2 transition-all ${
            imageLoaded 
              ? 'border-green-500 bg-green-50 text-green-600' 
              : 'border-slate-200 bg-white text-slate-400 hover:border-[#0056d2] hover:bg-blue-50'
          }`}
        >
          {imageLoaded ? (
            <>
              <CheckCircle className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase">Reference Photo Attached</span>
            </>
          ) : (
            <>
              <Camera className={`w-8 h-8 ${!scriptLoaded ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase">
                {scriptLoaded ? "Attach Photo for visual match (Optional)" : "Loading..."}
              </span>
            </>
          )}
        </button>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-[#0056d2] hover:bg-blue-800 text-white font-black py-6 rounded-[2rem] shadow-xl active:scale-95 transition-all flex justify-center items-center text-lg uppercase italic tracking-tighter"
        >
          {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "BROADCAST LOSS"}
        </button>

        <div className="flex items-center gap-2 px-4 text-slate-400">
           <Info className="w-4 h-4" />
           <p className="text-[9px] font-bold uppercase leading-tight tracking-tight">
             Detailed info like Place of Birth increases matching speed by 80%.
           </p>
        </div>
      </form>
    </div>
  );
}