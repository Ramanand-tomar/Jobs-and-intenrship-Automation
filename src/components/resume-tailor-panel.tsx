"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface TailorPanelProps {
  job: {
    id: string
    title: string
    company: string
    platform: string
  }
  onClose: () => void
}

interface AnalysisResult {
  ats_score: number
  keyword_matches: string[]
  missing_keywords: string[]
  gap_analysis?: string
  recommendations?: string[]
}

interface TailorResult extends AnalysisResult {
  tailored_summary: string
  tailored_skills: string[] | Record<string, string[]>
  download_url: string | null
  version_id: string | null
  warnings?: string[]
}

export default function ResumeTailorPanel({ job, onClose }: TailorPanelProps) {
  const supabase = createClient()
  const [step, setStep] = useState<"idle" | "analyzing" | "analyzed" | "tailoring" | "done" | "error">("idle")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [tailored, setTailored] = useState<TailorResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [lastAction, setLastAction] = useState<"analyze" | "tailor" | null>(null)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  const handleAnalyze = async () => {
    setLastAction("analyze")
    setStep("analyzing")
    setErrorMsg("")
    try {
      const token = await getToken()
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: job.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")
      setAnalysis(data)
      setStep("analyzed")
    } catch (err: any) {
      setErrorMsg(err.message || "Analysis failed")
      setStep("error")
    }
  }

  const handleTailor = async () => {
    setLastAction("tailor")
    setStep("tailoring")
    setErrorMsg("")
    try {
      const token = await getToken()
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: job.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Tailoring failed")
      setTailored(data)
      setStep("done")
    } catch (err: any) {
      setErrorMsg(err.message || "Tailoring failed")
      setStep("error")
    }
  }

  const handleRetry = () => {
    if (lastAction === "tailor") {
      handleTailor()
    } else {
      handleAnalyze()
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return "#22c55e"
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  const scoreLabel = (score: number) => {
    if (score >= 75) return "Strong Match"
    if (score >= 50) return "Moderate Match"
    return "Weak Match"
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/* Panel */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "420px", height: "100dvh",
        background: "#0f1117",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        animation: "slideInRight 0.25s ease-out",
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .kw-chip {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 500;
            margin: 3px;
          }
          .tailor-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
          .tailor-btn { transition: all 0.15s; }
        `}</style>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                ATS RESUME OPTIMIZER
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{job.title}</div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: 2 }}>{job.company}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20, padding: 4 }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px" }}>

          {/* IDLE state */}
          {step === "idle" && (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <div style={{ color: "#e5e7eb", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Check Your ATS Match Score
              </div>
              <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                Our AI analyzes the job description and compares it against your profile to find gaps and missing keywords.
              </div>
              <button
                className="tailor-btn"
                onClick={handleAnalyze}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer",
                }}
              >
                🔍 Analyze ATS Match
              </button>
            </div>
          )}

          {/* LOADING states */}
          {(step === "analyzing" || step === "tailoring") && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "3px solid rgba(99,102,241,0.2)",
                borderTopColor: "#6366f1",
                margin: "0 auto 20px",
                animation: "spin 0.8s linear infinite",
              }} />
              <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 15 }}>
                {step === "analyzing" ? "Analyzing your resume..." : "Generating tailored resume..."}
              </div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
                {step === "analyzing"
                  ? "Comparing your profile against the job description"
                  : "AI is rewriting your summary, skills, and bullet points"}
              </div>
            </div>
          )}

          {/* ANALYZED state */}
          {step === "analyzed" && analysis && (
            <div>
              {/* Score circle */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  display: "inline-flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center",
                  width: 120, height: 120, borderRadius: "50%",
                  border: `4px solid ${scoreColor(analysis.ats_score)}`,
                  background: "rgba(255,255,255,0.03)",
                }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor(analysis.ats_score) }}>
                    {analysis.ats_score}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>/ 100</div>
                </div>
                <div style={{ color: scoreColor(analysis.ats_score), fontWeight: 700, marginTop: 10, fontSize: 14 }}>
                  {scoreLabel(analysis.ats_score)}
                </div>
              </div>

              {/* Matched keywords */}
              {analysis.keyword_matches?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8 }}>
                    ✅ MATCHED KEYWORDS ({analysis.keyword_matches.length})
                  </div>
                  <div>
                    {analysis.keyword_matches.map((kw, i) => (
                      <span key={i} className="kw-chip" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {analysis.missing_keywords?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8 }}>
                    ❌ MISSING KEYWORDS ({analysis.missing_keywords.length})
                  </div>
                  <div>
                    {analysis.missing_keywords.map((kw, i) => (
                      <span key={i} className="kw-chip" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gap analysis */}
              {analysis.gap_analysis && (
                <div style={{
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 18,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>📋 GAP ANALYSIS</div>
                  <div style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.6 }}>{analysis.gap_analysis}</div>
                </div>
              )}

              {/* Recommendations */}
              {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8 }}>
                    💡 RECOMMENDATIONS
                  </div>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, marginBottom: 8,
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8, padding: "8px 10px",
                    }}>
                      <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, minWidth: 16 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.5 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="tailor-btn"
                onClick={handleTailor}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 10,
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer",
                }}
              >
                ✨ Generate Tailored Resume PDF
              </button>
            </div>
          )}

          {/* DONE state */}
          {step === "done" && tailored && (
            <div>
              {/* Success header */}
              <div style={{
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(5,150,105,0.15), rgba(16,185,129,0.08))",
                border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12,
                padding: "20px 16px", marginBottom: 24,
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ color: "#34d399", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  Tailored Resume Ready!
                </div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  ATS Score: <span style={{ color: scoreColor(tailored.ats_score), fontWeight: 700 }}>
                    {tailored.ats_score}/100
                  </span>
                </div>
              </div>

              {/* Keyword summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8 }}>
                  ✅ KEYWORDS MATCHED
                </div>
                <div>
                  {(tailored.keyword_matches || []).map((kw, i) => (
                    <span key={i} className="kw-chip" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {tailored.missing_keywords?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8 }}>
                    ⚠️ STILL MISSING
                  </div>
                  <div>
                    {tailored.missing_keywords.map((kw, i) => (
                      <span key={i} className="kw-chip" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tailored.warnings && tailored.warnings.length > 0 && (
                <div style={{
                  marginBottom: 20,
                  padding: "12px 14px",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: 10
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>
                    ⚠️ PROFILE COMPLETENESS WARNINGS
                  </div>
                  {tailored.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#fbbf24", marginBottom: 3 }}>
                      • {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Tailored summary preview */}
              {tailored.tailored_summary && (
                <div style={{
                  background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 6 }}>
                    📝 AI-TAILORED SUMMARY PREVIEW
                  </div>
                  <div style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.6 }}>{tailored.tailored_summary}</div>
                </div>
              )}

              {/* Download button */}
              {tailored.download_url ? (
                <a
                  href={tailored.download_url}
                  download={`resume_${job.company}_${job.title}.pdf`}
                  style={{
                    display: "block", width: "100%", padding: "13px 0",
                    borderRadius: 10, textAlign: "center",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  📥 Download Tailored Resume PDF
                </a>
              ) : (
                <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>
                  PDF generation succeeded but upload failed. Retry or check storage settings.
                </div>
              )}

              <button
                onClick={handleAnalyze}
                style={{
                  marginTop: 12, width: "100%", padding: "10px 0",
                  borderRadius: 10, background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af",
                  fontSize: 13, cursor: "pointer",
                }}
              >
                🔄 Re-analyze
              </button>
            </div>
          )}

          {/* ERROR state */}
          {step === "error" && (
            <div style={{ textAlign: "center", paddingTop: 30 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12, padding: "14px 16px", marginBottom: 20,
              }}>
                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {lastAction === "tailor" ? "Resume Tailoring Paused" : "ATS Analysis Error"}
                </div>
                <div style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.5 }}>{errorMsg}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleRetry}
                  className="tailor-btn"
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                    border: "none", cursor: "pointer",
                  }}
                >
                  🔄 {lastAction === "tailor" ? "Retry Generating Resume" : "Retry Analysis"}
                </button>

                {analysis && (
                  <button
                    onClick={() => setStep("analyzed")}
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 10,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#9ca3af", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    ← Back to ATS Match Score
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
