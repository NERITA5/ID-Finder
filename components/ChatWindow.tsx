"use client";

import { useEffect, useState, useRef } from "react";
import { pusherClient } from "@/lib/pusher"; // We'll create this client utility next
import { sendMessage } from "@/lib/actions";
import { format } from "date-fns";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Date;
}

export default function ChatWindow({ 
  chatId, 
  initialMessages, 
  currentUserId 
}: { 
  chatId: string; 
  initialMessages: Message[]; 
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Subscribe to the specific chat channel
    const channel = pusherClient.subscribe(chatId);

    // 2. Listen for the "incoming-message" event we defined in lib/actions.ts
    channel.bind("incoming-message", (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      pusherClient.unsubscribe(chatId);
    };
  }, [chatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempInput = input;
    setInput(""); // Clear input immediately for snappy UI

    const result = await sendMessage(chatId, tempInput);
    if (!result.success) {
      alert("Message failed to send.");
      setInput(tempInput); // Restore text if failed
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl ${
                isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}>
                <p>{msg.text}</p>
                <span className="text-[10px] opacity-70 block mt-1">
                  {format(new Date(msg.createdAt), "HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
          Send
        </button>
      </form>
    </div>
  );
}