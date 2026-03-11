import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a professional skills extractor for Bligo, a trust-based networking platform.
Your job is to have a friendly conversation to discover the user's professional skills across 6 categories:
1. Work history & experience
2. Technical skills & tools
3. Industry knowledge
4. Soft skills & strengths
5. Current projects & focus areas
6. Certifications & credentials

Ask one focused question at a time. After 6-8 exchanges, say "I have enough to generate your skills profile" and end with EXACTLY this JSON block on its own line:
SKILLS_JSON:{"signals":[{"tag":"skill name","confidence":0.0-1.0,"source":"guided_chat","cluster":"category"}]}

Confidence guide: 0.9+ = expert/certified, 0.7-0.9 = strong/experienced, 0.5-0.7 = working knowledge, 0.3-0.5 = familiar.
Categories for cluster field: work_history, technical, industry, soft_skills, current_focus, credentials.
Extract 8-15 skills. Be conversational and encouraging. Start by introducing yourself briefly and asking about their current work.`;

export async function POST(request) {
  const { messages = [] } = await request.json().catch(() => ({}));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ text: 'Missing Anthropic API key on server.' }, { status: 500 });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const text = data.content?.[0]?.text || 'Sorry, something went wrong. Please try again.';
  return NextResponse.json({ text });
}
