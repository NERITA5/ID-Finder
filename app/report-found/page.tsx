"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  MapPin, 
  FileText, 
  ChevronLeft, 
  Loader2, 
  ScanQrCode,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";
// Move up two levels to find components
import QRScannerModal from "../../components/modals/QRScannerModal";

// Move up one level to find actions
import { createFoundIdReport } from "../actions/foundId";
const ID_TYPES = ["National ID Card", "Passport", "Driver's License", "Student ID", "Voter's Card", "Other"];

const CAMEROON_REGIONS = [
  "Adamawa", "Central", "East", "Far North", "Littoral", 
  "North", "Northwest", "South", "Southwest", "West"
];

export default function ReportFoundID() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Form States
  const [idType, setIdType] = useState("");
  const [region, setRegion] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  /**
   * CLOUDINARY UPLOAD FUNCTION
   */
  const uploadImageToCloudinary = async () => {
    if (!image) return null;

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "id_registry_uploads");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dkndxbeao/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      return data.secure_url; 
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return null;
    }
  };

  const handleQRScan = (data: string) => {
    setLoading(true);
    setTimeout(() => {
        router.push(`/recover/${data}`);
    }, 1000);
  };

  /**
   * UPDATED HANDLESUBMIT
   * Sequence: Upload Image -> Save to Prisma -> Success State
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload to Cloudinary first
      const uploadedImageUrl = await uploadImageToCloudinary();

      if (!uploadedImageUrl && image) {
        alert("Failed to upload image. Please check your connection.");
        setLoading(false);
        return;
      }

      // 2. Call Prisma Server Action to save record
      const result = await createFoundIdReport({
        idType,
        imageUrl: uploadedImageUrl || "",
        region,
        locationDetail,
        notes: notes || "",
      });

      if (result.success) {
        setLoading(false);
        setSubmitted(true);
        // Redirect after 3 seconds
        setTimeout(() => router.push("/dashboard"), 3000);
      } else {
        alert(result.error || "An error occurred while saving the report.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-green-100 p-8 rounded-[3rem] mb-6 animate-bounce">
          <CheckCircle2 className="w-20 h-20 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Success!</h2>
        <p className="text-slate-500 font-bold mt-4 leading-relaxed max-w-xs">
          Your report is live. If a match is found, the owner will be notified securely.
        </p>
        <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            Returning to Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleQRScan} 
      />

      {/* Header */}
      <div className="bg-[#0056d2] p-6 text-white flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90">
                <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none pt-1">Report Found ID</h1>
        </div>
        <div className="bg-white/20 p-2 rounded-xl">
            <Info className="w-5 h-5 text-white" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-lg mx-auto">
        
        {/* QR Scanner Trigger */}
        <button 
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="w-full bg-blue-600 p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-blue-200 border-4 border-white"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ScanQrCode className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-black uppercase text-sm tracking-tight">Scan ID Sticker</p>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Instant Recovery Mode</p>
            </div>
          </div>
          <div className="bg-white/10 p-2 rounded-full">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>

        <div className="flex items-center gap-4 py-2">
            <hr className="flex-1 border-slate-200" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR FILL MANUALLY</span>
            <hr className="flex-1 border-slate-200" />
        </div>

        {/* ID Type Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Document Type</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10" />
            <select 
              required
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full pl-12 pr-4 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-slate-700 outline-none focus:border-blue-500 appearance-none shadow-sm transition-all"
            >
              <option value="">Select ID Type...</option>
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Photo Upload Area */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Clear Photo of ID</label>
          <div 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="relative h-64 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition-all overflow-hidden group shadow-sm"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="bg-slate-50 p-6 rounded-full group-hover:scale-110 transition-transform mb-4 shadow-inner">
                    <Camera className="w-12 h-12 text-blue-400" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tap to Snap or Upload</p>
              </>
            )}
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
        </div>

        {/* Location Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Region</label>
            <select 
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-5 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-slate-700 outline-none focus:border-blue-500 shadow-sm transition-all"
            >
              <option value="">Choose Region...</option>
              {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Where was it found?</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500 z-10" />
              <input 
                type="text" 
                placeholder="e.g. Near Molyko Post Office"
                required
                className="w-full pl-12 pr-4 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-slate-700 outline-none focus:border-blue-500 shadow-sm transition-all text-sm"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Extra Details (Optional)</label>
          <textarea 
            placeholder="e.g. ID was found inside a black leather wallet."
            rows={3}
            className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-bold text-slate-700 outline-none focus:border-blue-500 text-sm resize-none shadow-sm transition-all"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-[#2d8a4e] hover:bg-green-700 text-white py-6 rounded-[2.5rem] font-black shadow-xl shadow-green-100 active:scale-95 disabled:opacity-50 transition-all flex justify-center items-center gap-3 text-lg uppercase tracking-widest border-4 border-white/20 mt-4"
        >
          {loading ? <Loader2 className="animate-spin w-7 h-7" /> : "SUBMIT REPORT"}
        </button>

        <p className="text-[9px] text-slate-400 font-bold text-center px-6 leading-relaxed uppercase tracking-tighter">
            By submitting, you agree to protect the owner's privacy. Do not share full ID numbers publicly.
        </p>
      </form>
    </div>
  );
}