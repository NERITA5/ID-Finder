"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Camera, 
  MapPin, 
  FileText, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2,
  CreditCard,
  Hash,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { createWorker } from "tesseract.js";
import { reportFoundId } from "@/lib/actions";

const ID_TYPES = ["National ID Card", "Passport", "Driver's License", "Student ID", "Voter's Card", "Other"];
const CAMEROON_REGIONS = ["Adamawa", "Central", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West"];

export default function ReportFoundIDPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <ReportFoundForm />
    </Suspense>
  );
}

function ReportFoundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const ownerId = searchParams.get("owner");
  const isFromQR = searchParams.get("from") === "qr";
  const vaultSlug = searchParams.get("vaultSlug");

  const [loading, setLoading] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false); 
  const [submitted, setSubmitted] = useState(false);
  
  const [idType, setIdType] = useState("");
  const [fullName, setFullName] = useState(""); 
  const [idNumber, setIdNumber] = useState(""); 
  const [region, setRegion] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isFormValid = image && idType && region && locationDetail && fullName;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      await performOCR(file); 
    }
  };

  const performOCR = async (file: File) => {
    setIsScanningOCR(true);
    let worker;
    try {
      // Initialize worker with faster CDN data
      worker = await createWorker('eng', 1, {
        cachePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-data@4.0.0/'
      });

      const { data: { text } } = await worker.recognize(file);
      
      // 1. Passport Detection (MRZ Zone)
      if (text.includes("P<")) {
        setIdType("Passport");
        const mrzLine = text.split('\n').find(l => l.startsWith('P<'));
        if (mrzLine) {
          const nameMatch = mrzLine.substring(5).split('<<')[0].replace(/</g, ' ');
          setFullName(nameMatch);
        }
      }

      // 2. ID Number Extraction (Look for 8+ consecutive digits)
      const idMatch = text.match(/\d{8,}/); 
      if (idMatch && !idNumber) setIdNumber(idMatch[0]);

      // 3. Name Extraction (Look for high-confidence uppercase lines)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      const nameGuess = lines.find(line => /^[A-Z\s\-]{10,}$/.test(line));
      if (nameGuess && !fullName) setFullName(nameGuess);

    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      if (worker) await worker.terminate();
      setIsScanningOCR(false);
    }
  };

  const uploadImageToCloudinary = async () => {
    if (!image) return null;
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "id_registry_uploads");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dkndxbeao/image/upload`, {
          method: "POST",
          body: formData,
      });
      const data = await response.json();
      return data.secure_url; 
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedImageUrl = await uploadImageToCloudinary();
      const result = await reportFoundId({
        idType,
        fullName,
        idNumber,
        imageUrl: uploadedImageUrl || "",
        region,
        locationDetail,
        targetOwnerId: ownerId || undefined,
        vaultSlug: vaultSlug || undefined,
        reporterName: "Good Samaritan",
      });

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (error) {
      alert("Submission Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="bg-green-100 p-8 rounded-[3rem] mb-6 animate-bounce">
          <CheckCircle2 className="w-20 h-20 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">
          {isFromQR ? "Owner Notified!" : "Report Posted!"}
        </h2>
        <p className="text-slate-500 font-bold mt-4 tracking-tight leading-relaxed">
          {isFromQR 
            ? "A secure notification was sent to the owner's vault. Thank you for your kindness!" 
            : "The system is now scanning for a match in our registry."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans antialiased">
      <div className="bg-[#0056d2] p-6 text-white flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/10 rounded-2xl active:scale-90 transition-transform">
                <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-black italic tracking-tighter uppercase pt-1">Verify Found ID</h1>
        </div>
        {isFromQR && (
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
            <ShieldCheck className="w-4 h-4 text-green-300" />
            <span className="text-[10px] font-black uppercase italic text-green-300">QR Active</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg mx-auto">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">1. Snap ID Photo</label>
          <div 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="relative h-64 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white shadow-inner transition-all hover:border-blue-400"
          >
            {isScanningOCR && (
              <div className="absolute inset-0 z-20 bg-blue-600/40 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
                <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center border-2 border-blue-500">
                    <Sparkles className="w-10 h-10 text-blue-600 animate-pulse mb-3" />
                    <span className="text-[11px] font-black text-blue-600 uppercase italic tracking-tighter">AI Scanning...</span>
                </div>
              </div>
            )}
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <Camera className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Clear photo of the front side</p>
              </div>
            )}
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} required />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">2. ID Identity Details</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <input placeholder="Full Name on ID" required className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input placeholder="ID Number" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700"
                value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <select required value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 appearance-none outline-none">
                <option value="">Document Category...</option>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Finding Location</label>
            <div className="grid grid-cols-2 gap-3">
              <select required value={region} onChange={(e) => setRegion(e.target.value)}
                className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-none">
                <option value="">Region...</option>
                {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input placeholder="Specific Spot" required className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none"
                value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} />
            </div>
        </div>

        <button disabled={loading || !isFormValid || isScanningOCR} type="submit" 
          className={`w-full py-6 rounded-[2.5rem] font-black shadow-xl transition-all flex justify-center items-center gap-3 text-lg uppercase tracking-widest border-4 border-white/20 active:scale-95 ${
            isFormValid && !isScanningOCR ? 'bg-[#0056d2] text-white' : 'bg-slate-200 text-slate-400'
          }`}>
          {loading ? <Loader2 className="animate-spin w-7 h-7" /> : "POST FOUND REPORT"}
        </button>
      </form>
    </div>
  );
}