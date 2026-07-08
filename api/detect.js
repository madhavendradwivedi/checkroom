export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const prompt = `
You evaluate whether student writing appears AI-written or human-written.

Respond ONLY in JSON:

{
  "percentage": 0-100,
  "verdict": "Likely Human" or "Likely AI",
  "signals": [
    "reason 1",
    "reason 2",
    "reason 3"
  ]
}

Text:
${text}
`;

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

    const result =
      data.candidates[0].content.parts[0].text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    res.status(200).json(JSON.parse(result));

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
}