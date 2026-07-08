export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API KEY:", apiKey ? "FOUND" : "NOT FOUND");

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const prompt = `
You rewrite text to sound exactly like a real high school or college student writing it themselves — messy, authentic, with all the natural quirks of actual student work.

DO THIS:
- Use contractions constantly (it's, don't, can't, they're, I've)
- Vary sentence length wildly: mix short punchy sentences with longer rambling ones
- Use casual, everyday words instead of fancy vocabulary
- Add filler words naturally: "like", "kind of", "I guess", "basically", "honestly"
- Include small imperfections: occasional informal grammar, restating ideas, self-corrections in the flow
- Use first person and personal voice
- Add specific examples or details that feel real
- Show the thinking process naturally
- Don't be overly polished.

KEEP:
- Original meaning
- Original facts
- Similar length

Return ONLY the rewritten text.

Text:
${text}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const rewritten =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.status(200).json({
      text: rewritten.trim()
    });

  } catch (err) {
    console.error("FULL ERROR:", err);

    res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
}