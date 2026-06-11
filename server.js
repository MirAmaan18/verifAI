import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ── Rate limiting (20 requests / IP / day) ────────────────
const rateLimitMap = new Map(); // ip -> { count, resetAt }
const DAILY_LIMIT = 20;

function getRateInfo(ip) {
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  if (!rateLimitMap.has(ip) || rateLimitMap.get(ip).resetAt <= now) {
    rateLimitMap.set(ip, { count: 0, resetAt });
  }
  return rateLimitMap.get(ip);
}

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const info = getRateInfo(ip);
  if (info.count >= DAILY_LIMIT) {
    return res.status(429).json({
      error: "Daily limit reached",
      message: `You have used all ${DAILY_LIMIT} checks for today. Resets at midnight UTC.`,
      remaining: 0,
      total: DAILY_LIMIT,
    });
  }
  info.count++;
  res.setHeader("X-RateLimit-Remaining", DAILY_LIMIT - info.count);
  res.setHeader("X-RateLimit-Total", DAILY_LIMIT);
  next();
}

// ── Shared Groq caller ────────────────────────────────────
async function callGroq(messages, temperature = 0.1) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error("Groq API error"), { details: data });
  return data.choices?.[0]?.message?.content || "{}";
}

// ── POST /api/analyze ─────────────────────────────────────
app.post("/api/analyze", rateLimitMiddleware, async (req, res) => {
  try {
    const { userText } = req.body;
    if (!userText) return res.status(400).json({ error: "Missing userText" });

    const prompt = `You are an expert fact-checker and misinformation analyst.
Analyze the following news text and determine if it is REAL, FAKE, or UNCERTAIN.
Respond ONLY with a valid JSON object — no markdown, no extra text, nothing else.

Format:
{"verdict":"REAL|FAKE|UNCERTAIN","confidence":0.0-1.0,"real_score":0.0-1.0,"fake_score":0.0-1.0,"summary":"1-2 sentence explanation","signals":["signal1","signal2","signal3"],"red_flags":["flag1","flag2"],"bias":"left|center|right|unknown","emotional_tone":0.0-1.0,"language":"ISO-639-1 code e.g. en","suspicious_phrases":["phrase1","phrase2"]}

Rules:
- verdict must be exactly "REAL", "FAKE", or "UNCERTAIN"
- Use "UNCERTAIN" when confidence is below 0.65 or the claim cannot be verified
- confidence: 0.5 = very unsure, 1.0 = certain
- real_score + fake_score must equal 1.0
- red_flags must be [] if verdict is REAL
- suspicious_phrases: up to 5 verbatim phrases from the text that are misleading or emotionally manipulative (empty [] if REAL)
- emotional_tone: 0.0 = completely neutral/factual, 1.0 = extremely sensationalist/emotionally manipulative
- bias: political leaning of the content ("left", "center", "right", or "unknown")
- language: ISO 639-1 code of the language the article is written in

News text to analyze:
"${userText}"`;

    const raw = await callGroq([
      { role: "system", content: "You are an expert fact-checker. Respond ONLY with valid JSON, no markdown, no extra text." },
      { role: "user", content: prompt },
    ]);

    let clean = raw.trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];
    JSON.parse(clean); // validate

    const remaining = parseInt(res.getHeader("X-RateLimit-Remaining") ?? DAILY_LIMIT, 10);
    res.json({ result: clean, remaining, total: DAILY_LIMIT });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Analysis failed", message: err.message });
  }
});

// ── HTML text extraction helpers ──────────────────────────
function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ");
}

// Deep-search a parsed JSON object for article text fields
function deepFindArticleText(obj, depth = 0) {
  if (depth > 8 || !obj || typeof obj !== "object") return null;
  const keys = ["articleBody", "body", "content", "article", "text", "description", "bodyText", "fullText", "story"];
  for (const k of keys) {
    if (typeof obj[k] === "string" && obj[k].length > 200) return obj[k];
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        const found = deepFindArticleText(item, depth + 1);
        if (found) return found;
      }
    } else if (val && typeof val === "object") {
      const found = deepFindArticleText(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function stripTagsToText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1].trim());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const body = item.articleBody || item.description || item.text;
        if (body && body.length > 200) return body;
        if (Array.isArray(item["@graph"])) {
          for (const g of item["@graph"]) {
            const gb = g.articleBody || g.description || g.text;
            if (gb && gb.length > 200) return gb;
          }
        }
      }
    } catch { /* skip */ }
  }
  return null;
}

function extractNextData(html) {
  // Next.js embeds all page data in __NEXT_DATA__ script tag
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    || html.match(/<script>self\.__next_f\.push\(([\s\S]*?)\)<\/script>/i);
  if (!m) return null;
  try {
    const json = JSON.parse(m[1]);
    return deepFindArticleText(json);
  } catch { return null; }
}

function extractEmbeddedJson(html) {
  // Look for large JSON data blobs in any script tag (React, Vue, Nuxt, Angular SSR, etc.)
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/i,
    /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]+?});/i,
    /window\.__INITIAL_DATA__\s*=\s*({[\s\S]+?});/i,
    /window\.__DATA__\s*=\s*({[\s\S]+?});/i,
    /window\.__nuxt__\s*=\s*({[\s\S]+?});/i,
    /window\.NREUM\|\|\(NREUM={}\)[\s\S]*?;\s*({[\s\S]+?});/i,
    /__REDUX_STATE__\s*=\s*({[\s\S]+?});/i,
    /window\.msCommonShell\s*=\s*({[\s\S]+?});/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      try {
        const json = JSON.parse(m[1]);
        const found = deepFindArticleText(json);
        if (found) return found;
      } catch { /* skip */ }
    }
  }
  return null;
}

function extractParagraphs(html) {
  // Collect all <p> tags and join them — works when there's no clear article container
  const parts = [];
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = stripTagsToText(m[1]).trim();
    if (t.length > 40) parts.push(t);
  }
  return parts.join("\n");
}

function extractByTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const parts = [];
  for (const m of html.matchAll(re)) {
    const t = stripTagsToText(m[1]).trim();
    if (t.length > 80) parts.push(t);
  }
  return parts.join("\n\n");
}

function extractMetaContent(html, property) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${property}["']`, "i"));
  return m ? decodeHtmlEntities(m[1].trim()) : null;
}

async function fetchHtml(url, extraHeaders = {}) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      ...extraHeaders,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
}

// ── POST /api/fetch-url ───────────────────────────────────
app.post("/api/fetch-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });

    let parsed;
    try { parsed = new URL(url); } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only http/https URLs are supported" });
    }

    let html = "";
    let finalUrl = url;

    // ── Primary fetch
    const response = await fetchHtml(url);
    if (!response.ok) {
      return res.status(502).json({ error: `Could not reach that page (HTTP ${response.status}). The site may block automated access.` });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return res.status(415).json({ error: "URL does not point to an HTML page" });
    }
    html = await response.text();
    finalUrl = response.url || url; // follow redirects

    // ── Strategy 1: JSON-LD structured data
    let text = extractJsonLd(html);

    // ── Strategy 2: __NEXT_DATA__ (Next.js — MSN, Vox, etc.)
    if (!text || text.length < 200) {
      const nd = extractNextData(html);
      if (nd && nd.length > (text?.length || 0)) text = nd;
    }

    // ── Strategy 3: Embedded window.__INITIAL_STATE__ / __DATA__ etc.
    if (!text || text.length < 200) {
      const ej = extractEmbeddedJson(html);
      if (ej && ej.length > (text?.length || 0)) text = ej;
    }

    // ── Strategy 4: <article> tag
    if (!text || text.length < 200) {
      const at = extractByTag(html, "article");
      if (at.length > (text?.length || 0)) text = at;
    }

    // ── Strategy 5: <main> tag
    if (!text || text.length < 200) {
      const mt = extractByTag(html, "main");
      if (mt.length > (text?.length || 0)) text = mt;
    }

    // ── Strategy 6: All <p> tags (paragraph harvest)
    if (!text || text.length < 200) {
      const pt = extractParagraphs(html);
      if (pt.length > (text?.length || 0)) text = pt;
    }

    // ── Strategy 7: AMP fallback
    if (!text || text.length < 200) {
      try {
        const ampUrl = finalUrl.endsWith("/") ? finalUrl + "amp" : finalUrl + "/amp";
        const ampResp = await fetchHtml(ampUrl);
        if (ampResp.ok) {
          const ampHtml = await ampResp.text();
          const ampText = extractByTag(ampHtml, "article") || extractParagraphs(ampHtml);
          if (ampText && ampText.length > (text?.length || 0)) text = ampText;
        }
      } catch { /* continue */ }
    }

    // ── Strategy 7b: Find original publisher URL embedded in aggregator pages (MSN, Apple News, etc.)
    //    Many aggregators store the canonical source URL in metadata — fetch that instead.
    let sourceUrl = null;
    if (!text || text.length < 200) {
      try {
        // JSON-LD: sameAs, mainEntityOfPage, or url field pointing off-site
        const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
        for (const m of ldMatches) {
          try {
            const ld = JSON.parse(m[1].trim());
            const items = Array.isArray(ld) ? ld : Array.isArray(ld["@graph"]) ? ld["@graph"] : [ld];
            for (const item of items) {
              const candidates = [item.url, item.mainEntityOfPage, ...(Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs])].filter(Boolean);
              for (const c of candidates) {
                const cu = typeof c === "string" ? c : c?.["@id"] || c?.url;
                if (cu && cu.startsWith("http") && !cu.includes(parsed.hostname)) {
                  sourceUrl = cu;
                  break;
                }
              }
              if (sourceUrl) break;
            }
          } catch {}
          if (sourceUrl) break;
        }

        // Fallback: <link rel="canonical"> or og:url pointing off-site
        if (!sourceUrl) {
          const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
            || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
          if (canonMatch && canonMatch[1] && !canonMatch[1].includes(parsed.hostname)) {
            sourceUrl = canonMatch[1];
          }
        }
        if (!sourceUrl) {
          const ogUrl = extractMetaContent(html, "og:url");
          if (ogUrl && !ogUrl.includes(parsed.hostname)) sourceUrl = ogUrl;
        }

        // Fetch the original source
        if (sourceUrl) {
          const srcResp = await fetchHtml(sourceUrl);
          if (srcResp.ok) {
            const srcHtml = await srcResp.text();
            const srcText = extractJsonLd(srcHtml) || extractByTag(srcHtml, "article")
              || extractByTag(srcHtml, "main") || extractParagraphs(srcHtml);
            if (srcText && srcText.length > (text?.length || 0)) text = srcText;
          }
        }
      } catch { /* continue */ }
    }

    // ── Strategy 8: Full page strip (last resort)
    if (!text || text.length < 100) {
      text = stripTagsToText(
        html
          .replace(/<nav[\s\S]*?<\/nav>/gi, "")
          .replace(/<header[\s\S]*?<\/header>/gi, "")
          .replace(/<footer[\s\S]*?<\/footer>/gi, "")
          .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      );
    }

    // ── Strategy 9: Wayback Machine cached snapshot
    if (!text || text.length < 200) {
      try {
        const cdxResp = await fetch(
          `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (cdxResp.ok) {
          const cdxData = await cdxResp.json();
          const snapUrl = cdxData?.archived_snapshots?.closest?.url;
          if (snapUrl) {
            const snapResp = await fetchHtml(snapUrl);
            if (snapResp.ok) {
              const snapHtml = await snapResp.text();
              const snapText = extractJsonLd(snapHtml)
                || extractByTag(snapHtml, "article")
                || extractByTag(snapHtml, "main")
                || extractParagraphs(snapHtml);
              if (snapText && snapText.length > (text?.length || 0)) {
                text = snapText;
                sourceUrl = sourceUrl || snapUrl;
              }
            }
          }
        }
      } catch { /* wayback unavailable */ }
    }

    text = (text || "").replace(/\s{3,}/g, "\n\n").trim().slice(0, 6000);

    if (!text || text.length < 80) {
      const metaDesc = extractMetaContent(html, "og:description") || extractMetaContent(html, "description");
      const ogTitle = extractMetaContent(html, "og:title") || extractMetaContent(html, "twitter:title");
      return res.status(422).json({
        error: `${parsed.hostname} loads content with JavaScript and cannot be scraped automatically.`,
        hint: metaDesc ? `${ogTitle ? ogTitle + "\n\n" : ""}${metaDesc}` : null,
        sourceUrl: sourceUrl || null,
      });
    }

    const title =
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      parsed.hostname;

    res.json({ text, title: decodeHtmlEntities(title), url: sourceUrl || finalUrl });
  } catch (err) {
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "URL fetch timed out. The site may be slow or block automated access." });
    }
    console.error("Fetch-URL error:", err);
    res.status(500).json({ error: "Failed to fetch URL", message: err.message });
  }
});


// ── POST /api/compare ─────────────────────────────────────
app.post("/api/compare", rateLimitMiddleware, async (req, res) => {
  try {
    const { textA, textB } = req.body;
    if (!textA || !textB) return res.status(400).json({ error: "Both textA and textB are required" });

    const prompt = `You are an expert fact-checker comparing two versions of a news story.
Analyze both texts and determine how they relate to each other.
Respond ONLY with a valid JSON object — no markdown, no extra text, nothing else.

Format:
{"agreement":"HIGH|MEDIUM|LOW|CONTRADICTORY","summary":"2-3 sentence comparison summary","verdictA":"REAL|FAKE|UNCERTAIN","verdictB":"REAL|FAKE|UNCERTAIN","confidenceA":0.0-1.0,"confidenceB":0.0-1.0,"key_differences":["diff1","diff2","diff3"],"manipulation_added":["change1","change2"],"recommendation":"one sentence advice for the reader"}

Rules:
- agreement: how much do the two texts agree factually?
  - HIGH: mostly same facts, minor wording differences
  - MEDIUM: same topic but some factual disagreements
  - LOW: same topic but significantly different claims
  - CONTRADICTORY: directly opposing claims
- manipulation_added: phrases/claims added to one version to manipulate (may be empty [])

Article A:
"${textA}"

Article B:
"${textB}"`;

    const raw = await callGroq([
      { role: "system", content: "You are an expert fact-checker. Respond ONLY with valid JSON." },
      { role: "user", content: prompt },
    ]);

    let clean = raw.trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];
    JSON.parse(clean);

    const remaining = parseInt(res.getHeader("X-RateLimit-Remaining") ?? DAILY_LIMIT, 10);
    res.json({ result: clean, remaining, total: DAILY_LIMIT });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "Comparison failed", message: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────
app.listen(3001, () => {
  console.log("✅ VERIFAI proxy server running on http://localhost:3001");
  console.log("🔑 Groq API key:", process.env.GROQ_API_KEY ? "LOADED" : "MISSING — check .env");
});
