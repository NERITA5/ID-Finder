import React from "react";
import Link from "next/link"; // FIXED: Added missing Link import
import { ShieldAlert } from "lucide-react"; // FIXED: Added missing Icon import

export default function Sidebar() {
  return (
    /* ... rest of your sidebar code ... */
    <Link 
      href="/admin/reports" 
      className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-2 rounded-lg text-white">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <span className="text-xs font-black uppercase italic tracking-tight text-slate-600 group-hover:text-slate-900">
          Security Desk
        </span>
      </div>
      <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-1 rounded-md uppercase">
        Admin
      </span>
    </Link>
    /* ... rest of your sidebar code ... */
  );
}