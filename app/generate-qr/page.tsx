"use client";
import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeft, Download, Printer, Loader2, ShieldCheck, Fingerprint } from "lucide-react";
import Link from "next/link";
import { getOrCreateQRVault } from "@/lib/actions";

export default function GenerateQRPage() {
  const [vaultSlug, setVaultSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");
  
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);

    async function loadVault() {
      const result = await getOrCreateQRVault();
      if (result.success && result.qrSlug) {
        setVaultSlug(result.qrSlug);
      }
      setLoading(false);
    }
    loadVault();
  }, []);

  const downloadQRCode = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1024, 1024);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Secure-Recovery-Tag.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const discoveryUrl = `${baseUrl}/v/${vaultSlug}`;

  return (
    <div className="max-w-md mx-auto bg-[#f4f7fe] min-h-screen pb-10 antialiased">
      
      {/* BRANDED HEADER - Consistent with Dashboard */}
      <div className="bg-[#0052cc] p-6 pt-14 pb-20 text-white rounded-b-[3.5rem] shadow-xl relative overflow-hidden text-center">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <Link href="/dashboard" className="absolute top-12 left-6 bg-white/10 p-2 rounded-full active:scale-95 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        
        <h1 className="text-3xl handwriting font-bold">Secure Vault</h1>
        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-70">
           Universal Recovery ID
        </p>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        {loading ? (
          <div className="bg-white p-20 rounded-[3rem] shadow-sm flex flex-col items-center justify-center border border-slate-100">
            <Loader2 className="animate-spin text-[#0052cc] w-10 h-10" />
            <p className="text-[10px] font-black uppercase mt-4 text-slate-400 tracking-widest">Generating Your Tag...</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50 flex flex-col items-center text-center">
            
            <div className="bg-white p-5 rounded-[2.5rem] border-[8px] border-slate-900 mb-8 shadow-xl">
              <QRCodeSVG 
                ref={qrRef} 
                value={discoveryUrl} 
                size={200} 
                level="H" 
                includeMargin={false} 
              />
            </div>

            <div className="space-y-3 mb-8">
              <h2 className="handwriting text-3xl text-slate-900 leading-none">Universal Sticker</h2>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed px-4">
                Stick this on your ID card. If you lose it, the finder scans this to contact you safely.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-3 bg-[#0052cc] p-5 rounded-2xl text-white font-black text-xs uppercase active:scale-95 transition-all shadow-lg shadow-blue-100"
              >
                <Download className="w-5 h-5" /> Download Sticker
              </button>
              
              <button 
                onClick={() => window.print()} 
                className="w-full flex items-center justify-center gap-3 bg-slate-100 p-5 rounded-2xl text-slate-500 font-black text-xs uppercase active:scale-95 transition-all"
              >
                <Printer className="w-5 h-5" /> Print Tag
              </button>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-50 w-full flex flex-col items-center gap-2">
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  <Fingerprint className="w-4 h-4" />
                  Vault ID: {vaultSlug.slice(0, 8)}
               </div>
               <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                  End-to-End Encrypted
               </div>
            </div>
          </div>
        )}
      </div>
      
      {/* INSTRUCTIONS */}
      <div className="px-8 mt-10 space-y-4">
         <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] ml-2">How to use</h3>
         <div className="bg-white/50 p-6 rounded-[2rem] border border-white space-y-4">
            <div className="flex gap-4 items-start">
               <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</div>
               <p className="text-[11px] font-bold text-slate-500 leading-normal uppercase">Print this QR code on a small sticker paper.</p>
            </div>
            <div className="flex gap-4 items-start">
               <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</div>
               <p className="text-[11px] font-bold text-slate-500 leading-normal uppercase">Paste it on the back of your National ID or Passport.</p>
            </div>
         </div>
      </div>
    </div>
  );
}