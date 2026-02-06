"use client";

import React from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner"; // FIXED: Added IDetectedBarcode type
import { X, Zap } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  if (!isOpen) return null;

  // FIXED: Handle the new array-based scan result
  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      onScan(detectedCodes[0].rawValue);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-black uppercase tracking-widest text-xs">Scanner Active</span>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner View */}
        <div className="relative aspect-square overflow-hidden bg-black">
          {/* FIXED: Updated Scanner props to match latest library version */}
          <Scanner
            onScan={handleScan}
            onError={(error: unknown) => {
              if (error instanceof Error) {
                console.log(error.message);
              }
            }}
            styles={{
              container: { width: '100%' }
            }}
          />
          
          {/* Scanning Overlay UI */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-blue-500 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 translate-x-1 translate-y-1"></div>
                
                {/* Animated Scan Line */}
                <div className="w-full h-1 bg-blue-500/50 absolute top-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm font-bold">Align the ID's QR code within the frame</p>
          <p className="text-slate-500 text-[10px] uppercase mt-2 tracking-widest">Automatic match detection</p>
        </div>
      </div>
    </div>
  );
}