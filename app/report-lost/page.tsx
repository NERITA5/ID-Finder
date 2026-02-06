"use client";
import React, { useState } from "react";
import { Camera, MapPin, Calendar, CreditCard, Loader2, ChevronLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function ReportLostPage() {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false); // New: Script readiness check
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    idType: "National ID",
    fullName: "",
    idNumber: "",
    lastLocation: "",
    dateLost: "",
    description: "",
    imageUrl: "",
  });

  // Improved Cloudinary Widget Logic
  const uploadImage = () => {
    // Check if the script is actually ready
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const widget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: "dkndxbeao", 
          uploadPreset: "ml_default", // ENSURE THIS IS SET TO "UNSIGNED" IN CLOUDINARY
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
      alert("Upload tool is still initializing. Please try again in a moment.");
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
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10">
      {/* Script with onLoad handler to ensure reliability */}
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
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">ID Finder</h1>
          <p className="text-blue-100 text-sm font-medium mt-1">Broadcast your lost ID details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-4 -translate-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Category</label>
            <div className="relative">
              <select 
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                value={formData.idType}
                onChange={(e) => setFormData({...formData, idType: e.target.value})}
              >
                <option>National ID</option>
                <option>Driver's License</option>
                <option>Passport</option>
                <option>Student ID</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input 
              placeholder="Full Name on ID" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
            <input 
              placeholder="Last Known Location" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, lastLocation: e.target.value})}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
            <input 
              type="date" required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-500"
              onChange={(e) => setFormData({...formData, dateLost: e.target.value})}
            />
          </div>
        </div>

        {/* Updated Photo Button */}
        <button 
          type="button" 
          onClick={uploadImage}
          className={`w-full border-2 border-dashed p-8 rounded-3xl flex flex-col items-center gap-2 transition-all ${
            imageLoaded 
              ? 'border-green-500 bg-green-50 text-green-600' 
              : 'border-slate-200 bg-white text-slate-400 hover:border-[#0056d2] hover:bg-blue-50'
          }`}
        >
          {imageLoaded ? (
            <>
              <CheckCircle className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase">Photo Attached Successfully</span>
            </>
          ) : (
            <>
              <Camera className={`w-8 h-8 ${!scriptLoaded ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase">
                {scriptLoaded ? "Attach ID Photo (Optional)" : "Loading Uploader..."}
              </span>
            </>
          )}
        </button>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-[#0056d2] hover:bg-blue-800 text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center text-lg uppercase italic tracking-tighter"
        >
          {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "SUBMIT REPORT"}
        </button>
      </form>
    </div>
  );
}