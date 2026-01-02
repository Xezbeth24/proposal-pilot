"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { useAuth } from "../components/ui/providers/AuthProvider";
import { LogOut, LogIn, Download } from "lucide-react"; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'sonner';

import { PROPOSAL_TEMPLATES } from "../lib/templates";
import { MobileMenu } from "../components/ui/MobileMenu";

export default function Home() {
  const [job, setJob] = useState("");
  const [about, setAbout] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, login, logout, loading: authLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(PROPOSAL_TEMPLATES[1].id);

  const proposalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("proposalDraft");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setJob(parsed.job || "");
        setAbout(parsed.about || "");
        setProposal(parsed.proposal || "");
      } catch {}
      localStorage.removeItem("proposalDraft");
    }
  }, []);

  const downloadPDF = async () => {
    if (!proposal) return alert("No proposal to download!");

    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '650px';
      tempContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      tempContainer.style.padding = '0';
      tempContainer.style.borderRadius = '12px';
      tempContainer.style.fontFamily = '"Inter", "Segoe UI", Arial, sans-serif';

      tempContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 30px 20px; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Freelance Proposal</h1>
          <div style="display: flex; gap: 15px; font-size: 14px; opacity: 0.9;">
            <span>✨ ProposalPilot.ai</span>
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; color: #1f2937; line-height: 1.8; font-size: 16px;">
          ${proposal.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      `;

      document.body.appendChild(tempContainer);
      const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(tempContainer);

      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(data, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`proposal-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF.');
    }
  };
  

const generateProposal = async () => {
  // 2. Prevent clicking while Firebase is still "waking up"
  if (authLoading) return; 

  // 3. Check for user BEFORE making the expensive API call
  if (!user) {
  toast.error("You must be logged in to generate a proposal!");
  return;
}

  setLoading(true);
  setProposal("");

  try {
    const templateInstructions = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate)?.prompt || "";
    
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job, about, instruction: templateInstructions }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Generation failed");
      return;
    }

    // 4. Set the proposal directly from the data
    setProposal(data.proposal);
    toast.success("Magic generated!");

  } catch (e) {
    toast.error("Network error. Please check your connection.");
  } finally {
    setLoading(false);
  }
};


  const saveProposal = async () => {
    if (!proposal || !user) return toast.warning("Please sign in to save your history!");
    setSaving(true);
    try {
      await addDoc(collection(db, "proposals"), {
        uid: user.uid,
        job,
        about,
        proposal,
        createdAt: new Date(),
      });
      toast.success("Proposal saved to your cloud history!");
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/80 to-slate-800 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <main className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 backdrop-blur-xl bg-black/30 border-r border-purple-900/50 hidden md:flex flex-col shadow-2xl">
          <div className="h-16 flex items-center px-6 border-b border-purple-900/50">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
              ProposalPilot
            </span>
          </div>
          <nav className="flex-1 px-6 py-8 space-y-3 text-sm">
            <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/90 hover:bg-white/20 transition-all shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">✍️</div>
              Write Proposal
            </Link>
            <Link href="/history" className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-white/10 hover:text-white transition-all">
              📜 History
            </Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 backdrop-blur-xl bg-black/40 border-b border-purple-900/50 flex items-center justify-between px-6 md:px-12 sticky top-0 z-20 shadow-2xl">
  {/* Mobile Menu & Logo */}
  <div className="flex items-center gap-3 md:hidden">
    <MobileMenu />
    <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
      ProposalPilot
    </span>
  </div>

  <div className="flex-1" />

  {/* User Actions */}
  <div className="flex items-center gap-4">
    {user ? (
      <div className="flex items-center gap-4">
        {/* Desktop Version */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm text-white font-bold">{user.displayName}</span>
          <button onClick={logout} className="text-[10px] text-white/40 hover:text-red-400 uppercase font-bold">
            Sign Out
          </button>
        </div>
        
        <img src={user.photoURL || ""} className="w-10 h-10 rounded-2xl border border-white/10" alt="avatar" />

        {/* 🚀 Mobile Sign Out */}
        <button 
          onClick={logout} 
          className="md:hidden p-2 bg-red-500/10 text-red-400 rounded-xl active:scale-90 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    ) : (
      <button onClick={login} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-2xl font-black text-sm hover:scale-105 transition-all">
         <LogIn className="w-4 h-4" /> Sign In
      </button>
    )}
  </div>
</header>



          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-8 overflow-hidden">
            {/* LEFT INPUTS */}
            <section className="lg:w-1/2 space-y-6 flex flex-col">
              <div className="backdrop-blur-xl bg-white/5 border border-purple-900/50 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">🎯 Job Details</h2>
                <textarea className="w-full h-36 p-6 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/30" placeholder="Paste job description..." value={job} onChange={(e) => setJob(e.target.value)} />
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-purple-900/50 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent mb-3">🛠️ Your Profile</h2>
                <textarea className="w-full h-28 p-6 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-pink-500/30" placeholder="Your skills..." value={about} onChange={(e) => setAbout(e.target.value)} />
              </div>

              {/* Template Picker */}
              <div className="backdrop-blur-xl bg-white/5 border border-purple-900/50 p-6 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-3 gap-4">
                  {PROPOSAL_TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all ${selectedTemplate === t.id ? "bg-purple-600/30 border-purple-400 scale-105" : "bg-black/40 border-white/10 hover:bg-white/5"}`}>
                      <span className="text-2xl mb-1">{t.icon}</span>
                      <span className="text-[10px] font-black uppercase text-white/60">{t.name.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
  onClick={generateProposal}
  disabled={loading}
  className={`
    relative group w-full h-16 rounded-3xl font-black text-xl overflow-hidden transition-all duration-500
    ${loading 
      ? "bg-slate-800 cursor-not-allowed" 
      : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] active:scale-95"
    }
  `}
>
  {/* Shimmer Effect */}
  {!loading && (
    <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[35deg] animate-shimmer" />
  )}

  <div className="relative flex items-center justify-center gap-3">
    {loading ? (
      <>
        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Casting Spell...
        </span>
      </>
    ) : (
      <>
        <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">✨</span>
        <span className="tracking-tight">Generate Magic</span>
        <span className="text-2xl group-hover:-rotate-12 transition-transform duration-300">✨</span>
      </>
    )}
  </div>

  {/* Subtle Border Glow */}
  <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
</button>

            </section>

            {/* RIGHT PREVIEW - MODERN GLASS UI */}
            <section className="lg:w-1/2 flex flex-col">
              <div className="flex-1 backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500">
                {/* Preview Header */}
                <div className="border-b border-white/10 px-8 py-6 flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                  <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">📄 Client Preview</h2>
                    <p className="text-white/50 text-sm mt-1 font-medium">Live document view</p>
                  </div>
                  {proposal && (
                    <button onClick={copyToClipboard} className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-2xl text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20">
                      {copied ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  )}
                </div>

                {/* Preview Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                  {proposal ? (
                    <div className="bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-black/50 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-8 shadow-2xl min-h-[300px]">
                      <div className="text-white/95 text-lg leading-relaxed whitespace-pre-wrap font-medium tracking-wide">
                        {proposal}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30">
                      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-4">✨</div>
                      <p className="text-lg font-medium">Your proposal appears here</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                {proposal && (
                  <div className="border-t border-white/10 p-8 bg-black/20 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={saveProposal} disabled={saving} className="h-14 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-3xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all">
                        {saving ? "💾 Saving..." : "💾 Save to Cloud"}
                      </button>
                      <button onClick={downloadPDF} className="h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl font-black text-sm shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
