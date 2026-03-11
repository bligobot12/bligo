import { NextResponse } from 'next/server';

const INTENT_WEIGHTS = {
  trade_service: { location: 40, skills: 30, trust: 15, posts: 10, recency: 5 },
  investment: { location: 5, skills: 35, trust: 25, posts: 25, recency: 10 },
  advisory: { location: 0, skills: 40, trust: 30, posts: 20, recency: 10 },
  partnership: { location: 10, skills: 30, trust: 30, posts: 20, recency: 10 },
  virtual_service: { location: 0, skills: 45, trust: 25, posts: 20, recency: 10 },
  vendor_supplier: { location: 20, skills: 35, trust: 20, posts: 15, recency: 10 },
};

const FALLBACK = {
  intent_type: 'trade_service',
  intent_tags: [],
  location: null,
  suggested_label: 'General Search',
};

export async function POST(request) {
  const { query = '' } = await request.json().catch(() => ({}));

  let classified = { ...FALLBACK, intent_tags: query ? [query] : [] };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are a search intent classifier for a professional networking platform.
Given a search query, return ONLY a JSON object with these fields:
- intent_type: one of: trade_service, investment, advisory, partnership, virtual_service, vendor_supplier
- intent_tags: array of 2-5 key skill/specialty tags extracted from the query
- location: city or region extracted from query, or null
- suggested_label: human readable label like "Local Trade/Service" or "Global Advisory"
Return only valid JSON, no markdown, no explanation.`,
          messages: [{ role: 'user', content: query }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const text = data?.content?.[0]?.text || '{}';
      const parsed = JSON.parse(text);
      classified = {
        ...FALLBACK,
        ...parsed,
        intent_tags: Array.isArray(parsed?.intent_tags) ? parsed.intent_tags : [],
      };
    } catch {
      // fallback below
    }
  }

  return NextResponse.json({
    ...classified,
    weights: INTENT_WEIGHTS[classified.intent_type] || INTENT_WEIGHTS.trade_service,
  });
}
