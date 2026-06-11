// Vercel serverless function — mirrors POST /api/fetch-url in server.js

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ");
}

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
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    || html.match(/<script>self\.__next_f\.push\(([\s\S]*?)\)<\/script>/i);
  if (!m) return null;
  try {
    const json = JSON.parse(m[1]);
    return deepFindArticleText(json);
  } catch { return null; }
}

function extractEmbeddedJson(html) {
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/i,
    /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]+?});/i,
    /window\.__INITIAL_DATA__\s*=\s*({[\s\S]+?});/i,
    /window\.__DATA__\s*=\s*({[\s\S]+?});/i,
    /window\.__nuxt__\s*=\s*({[\s\S]+?});/i,
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

async function fetchHtml(url) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

    const response = await fetchHtml(url);
    if (!response.ok) {
      return res.status(502).json({ error: `Could not reach that page (HTTP ${response.status}). The site may block automated access.` });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return res.status(415).json({ error: "URL does not point to an HTML page" });
    }
    html = await response.text();
    finalUrl = response.url || url;

    let text = extractJsonLd(html);

    if (!text || text.length < 200) {
      const nd = extractNextData(html);
      if (nd && nd.length > (text?.length || 0)) text = nd;
    }

    if (!text || text.length < 200) {
      const ej = extractEmbeddedJson(html);
      if (ej && ej.length > (text?.length || 0)) text = ej;
    }

    if (!text || text.length < 200) {
      const at = extractByTag(html, "article");
      if (at.length > (text?.length || 0)) text = at;
    }

    if (!text || text.length < 200) {
      const mt = extractByTag(html, "main");
      if (mt.length > (text?.length || 0)) text = mt;
    }

    if (!text || text.length < 200) {
      const pt = extractParagraphs(html);
      if (pt.length > (text?.length || 0)) text = pt;
    }

    // AMP fallback
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

    // Find original publisher URL for aggregator pages
    let sourceUrl = null;
    if (!text || text.length < 200) {
      try {
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
                  sourceUrl = cu; break;
                }
              }
              if (sourceUrl) break;
            }
          } catch {}
          if (sourceUrl) break;
        }

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

    // Full page strip (last resort)
    if (!text || text.length < 100) {
      text = stripTagsToText(
        html
          .replace(/<nav[\s\S]*?<\/nav>/gi, "")
          .replace(/<header[\s\S]*?<\/header>/gi, "")
          .replace(/<footer[\s\S]*?<\/footer>/gi, "")
          .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      );
    }

    // Wayback Machine cached snapshot
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
}
