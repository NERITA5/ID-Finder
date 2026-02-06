"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Send, ShieldCheck, MapPin, Phone, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { sendMessage, getChatMessages } from "@/lib/actions";
import PusherClient from "pusher-js";

export default function ChatPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Real-time Subscription
  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getChatMessages(id as string);
        setMessages(data || []);
      } catch (err) {
        console.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchHistory();

    // Ensure Pusher only initializes if keys exist
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(id as string);

    channel.bind("incoming-message", (newMessage: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      pusher.unsubscribe(id as string);
      pusher.disconnect();
    };
  }, [id]);

  // 2. Smooth Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const currentText = input;
    const tempId = Date.now().toString();
    setInput(""); 

    // Optimistic UI Update
    const optimisticMsg = {
      id: tempId,
      senderId: user.id,
      text: currentText,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const result = await sendMessage(id as string, currentText);
    
    if (!result.success) {
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      alert("Message failed to send.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] flex flex-col font-sans border-x border-slate-200 overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md p-5 pt-12 flex items-center justify-between border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="bg-slate-50 p-2 rounded-xl active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="font-black uppercase italic tracking-tighter text-sm leading-none text-slate-800">
              ID Recovery Chat
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic tracking-tighter">Secure Handover</span>
            </div>
          </div>
        </div>
        <button className="bg-blue-50 p-2.5 rounded-xl text-blue-600 active:scale-90 transition-all">
          <Phone className="w-4 h-4" />
        </button>
      </header>

      {/* SAFETY WARNING */}
      <div className="bg-[#fff4e5] p-3 flex gap-3 items-center border-b border-orange-100">
        <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
        <p className="text-[9px] text-orange-900 font-black uppercase leading-tight italic">
          Meet in public places (e.g., Malls, Police Stations) for your safety.
        </p>
      </div>

      {/* MESSAGES */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-600" />
            <p className="text-[10px] font-black uppercase tracking-widest">Loading History...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-[13px] font-bold shadow-sm relative transition-all ${
                  isMe 
                    ? "bg-[#1a1c2e] text-white rounded-tr-none" 
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                } ${msg.isOptimistic ? "opacity-50" : "opacity-100"}`}>
                  {msg.text}
                  <p className={`text-[7px] font-black uppercase mt-2 opacity-40 ${isMe ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* INPUT */}
      <footer className="bg-white p-5 pb-8 border-t border-slate-100">
        <form 
          onSubmit={handleSendMessage}
          className="bg-slate-50 rounded-[2rem] p-1.5 flex items-center gap-2 border border-slate-200 focus-within:bg-white focus-within:border-blue-500 transition-all"
        >
          <button type="button" className="p-3 text-slate-400 hover:text-blue-600">
            <MapPin className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Discuss handover details..."
            className="flex-1 bg-transparent py-2 text-xs font-bold outline-none placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-[#0056d2] text-white p-3.5 rounded-full active:scale-95 disabled:opacity-20 shadow-lg shadow-blue-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}