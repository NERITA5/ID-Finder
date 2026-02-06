"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteReport } from "@/app/actions/fraud";

export default function DeleteButton({ reportId }: { reportId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Permanently delete this report?")) return;
    setLoading(true);
    const res = await deleteReport(reportId);
    if (!res.success) alert("Error deleting report.");
    setLoading(false);
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}