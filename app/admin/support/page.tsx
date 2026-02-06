import React from "react";
import { prisma } from "@/lib/prisma";
import { 
  ChevronLeft, Mail, Clock, MessageSquare, 
  Send, Trash2, Search, Filter, ShieldAlert 
} from "lucide-react";
import Link from "next/link";
import { deleteTicket } from "@/app/actions/support";

export default async function SupportAdminPage() {
  // Fetch tickets from the database
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto bg-[#fcfcfd] min-h-screen pb-20 font-sans antialiased">
      
      {/* HEADER SECTION */}
      <div className="p-8 pt-12 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
            <Link href="/dashboard" className="bg-slate-50 p-2 rounded-xl hover:bg-slate-100 transition-all">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Support Inbox</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">User Communications</p>
            </div>
            </div>

            {/* NAV TOGGLE */}
            <div className="flex gap-2">
                <Link href="/admin/reports" className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2">
                   <ShieldAlert className="w-3 h-3" /> Fraud
                </Link>
                <div className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-tight">{tickets.length} Tickets</span>
                </div>
            </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
            </div>
        </div>
      </div>

      {/* TICKETS LIST */}
      <div className="p-6 space-y-6">
        {tickets.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Mail className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Inbox is empty.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black italic text-xl border border-blue-100/50">
                    {ticket.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase italic leading-none">{ticket.name}</h3>
                    <p className="text-[10px] font-bold text-blue-500 lowercase mt-1.5">{ticket.email}</p>
                  </div>
                </div>
                <div className="text-slate-300 text-[9px] font-black uppercase tracking-widest">
                   {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100/50 mb-6 group-hover:bg-white group-hover:border-blue-100 transition-colors duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Subject: {ticket.subject}</span>
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                  "{ticket.message}"
                </p>
              </div>

              <div className="flex gap-3">
                <a 
                  href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`}
                  className="flex-[4] bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.1em] text-center hover:bg-blue-600 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> Reply to User
                </a>
                
                <form action={async () => {
                    "use server";
                    await deleteTicket(String(ticket.id));
                }} className="flex-1">
                    <button type="submit" className="w-full h-full bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95 group">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}