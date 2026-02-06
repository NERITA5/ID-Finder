"use client";
import React from "react";
import { 
  User, Shield, Bell, LogOut, 
  ChevronRight, CreditCard, Heart, 
  CheckCircle, Zap, Camera 
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk(); 
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#fcfcfd]">
        <div className="animate-pulse text-[#0056d2] font-bold">Loading Profile...</div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-[#fcfcfd] min-h-screen pb-32 font-sans antialiased">
      
      {/* 1. PROFILE HEADER */}
      <div className="bg-white p-8 pt-16 rounded-b-[3rem] shadow-sm border-b border-slate-50">
        <div className="flex flex-col items-center">
          <div className="relative mb-4 group">
            {/* PROFILE IMAGE CONTAINER */}
            <div className="w-24 h-24 rounded-[2.2rem] bg-gradient-to-tr from-[#0056d2] to-blue-400 p-1 shadow-lg">
              <div className="w-full h-full rounded-[2rem] bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>
            
            {/* UPLOAD TRIGGER */}
            <button 
              onClick={() => openUserProfile()}
              className="absolute -bottom-1 -right-1 bg-[#0056d2] border-4 border-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>

            <div className="absolute -top-1 -left-1 bg-green-500 border-4 border-white w-7 h-7 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
            {user?.fullName || "User Name"}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {user?.primaryEmailAddress?.emailAddress}
          </p>

          {/* TRUST SCORE METER */}
          <div className="mt-6 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Trust Score
              </span>
              <span className="text-[9px] font-black text-[#0056d2]">85%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-[#0056d2] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SETTINGS GROUPS */}
      <div className="p-6 space-y-8">
        
        {/* ACCOUNT SETTINGS */}
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
            Account Management
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => openUserProfile()}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-2.5 rounded-xl text-[#0056d2]">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic text-slate-700">Edit Personal Info</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>

            <Link href="/my-reports" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic text-slate-700">My ID Reports</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>

            <Link href="/notifications" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic text-slate-700">Alert Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </section>

        {/* SECURITY & SUPPORT */}
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
            Security & Support
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => openUserProfile()}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic text-slate-700">Privacy & Security</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>

            <Link href="/help" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic text-slate-700">Help Center</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </section>

        {/* LOGOUT */}
        <button 
          onClick={handleSignOut}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 p-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-red-100"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-black uppercase italic tracking-widest">Sign Out Account</span>
        </button>

        {/* FOOTER INFO */}
        <div className="text-center pt-4">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
            ID Finder v2.0.4 • Buea, Southwest Region
          </p>
        </div>
      </div>
    </div>
  );
}