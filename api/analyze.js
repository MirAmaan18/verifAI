export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userText } = req.body;
    if (!userText) {
      return res.status(400).json({ error: "Missing userText in request body" });
    }

    const prompt = `You are an expert fact-checker and misinformation analyst.
Analyze the following news text and determine if it is REAL or FAKE.
Respond ONLY with a valid JSON object — no markdown, no extra text, nothing else.

Format:
{"verdict":"REAL or FAKE","confidence":0.0-1.0,"real_score":0.0-1.0,"fake_score":0.0-1.0,"summary":"1-2 sentence explanation","signals":["signal1","signal2","signal3"],"red_flags":["flag1","flag2"]}

Rules:
- verdict must be exactly "REAL" or "FAKE"
- confidence is how certain you are (0.5 = unsure, 1.0 = certain)
- real_score + fake_score must equal 1.0
- red_flags must be empty array [] if verdict is REAL
- signals are 3 key observations that led to your decision

News text to analyze:
"${userText}"`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert fact-checker. Respond ONLY with valid JSON, no markdown, no extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ error: "Groq API error", details: data });
    }

    const raw = data.choices?.[0]?.message?.content || "{}";
    let clean = raw.trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      clean = jsonMatch[0];
    }

    // Validate it parses correctly
    JSON.parse(clean);

    res.json({ result: clean });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Analysis failed", message: err.message });
  }
}
