"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, ChevronRight } from "lucide-react";
import { pusherClient } from "@/lib/pusher";

export default function LiveConversationList({ initialChats, currentUserId }: any) {
  const [chats, setChats] = useState(initialChats);

  useEffect(() => {
    // Subscribe to a private channel for the user's conversation updates
    const channel = pusherClient.subscribe(`user-chats-${currentUserId}`);

    channel.bind("update-conversation", (updatedChat: any) => {
      setChats((prev: any) => {
        // Remove the old version of the chat and put the updated one at the top
        const filtered = prev.filter((c: any) => c.id !== updatedChat.id);
        return [updatedChat, ...filtered];
      });
    });

    return () => pusherClient.unsubscribe(`user-chats-${currentUserId}`);
  }, [currentUserId]);

  return (
    <div className="px-4 space-y-1">
      {chats.map((chat: any) => {
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
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="font-black uppercase text-[11px] italic text-slate-800 truncate tracking-tight">
                  Recovery ID: {chat.reportId.slice(-6).toUpperCase()}
                </h3>
                <span className="text-[8px] font-black text-slate-300 uppercase">
                  {lastMessage ? "Just now" : "Now"}
                </span>
              </div>
              <p className={`text-[11px] truncate leading-tight pr-4 ${!lastMessage ? "text-blue-600 font-black italic uppercase" : "text-slate-500 font-medium"}`}>
                {lastMessage?.text || "New connection! Start chat..."}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900 transition-all" />
          </Link>
        );
      })}
    </div>
  );
}