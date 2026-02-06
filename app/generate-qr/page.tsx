"use client";
import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeft, Download, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { getRecentReports } from "../../lib/actions";

export default function GenerateQRPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState(""); // Safe state for the URL
  
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Set origin only on client side to prevent Next.js hydration errors
    setBaseUrl(window.location.origin);

    async function load() {
      const data = await getRecentReports();
      setReports(data);
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const downloadQRCode = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set high resolution for the saved image
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = "white"; // Add white background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1024, 1024);
      }
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `ID-Registry-QR-${selectedId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const discoveryUrl = `${baseUrl}/found/${selectedId}`;

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10">
      <div className="bg-[#0056d2] p-6 pt-12 text-white rounded-b-[2.5rem] shadow-xl relative">
        <Link href="/dashboard" className="absolute top-12 left-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="text-center mt-4 uppercase">
          <h1 className="text-2xl font-black italic tracking-tighter">QR Generator</h1>
          <p className="text-blue-100 text-[10px] font-bold">Secure your identification today</p>
        </div>
      </div>

      <div className="px-6 -translate-y-6 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Target ID</label>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-500 transition-all"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.idType}: {r.fullName}</option>
              ))}
            </select>
          )}
        </div>

        {selectedId && !loading && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
            <div className="bg-white p-4 rounded-2xl border-4 border-[#0056d2] mb-4 shadow-inner">
              <QRCodeSVG 
                ref={qrRef} 
                value={discoveryUrl} 
                size={200} 
                level="H" 
                includeMargin={true} 
              />
            </div>
            <h2 className="font-black text-slate-800 uppercase italic tracking-tight">Official Sticker</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 px-4 leading-tight">
              Attach this QR to your physical document. If lost, the finder can scan it to alert you.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button 
                onClick={downloadQRCode}
                className="flex items-center justify-center gap-2 bg-slate-100 p-4 rounded-2xl text-slate-600 font-black text-xs uppercase hover:bg-slate-200 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" /> Save PNG
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex items-center justify-center gap-2 bg-[#0056d2] p-4 rounded-2xl text-white font-black text-xs uppercase hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}