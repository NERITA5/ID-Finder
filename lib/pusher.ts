import PusherServer from "pusher";
import PusherClient from "pusher-js";

// 1. Server-side (Private)
const globalForPusher = global as unknown as { pusherServer: PusherServer };

export const pusherServer =
  globalForPusher.pusherServer ||
  new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") globalForPusher.pusherServer = pusherServer;

// 2. Client-side (Public) - Protected against SSR
export const pusherClient = 
  typeof window !== "undefined" 
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        forceTLS: true,
      }) 
    : null;