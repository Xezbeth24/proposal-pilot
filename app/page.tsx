"use client";

import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { useAuth } from "../components/ui/providers/AuthProvider";
import { LogOut, LogIn, Download, Loader2, Link as LinkIcon } from "lucide-react"; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'sonner';
import { PROPOSAL_TEMPLATES } from "../lib/templates";
import { MobileMenu } from "../components/ui/MobileMenu";
// Import Shadcn components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [jobPost, setJobPost] = useState("");
  const [jobUrl, setJobUrl] = useState(""); 
  const [isScraping, setIsScraping] = useState(false);
  const [about, setAbout] = useState("");
  const [proposal, setProposal] = useState("");
  // ... and so on

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charLimit, setCharLimit] = useState(800); 
  const [selectedPlatform, setSelectedPlatform] = useState("Upwork");
  const [selectedTone, setSelectedTone] = useState("Professional");

  const { user, login, logout, loading: authLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(PROPOSAL_TEMPLATES[1].id);

  // New: Scraping Logic
  const handleScrape = async () => {
    if (!jobUrl) return toast.error("Please paste an Upwork or LinkedIn URL first!");
    
    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      
      if (data.markdown) {
        setJobPost(data.markdown); 
        toast.success("Job details imported successfully!");
      } else {
        throw new Error(data.error || "Failed to fetch content");
      }
    } catch (err: any) {
      toast.error(err.message || "Scraping failed. Try manual copy-paste.");
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("proposalDraft");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setJobPost(parsed.jobPost || parsed.job || "");
        setAbout(parsed.about || "");
        setProposal(parsed.proposal || "");
      } catch {}
      localStorage.removeItem("proposalDraft");
    }
  }, []);

  const downloadPDF = async () => {
    if (!proposal) return toast.error("No proposal to download!");
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '650px';
      tempContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      tempContainer.style.borderRadius = '12px';
      tempContainer.style.fontFamily = '"Inter", sans-serif';

      tempContainer.innerHTML = `
        <div style="padding: 30px; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800;">Freelance Proposal</h1>
          <p style="opacity: 0.8; font-size: 14px;">Generated via ProposalPilot.ai • ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; color: #1f2937; line-height: 1.8; font-size: 16px;">
          ${proposal.replace(/\n/g, '<br/>')}
        </div>
      `;

      document.body.appendChild(tempContainer);
      const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });
      document.body.removeChild(tempContainer);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`proposal-${Date.now()}.pdf`);
    } catch (error) {
      toast.error('Failed to generate PDF.');
    }
  };

  const saveProposal = async () => {
    if (!proposal || !user) return toast.warning("Please sign in to save your history!");
    setSaving(true);
    try {
      await addDoc(collection(db, "proposals"), {
        uid: user.uid,
        jobPost,
        about,
        proposal,
        createdAt: new Date(),
      });
      toast.success("Saved to cloud!");
    } catch (e: any) {
      toast.error("Save error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateProposal = async () => {
    if (authLoading) return;
    if (!user) return toast.error("Please sign in first!");

    setLoading(true);
    setProposal("");

    try {
      const templateInstructions = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate)?.prompt || "";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobPost, 
          about, 
          instruction: templateInstructions, 
          charLimit,
          platform: selectedPlatform,
          selectedTone: selectedTone
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setProposal(data.proposal);
      toast.success("✅ Magic generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/80 to-slate-800 overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <main className="relative z-10 flex min-h-screen">
        <aside className="w-72 backdrop-blur-xl bg-black/30 border-r border-purple-900/50 hidden md:flex flex-col shadow-2xl">
          <div className="h-16 flex items-center px-6 border-b border-purple-900/50">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">ProposalPilot</span>
          </div>
          <nav className="px-6 py-8 space-y-3 text-sm">
            <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/90 shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">✍️</div>
              Write Proposal
            </Link>
            <Link href="/history" className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-white/10 transition-all">📜 History</Link>
          </nav>

          <div className="px-6 mt-6">
            <label className="text-[10px] uppercase font-black text-white/40 mb-2 block tracking-widest">Target Platform</label>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
              {["Upwork", "LinkedIn"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`py-2 text-[10px] font-bold rounded-lg transition-all ${selectedPlatform === p ? "bg-purple-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 mt-4">
            <label className="text-[10px] uppercase font-black text-white/40 mb-2 block tracking-widest">Proposal Tone</label>
            <select 
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white/80 focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
            >
              <option value="Professional">👔 Professional</option>
              <option value="Casual">☕ Casual & Friendly</option>
              <option value="Aggressive Sales">🔥 Aggressive Sales</option>
            </select>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 backdrop-blur-xl bg-black/40 border-b border-purple-900/50 flex items-center justify-between px-6 md:px-12 sticky top-0 z-20 shadow-2xl">
            <div className="flex items-center gap-3 md:hidden">
              <MobileMenu />
              <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">ProposalPilot</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm text-white font-bold">{user.displayName}</span>
                    <button onClick={logout} className="text-[10px] text-white/40 hover:text-red-400 uppercase font-bold">Sign Out</button>
                  </div>
                  <img src={user.photoURL || ""} className="w-10 h-10 rounded-2xl border border-white/10" alt="avatar" />
                </div>
              ) : (
                <button onClick={login} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-2xl font-black text-sm hover:scale-105 transition-all"><LogIn className="w-4 h-4" /> Sign In</button>
              )}
            </div>
          </header>

          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-8 overflow-hidden">
            <section className="lg:w-1/2 space-y-6 flex flex-col overflow-y-auto pr-2">
              <div className="backdrop-blur-xl bg-white/5 border border-purple-900/50 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">🎯 Job Details</h2>
                
                {/* NEW: URL Scraping Section */}
                <div className="flex w-full items-center space-x-2 mb-6">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input 
                      type="url" 
                      placeholder="Paste Upwork or LinkedIn link..." 
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="pl-11 bg-black/40 border-white/20 text-white h-12 rounded-2xl focus:ring-purple-500"
                    />
                  </div>
                  <Button 
                    onClick={handleScrape} 
                    disabled={isScraping}
                    className="h-12 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
                  >
                    {isScraping ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching</>
                    ) : (
                      "Auto-Fill"
                    )}
                  </Button>
                </div>

                <textarea 
                  className="w-full h-44 p-6 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:ring-4 focus:ring-purple-500/30 outline-none" 
                  placeholder="Paste FULL job description..." 
                  value={jobPost} 
                  onChange={(e) => setJobPost(e.target.value)} 
                />
                <div className="mt-6 pt-6 border-t border-white/20">
                  <label className="block text-white/80 text-sm mb-3">Length: <span className="text-purple-400 font-bold">{charLimit} chars</span></label>
                  <input type="range" min="400" max="2500" step="50" value={charLimit} onChange={(e) => setCharLimit(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-purple-900/50 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent mb-3">🛠️ Your Profile</h2>
                <textarea className="w-full h-28 p-6 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:ring-4 focus:ring-pink-500/30 outline-none" placeholder="Your skills..." value={about} onChange={(e) => setAbout(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {PROPOSAL_TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`flex flex-col items-center justify-center p-4 rounded-[2rem] border-2 transition-all ${selectedTemplate === t.id ? "bg-purple-600/30 border-purple-400 scale-105" : "bg-black/40 border-white/10 hover:bg-white/5"}`}>
                    <span className="text-2xl mb-1">{t.icon}</span>
                    <span className="text-[10px] font-black uppercase text-white/60">{t.name.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              <button onClick={generateProposal} disabled={loading} className={`relative group w-full h-16 rounded-3xl font-black text-xl overflow-hidden transition-all ${loading ? "bg-slate-800" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"}`}>
                {!loading && <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-[35deg] animate-shimmer" />}
                <div className="relative flex items-center justify-center gap-3 h-full">
                  {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <>✨ <span className="tracking-tight">Generate Magic</span> ✨</>}
                </div>
              </button>
            </section>

            <section className="lg:w-1/2 flex flex-col">
              <div className="flex-1 backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500">
                <div className="border-b border-white/10 px-8 py-6 flex items-center justify-between bg-white/5">
                  <h2 className="text-2xl font-black text-white/90">📄 Client Preview</h2>
                  {proposal && <button onClick={copyToClipboard} className="px-5 py-2 bg-white/10 text-white rounded-xl text-xs font-bold border border-white/20">{copied ? "✅ Copied" : "📋 Copy"}</button>}
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                  {proposal ? (
                    <div className="bg-black/40 border border-purple-900/30 rounded-2xl p-8 text-white/90 text-lg leading-relaxed whitespace-pre-wrap">{proposal}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                      <div className="text-4xl mb-2 animate-pulse">✨</div>
                      <p className="font-medium">Magic appears here</p>
                    </div>
                  )}
                </div>
                {proposal && (
                  <div className="p-8 border-t border-white/10 grid grid-cols-2 gap-4 bg-black/20 backdrop-blur-md">
                    <button onClick={saveProposal} disabled={saving} className="h-14 bg-emerald-600/80 hover:bg-emerald-600 rounded-2xl font-bold text-sm text-white transition-all">💾 {saving ? "Saving..." : "Save Cloud"}</button>
                    <button onClick={downloadPDF} className="h-14 bg-indigo-600/80 hover:bg-indigo-600 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"><Download className="w-4 h-4" /> PDF</button>
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
