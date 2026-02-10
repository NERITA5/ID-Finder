"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Search, 
  ShieldPlus, 
  Loader2, 
  User, 
  Info, 
  RefreshCcw, 
  Eye, 
  EyeOff 
} from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false); 
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      alert("A new code has been sent to your email.");
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Error resending code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-slate-100 font-sans antialiased py-10">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-fit md:my-auto md:rounded-[2.5rem] overflow-hidden relative pb-10">
        
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

        <div className="flex flex-col items-center px-8 pt-4">
          <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center relative mb-4 border-4 border-white shadow-inner">
             <ShieldPlus className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 text-center leading-tight">
            {pendingVerification ? "Verify Email" : "Create Your Account"}
          </h1>
        </div>

        <div className="px-8 mt-6">
          {!pendingVerification ? (
            /* SIGN UP FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                   <input 
                    placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-medium"
                   />
                </div>
                <input 
                  placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input 
                  type="email" placeholder="Email Address" required value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              {/* PASSWORD INPUT WITH TOGGLE */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create Password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#2d8a4e] hover:bg-[#236b3d] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center text-lg mt-4">
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Sign Up"}
              </button>
            </form>
          ) : (
            /* VERIFICATION FORM (OTP) */
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-blue-700 leading-tight uppercase">
                  Please check your email for a verification code.
                </p>
              </div>

              <form onSubmit={onPressVerify} className="space-y-4 text-center">
                <input 
                  value={code} placeholder="000000" maxLength={6} onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-5 bg-slate-50 border-2 border-blue-500 rounded-2xl text-center text-3xl font-black tracking-[0.5em] outline-none"
                />
                
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                  Code expires in <span className="text-orange-500">10 minutes</span>
                </p>

                <button type="submit" disabled={loading} className="w-full bg-[#0056d2] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "COMPLETE SIGN UP"}
                </button>
              </form>

              <button 
                onClick={handleResendCode}
                disabled={resending}
                className="flex items-center justify-center gap-2 mx-auto text-[10px] font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                {resending ? <Loader2 className="animate-spin w-3 h-3" /> : <RefreshCcw className="w-3 h-3" />}
                Resend Code
              </button>
            </div>
          )}
        </div>

        {/* ADJUSTED FOOTER LINK */}
        <div className="mt-10 text-center">
          <p className="text-[11px] text-slate-400 font-black tracking-widest uppercase">
            Already have an account? <Link href="/sign-in" className="text-blue-600 ml-1 underline underline-offset-4">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}