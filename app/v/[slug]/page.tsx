import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShieldCheck, MessageSquare, AlertCircle, Fingerprint } from "lucide-react";
import Link from "next/link";

/**
 * PUBLIC SECURE REDIRECT
 * This is a Server Component. It fetches data before the page even reaches the browser.
 */
export default async function PublicQRRedirect({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  // 1. Await params (Required in Next.js 15+)
  const { slug } = await params;

  // 2. Fetch the vault from Neon DB
  const vault = await prisma.userVault.findUnique({
    where: { qrSlug: slug },
  });

  // 3. If the slug is invalid, trigger the native 404 page
  if (!vault) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 antialiased">
      <div className="max-w-sm w-full bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />

        <div className="w-20 h-20 bg-[#1a1c2e] rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl relative z-10">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-2 relative z-10">
          Secure Link
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 relative z-10">
          Recovery Protocol Active
        </p>

        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] mb-8 text-left relative z-10">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-tight">Found this Item?</span>
          </div>
          <p className="text-sm font-bold text-slate-700 leading-tight">
            The owner has registered this document in our secure vault. You can alert them immediately by clicking below.
          </p>
        </div>

        {/* PASSING PARAMETERS TO REPORT PAGE:
            - owner: vault.userId (The owner's Clerk ID)
            - vaultId: vault.id (To link the report to a specific item)
        */}
        <Link 
          href={`/report-found?owner=${vault?.userId}&from=qr&vaultSlug=${slug}`}
          className="w-full bg-[#0056d2] text-white py-5 rounded-2xl font-black italic uppercase tracking-tight flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 relative z-10"
        >
          <MessageSquare className="w-5 h-5" />
          Message Owner
        </Link>
        
        <div className="mt-8 flex flex-col items-center gap-2 relative z-10">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Identity Protection Network
          </p>
          <div className="flex items-center gap-1 opacity-20">
            <Fingerprint className="w-3 h-3 text-slate-900" />
            <span className="text-[8px] font-mono text-slate-900 uppercase">
              {slug.substring(0, 8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}