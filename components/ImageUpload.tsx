"use client";
import { CldUploadWidget } from 'next-cloudinary';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string;
}

export default function ImageUpload({ onUpload, value }: ImageUploadProps) {
  const [uploaded, setUploaded] = useState(!!value);

  return (
    <CldUploadWidget 
      uploadPreset="id_finder_uploads" // USE YOUR PRESET NAME HERE
      onSuccess={(results: any) => {
        onUpload(results.info.secure_url);
        setUploaded(true);
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className={`w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${
            uploaded 
              ? "bg-green-50 border-green-200 text-green-600" 
              : "bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {uploaded ? (
            <>
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Photo Attached!</span>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Attach ID Photo (Optional)</span>
            </>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}