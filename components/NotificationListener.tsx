"use client";
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher"; 
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

export default function NotificationListener() {
  const { user } = useUser();

  useEffect(() => {
    // Safety check: ensure both user and pusherClient exist
    if (!user || !pusherClient) return;

    const channelName = `user-alerts-${user.id}`;
    const channel = pusherClient.subscribe(channelName);
    
    // Bind to the 'new-notification' event triggered in lib/actions.ts
    channel.bind("new-notification", (data: any) => {
      toast.success(data.message || "Match found!", {
        icon: '🔔',
        duration: 6000,
        style: {
          borderRadius: '16px',
          background: '#1e293b', // Slate-800
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #334155'
        },
      });
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [user]);

  return null; // Component renders nothing visually
}