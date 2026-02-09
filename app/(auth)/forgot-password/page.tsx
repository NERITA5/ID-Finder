"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  KeyRound, 
  Loader2, 
  ChevronLeft, 
  CheckCircle2, 
  Eye, 
  EyeOff 
} from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false); // Visibility toggle state
  const [code, setCode] = React.useState("");
  const [successfulId, setSuccessfulId] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Step 1: Request Code
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSuccessfulId(true);
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Code AND Password together
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      // We must provide BOTH the code and the new password in this call
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code,
        password: password, // Clerk needs to set the password as it verifies the code
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.refresh();
        router.push("/dashboard");
      } else {
        console.log(result);
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.longMessage || "Incorrect code or expired. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-slate-100 font-sans antialiased">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col min-h-screen md:min-h-0 md:h-[850px] md:my-auto md:rounded-[2.5rem] overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#0056d2] pt-8 pb-16 relative">
          <div className="px-6 flex items-center relative z-10">
            <Link href="/sign-in" className="text-white mr-4 active:scale-90 transition-transform"><ChevronLeft /></Link>
            <span className="text-white text-lg font-black uppercase italic tracking-tighter">ID Finder</span>
          </div>
          <div className="absolute bottom-0 w-full h-12 bg-white rounded-t-[100%] translate-y-6 scale-x-125"></div>
        </div>

        <div className="px-8 pt-4 flex flex-col items-center flex-1">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner transition-colors duration-500 ${successfulId ? 'bg-green-50' : 'bg-blue-50'}`}>
            {successfulId ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
            ) : (
              <KeyRound className="w-16 h-16 text-blue-500" />
            )}
          </div>

          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {successfulId ? "Verify Code" : "Reset Password"}
          </h1>
          
          {!successfulId ? (
            /* STEP 1: REQUEST RESET */
            <form onSubmit={handleResetRequest} className="w-full mt-8 space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium transition-all"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#0056d2] hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : "SEND RESET CODE"}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY AND UPDATE */
            <form onSubmit={handleResetSubmit} className="w-full mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <input 
                type="text" 
                placeholder="6-digit code" 
                required 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="w-full py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-center text-3xl font-black tracking-[0.4em] outline-none"
              />
              
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="New Password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#2d8a4e] hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : "UPDATE PASSWORD"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setSuccessfulId(false)} 
                className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4 hover:text-blue-600 transition-colors"
              >
                Back to email request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}