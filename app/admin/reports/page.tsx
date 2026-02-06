import React from "react";
import { prisma } from "@/lib/prisma";
import { 
  ChevronLeft, ShieldAlert, ExternalLink, 
  Clock, Ban, Mail, Trash2 
} from "lucide-react";
import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";

// This tells Next.js to always get fresh data from the DB
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await prisma.fraudReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto bg-[#fcfcfd] min-h-screen pb-20 font-sans antialiased">
      
      {/* HEADER */}
      <div className="p-8 pt-12 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="bg-slate-50 p-2 rounded-xl hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Security Desk</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Incident Management</p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <Link href="/admin/support" className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2">
                <Mail className="w-3 h-3" /> Support
            </Link>
            <div className="bg-orange-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-100">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-black uppercase">{reports.length} Reports</span>
            </div>
        </div>
      </div>

      {/* LIST */}
      <div className="p-6 space-y-6">
        {reports.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No reports found.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* EVIDENCE IMAGE */}
                <div className="shrink-0">
                  {report.evidenceUrl ? (
                    <div className="relative group overflow-hidden rounded-[2rem] w-full md:w-40 h-40">
                      <img src={report.evidenceUrl} alt="Evidence" className="w-full h-full object-cover" />
                      <a href={report.evidenceUrl} target="_blank" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white backdrop-blur-sm transition-all">
                        <ExternalLink className="w-6 h-6" />
                      </a>
                    </div>
                  ) : (
                    <div className="w-full md:w-40 h-40 bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-100 text-slate-300 uppercase text-[9px] font-black">No Proof</div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic tracking-widest bg-slate-900 text-white">
                        {report.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                        <Clock className="w-3 h-3" /> {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-orange-600 font-black uppercase italic text-[10px]">{report.issueType}</p>
                    <p className="text-sm font-bold text-slate-700 leading-snug">{report.description}</p>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                      <Ban className="w-3.5 h-3.5" /> Ban User
                    </button>
                    <DeleteButton reportId={report.id} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}