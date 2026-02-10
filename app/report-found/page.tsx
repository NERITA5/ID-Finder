"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Camera, 
  MapPin, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2,
  CreditCard,
  Hash,
  Sparkles,
  ShieldCheck,
  Calendar,
  MapPinned
} from "lucide-react";
import Link from "next/link";
import { createWorker } from "tesseract.js";
import { reportFoundId } from "@/lib/actions";
import { useUser } from "@clerk/nextjs"; // Added Clerk hook

const ID_TYPES = ["National ID", "Passport", "Driver's License", "Student ID", "Voter's Card", "Other"];
const CAMEROON_REGIONS = ["Adamawa", "Central", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West"];

export default function ReportFoundIDPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <ReportFoundForm />
    </Suspense>
  );
}

function ReportFoundForm() {
  const { user } = useUser(); // Initialize Clerk User
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const ownerId = searchParams.get("owner");
  const isFromQR = searchParams.get("from") === "qr";
  const vaultSlug = searchParams.get("vaultSlug");

  const [loading, setLoading] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false); 
  const [submitted, setSubmitted] = useState(false);
  
  // Form Fields
  const [idType, setIdType] = useState("");
  const [fullName, setFullName] = useState(""); 
  const [idNumber, setIdNumber] = useState(""); 
  const [dob, setDob] = useState("");
  const [doi, setDoi] = useState("");
  const [pob, setPob] = useState("");
  const [region, setRegion] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  
  // Images
  const [imageFront, setImageFront] = useState<File | null>(null);
  const [previewFront, setPreviewFront] = useState<string | null>(null);
  const [imageBack, setImageBack] = useState<File | null>(null);
  const [previewBack, setPreviewBack] = useState<string | null>(null);

  const isFormValid = imageFront && idType && region && locationDetail && fullName;

  const performOCR = async (file: File) => {
    setIsScanningOCR(true);
    let worker;
    try {
      worker = await createWorker('eng', 1, {
        cachePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-data@4.0.0/'
      });
      const { data: { text } } = await worker.recognize(file);
      
      const idMatch = text.match(/\d{8,}/); 
      if (idMatch && !idNumber) setIdNumber(idMatch[0]);

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      const nameGuess = lines.find(line => /^[A-Z\s\-]{10,}$/.test(line));
      if (nameGuess && !fullName) setFullName(nameGuess);
    } catch (error) {
      console.log("OCR failed - manual entry allowed");
    } finally {
      if (worker) await worker.terminate();
      setIsScanningOCR(false);
    }
  };

  const handleFrontImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFront(file);
      setPreviewFront(URL.createObjectURL(file));
      performOCR(file); 
    }
  };

  const handleBackImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageBack(file);
      setPreviewBack(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "id_registry_uploads");
    const res = await fetch(`https://api.cloudinary.com/v1_1/dkndxbeao/image/upload`, {
        method: "POST",
        body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const frontUrl = await uploadToCloudinary(imageFront!);
      const backUrl = imageBack ? await uploadToCloudinary(imageBack) : null;

      const result = await reportFoundId({
        idType,
        fullName,
        idNumber,
        dateOfBirth: dob,
        dateOfIssue: doi,
        placeOfBirth: pob,
        imageUrl: frontUrl,
        backImageUrl: backUrl,
        region,
        locationDetail,
        // Correctly handling the reporterName from Clerk or fallback
        reporterName: user?.fullName || "Anonymous Finder", 
        targetOwnerId: ownerId || undefined,
        vaultSlug: vaultSlug || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (error) {
      alert("Submission failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
        <div className="bg-green-100 p-8 rounded-[3rem] mb-6 animate-bounce">
          <CheckCircle2 className="w-20 h-20 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase italic">Owner Notified!</h2>
        <p className="text-slate-500 font-bold mt-4 leading-relaxed">
          Thank you! The registry is processing your report.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 antialiased">
      {/* HEADER */}
      <div className="bg-[#0056d2] p-6 text-white flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/10 rounded-2xl">
                <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Report Found ID</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-lg mx-auto">
        
        {/* SAFETY SHIELD NOTICE */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-center gap-4">
           <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
           <p className="text-[10px] text-blue-700 font-bold leading-tight">
             Secure reporting active. Your details are only shared with the owner once a match is verified.
           </p>
        </div>

        {/* PHOTO UPLOADS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Front Side *</label>
            <div onClick={() => document.getElementById('front-upload')?.click()} 
                 className="relative h-40 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center bg-white overflow-hidden shadow-sm active:scale-95 transition-transform">
              {isScanningOCR && <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}
              {previewFront ? <img src={previewFront} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-blue-400" />}
              <input id="front-upload" type="file" accept="image/*" className="hidden" onChange={handleFrontImage} required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Back Side</label>
            <div onClick={() => document.getElementById('back-upload')?.click()} 
                 className="relative h-40 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center bg-white overflow-hidden shadow-sm active:scale-95 transition-transform">
              {previewBack ? <img src={previewBack} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-300" />}
              <input id="back-upload" type="file" accept="image/*" className="hidden" onChange={handleBackImage} />
            </div>
          </div>
        </div>

        {/* IDENTITY DETAILS */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2">
               <Sparkles className="w-4 h-4" /> Personal Details
            </label>
            
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input placeholder="Full Name on ID" required className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 placeholder:text-slate-300"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input placeholder="ID Number (Optional)" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 placeholder:text-slate-300"
                value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="DOB (YYYY-MM-DD)" className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs text-slate-700 placeholder:text-slate-300"
                    value={dob} onChange={(e) => setDob(e.target.value)} />
               </div>
               <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Issue Date" className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs text-slate-700 placeholder:text-slate-300"
                    value={doi} onChange={(e) => setDoi(e.target.value)} />
               </div>
            </div>

            <select required value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 appearance-none outline-none border-none cursor-pointer">
                <option value="">Document Type...</option>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>

        {/* LOCATION INFO */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Discovery Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select required value={region} onChange={(e) => setRegion(e.target.value)}
                className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer">
                <option value="">Region...</option>
                {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input placeholder="Spot Found" required className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none"
                value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} />
            </div>
        </div>

        <button disabled={loading || !isFormValid} type="submit" 
          className={`w-full py-6 rounded-3xl font-black shadow-xl transition-all flex justify-center items-center gap-3 text-lg uppercase tracking-widest active:scale-95 ${
            isFormValid ? 'bg-[#0056d2] text-white' : 'bg-slate-200 text-slate-400'
          }`}>
          {loading ? <Loader2 className="animate-spin w-7 h-7" /> : "SUBMIT VERIFIED REPORT"}
        </button>
      </form>
    </div>
  );
}