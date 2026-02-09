"use client";

import React, { useState, useEffect, Suspense } from "react";
import { 
  Search, 
  ChevronLeft, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Compass, 
  Target 
} from "lucide-react";
import Link from "next/link";
import { searchReports, getRecentReports } from "../../lib/actions"; 
import { useDebounce } from "use-debounce";

// 1. MAIN EXPORT WRAPPED IN SUSPENSE (Required for build success)
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

// 2. THE CONTENT COMPONENT
function SearchContent() {
  const [activeTab, setActiveTab] = useState("nearby");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [debouncedQuery] = useDebounce(query, 400);

  // --- GEOLOCATION TRIGGER ---
  const handleDetectLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision;
          
          setUserCity(city);
          // Fetch nearby IDs
          const nearbyData = await searchReports(city);
          setResults(nearbyData || []);
        } catch (err) {
          console.error("Location detection failed", err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        alert("Please allow location access to see IDs near you.");
      },
      { timeout: 10000 } // Safety timeout for slow mobile networks
    );
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      if (activeTab === "nearby" && !userCity) {
        const data = await getRecentReports();
        setResults(data || []);
      } else if (activeTab === "search") {
        setResults([]);
      }
      setLoading(false);
    };
    loadInitialData();
  }, [activeTab, userCity]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (activeTab === "search" && debouncedQuery.length >= 2) {
      const performSearch = async () => {
        setLoading(true);
        const data = await searchReports(debouncedQuery);
        setResults(data || []);
        setLoading(false);
      };
      performSearch();
    }
  }, [debouncedQuery, activeTab]);

  return (
    <div className="max-w-md mx-auto bg-[#f8f9ff] min-h-screen pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-6 pt-12 border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="bg-slate-50 p-2 rounded-xl active:scale-95 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="font-black uppercase italic tracking-tighter text-xl text-slate-800">
            {activeTab === "nearby" ? "Nearby Discovery" : "Global Search"}
          </h1>
        </div>
        
        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
          <button 
            onClick={() => setActiveTab("nearby")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${activeTab === 'nearby' ? 'bg-white text-[#0056d2] shadow-sm' : 'text-slate-400'}`}
          >
            <Compass className="w-4 h-4" /> Nearby
          </button>
          <button 
            onClick={() => setActiveTab("search")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${activeTab === 'search' ? 'bg-white text-[#0056d2] shadow-sm' : 'text-slate-400'}`}
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>

        {/* INPUTS */}
        <div className="h-14 flex items-center">
          {activeTab === "nearby" ? (
            <button 
              onClick={handleDetectLocation}
              className="w-full flex items-center justify-center gap-3 bg-[#0056d2]/5 text-[#0056d2] py-4 rounded-2xl text-[11px] font-black uppercase border border-[#0056d2]/10 active:scale-[0.98] transition-all"
            >
              <Target className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
              {userCity ? `Showing IDs in ${userCity}` : "Detect My Current City"}
            </button>
          ) : (
            <div className="relative w-full animate-in fade-in duration-300">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0056d2]" />
              <input 
                type="text"
                placeholder="Search Name, ID type, or City..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-[#0056d2] outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-[#0056d2] mb-3" />
             <p className="text-[10px] font-black uppercase text-slate-400 italic">Syncing Data...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((item) => (
            <Link 
              href={`/report/${item.id}`} 
              key={item.id} 
              className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between group hover:border-[#0056d2] transition-all"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`p-3 rounded-2xl shrink-0 ${item.status === 'LOST' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="text-left overflow-hidden">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${item.status === 'LOST' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {item.status}
                  </span>
                  <h3 className="font-black text-slate-800 uppercase italic text-sm mt-1 truncate">{item.idType}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{item.fullName}</p>
                  <p className="text-[9px] text-[#0056d2] font-black flex items-center gap-1 mt-0.5 uppercase">
                    <MapPin className="w-3 h-3" /> {item.lastLocation}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-[#0056d2] group-hover:text-white transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center opacity-40 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
            <p className="font-black uppercase italic text-sm tracking-widest">No active reports here</p>
            <p className="text-[10px] font-bold mt-2 uppercase">Try searching globally or change your location</p>
          </div>
        )}
      </div>
    </div>
  );
}