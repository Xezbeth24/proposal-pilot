"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileMenu } from "../../components/ui/MobileMenu";
import { useAuth } from "../../components/ui/providers/AuthProvider";

import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  deleteDoc, 
  doc, 
  where 
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Trash2, Search, History as HistoryIcon, LogIn } from "lucide-react";

// 1. Updated Type to support both old 'job' and new 'jobPost' fields
type ProposalDoc = {
  id: string;
  jobPost?: string; 
  job?: string;
  about: string;
  proposal: string;
  createdAt?: any;
};

export default function HistoryPage() {
  const [items, setItems] = useState<ProposalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const { user, login, logout } = useAuth(); 

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "proposals"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ProposalDoc[];
      setItems(docs);
    } catch (e) {
      console.error("Query failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteProposal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    try {
      await deleteDoc(doc(db, "proposals", id));
      loadHistory();
    } catch (e) {
      alert("Error deleting proposal");
    }
  };

  // 2. Updated handleLoad to use the new 'jobPost' key
  const handleLoad = (item: ProposalDoc) => {
    localStorage.setItem("proposalDraft", JSON.stringify({
      jobPost: item.jobPost || item.job || "", // Check both for old data compatibility
      about: item.about,
      proposal: item.proposal,
    }));
    window.location.href = "/";
  };

  const formatDate = (value: any) => {
    if (!value) return "";
    const d = value.toDate ? value.toDate() : new Date(value);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 3. FIX: Safe filtering that checks both jobPost and job
  const filtered = items.filter(item => {
    const title = item.jobPost || item.job || "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative selection:bg-purple-500/30">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <main className="relative z-10 flex h-screen overflow-hidden">
        <aside className="w-72 backdrop-blur-xl bg-black/40 border-r border-white/5 hidden md:flex flex-col">
          <div className="h-16 flex items-center px-8 border-b border-white/5">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              ProposalPilot
            </span>
          </div>
          <nav className="flex-1 px-6 py-8 space-y-3">
            <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-white/5 hover:text-white transition-all">
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm">✍️</div>
              <span className="font-medium text-sm">Write Proposal</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white shadow-xl shadow-purple-500/10">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm shadow-lg">📜</div>
              <span className="font-bold text-sm">History</span>
            </div>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 backdrop-blur-md bg-black/20 border-b border-white/5 flex items-center justify-between px-8">
            <div className="md:hidden mr-4">
              <MobileMenu />
            </div>
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search your proposals..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all placeholder:text-white/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[11px] text-white font-black uppercase tracking-widest">{user.displayName}</span>
                    <button onClick={logout} className="text-[9px] text-white/40 hover:text-red-400 transition-colors uppercase font-bold mt-1">Sign Out</button>
                  </div>
                  <img src={user.photoURL || ""} alt="User" className="w-9 h-9 rounded-xl border border-white/10 shadow-xl" />
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase hover:bg-purple-100 transition-all shadow-lg"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6">
              {!user ? (
                <div className="text-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
                   <p className="text-white/40 font-medium">Please sign in to view your history</p>
                   <button onClick={login} className="text-purple-400 text-sm mt-2 hover:underline">Sign In Now →</button>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-40">
                  <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Fetching history...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📁</div>
                  <p className="text-white/40 font-medium">No results found</p>
                  <Link href="/" className="text-purple-400 text-sm mt-2 hover:underline inline-block">Start writing now →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((item) => (
                    <div key={item.id} className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:translate-x-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-md">Proposal</span>
                            <span className="text-[10px] text-white/30 font-medium">{formatDate(item.createdAt)}</span>
                          </div>
                          {/* 4. Display both old and new field names */}
                          <h3 className="text-lg font-bold text-white/90 truncate group-hover:text-white transition-colors">
                            {item.jobPost || item.job || "Untitled Project"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            onClick={() => handleLoad(item)}
                            className="bg-white text-black hover:bg-purple-100 rounded-xl h-10 px-6 font-bold text-xs transition-transform active:scale-95"
                          >
                            Open in Editor
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => deleteProposal(item.id)}
                            className="w-10 h-10 p-0 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
