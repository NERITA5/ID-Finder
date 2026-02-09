"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Search, 
  CreditCard, 
  Loader2, 
  User, 
  Eye, 
  EyeOff 
} from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-slate-100 font-sans antialiased">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col min-h-screen md:min-h-0 md:h-[850px] md:my-auto md:rounded-[2.5rem] overflow-hidden relative">
        
        {/* HEADER */}
        <div className="bg-[#0056d2] pt-8 pb-16 relative">
          <div className="flex justify-center items-center gap-2 relative z-10">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <Search className="w-5 h-5 text-[#0056d2]" />
            </div>
            <span className="text-white text-xl font-black italic tracking-tighter uppercase leading-none">ID Finder</span>
          </div>
          <div className="absolute bottom-0 w-full h-12 bg-white rounded-t-[100%] translate-y-6 scale-x-125"></div>
        </div>

        {/* HERO ICON SECTION */}
        <div className="flex flex-col items-center px-8 pt-4">
          <div className="w-40 h-40 bg-blue-50 rounded-full flex items-center justify-center relative mb-6 border-4 border-white shadow-inner">
             <div className="relative">
                <User className="w-20 h-20 text-blue-400 opacity-40" />
                <div className="absolute top-0 -right-2 bg-white p-2 rounded-xl shadow-xl border-2 border-blue-100 rotate-12">
                   <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
             </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 text-center leading-tight">Find and Recover Lost IDs</h1>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleSignIn} className="px-8 mt-6 space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5 z-10" />
            <input 
              type="email" 
              placeholder="Email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={loading}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium text-slate-800 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5 z-10" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={loading}
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium text-slate-800 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors z-20"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-right">
            {/* FIXED: Removed 'disabled' prop and added conditional styling */}
            <Link 
              href="/forgot-password" 
              className={`text-blue-600 text-xs font-bold hover:underline transition-all ${loading ? "pointer-events-none opacity-50" : ""}`}
            >
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading || !isLoaded} 
            className="w-full bg-[#0056d2] hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center text-lg disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Sign In"}
          </button>

          <div className="flex items-center gap-4 py-2">
            <hr className="flex-1 border-slate-100" /> 
            <span className="text-xs font-black text-slate-300">OR</span> 
            <hr className="flex-1 border-slate-100" />
          </div>

          <Link 
            href="/sign-up" 
            className={`block w-full transition-all ${loading ? "pointer-events-none opacity-50" : ""}`}
          >
            <button 
              type="button" 
              className="w-full bg-[#2d8a4e] hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg"
            >
              Sign Up
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}