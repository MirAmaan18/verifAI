// Vercel serverless function — mirrors POST /api/compare in server.js

const DAILY_LIMIT = 20;

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

    res.json({ result: clean, remaining: DAILY_LIMIT, total: DAILY_LIMIT });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "Comparison failed", message: err.message });
  }
}
