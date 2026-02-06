"use client";
import React, { useState, useRef } from "react";
import { ChevronLeft, Camera, Send, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitFraudReport } from "@/app/actions/fraud";

export default function ReportFraudPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Using Env variables. Make sure these are in your .env.local
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!preset || !cloudName) {
      throw new Error("Cloudinary configuration missing in .env");
    }

    formData.append("upload_preset", preset); 

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary API Error:", errorData);
      throw new Error(errorData.error?.message || "Image upload failed");
    }
    
    const data = await response.json();
    return data.secure_url; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = "";

      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const result = await submitFraudReport({
        description,
        issueType: "Suspicious Activity",
        imageUrl: finalImageUrl,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        alert("Server error: " + result.error);
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(`Error: ${error.message || "Something went wrong. Check your Cloudinary settings."}`);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto h-screen bg-white flex flex-col items-center justify-center p-10 text-center font-sans antialiased">
        <div className="bg-orange-100 p-8 rounded-[2.5rem] mb-6 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Report Received</h2>
        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest leading-relaxed">
          Thank you for keeping the community safe. <br /> Our team will investigate immediately.
        </p>
        <button 
          onClick={() => router.replace("/help")} 
          className="mt-10 bg-slate-900 text-white w-full py-5 rounded-[2rem] font-black uppercase italic text-[11px] tracking-widest active:scale-95 transition-all shadow-xl"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-10 font-sans antialiased">
      <div className="p-6 pt-12 flex items-center gap-4 bg-white border-b border-slate-50 sticky top-0 z-10">
        <button onClick={() => router.back()} className="bg-slate-50 p-2 rounded-xl active:scale-90 transition-all">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Security Report</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
          <p className="text-[10px] font-bold text-orange-800 uppercase leading-tight">Reports are anonymous. Evidence helps us take action faster.</p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest leading-none">Attach Proof</label>
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer group"
            >
              <Camera className="w-10 h-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">Tap to upload image</span>
            </div>
          ) : (
            <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-100">
              <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
              <button 
                type="button"
                onClick={() => {setImagePreview(null); setSelectedFile(null);}}
                className="absolute top-4 right-4 bg-black/60 text-white p-2.5 rounded-full backdrop-blur-md hover:bg-red-500 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest leading-none">Incident Details</label>
          <textarea 
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe the suspicious activity in detail..."
            className="w-full mt-3 bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200 min-h-[160px] resize-none transition-all placeholder:text-slate-300"
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !description}
          className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase italic tracking-[0.1em] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <><Send className="w-4 h-4" /> Dispatch Report</>
          )}
        </button>
      </form>
    </div>
  );
}