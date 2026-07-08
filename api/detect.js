export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({
      error: "No text provided"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing"
    });
  }

  const prompt = `
You are an AI writing detector.

Analyze the following student writing.

Return ONLY valid JSON.

{
  "percentage": number,
  "verdict": "Likely Human" or "Likely AI",
  "signals":[
    "reason 1",
    "reason 2",
    "reason 3"
  ]
}

Rules:

- Human writing usually contains contractions.
- Human writing varies sentence length.
- Human writing sounds personal.
- AI writing sounds formal and perfect.
- Give a realistic score.

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

    const raw = await response.text();

    console.log(raw);

    const data = JSON.parse(raw);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (!data.candidates) {
      return res.status(500).json({
        error: "Gemini returned no candidates",
        data
      });
    }

    let output =
      data.candidates[0].content.parts[0].text;

    output = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result;

    try {
      result = JSON.parse(output);
    } catch {

      result = {
        percentage: 50,
        verdict: "Unable to determine",
        signals: [
          output
        ]
      };

    }

    return res.status(200).json(result);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }

}