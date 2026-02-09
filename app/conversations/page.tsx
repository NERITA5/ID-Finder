import React from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight, User, Search } from "lucide-react";
import { getUserChats } from "@/lib/actions";

export const revalidate = 0; 

export default async function ConversationsPage() {
  const chats = await getUserChats();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen font-sans pb-32">
      <div className="p-6 pt-12">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          Messages
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Active Recoveries ({chats.length})
          </p>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="bg-transparent text-xs font-bold outline-none w-full placeholder:text-slate-300 uppercase tracking-tighter"
          />
        </div>
      </div>

      <div className="px-4 space-y-1">
        {chats.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200/50 mx-2">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
               <MessageSquare className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active chats yet</p>
          </div>
        ) : (
          chats.map((chat) => {
            const lastMessage = chat.messages[0]; 
            return (
              <Link 
                key={chat.id} 
                href={`/chat/${chat.id}`} 
                className="flex items-center gap-4 p-4 hover:bg-slate-50 active:scale-[0.97] transition-all rounded-[2.2rem] border border-transparent hover:border-slate-100 group"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 bg-[#1a1c2e] rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:rotate-3 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  {!lastMessage && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 border-4 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-black uppercase text-[11px] italic text-slate-800 truncate tracking-tight">
                      Recovery ID: {chat.reportId.slice(-6).toUpperCase()}
                    </h3>
                    <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">
                      {lastMessage 
                        ? new Date(lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : "Now"}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate leading-tight pr-4 ${!lastMessage ? "text-blue-600 font-black italic uppercase" : "text-slate-500 font-medium"}`}>
                    {lastMessage?.text || "New connection! Start chat..."}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}