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

  const system = `You rewrite text to sound exactly like a real high school or college student writing it themselves — messy, authentic, with all the natural quirks of actual student work.

DO THIS:
- Use contractions constantly (it's, don't, can't, they're, I've)
- Vary sentence length wildly: mix short punchy sentences with longer rambling ones
- Use casual, everyday words instead of fancy vocabulary
- Add filler words naturally: "like", "kind of", "I guess", "basically", "honestly"
- Include small imperfections: occasional informal grammar, restating ideas, self-corrections in the flow
- Use first person and personal voice (I think, in my opinion, from what I can tell)
- Add specific examples or details that feel real and personal, not generic
- Show your thinking process (like "so what that means is...")
- Break the "rules" of formal writing intentionally — start sentences with "And" or "But", use fragments
- Don't be overly polished — roughness is authenticity

KEEP:
- All the original facts, arguments, and meaning
- The same general length and structure
- The core ideas intact

Output ONLY the rewritten text. No headers, no markdown, no preamble.`;

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
    max_tokens: 1000,
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

    res.status(200).json({ text: resultText.trim() });
  } catch (error) {
  console.error(error);
  return res.status(500).json({
    error: error.message,
    stack: error.stack
  });
}