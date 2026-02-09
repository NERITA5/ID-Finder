"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, ShieldCheck, Printer } from "lucide-react";
import { getOrCreateQRVault } from "@/lib/actions";

export default function QRVault() {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    async function initVault() {
      const result = await getOrCreateQRVault();
      if (result.success) {
        // Build the public URL that strangers will scan
        const url = `${window.location.origin}/v/${result.qrSlug}`;
        setQrUrl(url);
      }
    }
    initVault();
  }, []);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Your Recovery Sticker</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Protection</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mb-6">
          {qrUrl ? (
            <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={true} />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center animate-pulse bg-slate-200 rounded-xl" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase italic hover:bg-slate-800 transition">
            <Download className="w-4 h-4" /> Download
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-black uppercase italic hover:bg-blue-100 transition"
          >
            <Printer className="w-4 h-4" /> Print Tags
          </button>
        </div>
      </div>
    </div>
  );
}