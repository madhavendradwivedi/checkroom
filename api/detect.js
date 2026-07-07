module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const system = `You evaluate if student writing was written by a human or AI. Use this rubric:

STRONG HUMAN MARKERS (each point lowers the score):
- Contractions used naturally (it's, don't, can't, they're, I've, etc.)
- Sentence length varies a lot (short, medium, rambling, fragments)
- Casual filler words present (like, kind of, basically, honestly, I guess, so)
- Specific personal examples or observations, not generic
- First-person voice and perspective
- Minor imperfections: restating ideas, incomplete thoughts, informal grammar
- Shows thinking process (like, "what I mean is...", "basically...", self-corrections)
- Vocabulary is simple and conversational, matches teen/college student age
- Uneven or natural paragraph structure, not perfectly balanced

STRONG AI MARKERS (each adds to the score):
- Heavy use of formal vocabulary (furthermore, moreover, albeit, facilitate)
- Every sentence perfectly constructed with zero errors
- Generic examples that could apply anywhere
- No contractions at all
- Unnaturally smooth transitions between ideas
- No filler words or hedging in a natural way
- Distant, formal tone throughout
- Overly symmetrical or balanced structure
- No visible thinking process or self-correction
- Vocabulary is unusually consistent and advanced

SCORING RULE: Default to human unless you find 3+ strong AI markers. Presence of casual language and contractions = likely human (under 50%). Perfect polish + formal tone + no contractions = likely AI (above 70%).

Respond with ONLY valid JSON: {"percentage": <0-100>, "verdict": "<short phrase>", "signals": ["observation 1", "observation 2", "observation 3"]}`;

  try {
 const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 700,
    system: system,
    messages: [
      {
        role: 'user',
        content: text
      }
    ]
  })
});

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'API error' });
    }

    const data = await response.json();
    const resultText = data.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    const cleaned = resultText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json(parsed);
  } catch (error) {
  console.error(error);
  return res.status(500).json({
    error: error.message,
    stack: error.stack
  });
}
