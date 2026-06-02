import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#0e0b0b",
  surface: "#1a1212",
  card: "#211818",
  border: "#3a2020",
  red: "#dc2626",
  redDim: "#7f1d1d",
  yellow: "#fbbf24",
  white: "#f5f0eb",
  muted: "#8a7070",
  verified: "#16a34a",
};

const BOOT_LINES = [
  "INITIALIZING VERIFAI FACT-CHECK BUREAU...",
  "LOADING NLP CLASSIFICATION ENGINE...",
  "CONNECTING TO GROK AI BACKEND...",
  "MOUNTING MISINFORMATION DATABASE...",
  "CALIBRATING CONFIDENCE THRESHOLDS...",
  "ENABLING REAL-TIME ANALYSIS PIPELINE...",
  "ALL SYSTEMS OPERATIONAL.",
];

const ANALYSIS_STEPS = [
  { label: "INGESTING TEXT", detail: "Parsing tokens and structure..." },
  { label: "NLP PREPROCESSING", detail: "Tokenizing, stripping noise..." },
  {
    label: "PATTERN MATCHING",
    detail: "Scanning for known misinformation signals...",
  },
  {
    label: "SEMANTIC ANALYSIS",
    detail: "Checking factual coherence and source tone...",
  },
  { label: "AI INFERENCE", detail: "Running classification model..." },
  {
    label: "COMPILING REPORT",
    detail: "Generating verdict and confidence score...",
  },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Code+Pro:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0e0b0b; }
  @keyframes ticker   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes pulse    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeL    { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cursor   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes scanMove { from{top:0} to{top:100%} }
  .fade-in   { animation: fadeIn  0.4s ease both; }
  .slide-up  { animation: slideUp 0.5s ease both; }

  /* Responsive Grids & Layouts */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .stat-card {
    padding: 24px 20px;
    text-align: center;
    border-right: 1px solid #3a2020;
  }
  .stat-card:last-child {
    border-right: none;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #3a2020;
  }
  .step-card {
    background: #211818;
    padding: 32px 28px;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 28px;
  }

  .result-header {
    border-top: 4px solid var(--vc-color);
    background: #211818;
    border: 1px solid var(--vc-border);
    border-top-width: 4px;
    margin-bottom: 14px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 22px;
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 48px;
    line-height: 1.1;
    letter-spacing: 0.02em;
    margin-bottom: 20px;
    color: #f5f0eb;
  }

  .splash-title {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 56px;
    letter-spacing: 0.06em;
    line-height: 1;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .stat-card {
      border-right: none;
      border-bottom: 1px solid #3a2020;
    }
    .stat-card:nth-child(even) {
      border-right: none;
    }
    .stat-card:last-child {
      border-bottom: none;
    }

    .steps-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      background: transparent;
    }
    .step-card {
      border: 1px solid #3a2020;
    }
  }

  @media (max-width: 600px) {
    .features-grid {
      grid-template-columns: 1fr;
    }
    .nav-header {
      flex-direction: column;
      gap: 14px;
      padding: 16px 14px;
      text-align: center;
    }
    .hero-title {
      font-size: 34px;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .stat-card {
      border-bottom: 1px solid #3a2020;
    }
    .stat-card:last-child {
      border-bottom: none;
    }
    .result-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
    .splash-title {
      font-size: 42px;
    }
  }
`;

// ── Shared: Ticker ────────────────────────────────────────
function Ticker({ items }) {
  const defaults = [
    "BREAKING: AI SYSTEM SCANNING FOR MISINFORMATION",
    "CROSS-REFERENCING KNOWN SOURCES",
    "PATTERN DATABASE ACTIVE",
    "FACT-CHECK PROTOCOL ENGAGED",
  ];
  const gap = " ".repeat(25);
  const text = (items || defaults).join(`${gap}◆${gap}`) + `${gap}◆${gap}`;
  return (
    <div
      style={{
        background: C.red,
        overflow: "hidden",
        height: 28,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          flexShrink: 0,
          whiteSpace: "nowrap",
          animation: "ticker 110s linear infinite",
          fontSize: 10,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.1em",
          fontFamily: "'Source Code Pro',monospace",
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ flexShrink: 0 }}>{text}</span>
        ))}
      </div>
    </div>
  );
}

// ── Shared: Nav bar ───────────────────────────────────────
function NavBar({ page, onNav, historyCount }) {
  return (
    <div
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          borderTop: `4px solid ${C.red}`,
          borderBottom: `1px solid ${C.redDim}`,
          height: 7,
        }}
      />
      <div className="nav-header">
        <button
          onClick={() => onNav("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "0.04em",
              color: C.white,
              lineHeight: 1,
            }}
          >
            VERI<span style={{ color: C.red }}>FAI</span>
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: C.muted,
              fontFamily: "'Source Code Pro',monospace",
              marginTop: 2,
            }}
          >
            FACT-CHECK BUREAU
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["home", "analyze", "history"].map((p) => (
            <button
              key={p}
              onClick={() => onNav(p)}
              style={{
                background: page === p ? C.red : "transparent",
                border: `1px solid ${page === p ? C.red : C.border}`,
                color: page === p ? "#fff" : C.muted,
                fontFamily: "'Source Code Pro',monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                padding: "5px 12px",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: page === p ? 700 : 400,
              }}
            >
              {p.toUpperCase()}
              {p === "history" && historyCount > 0 ? ` (${historyCount})` : ""}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page: Splash ──────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [lines, setLines] = useState([]);
  const [barW, setBarW] = useState(0);
  const [fading, setFading] = useState(false);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setLines(BOOT_LINES.slice(0, i));
      setBarW(Math.round((i / BOOT_LINES.length) * 100));
      if (i >= BOOT_LINES.length) {
        clearInterval(t);
        setTimeout(() => {
          setFading(true);
          setTimeout(onDone, 500);
        }, 700);
      }
    }, 300);
    return () => clearInterval(t);
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(() => setScanY((y) => (y + 3) % 700), 16);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.white,
        fontFamily: "'Source Code Pro',monospace",
        display: "flex",
        flexDirection: "column",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          backgroundImage:
            "radial-gradient(circle,#f5f0eb 1px,transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          top: scanY,
          background: "rgba(220,38,38,0.13)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          borderTop: `4px solid ${C.red}`,
          borderBottom: `1px solid ${C.redDim}`,
          height: 8,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="splash-title">
              VERI<span style={{ color: C.red }}>FAI</span>
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.28em",
                color: C.muted,
                marginTop: 8,
              }}
            >
              FACT-CHECK BUREAU — EST. 2026
            </div>
            <div
              style={{
                marginTop: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.red,
                padding: "5px 14px",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                  animation: "pulse 0.8s ease infinite",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: "#fff",
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                }}
              >
                SYSTEM BOOT
              </span>
            </div>
          </div>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.red}`,
              padding: "20px 22px",
              minHeight: 220,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.redDim,
                letterSpacing: "0.18em",
                marginBottom: 14,
              }}
            >
              ROOT@VERIFAI:~$
            </div>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  marginBottom: 8,
                  letterSpacing: "0.04em",
                  lineHeight: 1.6,
                  animation: "fadeUp 0.25s ease both",
                  color:
                    line === "ALL SYSTEMS OPERATIONAL."
                      ? C.verified
                      : i === lines.length - 1
                        ? C.white
                        : C.muted,
                  fontWeight: line === "ALL SYSTEMS OPERATIONAL." ? 700 : 400,
                }}
              >
                <span style={{ color: C.redDim, marginRight: 8 }}>›</span>
                {line}
                {i === lines.length - 1 && lines.length < BOOT_LINES.length && (
                  <span
                    style={{
                      animation: "cursor 0.7s step-end infinite",
                      marginLeft: 2,
                    }}
                  >
                    █
                  </span>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 10,
              color: C.muted,
              letterSpacing: "0.15em",
              marginBottom: 6,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>LOADING MODULES</span>
            <span style={{ color: C.red, fontWeight: 700 }}>{barW}%</span>
          </div>
          <div style={{ height: 4, background: C.border }}>
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg,${C.redDim},${C.red})`,
                width: `${barW}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "10px 28px",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9, color: C.border, letterSpacing: "0.15em" }}>
          VERIFAI FACT-CHECK BUREAU
        </span>
        <span style={{ fontSize: 9, color: C.border, letterSpacing: "0.15em" }}>
          POWERED BY GROK AI
        </span>
      </div>
    </div>
  );
}

// ── Page: Home ────────────────────────────────────────────
function HomePage({ onAnalyze, historyCount, onNav }) {
  const stats = [
    { n: "98.2%", label: "Detection Accuracy" },
    { n: "<2s", label: "Avg. Analysis Time" },
    { n: "50K+", label: "Articles Checked" },
    { n: "12", label: "Signal Categories" },
  ];
  const features = [
    {
      icon: "⚡",
      title: "Real-Time Analysis",
      desc: "Grok AI processes your article in seconds, returning a verdict with full signal breakdown.",
    },
    {
      icon: "🔬",
      title: "Deep NLP Pipeline",
      desc: "Tokenization, semantic coherence checks, and emotional manipulation detection built in.",
    },
    {
      icon: "📊",
      title: "Confidence Scoring",
      desc: "Every verdict comes with a percentage confidence and a dual real/fake probability score.",
    },
    {
      icon: "🚩",
      title: "Red Flag Detection",
      desc: "Explicit red flags are surfaced when fake content is detected — no black-box decisions.",
    },
  ];

  return (
    <div
      style={{
        background: C.bg,
        color: C.white,
        fontFamily: "'Georgia',serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar page="home" onNav={onNav} historyCount={historyCount} />
      <Ticker />

      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
          borderBottom: `1px solid ${C.border}`,
          padding: "64px 24px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle,#f5f0eb 1px,transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.red,
              padding: "4px 14px",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#fff",
                display: "inline-block",
                animation: "pulse 0.8s ease infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "#fff",
                fontFamily: "'Source Code Pro',monospace",
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              LIVE — POWERED BY GROK AI
            </span>
          </div>

          <div className="hero-title">
            Stop Sharing.
            <br />
            <span style={{ color: C.red }}>Start Verifying.</span>
          </div>

          <div
            style={{
              fontSize: 16,
              color: C.muted,
              lineHeight: 1.8,
              marginBottom: 36,
              fontStyle: "italic",
              maxWidth: 520,
              margin: "0 auto 36px",
            }}
          >
            Paste any news headline or article. Our AI fact-checker tells you if
            it's real — in seconds.
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={onAnalyze}
              style={{
                background: C.red,
                border: "none",
                color: "#fff",
                fontFamily: "'Source Code Pro',monospace",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "14px 32px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#b91c1c")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = C.red)}
            >
              ▶ ANALYZE AN ARTICLE
            </button>
            <button
              onClick={() => onNav("history")}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.muted,
                fontFamily: "'Source Code Pro',monospace",
                fontSize: 13,
                letterSpacing: "0.1em",
                padding: "14px 28px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = C.white;
                e.currentTarget.style.borderColor = C.muted;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              VIEW HISTORY
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="stats-grid" style={{ maxWidth: 860, margin: "0 auto" }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 900,
                  fontSize: 28,
                  color: C.red,
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: "0.12em",
                  marginTop: 6,
                  fontFamily: "'Source Code Pro',monospace",
                }}
              >
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 10,
              color: C.red,
              letterSpacing: "0.22em",
              fontFamily: "'Source Code Pro',monospace",
              marginBottom: 10,
            }}
          >
            — HOW IT WORKS —
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 28,
              color: C.white,
            }}
          >
            Three Steps to the Truth
          </div>
        </div>
        <div className="steps-grid">
          {[
            {
              n: "01",
              title: "Paste Your Article",
              desc: "Copy any news headline, paragraph, or full article and paste it into the analyzer.",
            },
            {
              n: "02",
              title: "AI Runs Analysis",
              desc: "Grok scans for linguistic signals, emotional manipulation, source coherence, and known patterns.",
            },
            {
              n: "03",
              title: "Get Your Verdict",
              desc: "Receive a REAL or FAKE verdict with confidence score, signals, and detailed red flags.",
            },
          ].map((s, i) => (
            <div key={i} className="step-card">
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: C.redDim,
                  lineHeight: 1,
                  marginBottom: 14,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: C.white,
                  marginBottom: 10,
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 10,
              color: C.red,
              letterSpacing: "0.22em",
              fontFamily: "'Source Code Pro',monospace",
              marginBottom: 10,
            }}
          >
            — FEATURES —
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 28,
              color: C.white,
            }}
          >
            What's Under the Hood
          </div>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.redDim}`,
                padding: "24px 22px",
                display: "flex",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: C.white,
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{ maxWidth: 860, margin: "52px auto 0", padding: "0 24px 64px" }}
      >
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${C.red}`,
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 26,
              color: C.white,
              marginBottom: 12,
            }}
          >
            Don't Spread What You Can't Verify.
          </div>
          <div
            style={{
              fontSize: 14,
              color: C.muted,
              marginBottom: 28,
              fontStyle: "italic",
            }}
          >
            Run a fact-check before you share. It takes less than 2 seconds.
          </div>
          <button
            onClick={onAnalyze}
            style={{
              background: C.red,
              border: "none",
              color: "#fff",
              fontFamily: "'Source Code Pro',monospace",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "14px 36px",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseOut={(e) => (e.currentTarget.style.background = C.red)}
          >
            ▶ START FACT-CHECKING NOW
          </button>
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "12px 28px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: C.border,
            fontFamily: "'Source Code Pro',monospace",
            letterSpacing: "0.15em",
          }}
        >
          © 2025 VERIFAI FACT-CHECK BUREAU
        </span>
        <span
          style={{
            fontSize: 9,
            color: C.border,
            fontFamily: "'Source Code Pro',monospace",
            letterSpacing: "0.15em",
          }}
        >
          POWERED BY GROK AI
        </span>
      </div>
    </div>
  );
}

// ── Shared: Shield ────────────────────────────────────────
function Shield({ verdict, confidence, size = 72 }) {
  const color =
    verdict === "REAL" ? C.verified : verdict === "FAKE" ? C.red : C.muted;
  const pct = Math.round(confidence * 100);
  const r = 20,
    circ = 2 * Math.PI * r,
    dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <path
        d="M36 6 L62 16 L62 38 C62 52 50 62 36 66 C22 62 10 52 10 38 L10 16 Z"
        fill={color + "18"}
        stroke={color}
        strokeWidth="2"
      />
      <circle
        cx="36"
        cy="38"
        r={r}
        stroke={color + "33"}
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="36"
        cy="38"
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="butt"
        transform="rotate(-90 36 38)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text
        x="36"
        y="44"
        textAnchor="middle"
        fill={color}
        fontSize="12"
        fontWeight="700"
        fontFamily="'Source Code Pro',monospace"
      >
        {verdict === null ? "?" : `${pct}%`}
      </text>
    </svg>
  );
}

// ── Shared: ConfidenceBar ─────────────────────────────────
function ConfidenceBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            fontFamily: "'Source Code Pro',monospace",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color,
            fontFamily: "'Source Code Pro',monospace",
          }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <div style={{ height: 5, background: C.border }}>
        <div
          style={{
            height: "100%",
            background: color,
            width: `${value * 100}%`,
            transition: "width 0.8s cubic-bezier(.22,.68,0,1.2)",
          }}
        />
      </div>
    </div>
  );
}

// ── Page: Analyze loading ─────────────────────────────────
function AnalysisLoading() {
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const [tick, setTick] = useState(0);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)),
      600,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      const target = ((step + 1) / ANALYSIS_STEPS.length) * 100;
      setProg((p) => {
        const next = p + (target - p) * 0.15;
        return target - next < 0.1 ? target : next;
      });
    }, 40);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setScanY((y) => (y + 3) % 620), 16);
    return () => clearInterval(t);
  }, []);

  const circ = 2 * Math.PI * 24;
  return (
    <div
      style={{
        background: C.bg,
        minHeight: 600,
        color: C.white,
        fontFamily: "'Source Code Pro',monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          backgroundImage:
            "radial-gradient(circle,#f5f0eb 1px,transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          top: scanY,
          background: "rgba(220,38,38,0.13)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 600,
          padding: "40px 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              fill="none"
              style={{ display: "block", margin: "0 auto 16px" }}
            >
              <circle
                cx="44"
                cy="44"
                r="24"
                stroke={C.border}
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="44"
                cy="44"
                r="24"
                stroke={C.red}
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${(prog / 100) * circ} ${circ}`}
                strokeLinecap="butt"
                transform="rotate(-90 44 44)"
                style={{ transition: "stroke-dasharray 0.08s linear" }}
              />
              <text
                x="44"
                y="49"
                textAnchor="middle"
                fill={C.white}
                fontSize="13"
                fontWeight="700"
                fontFamily="'Source Code Pro',monospace"
              >
                {Math.round(prog)}%
              </text>
            </svg>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 28,
                color: C.white,
                letterSpacing: "0.04em",
              }}
            >
              VERI<span style={{ color: C.red }}>FAI</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                letterSpacing: "0.2em",
                marginTop: 4,
              }}
            >
              ANALYZING CONTENT
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            {ANALYSIS_STEPS.map((s, i) => {
              const done = i < step,
                active = i === step;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 0",
                    borderBottom: `1px solid ${C.border}`,
                    opacity: i > step ? 0.12 : 1,
                    transition: "opacity 0.4s",
                    animation: active ? "fadeL 0.3s ease both" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {done ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle cx="7" cy="7" r="7" fill={C.verified + "33"} />
                        <path
                          d="M4 7l2 2 4-4"
                          stroke={C.verified}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : active ? (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          border: `1.5px solid ${C.red}`,
                          borderTopColor: "transparent",
                          animation: "spin 0.65s linear infinite",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: C.border,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: done ? C.muted : active ? C.white : C.border,
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {s.label}
                    </div>
                    {active && (
                      <div
                        style={{ fontSize: 10, color: C.muted, marginTop: 2 }}
                      >
                        {s.detail}
                      </div>
                    )}
                  </div>
                  {done && (
                    <span
                      style={{
                        fontSize: 10,
                        color: C.verified,
                        letterSpacing: "0.08em",
                      }}
                    >
                      DONE
                    </span>
                  )}
                  {active && (
                    <span
                      style={{
                        fontSize: 13,
                        color: C.red,
                        animation: "blink 0.9s step-end infinite",
                      }}
                    >
                      ▌
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ height: 3, background: C.border }}>
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg,${C.redDim},${C.red})`,
                width: `${prog}%`,
                transition: "width 0.08s linear",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span
              style={{ fontSize: 10, color: C.redDim, letterSpacing: "0.12em" }}
            >
              PROCESSING{".".repeat((tick % 3) + 1)}
            </span>
            <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>
              {Math.round(prog)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared: HistoryItem ───────────────────────────────────
function HistoryItem({ item, onClick }) {
  const color =
    item.verdict === "REAL"
      ? C.verified
      : item.verdict === "FAKE"
        ? C.red
        : C.muted;
  return (
    <button
      onClick={() => onClick(item)}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 0",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ width: 3, height: 36, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontSize: 13,
            color: C.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "Georgia,serif",
            lineHeight: 1.5,
          }}
        >
          {item.text.slice(0, 80)}
          {item.text.length > 80 ? "…" : ""}
        </div>
        <div
          style={{
            fontSize: 10,
            color: C.border,
            fontFamily: "'Source Code Pro',monospace",
            marginTop: 3,
            letterSpacing: "0.06em",
          }}
        >
          {new Date(item.ts).toLocaleDateString()} ·{" "}
          {Math.round(item.confidence * 100)}% confidence
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color,
          fontFamily: "'Source Code Pro',monospace",
          flexShrink: 0,
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        {item.verdict}
      </span>
    </button>
  );
}

// ── Page: Analyze ─────────────────────────────────────────
function AnalyzePage({ history, setHistory, onNav, selectedArticle }) {
  const [text, setText] = useState(selectedArticle ? selectedArticle.text : "");
  const [result, setResult] = useState(selectedArticle ? selectedArticle : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analyze");

  async function analyze() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    const startTime = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      const parsed = JSON.parse(data.result);

      // Keep loading screen active long enough for simulated steps & progress bar to fully complete
      const elapsed = Date.now() - startTime;
      const minDuration = 3800;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setResult(parsed);

      const newH = [
        { text, ...parsed, ts: Date.now() },
        ...history.filter((h) => h.text !== text),
      ];
      setHistory(newH);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const vc =
    result?.verdict === "REAL"
      ? C.verified
      : result?.verdict === "FAKE"
        ? C.red
        : C.muted;

  return (
    <div
      style={{
        background: C.bg,
        color: C.white,
        fontFamily: "'Georgia',serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        .run-btn { background:${C.red}; border:none; color:#fff; font-family:'Source Code Pro',monospace; font-size:13px; font-weight:700; letter-spacing:0.12em; padding:13px 28px; cursor:pointer; transition:background 0.15s; }
        .run-btn:hover:not(:disabled) { background:#b91c1c; }
        .run-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .sig-tag  { display:inline-block; background:${C.card}; border:1px solid ${C.border}; padding:4px 10px; font-size:11px; color:${C.muted}; margin:3px; font-family:'Source Code Pro',monospace; }
        .flag-tag { display:inline-block; background:#2d0a0a; border:1px solid ${C.redDim}; padding:4px 10px; font-size:11px; color:#fca5a5; margin:3px; font-family:'Source Code Pro',monospace; }
        .atab { background:transparent; border:none; cursor:pointer; padding:8px 20px; font-family:'Source Code Pro',monospace; font-size:11px; letter-spacing:0.12em; border-bottom:2px solid transparent; transition:all 0.2s; }
        .atab.on  { color:${C.white}; border-bottom-color:${C.red}; }
        .atab.off { color:${C.muted}; }
        .atab.off:hover { color:${C.white}; }
      `}</style>

      <NavBar page="analyze" onNav={onNav} historyCount={history.length} />
      <Ticker
        items={[
          "FACT-CHECK BUREAU — SUBMIT YOUR ARTICLE",
          "AI ANALYSIS READY",
          "LIVE VERDICT IN UNDER 2 SECONDS",
          "POWERED BY GROK AI",
          "MISINFORMATION STOPS HERE",
        ]}
      />

      {loading ? (
        <AnalysisLoading />
      ) : (
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            width: "100%",
            padding: "28px 24px",
            flex: 1,
          }}
        >
          {/* Page header */}
          <div
            style={{
              marginBottom: 24,
              paddingBottom: 18,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 26,
                color: C.white,
                marginBottom: 4,
              }}
            >
              Article <span style={{ color: C.red }}>Analyzer</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                fontFamily: "'Source Code Pro',monospace",
                letterSpacing: "0.08em",
              }}
            >
              Submit any news text. VERIFAI returns a verdict in seconds.
            </div>
          </div>

          {/* Sub-tabs */}
          <div
            style={{
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 24,
              display: "flex",
            }}
          >
            <button
              className={`atab ${tab === "analyze" ? "on" : "off"}`}
              onClick={() => setTab("analyze")}
            >
              ANALYZER
            </button>
            <button
              className={`atab ${tab === "history" ? "on" : "off"}`}
              onClick={() => setTab("history")}
            >
              HISTORY{history.length > 0 ? ` (${history.length})` : ""}
            </button>
          </div>

          {tab === "analyze" && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    letterSpacing: "0.2em",
                    marginBottom: 8,
                    fontFamily: "'Source Code Pro',monospace",
                  }}
                >
                  SUBMIT ARTICLE FOR VERIFICATION
                </div>
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.redDim}`,
                  }}
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste a news headline or full article here..."
                    rows={5}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: C.white,
                      fontFamily: "Georgia,serif",
                      fontSize: 14,
                      padding: "16px",
                      resize: "vertical",
                      lineHeight: 1.8,
                      minHeight: 120,
                    }}
                  />
                  <div
                    style={{
                      padding: "8px 14px",
                      borderTop: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: C.muted,
                        fontFamily: "'Source Code Pro',monospace",
                      }}
                    >
                      {text.length} chars /{" "}
                      {text.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    {text && (
                      <button
                        onClick={() => {
                          setText("");
                          setResult(null);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: C.muted,
                          cursor: "pointer",
                          fontSize: 11,
                          fontFamily: "'Source Code Pro',monospace",
                        }}
                      >
                        CLEAR ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <button
                  className="run-btn"
                  onClick={analyze}
                  disabled={!text.trim()}
                >
                  ▶ RUN FACT-CHECK
                </button>
                {error && (
                  <span
                    style={{
                      color: C.red,
                      fontSize: 12,
                      fontFamily: "'Source Code Pro',monospace",
                    }}
                  >
                    {error}
                  </span>
                )}
              </div>

              {result && (
                <div className="fade-in">
                  <div
                    style={{
                      "--vc-color": vc,
                      "--vc-border": `${vc}44`,
                    }}
                    className="result-header"
                  >
                    <Shield
                      verdict={result.verdict}
                      confidence={result.confidence}
                      size={72}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Playfair Display',serif",
                            fontWeight: 900,
                            fontSize: 28,
                            color: vc,
                          }}
                        >
                          {result.verdict === "FAKE"
                            ? "⚠ FAKE NEWS"
                            : "✓ VERIFIED"}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: C.muted,
                            fontFamily: "'Source Code Pro',monospace",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {Math.round(result.confidence * 100)}% CONFIDENCE
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: C.muted,
                          margin: 0,
                          lineHeight: 1.7,
                          fontStyle: "italic",
                        }}
                      >
                        {result.summary}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      padding: "18px 22px",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: C.muted,
                        letterSpacing: "0.18em",
                        marginBottom: 14,
                        fontFamily: "'Source Code Pro',monospace",
                      }}
                    >
                      SCORE BREAKDOWN
                    </div>
                    <ConfidenceBar
                      label="VERIFIED / REAL"
                      value={result.real_score}
                      color={C.verified}
                    />
                    <ConfidenceBar
                      label="FAKE / MISINFORMATION"
                      value={result.fake_score}
                      color={C.red}
                    />
                  </div>
                  {result.signals?.length > 0 && (
                    <div
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        padding: "18px 22px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          letterSpacing: "0.18em",
                          marginBottom: 10,
                          fontFamily: "'Source Code Pro',monospace",
                        }}
                      >
                        ANALYSIS SIGNALS
                      </div>
                      {result.signals.map((s, i) => (
                        <span key={i} className="sig-tag">
                          → {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.red_flags?.length > 0 && (
                    <div
                      style={{
                        background: "#1a0a0a",
                        border: `1px solid ${C.redDim}`,
                        borderLeft: `3px solid ${C.red}`,
                        padding: "18px 22px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.red,
                          letterSpacing: "0.18em",
                          marginBottom: 10,
                          fontFamily: "'Source Code Pro',monospace",
                        }}
                      >
                        ⚠ RED FLAGS DETECTED
                      </div>
                      {result.red_flags.map((f, i) => (
                        <span key={i} className="flag-tag">
                          ✕ {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!result && (
                <div style={{ marginTop: 32 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                      letterSpacing: "0.18em",
                      marginBottom: 14,
                      fontFamily: "'Source Code Pro',monospace",
                    }}
                  >
                    — SAMPLE HEADLINES —
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {[
                      "Scientists discover new antibiotic that kills drug-resistant bacteria in lab tests",
                      "Government secretly adding mind control chemicals to tap water, leaked documents reveal",
                      "Stock markets fell sharply on Tuesday amid rising inflation concerns",
                    ].map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setText(ex)}
                        style={{
                          background: C.card,
                          border: `1px solid ${C.border}`,
                          borderLeft: `2px solid ${C.redDim}`,
                          padding: "10px 14px",
                          textAlign: "left",
                          color: C.muted,
                          fontSize: 13,
                          fontFamily: "Georgia,serif",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          lineHeight: 1.5,
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = C.white;
                          e.currentTarget.style.borderLeftColor = C.red;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = C.muted;
                          e.currentTarget.style.borderLeftColor = C.redDim;
                        }}
                      >
                        <span
                          style={{
                            color: C.red,
                            marginRight: 10,
                            fontFamily: "'Source Code Pro',monospace",
                            fontSize: 11,
                          }}
                        >
                          {i + 1}.
                        </span>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "history" && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: "0.18em",
                  marginBottom: 16,
                  fontFamily: "'Source Code Pro',monospace",
                }}
              >
                ANALYSIS HISTORY — {history.length} ENTRIES
              </div>
              {history.length === 0 ? (
                <div
                  style={{
                    color: C.muted,
                    fontSize: 14,
                    padding: "48px 0",
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  No analyses yet. Submit your first article.
                </div>
              ) : (
                <>
                  {history.map((item, i) => (
                    <HistoryItem
                      key={i}
                      item={item}
                      onClick={(h) => {
                        setText(h.text);
                        setResult(h);
                        setTab("analyze");
                      }}
                    />
                  ))}
                  <button
                    onClick={() => setHistory([])}
                    style={{
                      marginTop: 16,
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      color: C.muted,
                      fontFamily: "'Source Code Pro',monospace",
                      fontSize: 11,
                      padding: "8px 16px",
                      cursor: "pointer",
                      letterSpacing: "0.1em",
                    }}
                  >
                    CLEAR HISTORY
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page: History (standalone) ────────────────────────────
function HistoryPage({ history, setHistory, onNav, onLoadArticle }) {
  return (
    <div
      style={{
        background: C.bg,
        color: C.white,
        fontFamily: "'Georgia',serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar page="history" onNav={onNav} historyCount={history.length} />
      <Ticker />
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          padding: "32px 24px",
          flex: 1,
        }}
      >
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 26,
              color: C.white,
              marginBottom: 4,
            }}
          >
            Analysis <span style={{ color: C.red }}>History</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontFamily: "'Source Code Pro',monospace",
              letterSpacing: "0.08em",
            }}
          >
            Your recent fact-checks — click any to reload.
          </div>
        </div>
        {history.length === 0 ? (
          <div
            style={{
              color: C.muted,
              fontSize: 14,
              padding: "64px 0",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            No analyses yet.{" "}
            <button
              onClick={() => onNav("analyze")}
              style={{
                background: "none",
                border: "none",
                color: C.red,
                cursor: "pointer",
                fontFamily: "Georgia,serif",
                fontSize: 14,
                fontStyle: "italic",
                textDecoration: "underline",
              }}
            >
              Analyze your first article →
            </button>
          </div>
        ) : (
          <>
            {history.map((item, i) => (
              <HistoryItem
                key={i}
                item={item}
                onClick={onLoadArticle}
              />
            ))}
            <button
              onClick={() => setHistory([])}
              style={{
                marginTop: 20,
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.muted,
                fontFamily: "'Source Code Pro',monospace",
                fontSize: 11,
                padding: "8px 16px",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              CLEAR HISTORY
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────
function loadH() {
  try {
    return JSON.parse(localStorage.getItem("fnds_v2") || "[]");
  } catch {
    return [];
  }
}
function saveH(h) {
  try {
    localStorage.setItem("fnds_v2", JSON.stringify(h.slice(0, 50)));
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

export default function App() {
  const [page, setPage] = useState("splash");
  const [history, setHistory] = useState(() => loadH());
  const [selectedArticle, setSelectedArticle] = useState(null);

  const handleSetHistory = useCallback((h) => {
    setHistory(h);
    saveH(h);
  }, []);

  const nav = useCallback((p) => {
    setSelectedArticle(null);
    setPage(p);
  }, []);

  const loadArticle = useCallback((item) => {
    setSelectedArticle(item);
    setPage("analyze");
  }, []);

  const handleDone = useCallback(() => {
    setPage("home");
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {page === "splash" && <SplashScreen onDone={handleDone} />}
      {page === "home" && (
        <HomePage
          onAnalyze={() => setPage("analyze")}
          historyCount={history.length}
          onNav={nav}
        />
      )}
      {page === "analyze" && (
        <AnalyzePage
          history={history}
          setHistory={handleSetHistory}
          onNav={nav}
          selectedArticle={selectedArticle}
        />
      )}
      {page === "history" && (
        <HistoryPage
          history={history}
          setHistory={handleSetHistory}
          onNav={nav}
          onLoadArticle={loadArticle}
        />
      )}
    </>
  );
}
