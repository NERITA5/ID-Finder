import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function LandingPage() {
  // Check authentication status on the server
  const { userId } = await auth();

  // If already logged in, move them to /dashboard immediately
  if (userId) {
    redirect("/dashboard");
  }

  // Otherwise, show the landing page
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black italic tracking-tighter text-blue-600 uppercase mb-4">
        Nerita ID Registry
      </h1>
      <p className="text-slate-500 font-bold mb-8 max-w-md">
        The most secure way to report and recover lost identity documents in Cameroon.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/sign-in" 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}