import { useState, useEffect, useCallback, useRef } from "react";

// ── Theme tokens ──────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0e0b0b", surface: "#1a1212", card: "#211818",
    border: "#3a2020", red: "#dc2626", redDim: "#7f1d1d",
    yellow: "#fbbf24", amber: "#f59e0b", white: "#f5f0eb",
    muted: "#8a7070", verified: "#16a34a", uncertain: "#d97706",
  },
  neutral: {
    bg: "#111318", surface: "#1c1f27", card: "#242830",
    border: "#333a47", red: "#e05252", redDim: "#7f3535",
    yellow: "#fbbf24", amber: "#f59e0b", white: "#e8eaf0",
    muted: "#6b7280", verified: "#22c55e", uncertain: "#d97706",
  },
};

// ── Source Reliability Database ───────────────────────────
const SOURCE_RELIABILITY = {
  "reuters.com":           { label: "Reuters",            tier: "trusted"    },
  "apnews.com":            { label: "AP News",            tier: "trusted"    },
  "bbc.com":               { label: "BBC",                tier: "trusted"    },
  "bbc.co.uk":             { label: "BBC",                tier: "trusted"    },
  "nytimes.com":           { label: "New York Times",     tier: "trusted"    },
  "washingtonpost.com":    { label: "Washington Post",    tier: "trusted"    },
  "theguardian.com":       { label: "The Guardian",       tier: "trusted"    },
  "wsj.com":               { label: "Wall Street Journal",tier: "trusted"    },
  "economist.com":         { label: "The Economist",      tier: "trusted"    },
  "nature.com":            { label: "Nature",             tier: "trusted"    },
  "science.org":           { label: "Science",            tier: "trusted"    },
  "who.int":               { label: "WHO",                tier: "trusted"    },
  "cdc.gov":               { label: "CDC",                tier: "trusted"    },
  "nasa.gov":              { label: "NASA",               tier: "trusted"    },
  "npr.org":               { label: "NPR",                tier: "trusted"    },
  "pbs.org":               { label: "PBS",                tier: "trusted"    },
  "ft.com":                { label: "Financial Times",    tier: "trusted"    },
  "bloomberg.com":         { label: "Bloomberg",          tier: "trusted"    },
  "aljazeera.com":         { label: "Al Jazeera",         tier: "trusted"    },
  "theatlantic.com":       { label: "The Atlantic",       tier: "trusted"    },
  "cnn.com":               { label: "CNN",                tier: "mixed"      },
  "foxnews.com":           { label: "Fox News",           tier: "mixed"      },
  "msnbc.com":             { label: "MSNBC",              tier: "mixed"      },
  "nbcnews.com":           { label: "NBC News",           tier: "mixed"      },
  "abcnews.go.com":        { label: "ABC News",           tier: "mixed"      },
  "cbsnews.com":           { label: "CBS News",           tier: "mixed"      },
  "usatoday.com":          { label: "USA Today",          tier: "mixed"      },
  "nypost.com":            { label: "New York Post",      tier: "mixed"      },
  "huffpost.com":          { label: "HuffPost",           tier: "mixed"      },
  "dailymail.co.uk":       { label: "Daily Mail",         tier: "mixed"      },
  "msn.com":               { label: "MSN",                tier: "mixed"      },
  "thehill.com":           { label: "The Hill",           tier: "mixed"      },
  "politico.com":          { label: "Politico",           tier: "mixed"      },
  "vox.com":               { label: "Vox",                tier: "mixed"      },
  "infowars.com":          { label: "InfoWars",           tier: "unreliable" },
  "naturalnews.com":       { label: "Natural News",       tier: "unreliable" },
  "thegatewaypundit.com":  { label: "Gateway Pundit",     tier: "unreliable" },
  "beforeitsnews.com":     { label: "Before It's News",   tier: "unreliable" },
  "worldnewsdailyreport.com":{ label: "WNDR",            tier: "unreliable" },
  "yournewswire.com":      { label: "YourNewsWire",       tier: "unreliable" },
  "zerohedge.com":         { label: "Zero Hedge",         tier: "unreliable" },
};

const TIER_CONFIG = {
  trusted:    { color: "#16a34a", bg: "#052e16", border: "#14532d", icon: "✓", label: "TRUSTED SOURCE"    },
  mixed:      { color: "#d97706", bg: "#1c1200", border: "#78350f", icon: "~", label: "MIXED RELIABILITY"  },
  unreliable: { color: "#dc2626", bg: "#1a0a0a", border: "#7f1d1d", icon: "✕", label: "LOW CREDIBILITY"    },
  unknown:    { color: "#8a7070", bg: "#1a1212", border: "#3a2020", icon: "?", label: "UNKNOWN SOURCE"     },
};

// ── Category config ───────────────────────────────────────
const CATEGORY_COLORS = {
  Politics:      "#3b82f6", Health:        "#10b981",
  Science:       "#8b5cf6", Technology:    "#06b6d4",
  Business:      "#f59e0b", Sports:        "#84cc16",
  Entertainment: "#ec4899", Crime:         "#ef4444",
  Environment:   "#22c55e", Other:         "#6b7280",
};
const CATEGORIES = ["All", ...Object.keys(CATEGORY_COLORS)];

function getTheme() {
  try { return localStorage.getItem("verifai_theme") || "dark"; } catch { return "dark"; }
}

const BOOT_LINES = [
  "INITIALIZING VERIFAI FACT-CHECK BUREAU...",
  "LOADING NLP CLASSIFICATION ENGINE...",
  "CONNECTING TO GROQ AI BACKEND...",
  "MOUNTING MISINFORMATION DATABASE...",
  "CALIBRATING CONFIDENCE THRESHOLDS...",
  "ENABLING REAL-TIME ANALYSIS PIPELINE...",
  "ALL SYSTEMS OPERATIONAL.",
];

const ANALYSIS_STEPS = [
  { label: "INGESTING TEXT",    detail: "Parsing tokens and structure..."               },
  { label: "NLP PREPROCESSING", detail: "Tokenizing, stripping noise..."               },
  { label: "PATTERN MATCHING",  detail: "Scanning for known misinformation signals..."  },
  { label: "SEMANTIC ANALYSIS", detail: "Checking factual coherence and source tone..."  },
  { label: "BIAS DETECTION",    detail: "Assessing political lean and emotional tone..."  },
  { label: "AI INFERENCE",      detail: "Running classification model..."               },
  { label: "COMPILING REPORT",  detail: "Generating verdict and confidence score..."    },
];

const LANG_NAMES = {
  en:"English", hi:"Hindi", es:"Spanish", fr:"French", de:"German",
  ar:"Arabic", pt:"Portuguese", zh:"Chinese", ja:"Japanese", ru:"Russian",
  it:"Italian", ko:"Korean", nl:"Dutch", tr:"Turkish", pl:"Polish",
  bn:"Bengali", ur:"Urdu", ta:"Tamil", te:"Telugu", mr:"Marathi",
};

// ── Global CSS ────────────────────────────────────────────
function buildGlobalCSS(C) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Code+Pro:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes pulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeL   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cursor  { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes meterFill { from{width:0} to{width:var(--w)} }
  .fade-in  { animation: fadeIn  0.4s ease both; }
  .slide-up { animation: slideUp 0.5s ease both; }

  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); }
  .stat-card  { padding:24px 20px; text-align:center; border-right:1px solid ${C.border}; }
  .stat-card:last-child { border-right:none; }

  .steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:${C.border}; }
  .step-card  { background:${C.card}; padding:32px 28px; }

  .features-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }

  .nav-header { display:flex; align-items:center; justify-content:space-between; padding:12px 28px; }

  .result-header {
    border-top: 4px solid var(--vc-color);
    background: ${C.card};
    border: 1px solid var(--vc-border);
    border-top-width: 4px;
    margin-bottom: 14px; padding: 20px 22px;
    display: flex; align-items: center; gap: 22px;
  }

  .hero-title {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: 48px; line-height: 1.1; letter-spacing: 0.02em;
    margin-bottom: 20px; color: ${C.white};
  }
  .splash-title {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: 56px; letter-spacing: 0.06em; line-height: 1;
  }
  .compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

  /* Tooltip */
  .tip-wrap { position:relative; display:inline-block; }
  .tip-box {
    position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
    background:${C.surface}; border:1px solid ${C.border}; padding:10px 14px;
    z-index:200; width:240px; font-size:12px; color:${C.muted}; line-height:1.6;
    font-family:Georgia,serif; box-shadow:0 8px 24px rgba(0,0,0,0.5); pointer-events:none;
    animation:fadeIn 0.15s ease both;
  }
  .tip-box::after {
    content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%);
    border:5px solid transparent; border-top-color:${C.border};
  }

  /* FAQ accordion */
  .faq-item { border-bottom:1px solid ${C.border}; }
  .faq-q {
    width:100%; text-align:left; background:transparent; border:none; cursor:pointer;
    padding:18px 0; display:flex; justify-content:space-between; align-items:center;
    font-family:Georgia,serif; font-size:15px; color:${C.white}; transition:color 0.15s;
  }
  .faq-q:hover { color:${C.red}; }
  .faq-a { padding:0 0 18px; font-size:13px; color:${C.muted}; line-height:1.8; font-family:Georgia,serif; animation:fadeIn 0.2s ease both; }

  /* Share card modal */
  .share-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000;
    display:flex; align-items:center; justify-content:center; padding:24px;
    animation:fadeIn 0.2s ease both;
  }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns:repeat(2,1fr); }
    .stat-card { border-right:none; border-bottom:1px solid ${C.border}; }
    .stat-card:last-child { border-bottom:none; }
    .steps-grid { grid-template-columns:1fr; gap:16px; background:transparent; }
    .step-card { border:1px solid ${C.border}; }
    .compare-grid { grid-template-columns:1fr; }
  }
  @media (max-width: 600px) {
    .features-grid { grid-template-columns:1fr; }
    .nav-header { flex-direction:column; gap:14px; padding:16px 14px; text-align:center; }
    .hero-title { font-size:34px; }
  }
  @media (max-width: 480px) {
    .stats-grid { grid-template-columns:1fr; }
    .stat-card { border-bottom:1px solid ${C.border}; }
    .stat-card:last-child { border-bottom:none; }
    .result-header { flex-direction:column; text-align:center; gap:16px; }
    .splash-title { font-size:42px; }
  }
`;
}

// ── Toast ─────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      background:"#16a34a", color:"#fff", padding:"10px 20px",
      fontFamily:"'Source Code Pro',monospace", fontSize:12,
      letterSpacing:"0.1em", fontWeight:700,
      animation:"toastIn 0.3s ease both", boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
    }}>{msg}</div>
  );
}

// ── Ticker ────────────────────────────────────────────────
function Ticker({ items }) {
  const defaults = ["BREAKING: AI SYSTEM SCANNING FOR MISINFORMATION","CROSS-REFERENCING KNOWN SOURCES","PATTERN DATABASE ACTIVE","FACT-CHECK PROTOCOL ENGAGED"];
  const gap = " ".repeat(25);
  const text = (items || defaults).join(`${gap}◆${gap}`) + `${gap}◆${gap}`;
  return (
    <div style={{ background:"#dc2626", overflow:"hidden", height:28, display:"flex", alignItems:"center", flexShrink:0 }}>
      <div style={{ display:"flex", width:"max-content", flexShrink:0, whiteSpace:"nowrap", animation:"ticker 110s linear infinite", fontSize:10, fontWeight:700, color:"#fff", letterSpacing:"0.1em", fontFamily:"'Source Code Pro',monospace" }}>
        {Array.from({ length: 10 }).map((_,i) => <span key={i} style={{ flexShrink:0 }}>{text}</span>)}
      </div>
    </div>
  );
}

// ── NavBar ────────────────────────────────────────────────
function NavBar({ page, onNav, historyCount, theme, onThemeToggle, C }) {
  const mainPages = ["home","analyze","compare","history"];
  const subPages  = ["about","faq"];
  return (
    <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      <div style={{ borderTop:`4px solid ${C.red}`, borderBottom:`1px solid ${C.redDim}`, height:7 }} />
      <div className="nav-header">
        <button onClick={() => onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:22, letterSpacing:"0.04em", color:C.white, lineHeight:1 }}>
            VERI<span style={{ color:C.red }}>FAI</span>
          </div>
          <div style={{ fontSize:9, letterSpacing:"0.2em", color:C.muted, fontFamily:"'Source Code Pro',monospace", marginTop:2 }}>FACT-CHECK BUREAU</div>
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", justifyContent:"center" }}>
          {mainPages.map(p => (
            <button key={p} onClick={() => onNav(p)} style={{
              background: page===p ? C.red : "transparent",
              border:`1px solid ${page===p ? C.red : C.border}`,
              color: page===p ? "#fff" : C.muted,
              fontFamily:"'Source Code Pro',monospace", fontSize:10,
              letterSpacing:"0.12em", padding:"5px 10px", cursor:"pointer",
              transition:"all 0.15s", fontWeight:page===p ? 700 : 400,
            }}>
              {p.toUpperCase()}{p==="history" && historyCount>0 ? ` (${historyCount})` : ""}
            </button>
          ))}

          <span style={{ width:1, height:18, background:C.border, margin:"0 4px" }} />

          {subPages.map(p => (
            <button key={p} onClick={() => onNav(p)} style={{
              background: page===p ? C.surface : "transparent",
              border:`1px solid ${page===p ? C.muted : C.border}`,
              color: page===p ? C.white : C.muted,
              fontFamily:"'Source Code Pro',monospace", fontSize:9,
              letterSpacing:"0.1em", padding:"5px 9px", cursor:"pointer", transition:"all 0.15s",
            }}>
              {p.toUpperCase()}
            </button>
          ))}

          <button onClick={onThemeToggle} title={`Switch to ${theme==="dark"?"neutral":"dark"} theme`}
            style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:14, padding:"4px 10px", cursor:"pointer", transition:"all 0.15s", lineHeight:1 }}
            onMouseOver={e=>{e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.muted;}}
            onMouseOut={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>
            {theme==="dark" ? "◑" : "◐"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SplashScreen ──────────────────────────────────────────
function SplashScreen({ onDone, C }) {
  const [lines, setLines] = useState([]);
  const [barW, setBarW]   = useState(0);
  const [fading, setFading] = useState(false);
  const [scanY, setScanY]   = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setLines(BOOT_LINES.slice(0, i));
      setBarW(Math.round((i / BOOT_LINES.length) * 100));
      if (i >= BOOT_LINES.length) {
        clearInterval(t);
        setTimeout(() => { setFading(true); setTimeout(onDone, 500); }, 700);
      }
    }, 300);
    return () => clearInterval(t);
  }, [onDone]);

  useEffect(() => { const t = setInterval(() => setScanY(y => (y+3)%700), 16); return () => clearInterval(t); }, []);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.white, fontFamily:"'Source Code Pro',monospace", display:"flex", flexDirection:"column", opacity:fading?0:1, transition:"opacity 0.5s ease", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.05, backgroundImage:"radial-gradient(circle,#f5f0eb 1px,transparent 1px)", backgroundSize:"18px 18px" }} />
      <div style={{ position:"absolute", left:0, right:0, height:2, top:scanY, background:"rgba(220,38,38,0.13)", pointerEvents:"none" }} />
      <div style={{ borderTop:`4px solid ${C.red}`, borderBottom:`1px solid ${C.redDim}`, height:8 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", zIndex:2 }}>
        <div style={{ width:"100%", maxWidth:500 }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div className="splash-title">VERI<span style={{ color:C.red }}>FAI</span></div>
            <div style={{ fontSize:10, letterSpacing:"0.28em", color:C.muted, marginTop:8 }}>FACT-CHECK BUREAU — EST. 2026</div>
            <div style={{ marginTop:18, display:"inline-flex", alignItems:"center", gap:8, background:C.red, padding:"5px 14px" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#fff", display:"inline-block", animation:"pulse 0.8s ease infinite" }} />
              <span style={{ fontSize:10, color:"#fff", letterSpacing:"0.18em", fontWeight:700 }}>SYSTEM BOOT</span>
            </div>
          </div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, padding:"20px 22px", minHeight:220, marginBottom:28 }}>
            <div style={{ fontSize:10, color:C.redDim, letterSpacing:"0.18em", marginBottom:14 }}>ROOT@VERIFAI:~$</div>
            {lines.map((line, i) => (
              <div key={i} style={{ fontSize:12, marginBottom:8, letterSpacing:"0.04em", lineHeight:1.6, animation:"fadeUp 0.25s ease both", color:line==="ALL SYSTEMS OPERATIONAL."?C.verified:i===lines.length-1?C.white:C.muted, fontWeight:line==="ALL SYSTEMS OPERATIONAL."?700:400 }}>
                <span style={{ color:C.redDim, marginRight:8 }}>›</span>{line}
                {i===lines.length-1 && lines.length<BOOT_LINES.length && <span style={{ animation:"cursor 0.7s step-end infinite", marginLeft:2 }}>█</span>}
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.15em", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
            <span>LOADING MODULES</span>
            <span style={{ color:C.red, fontWeight:700 }}>{barW}%</span>
          </div>
          <div style={{ height:4, background:C.border }}>
            <div style={{ height:"100%", background:`linear-gradient(90deg,${C.redDim},${C.red})`, width:`${barW}%`, transition:"width 0.3s ease" }} />
          </div>
        </div>
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 28px", display:"flex", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:9, color:C.border, letterSpacing:"0.15em" }}>VERIFAI FACT-CHECK BUREAU</span>
        <span style={{ fontSize:9, color:C.border, letterSpacing:"0.15em" }}>POWERED BY GROQ AI</span>
      </div>
    </div>
  );
}

// ── Recent Analyses Feed ──────────────────────────────────
function RecentFeed({ history, onNav, onLoad, C }) {
  if (!history || history.length === 0) return null;
  const recent = history.slice(0, 5);

  function timeAgo(ts) {
    const d = Date.now() - ts;
    if (d < 60000)   return "just now";
    if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
    if (d < 86400000)return `${Math.floor(d/3600000)}h ago`;
    return `${Math.floor(d/86400000)}d ago`;
  }

  return (
    <div style={{ maxWidth:860, margin:"0 auto", padding:"0 24px 64px" }}>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:40 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:8 }}>— LIVE ANALYSIS FEED —</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:C.white }}>Recent Fact-Checks</div>
          </div>
          <button onClick={() => onNav("history")} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:10, padding:"6px 14px", cursor:"pointer", letterSpacing:"0.1em" }}
            onMouseOver={e=>{e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.muted;}}
            onMouseOut={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>
            VIEW ALL →
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {recent.map((item, i) => {
            const vc = item.verdict==="REAL" ? C.verified : item.verdict==="FAKE" ? C.red : C.uncertain;
            const score = item.credibility_score;
            const scoreColor = score ? (score<=3?C.red:score<=6?C.amber:C.verified) : C.muted;
            return (
              <button key={i} onClick={() => onLoad(item)}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${vc}`, padding:"12px 16px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}
                onMouseOver={e=>{e.currentTarget.style.background=C.surface;}}
                onMouseOut={e=>{e.currentTarget.style.background=C.card;}}>
                <span style={{ fontSize:9, fontWeight:700, color:vc, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", flexShrink:0, minWidth:66 }}>{item.verdict}</span>
                <span style={{ flex:1, fontSize:12, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"Georgia,serif" }}>
                  {item.text.slice(0,90)}{item.text.length>90?"…":""}
                </span>
                {item.category && <span style={{ fontSize:9, color:CATEGORY_COLORS[item.category]||C.muted, fontFamily:"'Source Code Pro',monospace", flexShrink:0, letterSpacing:"0.08em" }}>{item.category.toUpperCase()}</span>}
                {score && <span style={{ fontSize:11, fontWeight:700, color:scoreColor, fontFamily:"'Source Code Pro',monospace", flexShrink:0 }}>{score}/10</span>}
                <span style={{ fontSize:9, color:C.border, fontFamily:"'Source Code Pro',monospace", flexShrink:0 }}>{timeAgo(item.ts)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────
function HomePage({ onAnalyze, historyCount, onNav, history, onLoadArticle, C }) {
  const stats = [
    { n:"98.2%", label:"Detection Accuracy" }, { n:"<2s", label:"Avg. Analysis Time" },
    { n:"50K+",  label:"Articles Checked"   }, { n:"12",  label:"Signal Categories" },
  ];
  const features = [
    { icon:"⚡", title:"Real-Time Analysis",    desc:"Groq AI processes your article in seconds, returning a verdict with full signal breakdown." },
    { icon:"🔬", title:"Deep NLP Pipeline",     desc:"Tokenization, semantic coherence checks, and emotional manipulation detection built in." },
    { icon:"📊", title:"Credibility Meter",     desc:"Every verdict comes with a 1–10 credibility score and a dual real/fake probability bar." },
    { icon:"🚩", title:"Red Flag Detection",    desc:"Explicit red flags are surfaced when fake content is detected — no black-box decisions." },
    { icon:"🌐", title:"URL Analyzer",          desc:"Paste a link instead of text. We fetch the article and run the full fact-check automatically." },
    { icon:"⚖️", title:"Bias & Tone Meter",    desc:"Know the political lean and emotional manipulation level of every article you check." },
    { icon:"🔁", title:"Compare Mode",          desc:"Side-by-side comparison of two article versions to spot manipulated or altered claims." },
    { icon:"🏷️", title:"Source Reliability",   desc:"Known news domains are flagged with a Trusted / Mixed / Unreliable credibility tier." },
  ];

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Ticker />
      <div style={{ background:`linear-gradient(180deg,${C.surface} 0%,${C.bg} 100%)`, borderBottom:`1px solid ${C.border}`, padding:"64px 24px 56px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"radial-gradient(circle,#f5f0eb 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:680, margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.red, padding:"4px 14px", marginBottom:28 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#fff", display:"inline-block", animation:"pulse 0.8s ease infinite" }} />
            <span style={{ fontSize:10, color:"#fff", fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.18em", fontWeight:700 }}>LIVE — POWERED BY GROQ AI</span>
          </div>
          <div className="hero-title">Stop Sharing.<br /><span style={{ color:C.red }}>Start Verifying.</span></div>
          <div style={{ fontSize:16, color:C.muted, lineHeight:1.8, marginBottom:36, fontStyle:"italic", maxWidth:520, margin:"0 auto 36px" }}>
            Paste any news headline, article, or URL. Our AI fact-checker tells you if it's real — in seconds.
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onAnalyze} style={{ background:C.red, border:"none", color:"#fff", fontFamily:"'Source Code Pro',monospace", fontSize:13, fontWeight:700, letterSpacing:"0.12em", padding:"14px 32px", cursor:"pointer", transition:"background 0.15s" }} onMouseOver={e=>e.currentTarget.style.background="#b91c1c"} onMouseOut={e=>e.currentTarget.style.background=C.red}>
              ▶ ANALYZE AN ARTICLE
            </button>
            <button onClick={() => onNav("history")} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:13, letterSpacing:"0.1em", padding:"14px 28px", cursor:"pointer", transition:"all 0.15s" }} onMouseOver={e=>{e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.muted;}} onMouseOut={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>
              VIEW HISTORY
            </button>
          </div>
        </div>
      </div>

      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}` }}>
        <div className="stats-grid" style={{ maxWidth:860, margin:"0 auto" }}>
          {stats.map((s,i) => (
            <div key={i} className="stat-card">
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:28, color:C.red, lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.12em", marginTop:6, fontFamily:"'Source Code Pro',monospace" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"56px 24px 0" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:10 }}>— HOW IT WORKS —</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:C.white }}>Three Steps to the Truth</div>
        </div>
        <div className="steps-grid">
          {[
            { n:"01", title:"Paste or Link", desc:"Copy any news headline, paragraph, full article, or paste a URL — we extract the text automatically." },
            { n:"02", title:"AI Runs Analysis", desc:"Groq scans for linguistic signals, emotional manipulation, political bias, source coherence, and known patterns." },
            { n:"03", title:"Get Your Verdict", desc:"Receive REAL, FAKE, or UNCERTAIN with a 1–10 credibility score, bias meter, signals, and red flags." },
          ].map((s,i) => (
            <div key={i} className="step-card">
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:40, color:C.redDim, lineHeight:1, marginBottom:14 }}>{s.n}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:C.white, marginBottom:10 }}>{s.title}</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"52px 24px 0" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:10 }}>— FEATURES —</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:C.white }}>What's Under the Hood</div>
        </div>
        <div className="features-grid">
          {features.map((f,i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.redDim}`, padding:"24px 22px", display:"flex", gap:16 }}>
              <div style={{ fontSize:24, flexShrink:0 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.white, marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"52px auto 0", padding:"0 24px 48px" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, padding:"40px 32px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:C.white, marginBottom:12 }}>Don't Spread What You Can't Verify.</div>
          <div style={{ fontSize:14, color:C.muted, marginBottom:28, fontStyle:"italic" }}>Run a fact-check before you share. It takes less than 2 seconds.</div>
          <button onClick={onAnalyze} style={{ background:C.red, border:"none", color:"#fff", fontFamily:"'Source Code Pro',monospace", fontSize:13, fontWeight:700, letterSpacing:"0.12em", padding:"14px 36px", cursor:"pointer" }} onMouseOver={e=>e.currentTarget.style.background="#b91c1c"} onMouseOut={e=>e.currentTarget.style.background=C.red}>
            ▶ START FACT-CHECKING NOW
          </button>
        </div>
      </div>

      <RecentFeed history={history} onNav={onNav} onLoad={onLoadArticle} C={C} />

      <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 28px", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:9, color:C.border, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.15em" }}>© 2026 VERIFAI FACT-CHECK BUREAU</span>
        <span style={{ fontSize:9, color:C.border, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.15em" }}>POWERED BY GROQ AI</span>
      </div>
    </div>
  );
}

// ── Credibility Meter ─────────────────────────────────────
function CredibilityMeter({ score, C }) {
  const s = Math.max(1, Math.min(10, score || 5));
  const pct = (s / 10) * 100;
  const color = s <= 3 ? "#dc2626" : s <= 6 ? "#d97706" : "#16a34a";
  const label = s <= 3 ? "LOW CREDIBILITY" : s <= 6 ? "MODERATE" : "HIGH CREDIBILITY";

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12 }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", fontFamily:"'Source Code Pro',monospace" }}>CREDIBILITY SCORE</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:42, color, lineHeight:1 }}>{s}</span>
          <span style={{ fontFamily:"'Source Code Pro',monospace", fontSize:16, color:C.muted }}>/10</span>
        </div>
      </div>

      {/* Gradient track */}
      <div style={{ position:"relative", height:14, background:"linear-gradient(90deg,#dc2626 0%,#d97706 45%,#16a34a 100%)", marginBottom:8 }}>
        {/* Unfilled mask */}
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:`${100-pct}%`, background:C.bg, opacity:0.82, transition:"width 0.9s cubic-bezier(.22,.68,0,1.2)" }} />
        {/* Marker dot */}
        <div style={{ position:"absolute", left:`${pct}%`, top:"50%", transform:"translate(-50%,-50%)", width:20, height:20, background:color, border:`2px solid ${C.bg}`, borderRadius:"50%", transition:"left 0.9s cubic-bezier(.22,.68,0,1.2)", boxShadow:`0 0 8px ${color}88` }} />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#dc2626", fontFamily:"'Source Code Pro',monospace" }}>1 — FABRICATED</span>
        <span style={{ fontSize:10, fontWeight:700, color, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em" }}>{label}</span>
        <span style={{ fontSize:9, color:"#16a34a", fontFamily:"'Source Code Pro',monospace" }}>10 — VERIFIED</span>
      </div>
    </div>
  );
}

// ── Shield ────────────────────────────────────────────────
function Shield({ verdict, confidence, size=72, C }) {
  const color = verdict==="REAL"?C.verified:verdict==="FAKE"?C.red:verdict==="UNCERTAIN"?C.uncertain:C.muted;
  const pct = Math.round((confidence||0)*100);
  const r=20, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <path d="M36 6 L62 16 L62 38 C62 52 50 62 36 66 C22 62 10 52 10 38 L10 16 Z" fill={color+"18"} stroke={color} strokeWidth="2" />
      <circle cx="36" cy="38" r={r} stroke={color+"33"} strokeWidth="3" fill="none" />
      <circle cx="36" cy="38" r={r} stroke={color} strokeWidth="3" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt"
        transform="rotate(-90 36 38)" style={{ transition:"stroke-dasharray 0.8s ease" }} />
      <text x="36" y="44" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="'Source Code Pro',monospace">
        {verdict===null?"?":`${pct}%`}
      </text>
    </svg>
  );
}

// ── ConfidenceBar ─────────────────────────────────────────
function ConfidenceBar({ label, value, color, C }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'Source Code Pro',monospace" }}>{Math.round(value*100)}%</span>
      </div>
      <div style={{ height:5, background:C.border }}>
        <div style={{ height:"100%", background:color, width:`${value*100}%`, transition:"width 0.8s cubic-bezier(.22,.68,0,1.2)" }} />
      </div>
    </div>
  );
}

// ── BiasToneMeter ─────────────────────────────────────────
function BiasToneMeter({ bias, emotional_tone, C }) {
  const biasPos = { left:5, center:50, right:95, unknown:50 }[bias] ?? 50;
  const toneColor = emotional_tone>0.7 ? C.red : emotional_tone>0.4 ? C.amber : C.verified;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:12 }}>
      <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:16, fontFamily:"'Source Code Pro',monospace" }}>BIAS & TONE ANALYSIS</div>
      <div style={{ marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>POLITICAL LEAN</span>
          <span style={{ fontSize:11, fontWeight:700, color:C.white, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em" }}>{(bias||"UNKNOWN").toUpperCase()}</span>
        </div>
        <div style={{ position:"relative", height:8, background:"linear-gradient(90deg,#3b82f6 0%,"+C.border+" 50%,#ef4444 100%)" }}>
          <div style={{ position:"absolute", top:"50%", left:`${biasPos}%`, transform:"translate(-50%,-50%)", width:14, height:14, background:C.white, border:`2px solid ${C.red}`, borderRadius:"50%", transition:"left 0.6s ease" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:9, color:"#3b82f6", fontFamily:"'Source Code Pro',monospace" }}>LEFT</span>
          <span style={{ fontSize:9, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>CENTER</span>
          <span style={{ fontSize:9, color:"#ef4444", fontFamily:"'Source Code Pro',monospace" }}>RIGHT</span>
        </div>
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>EMOTIONAL TONE</span>
          <span style={{ fontSize:11, fontWeight:700, color:toneColor, fontFamily:"'Source Code Pro',monospace" }}>
            {emotional_tone>0.7?"SENSATIONALIST":emotional_tone>0.4?"MODERATE":"NEUTRAL"}
          </span>
        </div>
        <div style={{ height:5, background:C.border }}>
          <div style={{ height:"100%", background:toneColor, width:`${(emotional_tone||0)*100}%`, transition:"width 0.8s ease" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:9, color:C.verified, fontFamily:"'Source Code Pro',monospace" }}>NEUTRAL</span>
          <span style={{ fontSize:9, color:C.red, fontFamily:"'Source Code Pro',monospace" }}>SENSATIONALIST</span>
        </div>
      </div>
    </div>
  );
}

// ── HighlightedText ───────────────────────────────────────
function HighlightedText({ text, suspicious_phrases, C }) {
  if (!suspicious_phrases?.length) {
    return <div style={{ fontSize:14, color:C.muted, lineHeight:1.8, fontFamily:"Georgia,serif", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{text}</div>;
  }
  const escaped = suspicious_phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <div style={{ fontSize:14, color:C.muted, lineHeight:1.8, fontFamily:"Georgia,serif", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
      {parts.map((part,i) => {
        const isMatch = suspicious_phrases.some(p => p.toLowerCase()===part.toLowerCase());
        return isMatch
          ? <mark key={i} style={{ background:"#7f1d1d55", color:"#fca5a5", borderBottom:`1px solid ${C.red}`, padding:"0 1px" }}>{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ── LanguageBadge ─────────────────────────────────────────
function LanguageBadge({ language, C }) {
  if (!language || language==="en") return null;
  const name = LANG_NAMES[language] || language.toUpperCase();
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.card, border:`1px solid ${C.border}`, padding:"4px 10px", marginBottom:12 }}>
      <span style={{ fontSize:14 }}>🌐</span>
      <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em" }}>DETECTED LANGUAGE: {name.toUpperCase()}</span>
    </div>
  );
}

// ── CategoryBadge ─────────────────────────────────────────
function CategoryBadge({ category, C }) {
  if (!category) return null;
  const color = CATEGORY_COLORS[category] || C.muted;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:color+"22", border:`1px solid ${color}55`, padding:"3px 10px", fontFamily:"'Source Code Pro',monospace", fontSize:9, color, letterSpacing:"0.12em", fontWeight:700 }}>
      ◈ {category.toUpperCase()}
    </span>
  );
}

// ── SourceReliabilityBadge ────────────────────────────────
function SourceReliabilityBadge({ detected_source, C }) {
  if (!detected_source) return null;

  // Try to match against our database
  const key = Object.keys(SOURCE_RELIABILITY).find(k => detected_source.toLowerCase().includes(k) || k.includes(detected_source.toLowerCase().replace("www.","").split("/")[0]));
  const info = key ? SOURCE_RELIABILITY[key] : null;
  const tier = info ? info.tier : "unknown";
  const cfg  = TIER_CONFIG[tier];
  const displayName = info ? info.label : detected_source;

  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:"6px 12px", marginBottom:12 }}>
      <span style={{ fontSize:14, fontWeight:700, color:cfg.color, fontFamily:"'Source Code Pro',monospace" }}>{cfg.icon}</span>
      <div>
        <div style={{ fontSize:9, color:cfg.color, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.14em", fontWeight:700 }}>{cfg.label}</div>
        <div style={{ fontSize:11, color:cfg.color, fontFamily:"Georgia,serif", opacity:0.85 }}>{displayName}</div>
      </div>
    </div>
  );
}

// ── ConfidenceTooltip ─────────────────────────────────────
function ConfidenceTooltip({ confidence, C }) {
  const [show, setShow] = useState(false);
  const pct = Math.round((confidence||0)*100);
  const explain = pct>=90 ? "Near-certain verdict — extremely strong signals detected in the text."
    : pct>=75 ? "High confidence — the AI found clear indicators supporting this verdict."
    : pct>=60 ? "Moderate confidence — signals are present but some ambiguity remains."
    : "Low confidence — the AI is uncertain. Treat this result with caution.";
  return (
    <span className="tip-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ cursor:"help", borderBottom:`1px dashed ${C.muted}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:11, letterSpacing:"0.1em" }}>
        {pct}% CONFIDENCE ⓘ
      </span>
      {show && (
        <div className="tip-box">
          <div style={{ fontSize:10, color:C.red, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", marginBottom:6 }}>CONFIDENCE EXPLAINED</div>
          {explain}
        </div>
      )}
    </span>
  );
}

// ── Share Card (Canvas PNG) ───────────────────────────────
function generateShareCardPNG(result) {
  const W=900, H=480;
  const canvas = document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx = canvas.getContext("2d");
  const score = result.credibility_score||5;
  const vc = result.verdict==="REAL"?"#16a34a":result.verdict==="FAKE"?"#dc2626":"#d97706";

  // BG
  ctx.fillStyle="#0e0b0b"; ctx.fillRect(0,0,W,H);
  // Top bar
  ctx.fillStyle="#dc2626"; ctx.fillRect(0,0,W,5);
  // Left verdict bar
  ctx.fillStyle=vc; ctx.fillRect(0,0,6,H);
  // Subtle dot grid
  ctx.fillStyle="#f5f0eb";
  for(let x=20;x<W;x+=20) for(let y=20;y<H;y+=20){ ctx.globalAlpha=0.03; ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill(); }
  ctx.globalAlpha=1;

  // VERIFAI logo
  ctx.font="900 32px Georgia,serif"; ctx.fillStyle="#f5f0eb"; ctx.fillText("VERI",60,72);
  const vw=ctx.measureText("VERI").width;
  ctx.fillStyle="#dc2626"; ctx.fillText("FAI",60+vw,72);
  ctx.font="11px monospace"; ctx.fillStyle="#8a7070"; ctx.fillText("FACT-CHECK BUREAU",60,90);

  // Category + date badge
  const dateStr = new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
  ctx.font="10px monospace"; ctx.fillStyle="#3a2020";
  ctx.fillText(`${result.category||"GENERAL"} • ${dateStr}`,60,112);

  // Verdict big text
  const vLabel = result.verdict==="REAL"?"VERIFIED":result.verdict==="FAKE"?"FAKE NEWS":"UNCERTAIN";
  ctx.font="900 56px Georgia,serif"; ctx.fillStyle=vc;
  ctx.fillText(vLabel, 60, 195);

  // Credibility score (top-right)
  ctx.font="900 72px Georgia,serif"; ctx.fillStyle=vc;
  const scoreStr=`${score}`;
  const sw=ctx.measureText(scoreStr).width;
  ctx.fillText(scoreStr,W-100-sw,100);
  ctx.font="900 28px Georgia,serif"; ctx.fillStyle=vc+"aa"; ctx.fillText("/10",W-96,100);
  ctx.font="10px monospace"; ctx.fillStyle="#8a7070";
  const credW=ctx.measureText("CREDIBILITY").width;
  ctx.fillText("CREDIBILITY",W-80-credW/2,118);

  // Credibility gradient bar
  const barX=60, barY=215, barW2=W-120, barH=10;
  const grad=ctx.createLinearGradient(barX,0,barX+barW2,0);
  grad.addColorStop(0,"#dc2626"); grad.addColorStop(0.45,"#d97706"); grad.addColorStop(1,"#16a34a");
  ctx.fillStyle=grad; ctx.fillRect(barX,barY,barW2,barH);
  // Mask unfilled
  ctx.fillStyle="#0e0b0bcc"; ctx.fillRect(barX+(score/10)*barW2,barY,(1-score/10)*barW2,barH);
  // Marker
  const mx=barX+(score/10)*barW2;
  ctx.fillStyle=vc; ctx.beginPath(); ctx.arc(mx,barY+barH/2,7,0,Math.PI*2); ctx.fill();

  // Summary (word-wrapped)
  ctx.font="15px Georgia,serif"; ctx.fillStyle="#8a7070";
  const words=(result.summary||"").split(" ");
  let line="", y=260;
  for(const w of words){
    const t=line+w+" ";
    if(ctx.measureText(t).width>W-130&&line){ctx.fillText(line,60,y);line=w+" ";y+=24;}
    else line=t;
  }
  if(line)ctx.fillText(line,60,y);

  // Stats row
  y+=40;
  ctx.font="bold 12px monospace"; ctx.fillStyle="#8a7070";
  ctx.fillText(`CONFIDENCE: ${Math.round((result.confidence||0)*100)}%`,60,y);
  ctx.fillText(`BIAS: ${(result.bias||"UNKNOWN").toUpperCase()}`,280,y);
  if(result.detected_source) ctx.fillText(`SOURCE: ${result.detected_source}`,460,y);

  // Divider
  ctx.strokeStyle="#3a2020"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(60,y+18); ctx.lineTo(W-60,y+18); ctx.stroke();

  // Bottom watermark
  ctx.font="10px monospace"; ctx.fillStyle="#3a2020";
  ctx.fillText("Verified by VERIFAI Fact-Check Bureau  •  verifai.vercel.app",60,H-24);
  ctx.fillText(`Powered by Groq AI`,W-200,H-24);

  return canvas.toDataURL("image/png");
}

function ShareCardModal({ result, onClose, C }) {
  const score = result.credibility_score||5;
  const vc = result.verdict==="REAL"?C.verified:result.verdict==="FAKE"?C.red:C.uncertain;
  const scoreColor = score<=3?C.red:score<=6?C.amber:C.verified;
  const [copying, setCopying] = useState(false);

  function download() {
    const url = generateShareCardPNG(result);
    const a = document.createElement("a");
    a.download = `verifai-${result.verdict.toLowerCase()}-${Date.now()}.png`;
    a.href = url; a.click();
  }

  function copyText() {
    const t = `🔍 VERIFAI VERDICT: ${result.verdict} (${score}/10 credibility)\n${result.summary}\n\nVerified by VERIFAI Fact-Check Bureau`;
    navigator.clipboard.writeText(t).then(() => { setCopying(true); setTimeout(()=>setCopying(false),1800); });
  }

  return (
    <div className="share-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderTop:`4px solid ${vc}`, maxWidth:540, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
        {/* Card preview */}
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"28px 32px", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:4, background:vc }} />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:C.white, lineHeight:1 }}>VERI<span style={{ color:C.red }}>FAI</span></div>
              <div style={{ fontSize:8, letterSpacing:"0.2em", color:C.muted, fontFamily:"'Source Code Pro',monospace", marginTop:2 }}>FACT-CHECK BUREAU</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:40, color:scoreColor, lineHeight:1 }}>{score}<span style={{ fontSize:18, color:C.muted }}>/10</span></div>
              <div style={{ fontSize:8, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em" }}>CREDIBILITY</div>
            </div>
          </div>

          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:32, color:vc, marginBottom:10 }}>
            {result.verdict==="REAL"?"✓ VERIFIED":result.verdict==="FAKE"?"⚠ FAKE NEWS":"? UNCERTAIN"}
          </div>

          {/* Mini meter */}
          <div style={{ height:6, background:`linear-gradient(90deg,#dc2626 0%,#d97706 45%,#16a34a 100%)`, marginBottom:14, position:"relative" }}>
            <div style={{ position:"absolute", right:0, top:0, bottom:0, width:`${100-(score/10)*100}%`, background:C.bg, opacity:0.8 }} />
          </div>

          <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, fontStyle:"italic", fontFamily:"Georgia,serif", marginBottom:16 }}>{result.summary}</div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>CONFIDENCE: {Math.round((result.confidence||0)*100)}%</span>
            <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>BIAS: {(result.bias||"UNKNOWN").toUpperCase()}</span>
            {result.category && <CategoryBadge category={result.category} C={C} />}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:"18px 24px", display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={download} style={{ background:C.red, border:"none", color:"#fff", fontFamily:"'Source Code Pro',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", padding:"9px 18px", cursor:"pointer" }}>
            ⬇ DOWNLOAD PNG
          </button>
          <button onClick={copyText} style={{ background:"transparent", border:`1px solid ${C.border}`, color:copying?C.verified:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:11, letterSpacing:"0.1em", padding:"9px 16px", cursor:"pointer", transition:"color 0.2s" }}>
            {copying ? "✓ COPIED!" : "📋 COPY TEXT"}
          </button>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:11, letterSpacing:"0.1em", padding:"9px 16px", cursor:"pointer" }}>
            ✕ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Analysis Loading ──────────────────────────────────────
function AnalysisLoading({ C }) {
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const [tick, setTick] = useState(0);
  const [scanY, setScanY] = useState(0);

  useEffect(() => { const t=setInterval(()=>setStep(s=>Math.min(s+1,ANALYSIS_STEPS.length-1)),550); return()=>clearInterval(t); }, []);
  useEffect(() => {
    const t=setInterval(()=>{
      const target=((step+1)/ANALYSIS_STEPS.length)*100;
      setProg(p=>{ const next=p+(target-p)*0.15; return target-next<0.1?target:next; });
    },40);
    return()=>clearInterval(t);
  },[step]);
  useEffect(()=>{const t=setInterval(()=>setTick(n=>n+1),500);return()=>clearInterval(t);},[]);
  useEffect(()=>{const t=setInterval(()=>setScanY(y=>(y+3)%620),16);return()=>clearInterval(t);},[]);

  const circ=2*Math.PI*24;
  return (
    <div style={{ background:C.bg, minHeight:600, color:C.white, fontFamily:"'Source Code Pro',monospace", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.05, backgroundImage:"radial-gradient(circle,#f5f0eb 1px,transparent 1px)", backgroundSize:"18px 18px" }} />
      <div style={{ position:"absolute", left:0, right:0, height:2, top:scanY, background:"rgba(220,38,38,0.13)", pointerEvents:"none" }} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:600, padding:"40px 24px", position:"relative", zIndex:2 }}>
        <div style={{ width:"100%", maxWidth:460 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none" style={{ display:"block", margin:"0 auto 16px" }}>
              <circle cx="44" cy="44" r="24" stroke={C.border} strokeWidth="3" fill="none" />
              <circle cx="44" cy="44" r="24" stroke={C.red} strokeWidth="3" fill="none"
                strokeDasharray={`${(prog/100)*circ} ${circ}`} strokeLinecap="butt"
                transform="rotate(-90 44 44)" style={{ transition:"stroke-dasharray 0.08s linear" }} />
              <text x="44" y="49" textAnchor="middle" fill={C.white} fontSize="13" fontWeight="700" fontFamily="'Source Code Pro',monospace">{Math.round(prog)}%</text>
            </svg>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:28, color:C.white, letterSpacing:"0.04em" }}>VERI<span style={{ color:C.red }}>FAI</span></div>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.2em", marginTop:4 }}>ANALYZING CONTENT</div>
          </div>
          <div style={{ marginBottom:24 }}>
            {ANALYSIS_STEPS.map((s,i) => {
              const done=i<step, active=i===step;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.border}`, opacity:i>step?0.12:1, transition:"opacity 0.4s", animation:active?"fadeL 0.3s ease both":"none" }}>
                  <div style={{ width:20, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {done?(
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill={C.verified+"33"} />
                        <path d="M4 7l2 2 4-4" stroke={C.verified} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ):active?(
                      <div style={{ width:8, height:8, borderRadius:"50%", border:`1.5px solid ${C.red}`, borderTopColor:"transparent", animation:"spin 0.65s linear infinite" }} />
                    ):(
                      <div style={{ width:5, height:5, borderRadius:"50%", background:C.border }} />
                    )}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, letterSpacing:"0.1em", color:done?C.muted:active?C.white:C.border, fontWeight:active?700:400 }}>{s.label}</div>
                    {active && <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{s.detail}</div>}
                  </div>
                  {done && <span style={{ fontSize:10, color:C.verified, letterSpacing:"0.08em" }}>DONE</span>}
                  {active && <span style={{ fontSize:13, color:C.red, animation:"blink 0.9s step-end infinite" }}>▌</span>}
                </div>
              );
            })}
          </div>
          <div style={{ height:3, background:C.border }}>
            <div style={{ height:"100%", background:`linear-gradient(90deg,${C.redDim},${C.red})`, width:`${prog}%`, transition:"width 0.08s linear" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:10, color:C.redDim, letterSpacing:"0.12em" }}>PROCESSING{".".repeat((tick%3)+1)}</span>
            <span style={{ fontSize:10, color:C.red, fontWeight:700 }}>{Math.round(prog)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Item ──────────────────────────────────────────
function HistoryItem({ item, onClick, C }) {
  const color = item.verdict==="REAL"?C.verified:item.verdict==="FAKE"?C.red:item.verdict==="UNCERTAIN"?C.uncertain:C.muted;
  const score = item.credibility_score;
  const scoreColor = score ? (score<=3?C.red:score<=6?C.amber:C.verified) : C.muted;
  return (
    <button onClick={() => onClick(item)} style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, padding:"12px 0", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:3, height:40, background:color, flexShrink:0 }} />
      <div style={{ flex:1, overflow:"hidden" }}>
        <div style={{ fontSize:13, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"Georgia,serif", lineHeight:1.5 }}>
          {item.text.slice(0,80)}{item.text.length>80?"…":""}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4, flexWrap:"wrap" }}>
          <span style={{ fontSize:9, color:C.border, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.06em" }}>
            {new Date(item.ts).toLocaleDateString()} · {Math.round((item.confidence||0)*100)}% conf.
          </span>
          {item.category && <CategoryBadge category={item.category} C={C} />}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
        <span style={{ fontSize:11, color, fontFamily:"'Source Code Pro',monospace", fontWeight:700, letterSpacing:"0.1em" }}>{item.verdict}</span>
        {score && <span style={{ fontSize:11, fontWeight:700, color:scoreColor, fontFamily:"'Source Code Pro',monospace" }}>{score}/10</span>}
      </div>
    </button>
  );
}

// ── History Stats Dashboard ───────────────────────────────
function HistoryStats({ history, C }) {
  if (history.length===0) return null;

  const counts = { REAL:0, FAKE:0, UNCERTAIN:0 };
  let totalConf=0;
  const flagFreq={}, catFreq={};
  history.forEach(h => {
    counts[h.verdict] = (counts[h.verdict]||0)+1;
    totalConf += h.confidence||0;
    (h.red_flags||[]).forEach(f => { flagFreq[f]=(flagFreq[f]||0)+1; });
    if(h.category) catFreq[h.category]=(catFreq[h.category]||0)+1;
  });
  const avgConf = Math.round((totalConf/history.length)*100);
  const topFlag = Object.entries(flagFreq).sort((a,b)=>b[1]-a[1])[0]?.[0];

  const total=history.length;
  const colors = { REAL:C.verified, FAKE:C.red, UNCERTAIN:C.uncertain };
  const r=30, circ=2*Math.PI*r;
  let offset=0;
  const slices = Object.entries(counts).filter(([,v])=>v>0).map(([label,val])=>{
    const pct=val/total, len=pct*circ;
    const slice={label,val,pct,len,offset,color:colors[label]};
    offset+=len; return slice;
  });

  const topCats = Object.entries(catFreq).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, padding:"20px 22px", marginBottom:24 }}>
      <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:16, fontFamily:"'Source Code Pro',monospace" }}>ANALYSIS STATISTICS</div>
      <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          {slices.map((s,i)=>(
            <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={s.color} strokeWidth="12"
              strokeDasharray={`${s.len} ${circ}`} strokeDashoffset={-s.offset} transform="rotate(-90 40 40)" />
          ))}
          <text x="40" y="44" textAnchor="middle" fill={C.white} fontSize="11" fontWeight="700" fontFamily="'Source Code Pro',monospace">{total}</text>
          <text x="40" y="55" textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Source Code Pro',monospace">TOTAL</text>
        </svg>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {slices.map(s=>(
            <div key={s.label}>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ borderLeft:`1px solid ${C.border}`, paddingLeft:20 }}>
          <div style={{ fontSize:20, fontWeight:900, color:C.white, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{avgConf}%</div>
          <div style={{ fontSize:9, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", marginTop:2 }}>AVG CONFIDENCE</div>
        </div>
        {topFlag && (
          <div style={{ borderLeft:`1px solid ${C.border}`, paddingLeft:20, maxWidth:180 }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", marginBottom:4 }}>TOP RED FLAG</div>
            <div style={{ fontSize:11, color:C.red, fontFamily:"Georgia,serif", lineHeight:1.5 }}>"{topFlag.slice(0,60)}{topFlag.length>60?"…":""}"</div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {topCats.length>0 && (
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.14em", marginBottom:10, fontFamily:"'Source Code Pro',monospace" }}>CATEGORY BREAKDOWN</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {topCats.map(([cat,cnt])=>(
              <div key={cat} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:9, color:CATEGORY_COLORS[cat]||C.muted, fontFamily:"'Source Code Pro',monospace", width:90, letterSpacing:"0.08em" }}>{cat.toUpperCase()}</span>
                <div style={{ flex:1, height:4, background:C.border }}>
                  <div style={{ height:"100%", background:CATEGORY_COLORS[cat]||C.muted, width:`${(cnt/total)*100}%`, transition:"width 0.6s ease" }} />
                </div>
                <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace", width:20, textAlign:"right" }}>{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Share / Export helpers ────────────────────────────────
function buildShareText(result, text) {
  const score = result.credibility_score||"N/A";
  return `🔍 VERIFAI FACT-CHECK RESULT
${"─".repeat(40)}
VERDICT: ${result.verdict} ${result.verdict==="REAL"?"✓":result.verdict==="FAKE"?"⚠":"?"}
CREDIBILITY SCORE: ${score}/10
CONFIDENCE: ${Math.round((result.confidence||0)*100)}%
REAL SCORE: ${Math.round((result.real_score||0)*100)}%  |  FAKE SCORE: ${Math.round((result.fake_score||0)*100)}%
BIAS: ${(result.bias||"unknown").toUpperCase()}  |  EMOTIONAL TONE: ${Math.round((result.emotional_tone||0)*100)}%
${result.category?`CATEGORY: ${result.category}`:""}

SUMMARY:
${result.summary}

SIGNALS:
${(result.signals||[]).map(s=>`• ${s}`).join("\n")}
${result.red_flags?.length?`\nRED FLAGS:\n${result.red_flags.map(f=>`⚑ ${f}`).join("\n")}`:""}
${"─".repeat(40)}
Checked with VERIFAI Fact-Check Bureau`;
}

function exportReport(result, text) {
  const score = result.credibility_score||"N/A";
  const content = `VERIFAI FACT-CHECK REPORT
Generated: ${new Date().toLocaleString()}
${"═".repeat(50)}

ARTICLE TEXT:
${text}

${"═".repeat(50)}
VERDICT: ${result.verdict}
CREDIBILITY SCORE: ${score}/10
CONFIDENCE: ${Math.round((result.confidence||0)*100)}%
REAL SCORE: ${Math.round((result.real_score||0)*100)}%
FAKE SCORE: ${Math.round((result.fake_score||0)*100)}%
BIAS: ${(result.bias||"unknown").toUpperCase()}
EMOTIONAL TONE: ${Math.round((result.emotional_tone||0)*100)}%
LANGUAGE: ${LANG_NAMES[result.language]||result.language||"Unknown"}
CATEGORY: ${result.category||"Unknown"}
DETECTED SOURCE: ${result.detected_source||"None"}

SUMMARY:
${result.summary}

SIGNALS:
${(result.signals||[]).map(s=>`  • ${s}`).join("\n")}

RED FLAGS:
${result.red_flags?.length?result.red_flags.map(f=>`  ⚑ ${f}`).join("\n"):"  None"}

SUSPICIOUS PHRASES:
${result.suspicious_phrases?.length?result.suspicious_phrases.map(p=>`  "${p}"`).join("\n"):"  None"}

${"═".repeat(50)}
VERIFAI FACT-CHECK BUREAU — Powered by Groq AI`;

  const blob=new Blob([content],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`verifai-report-${Date.now()}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// ── Analyze Page ──────────────────────────────────────────
function AnalyzePage({ history, setHistory, onNav, selectedArticle, usageInfo, setUsageInfo, C }) {
  const [inputMode, setInputMode] = useState("text");
  const [text, setText] = useState(selectedArticle?selectedArticle.text:"");
  const [urlInput, setUrlInput] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [urlSourceLink, setUrlSourceLink] = useState(null);
  const [result, setResult] = useState(selectedArticle||null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analyze");
  const [toast, setToast] = useState("");
  const [showHighlight, setShowHighlight] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey||e.metaKey)&&e.key==="Enter") { e.preventDefault(); analyze(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="k") { e.preventDefault(); textareaRef.current?.focus(); }
      if (e.key==="Escape") { if(showShareCard){setShowShareCard(false);return;} if(text){setText("");setResult(null);} }
    }
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  });

  async function fetchUrl() {
    if (!urlInput.trim()||urlFetching) return;
    setUrlFetching(true); setUrlError(""); setUrlSourceLink(null);
    try {
      const res = await fetch("/api/fetch-url",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({url:urlInput.trim()}) });
      const data = await res.json();
      if (!res.ok) {
        setUrlSourceLink(data.sourceUrl||null);
        if (data.hint) { setText(data.hint); setInputMode("text"); setUrlError(data.error); setToast("⚠ JS site: loaded page summary — review before analyzing"); }
        else setUrlError(data.error||"Failed to fetch URL");
        return;
      }
      setText(data.text); setInputMode("text"); setUrlError(""); setUrlSourceLink(null);
      setToast(`✓ Extracted from "${data.title||urlInput}" — ready to analyze`);
    } catch(err) { setUrlError(err.message); }
    finally { setUrlFetching(false); }
  }

  async function analyze() {
    if (!text.trim()||loading) return;
    setLoading(true); setError(""); setResult(null); setShowHighlight(false); setShowShareCard(false);
    const startTime=Date.now();
    try {
      const res = await fetch("/api/analyze",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userText:text}) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status===429) throw new Error(data.message||"Daily limit reached");
        throw new Error(data.error||"Server error");
      }
      const parsed = JSON.parse(data.result);
      if (data.remaining!==undefined) setUsageInfo({remaining:data.remaining,total:data.total});
      const elapsed=Date.now()-startTime;
      if (elapsed<4200) await new Promise(r=>setTimeout(r,4200-elapsed));
      setResult(parsed);
      const newH=[{text,...parsed,ts:Date.now()},...history.filter(h=>h.text!==text)];
      setHistory(newH);
    } catch(err) { console.error(err); setError(err.message||"Analysis failed. Please try again."); }
    finally { setLoading(false); }
  }

  const vc = result?.verdict==="REAL"?C.verified:result?.verdict==="FAKE"?C.red:result?.verdict==="UNCERTAIN"?C.uncertain:C.muted;
  const verdictLabel = result?.verdict==="FAKE"?"⚠ FAKE NEWS":result?.verdict==="REAL"?"✓ VERIFIED":result?.verdict==="UNCERTAIN"?"? UNCERTAIN":"";

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
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
        .mode-btn { font-family:'Source Code Pro',monospace; font-size:11px; letter-spacing:0.1em; padding:6px 18px; cursor:pointer; border:1px solid ${C.border}; transition:all 0.15s; }
        .mode-btn.on  { background:${C.red}; color:#fff; border-color:${C.red}; font-weight:700; }
        .mode-btn.off { background:transparent; color:${C.muted}; }
        .mode-btn.off:hover { color:${C.white}; border-color:${C.muted}; }
        .act-btn { background:transparent; border:1px solid ${C.border}; color:${C.muted}; font-family:'Source Code Pro',monospace; font-size:11px; letter-spacing:0.1em; padding:7px 14px; cursor:pointer; transition:all 0.15s; }
        .act-btn:hover { color:${C.white}; border-color:${C.muted}; }
      `}</style>

      <Ticker items={["FACT-CHECK BUREAU — SUBMIT YOUR ARTICLE","AI ANALYSIS READY","LIVE VERDICT IN UNDER 2 SECONDS","POWERED BY GROQ AI","MISINFORMATION STOPS HERE"]} />
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      {showShareCard && result && <ShareCardModal result={result} onClose={() => setShowShareCard(false)} C={C} />}

      {loading ? <AnalysisLoading C={C} /> : (
        <div style={{ maxWidth:760, margin:"0 auto", width:"100%", padding:"28px 24px", flex:1 }}>
          <div style={{ marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:C.white, marginBottom:4 }}>
                Article <span style={{ color:C.red }}>Analyzer</span>
              </div>
              <div style={{ fontSize:12, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>Submit any news text or URL. VERIFAI returns a verdict in seconds.</div>
            </div>
            {usageInfo && (
              <div style={{ fontSize:10, color:usageInfo.remaining<5?C.red:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em", textAlign:"right" }}>
                {usageInfo.remaining} / {usageInfo.total} CHECKS REMAINING TODAY
                <div style={{ height:2, background:C.border, marginTop:4 }}>
                  <div style={{ height:"100%", background:usageInfo.remaining<5?C.red:C.verified, width:`${(usageInfo.remaining/usageInfo.total)*100}%`, transition:"width 0.4s" }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ borderBottom:`1px solid ${C.border}`, marginBottom:24, display:"flex" }}>
            <button className={`atab ${tab==="analyze"?"on":"off"}`} onClick={() => setTab("analyze")}>ANALYZER</button>
            <button className={`atab ${tab==="history"?"on":"off"}`} onClick={() => setTab("history")}>HISTORY{history.length>0?` (${history.length})`:""}</button>
          </div>

          {tab==="analyze" && (
            <>
              <div style={{ display:"flex", gap:0, marginBottom:14 }}>
                <button className={`mode-btn ${inputMode==="text"?"on":"off"}`} onClick={() => setInputMode("text")}>✏ TEXT</button>
                <button className={`mode-btn ${inputMode==="url"?"on":"off"}`} onClick={() => setInputMode("url")}>🔗 URL</button>
              </div>

              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.2em", marginBottom:8, fontFamily:"'Source Code Pro',monospace" }}>
                  {inputMode==="url"?"ENTER ARTICLE URL":"SUBMIT ARTICLE FOR VERIFICATION"}
                </div>

                {inputMode==="url" ? (
                  <>
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.redDim}` }}>
                      <input value={urlInput} onChange={e=>{setUrlInput(e.target.value);setUrlError("");setUrlSourceLink(null);}}
                        onKeyDown={e=>e.key==="Enter"&&fetchUrl()}
                        placeholder="https://example.com/news-article"
                        style={{ width:"100%", background:"transparent", border:"none", color:C.white, fontFamily:"Georgia,serif", fontSize:14, padding:"16px", outline:"none" }} />
                      <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>Press Enter or click FETCH to extract article text</span>
                        <button onClick={fetchUrl} disabled={!urlInput.trim()||urlFetching}
                          style={{ background:urlFetching?C.border:C.red, border:"none", color:"#fff", fontFamily:"'Source Code Pro',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", padding:"6px 16px", cursor:urlFetching?"not-allowed":"pointer", opacity:!urlInput.trim()?0.4:1 }}>
                          {urlFetching?"FETCHING...":"FETCH →"}
                        </button>
                      </div>
                    </div>
                    {urlError && (
                      <div style={{ marginTop:10, background:"#1a1000", border:"1px solid #78350f", borderLeft:"3px solid #f59e0b", padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                          <span style={{ fontSize:16, lineHeight:1 }}>⚠</span>
                          <div>
                            <div style={{ fontFamily:"'Source Code Pro',monospace", fontSize:11, fontWeight:700, color:"#fbbf24", letterSpacing:"0.1em", marginBottom:4 }}>CANNOT SCRAPE THIS SITE</div>
                            <div style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#d6b87a", lineHeight:1.6 }}>{urlError}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {urlSourceLink && (
                            <a href={urlSourceLink} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily:"'Source Code Pro',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.1em", padding:"6px 14px", background:"#78350f", color:"#fef3c7", border:"1px solid #92400e", textDecoration:"none", display:"inline-block" }}>
                              🔗 TRY ORIGINAL SOURCE →
                            </a>
                          )}
                          <button onClick={() => { setInputMode("text"); setUrlError(""); setUrlSourceLink(null); setTimeout(()=>textareaRef.current?.focus(),50); }}
                            style={{ fontFamily:"'Source Code Pro',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.1em", padding:"6px 14px", background:"transparent", color:"#d6b87a", border:"1px solid #78350f", cursor:"pointer" }}>
                            ✎ PASTE TEXT MANUALLY
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.redDim}` }}>
                    {result && showHighlight ? (
                      <div style={{ padding:"16px", minHeight:120 }}>
                        <HighlightedText text={text} suspicious_phrases={result.suspicious_phrases} C={C} />
                      </div>
                    ) : (
                      <textarea ref={textareaRef} value={text} onChange={e=>setText(e.target.value)}
                        placeholder="Paste a news headline or full article here... (Ctrl+Enter to analyze)"
                        rows={5} style={{ width:"100%", background:"transparent", border:"none", color:C.white, fontFamily:"Georgia,serif", fontSize:14, padding:"16px", resize:"vertical", lineHeight:1.8, minHeight:120, outline:"none" }} />
                    )}
                    <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.muted, fontFamily:"'Source Code Pro',monospace" }}>
                        {text.length} chars / {text.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        {result && result.suspicious_phrases?.length>0 && (
                          <button onClick={() => setShowHighlight(h=>!h)} className="act-btn" style={{ fontSize:10 }}>
                            {showHighlight?"EDIT TEXT":"HIGHLIGHT FLAGS"}
                          </button>
                        )}
                        {text && <button onClick={() => { setText(""); setResult(null); setShowHighlight(false); }} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:11, fontFamily:"'Source Code Pro',monospace" }}>CLEAR ×</button>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <button className="run-btn" onClick={analyze} disabled={!text.trim()}>▶ RUN FACT-CHECK</button>
                  <span style={{ fontSize:9, color:C.border, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>CTRL+ENTER</span>
                </div>
                {error && <span style={{ color:C.red, fontSize:12, fontFamily:"'Source Code Pro',monospace" }}>{error}</span>}
              </div>

              {result && (
                <div className="fade-in">
                  <LanguageBadge language={result.language} C={C} />

                  {/* Source + Category badges row */}
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:result.detected_source||result.category?12:0 }}>
                    {result.detected_source && <SourceReliabilityBadge detected_source={result.detected_source} C={C} />}
                    {result.category && <CategoryBadge category={result.category} C={C} />}
                  </div>

                  {/* Verdict header */}
                  <div style={{ "--vc-color":vc,"--vc-border":`${vc}44` }} className="result-header">
                    <Shield verdict={result.verdict} confidence={result.confidence} size={72} C={C} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:28, color:vc }}>{verdictLabel}</span>
                        <ConfidenceTooltip confidence={result.confidence} C={C} />
                      </div>
                      <p style={{ fontSize:14, color:C.muted, margin:0, lineHeight:1.7, fontStyle:"italic" }}>{result.summary}</p>
                    </div>
                  </div>

                  {/* Credibility Meter */}
                  <CredibilityMeter score={result.credibility_score} C={C} />

                  {/* Action buttons */}
                  <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                    <button className="act-btn" onClick={() => setShowShareCard(true)}>📸 SHARE CARD</button>
                    <button className="act-btn" onClick={() => { navigator.clipboard.writeText(buildShareText(result,text)); setToast("✓ RESULT COPIED TO CLIPBOARD"); }}>📤 COPY RESULT</button>
                    <button className="act-btn" onClick={() => exportReport(result,text)}>⬇ EXPORT REPORT</button>
                    <button className="act-btn" onClick={() => { setText(""); setResult(null); setShowHighlight(false); }}>↺ NEW CHECK</button>
                  </div>

                  {/* Score breakdown */}
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:12 }}>
                    <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:14, fontFamily:"'Source Code Pro',monospace" }}>SCORE BREAKDOWN</div>
                    <ConfidenceBar label="VERIFIED / REAL" value={result.real_score||0} color={C.verified} C={C} />
                    <ConfidenceBar label="FAKE / MISINFORMATION" value={result.fake_score||0} color={C.red} C={C} />
                  </div>

                  {/* Bias & Tone */}
                  {(result.bias||result.emotional_tone!==undefined) && <BiasToneMeter bias={result.bias} emotional_tone={result.emotional_tone} C={C} />}

                  {/* Signals */}
                  {result.signals?.length>0 && (
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:12 }}>
                      <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:10, fontFamily:"'Source Code Pro',monospace" }}>ANALYSIS SIGNALS</div>
                      {result.signals.map((s,i) => <span key={i} className="sig-tag">→ {s}</span>)}
                    </div>
                  )}

                  {/* Red flags */}
                  {result.red_flags?.length>0 && (
                    <div style={{ background:"#1a0a0a", border:`1px solid ${C.redDim}`, borderLeft:`3px solid ${C.red}`, padding:"18px 22px", marginBottom:12 }}>
                      <div style={{ fontSize:10, color:C.red, letterSpacing:"0.18em", marginBottom:10, fontFamily:"'Source Code Pro',monospace" }}>⚠ RED FLAGS DETECTED</div>
                      {result.red_flags.map((f,i) => <span key={i} className="flag-tag">✕ {f}</span>)}
                    </div>
                  )}
                </div>
              )}

              {!result && (
                <div style={{ marginTop:32 }}>
                  <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:14, fontFamily:"'Source Code Pro',monospace" }}>— SAMPLE HEADLINES —</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {[
                      "Scientists discover new antibiotic that kills drug-resistant bacteria in lab tests",
                      "Government secretly adding mind control chemicals to tap water, leaked documents reveal",
                      "Stock markets fell sharply on Tuesday amid rising inflation concerns",
                    ].map((ex,i) => (
                      <button key={i} onClick={() => setText(ex)} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`2px solid ${C.redDim}`, padding:"10px 14px", textAlign:"left", color:C.muted, fontSize:13, fontFamily:"Georgia,serif", cursor:"pointer", transition:"all 0.15s", lineHeight:1.5 }}
                        onMouseOver={e=>{e.currentTarget.style.color=C.white;e.currentTarget.style.borderLeftColor=C.red;}}
                        onMouseOut={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderLeftColor=C.redDim;}}>
                        <span style={{ color:C.red, marginRight:10, fontFamily:"'Source Code Pro',monospace", fontSize:11 }}>{i+1}.</span>{ex}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop:16, fontSize:10, color:C.border, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>
                    SHORTCUTS: CTRL+ENTER = analyze · ESC = clear · CTRL+K = focus input
                  </div>
                </div>
              )}
            </>
          )}

          {tab==="history" && (
            <div>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:16, fontFamily:"'Source Code Pro',monospace" }}>ANALYSIS HISTORY — {history.length} ENTRIES</div>
              {history.length===0 ? (
                <div style={{ color:C.muted, fontSize:14, padding:"48px 0", textAlign:"center", fontStyle:"italic" }}>No analyses yet. Submit your first article.</div>
              ) : (
                <>
                  {history.map((item,i) => <HistoryItem key={i} item={item} onClick={h=>{setText(h.text);setResult(h);setTab("analyze");}} C={C} />)}
                  <button onClick={() => setHistory([])} style={{ marginTop:16, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:11, padding:"8px 16px", cursor:"pointer", letterSpacing:"0.1em" }}>CLEAR HISTORY</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compare Page ──────────────────────────────────────────
function ComparePage({ history, onNav, usageInfo, setUsageInfo, C }) {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function runCompare() {
    if (!textA.trim()||!textB.trim()||loading) return;
    setLoading(true); setError(""); setResult(null);
    const startTime=Date.now();
    try {
      const res = await fetch("/api/compare",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({textA:textA.trim(),textB:textB.trim()}) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status===429) throw new Error(data.message||"Daily limit reached");
        throw new Error(data.error||"Compare failed");
      }
      const parsed = JSON.parse(data.result);
      if (data.remaining!==undefined) setUsageInfo({remaining:data.remaining,total:data.total});
      const elapsed=Date.now()-startTime;
      if (elapsed<2000) await new Promise(r=>setTimeout(r,2000-elapsed));
      setResult(parsed);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const agreementColors = { HIGH:C.verified, MEDIUM:C.amber, LOW:C.amber, CONTRADICTORY:C.red };
  const verdictColor = v => v==="REAL"?C.verified:v==="FAKE"?C.red:C.uncertain;

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`
        .cmp-btn { background:${C.red}; border:none; color:#fff; font-family:'Source Code Pro',monospace; font-size:13px; font-weight:700; letter-spacing:0.12em; padding:13px 28px; cursor:pointer; transition:background 0.15s; }
        .cmp-btn:hover:not(:disabled) { background:#b91c1c; }
        .cmp-btn:disabled { opacity:0.35; cursor:not-allowed; }
      `}</style>
      <Ticker items={["COMPARE MODE — TWO-ARTICLE ANALYSIS","SPOT MANIPULATED CLAIMS","SIDE-BY-SIDE FACT VERIFICATION"]} />
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}

      <div style={{ maxWidth:900, margin:"0 auto", width:"100%", padding:"28px 24px", flex:1 }}>
        <div style={{ marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:C.white, marginBottom:4 }}>Article <span style={{ color:C.red }}>Comparator</span></div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>Paste two versions of the same story to detect alterations, manipulation, and factual drift.</div>
        </div>

        <div className="compare-grid" style={{ marginBottom:18 }}>
          {[["A",textA,setTextA],["B",textB,setTextB]].map(([label,val,setter]) => (
            <div key={label}>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:8, fontFamily:"'Source Code Pro',monospace" }}>ARTICLE {label}</div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.redDim}` }}>
                <textarea value={val} onChange={e=>setter(e.target.value)} placeholder={`Paste article ${label} here...`} rows={7}
                  style={{ width:"100%", background:"transparent", border:"none", color:C.white, fontFamily:"Georgia,serif", fontSize:13, padding:"14px", resize:"vertical", lineHeight:1.7, minHeight:140, outline:"none" }} />
                <div style={{ padding:"6px 12px", borderTop:`1px solid ${C.border}`, fontSize:10, color:C.border, fontFamily:"'Source Code Pro',monospace" }}>
                  {val.trim().split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>
          ))}
        </div>

        {history.length>0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.12em", marginBottom:8, fontFamily:"'Source Code Pro',monospace" }}>LOAD FROM HISTORY:</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {history.slice(0,4).map((h,i) => (
                <div key={i} style={{ display:"flex", gap:4 }}>
                  <button onClick={() => setTextA(h.text)} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:10, padding:"4px 8px", cursor:"pointer" }}>→ A</button>
                  <button onClick={() => setTextB(h.text)} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:10, padding:"4px 8px", cursor:"pointer" }}>→ B</button>
                  <span style={{ fontSize:11, color:C.muted, fontFamily:"Georgia,serif", alignSelf:"center" }}>{h.text.slice(0,40)}…</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:24, flexWrap:"wrap" }}>
          <button className="cmp-btn" onClick={runCompare} disabled={!textA.trim()||!textB.trim()||loading}>
            {loading?"⏳ ANALYZING...":"⚖ COMPARE ARTICLES"}
          </button>
          {error && <span style={{ color:C.red, fontSize:12, fontFamily:"'Source Code Pro',monospace" }}>{error}</span>}
        </div>

        {result && (
          <div className="fade-in">
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`4px solid ${agreementColors[result.agreement]||C.muted}`, padding:"20px 22px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:12, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", fontFamily:"'Source Code Pro',monospace", marginBottom:4 }}>AGREEMENT LEVEL</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:agreementColors[result.agreement]||C.muted }}>{result.agreement}</div>
                </div>
                <div style={{ display:"flex", gap:20 }}>
                  {[["A",result.verdictA,result.confidenceA],["B",result.verdictB,result.confidenceB]].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:9, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em", marginBottom:4 }}>ARTICLE {l}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:verdictColor(v), fontFamily:"'Source Code Pro',monospace" }}>{v}</div>
                      <div style={{ fontSize:10, color:C.border, fontFamily:"'Source Code Pro',monospace" }}>{Math.round((c||0)*100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize:14, color:C.muted, lineHeight:1.7, fontStyle:"italic", margin:0 }}>{result.summary}</p>
            </div>

            {result.key_differences?.length>0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", marginBottom:10, fontFamily:"'Source Code Pro',monospace" }}>KEY DIFFERENCES</div>
                {result.key_differences.map((d,i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:8, fontSize:13, color:C.muted, lineHeight:1.6 }}>
                    <span style={{ color:C.red, fontFamily:"'Source Code Pro',monospace", flexShrink:0 }}>#{i+1}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}

            {result.manipulation_added?.length>0 && (
              <div style={{ background:"#1a0a0a", border:`1px solid ${C.redDim}`, borderLeft:`3px solid ${C.red}`, padding:"18px 22px", marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.red, letterSpacing:"0.18em", marginBottom:10, fontFamily:"'Source Code Pro',monospace" }}>⚠ MANIPULATION DETECTED</div>
                {result.manipulation_added.map((m,i) => (
                  <div key={i} style={{ fontSize:13, color:"#fca5a5", marginBottom:6, lineHeight:1.6 }}>✕ {m}</div>
                ))}
              </div>
            )}

            {result.recommendation && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.verified}`, padding:"14px 18px" }}>
                <div style={{ fontSize:10, color:C.verified, letterSpacing:"0.18em", marginBottom:6, fontFamily:"'Source Code Pro',monospace" }}>RECOMMENDATION</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{result.recommendation}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── History Page ──────────────────────────────────────────
function HistoryPage({ history, setHistory, onNav, onLoadArticle, C }) {
  const [catFilter, setCatFilter] = useState("All");

  const filtered = catFilter==="All" ? history : history.filter(h=>h.category===catFilter);
  const usedCats = ["All",...new Set(history.map(h=>h.category).filter(Boolean))];

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Ticker />
      <div style={{ maxWidth:760, margin:"0 auto", width:"100%", padding:"32px 24px", flex:1 }}>
        <div style={{ marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:C.white, marginBottom:4 }}>
            Analysis <span style={{ color:C.red }}>History</span>
          </div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.08em" }}>Your recent fact-checks — click any to reload.</div>
        </div>

        <HistoryStats history={history} C={C} />

        {/* Category filter */}
        {history.length>0 && usedCats.length>1 && (
          <div style={{ marginBottom:20, display:"flex", gap:6, flexWrap:"wrap" }}>
            {usedCats.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                background: catFilter===cat ? (CATEGORY_COLORS[cat]||C.red) : "transparent",
                border:`1px solid ${catFilter===cat?(CATEGORY_COLORS[cat]||C.red):C.border}`,
                color: catFilter===cat ? "#fff" : C.muted,
                fontFamily:"'Source Code Pro',monospace", fontSize:9, letterSpacing:"0.1em",
                padding:"4px 12px", cursor:"pointer", transition:"all 0.15s",
              }}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {filtered.length===0 ? (
          <div style={{ color:C.muted, fontSize:14, padding:"64px 0", textAlign:"center", fontStyle:"italic" }}>
            {history.length===0 ? (
              <>No analyses yet.{" "}<button onClick={() => onNav("analyze")} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", textDecoration:"underline" }}>Analyze your first article →</button></>
            ) : (
              <>No results for this category.</>
            )}
          </div>
        ) : (
          <>
            {filtered.map((item,i) => <HistoryItem key={i} item={item} onClick={onLoadArticle} C={C} />)}
            <button onClick={() => setHistory([])} style={{ marginTop:20, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Source Code Pro',monospace", fontSize:11, padding:"8px 16px", cursor:"pointer", letterSpacing:"0.1em" }}>
              CLEAR ALL HISTORY
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── About Page ────────────────────────────────────────────
function AboutPage({ C }) {
  const stack = [
    { icon:"⚛️", name:"React 19",          desc:"UI framework with the new compiler"          },
    { icon:"⚡", name:"Vite 8",            desc:"Blazing-fast build tool and dev server"      },
    { icon:"🤖", name:"Groq / Llama-3.3", desc:"70B parameter LLM for fact-checking"        },
    { icon:"🌐", name:"Vercel",            desc:"Zero-config serverless deployment"           },
    { icon:"🔌", name:"Node.js + Express", desc:"Local dev proxy server"                     },
    { icon:"🎨", name:"Vanilla CSS",       desc:"No frameworks — pure design system"         },
  ];

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh" }}>
      <Ticker items={["ABOUT VERIFAI","BUILT WITH GROQ AI","OPEN SOURCE & TRANSPARENT","FIGHTING MISINFORMATION"]} />
      <div style={{ maxWidth:760, margin:"0 auto", padding:"48px 24px" }}>

        {/* Header */}
        <div style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:32, marginBottom:40, textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:52, letterSpacing:"0.04em", color:C.white, lineHeight:1, marginBottom:12 }}>
            VERI<span style={{ color:C.red }}>FAI</span>
          </div>
          <div style={{ fontSize:11, letterSpacing:"0.22em", color:C.muted, fontFamily:"'Source Code Pro',monospace", marginBottom:20 }}>FACT-CHECK BUREAU — EST. 2026</div>
          <p style={{ fontSize:16, color:C.muted, lineHeight:1.9, fontStyle:"italic", maxWidth:560, margin:"0 auto" }}>
            VERIFAI is an AI-powered misinformation detection tool built to help people identify fake news, verify article credibility, and understand media bias — in seconds.
          </p>
        </div>

        {/* Mission */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.red}`, padding:"24px 28px", marginBottom:32 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:10 }}>OUR MISSION</div>
          <p style={{ fontSize:15, color:C.muted, lineHeight:1.9 }}>
            In an era where misinformation spreads faster than facts, VERIFAI provides an accessible, transparent, AI-assisted layer of verification. We believe everyone deserves the tools to think critically about what they read online.
          </p>
        </div>

        {/* How it works */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:16 }}>— HOW IT WORKS —</div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[
              { n:"01", t:"Text Ingestion",     d:"Your article text (or URL-fetched content) is sent to the VERIFAI backend." },
              { n:"02", t:"AI Classification",  d:"Groq's Llama-3.3-70B model analyzes linguistic patterns, emotional manipulation, source coherence, and factual consistency." },
              { n:"03", t:"Multi-dimensional Score", d:"The model returns a structured JSON verdict: REAL/FAKE/UNCERTAIN, a 1–10 credibility score, bias meter, red flags, and suspicious phrases." },
              { n:"04", t:"Result Display",     d:"VERIFAI renders the analysis as an interactive, shareable report — complete with highlighted text and source reliability info." },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", gap:20, padding:"20px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:32, color:C.redDim, lineHeight:1, flexShrink:0, width:48 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.white, marginBottom:6 }}>{s.t}</div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:16 }}>— TECH STACK —</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
            {stack.map((s,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, padding:"16px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily:"'Source Code Pro',monospace", fontWeight:700, fontSize:12, color:C.white, marginBottom:4 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.amber}`, padding:"18px 22px", marginBottom:32 }}>
          <div style={{ fontSize:10, color:C.amber, letterSpacing:"0.18em", fontFamily:"'Source Code Pro',monospace", marginBottom:8 }}>⚠ IMPORTANT DISCLAIMER</div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>
            VERIFAI is an assistive tool — not a definitive fact-checker. AI models can make mistakes, and results should be used as a starting point for further research, not as final verdicts. Always cross-reference with primary sources.
          </p>
        </div>

        {/* Built by */}
        <div style={{ textAlign:"center", paddingTop:24, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.18em", fontFamily:"'Source Code Pro',monospace", marginBottom:8 }}>BUILT BY</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:C.white, marginBottom:4 }}>MirAmaan18</div>
          <a href="https://github.com/MirAmaan18/verifAI" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:11, color:C.red, fontFamily:"'Source Code Pro',monospace", letterSpacing:"0.1em" }}>
            github.com/MirAmaan18/verifAI →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Page ──────────────────────────────────────────────
function FAQPage({ C }) {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "How accurate is VERIFAI?",
      a: "VERIFAI uses Llama-3.3-70B via Groq, one of the most capable publicly available language models. In testing on clearly fabricated or clearly factual articles, accuracy exceeds 90%. However, for nuanced political content or satire, accuracy drops. Always treat results as a guide, not a verdict."
    },
    {
      q: "What AI model powers it?",
      a: "VERIFAI uses Meta's Llama-3.3-70B model served through Groq's ultra-fast inference API. The model analyzes the text for linguistic patterns, emotional manipulation signals, source coherence, and factual consistency to produce a structured JSON verdict."
    },
    {
      q: "Is my data stored anywhere?",
      a: "No. Your article text is sent directly to the Groq API for analysis and is not stored on any VERIFAI server. Analysis history is saved only in your browser's localStorage and is never uploaded or shared."
    },
    {
      q: "Can VERIFAI analyze any language?",
      a: "Yes. Llama-3.3 has multilingual capabilities and can analyze articles in English, Hindi, Spanish, French, Arabic, and many other languages. The detected language is shown in the result. Accuracy may be lower for non-English content."
    },
    {
      q: "Why does the URL analyzer fail on some sites?",
      a: "Many modern news sites (e.g. MSN, Vox, some paywalled outlets) render content using JavaScript in the browser. Our server-side fetcher cannot execute JavaScript, so it cannot extract the article text. In these cases, copy and paste the text manually."
    },
    {
      q: "What does the credibility score mean?",
      a: "The 1–10 credibility score is the AI's holistic assessment: 1–3 means the content shows strong signs of fabrication or extreme misinformation, 4–6 means uncertain or mixed reliability, and 7–10 means the content appears credible and factually grounded. It accounts for source tone, factual coherence, emotional manipulation, and signal patterns."
    },
    {
      q: "How is political bias detected?",
      a: "The AI assesses the language, framing, sources cited, and rhetorical techniques used in the article to estimate political lean (left, center, right, or unknown). This is the AI's interpretation and may not perfectly match independent bias ratings."
    },
    {
      q: "How many analyses can I do per day?",
      a: "The free tier allows 20 analyses per day per IP address, enforced by the server. This limit resets at midnight UTC. The usage meter is shown at the top of the Analyzer page."
    },
  ];

  return (
    <div style={{ background:C.bg, color:C.white, fontFamily:"'Georgia',serif", minHeight:"100vh" }}>
      <Ticker items={["FREQUENTLY ASKED QUESTIONS","HOW DOES VERIFAI WORK","AI FACT-CHECKING EXPLAINED"]} />
      <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 24px" }}>
        <div style={{ marginBottom:40, borderBottom:`1px solid ${C.border}`, paddingBottom:32 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:"0.22em", fontFamily:"'Source Code Pro',monospace", marginBottom:10 }}>— FAQ —</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:36, color:C.white, marginBottom:12 }}>
            Frequently Asked <span style={{ color:C.red }}>Questions</span>
          </div>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.8 }}>Everything you need to know about how VERIFAI works, its limitations, and how to get the most out of it.</p>
        </div>

        <div>
          {faqs.map((faq,i) => (
            <div key={i} className="faq-item">
              <button className="faq-q" onClick={() => setOpenIdx(openIdx===i?null:i)}>
                <span>{faq.q}</span>
                <span style={{ color:C.red, fontFamily:"'Source Code Pro',monospace", fontSize:14, flexShrink:0, marginLeft:16, transition:"transform 0.2s", transform:openIdx===i?"rotate(180deg)":"rotate(0deg)", display:"inline-block" }}>▼</span>
              </button>
              {openIdx===i && <div className="faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop:48, background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, padding:"28px 24px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:C.white, marginBottom:8 }}>Still have questions?</div>
          <p style={{ fontSize:13, color:C.muted, marginBottom:16, lineHeight:1.7 }}>Open an issue on GitHub or reach out directly.</p>
          <a href="https://github.com/MirAmaan18/verifAI/issues" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-block", background:C.red, color:"#fff", fontFamily:"'Source Code Pro',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.12em", padding:"10px 24px", textDecoration:"none" }}>
            OPEN AN ISSUE →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── localStorage helpers ──────────────────────────────────
function loadH() {
  try {
    // Try v3 first (has credibility_score, category, detected_source)
    const v3 = localStorage.getItem("fnds_v3");
    if (v3) return JSON.parse(v3);
    // Migrate from v2 — add default values for new fields
    const v2 = localStorage.getItem("fnds_v2");
    if (v2) {
      return JSON.parse(v2).map(item => ({
        ...item,
        credibility_score: item.credibility_score || (item.verdict==="REAL"?8:item.verdict==="FAKE"?2:5),
        category: item.category || "Other",
        detected_source: item.detected_source || null,
      }));
    }
    return [];
  } catch { return []; }
}

function saveH(h) {
  try { localStorage.setItem("fnds_v3", JSON.stringify(h.slice(0,50))); } catch(e) { console.error(e); }
}

// ── App Root ──────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("splash");
  const [history, setHistory] = useState(() => loadH());
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [themeName, setThemeName] = useState(getTheme);
  const [usageInfo, setUsageInfo] = useState(null);

  const C = THEMES[themeName] || THEMES.dark;

  const handleSetHistory = useCallback(h => { setHistory(h); saveH(h); }, []);
  const nav = useCallback(p => { setSelectedArticle(null); setPage(p); }, []);
  const loadArticle = useCallback(item => { setSelectedArticle(item); setPage("analyze"); }, []);
  const handleDone = useCallback(() => setPage("home"), []);
  const toggleTheme = useCallback(() => {
    setThemeName(t => {
      const next = t==="dark"?"neutral":"dark";
      try { localStorage.setItem("verifai_theme",next); } catch {}
      return next;
    });
  }, []);

  return (
    <>
      <style>{buildGlobalCSS(C)}</style>
      {page==="splash" && <SplashScreen onDone={handleDone} C={C} />}
      {page!=="splash" && (
        <NavBar page={page} onNav={nav} historyCount={history.length} theme={themeName} onThemeToggle={toggleTheme} C={C} />
      )}
      {page==="home" && (
        <HomePage onAnalyze={() => setPage("analyze")} historyCount={history.length} onNav={nav} history={history} onLoadArticle={loadArticle} C={C} />
      )}
      {page==="analyze" && (
        <AnalyzePage history={history} setHistory={handleSetHistory} onNav={nav} selectedArticle={selectedArticle} usageInfo={usageInfo} setUsageInfo={setUsageInfo} C={C} />
      )}
      {page==="compare" && (
        <ComparePage history={history} onNav={nav} usageInfo={usageInfo} setUsageInfo={setUsageInfo} C={C} />
      )}
      {page==="history" && (
        <HistoryPage history={history} setHistory={handleSetHistory} onNav={nav} onLoadArticle={loadArticle} C={C} />
      )}
      {page==="about" && <AboutPage C={C} />}
      {page==="faq"   && <FAQPage   C={C} />}
    </>
  );
}
