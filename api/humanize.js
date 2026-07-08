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
Rewrite the following text so it sounds like it was naturally written by a real college student.

Rules:

- Keep the same meaning.
- Keep the same facts.
- Use contractions naturally.
- Vary sentence lengths.
- Use simple vocabulary.
- Add a natural human tone.
- Don't sound robotic.
- Don't add new information.
- Don't remove important information.
- Return ONLY the rewritten text.

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

    const rewritten =
      data.candidates[0].content.parts[0].text.trim();

    return res.status(200).json({
      text: rewritten
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }
}