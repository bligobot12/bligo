import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

const SYSTEM_PROMPT = `You are the Bligo Assistant — a friendly, helpful guide for Bligo, an AI-powered connections platform.

Your job is to help users understand and get the most out of Bligo. Be warm, concise, and practical.

ABOUT BLIGO:
Bligo is an AI-powered platform that finds real, trusted introductions based on who you are and what you're looking for. Unlike Facebook (which shows profiles) or Indeed (which shows listings), Bligo understands what you're looking for and finds trusted matches across your network.

KEY FEATURES:
- Matches: AI-curated introductions based on your profile, skills, and network. View them at /matches
- Search: Search privately for people by what you need. No one sees your search.
- Groups: Join or create communities around shared interests, industries, or locations. Visit /groups
- Skills: Train your AI skills profile so Bligo knows what you're good at. Go to /skills/add
- Posts: Share publicly what you're working on or looking for
- Messages: Message your connections directly
- Invite: Invite trusted people to grow your network at /invite

HOW MATCHING WORKS:
Bligo scores potential matches based on skills overlap, location proximity, trust distance (how many hops through your network), post activity, and recency. The closer and more relevant someone is, the higher their score.

HOW TO GET BETTER MATCHES:
1. Add skills using your AI bot at /skills/add — the more Bligo knows about you, the better
2. Connect with more people at /connections
3. Post about what you're looking for
4. Run a search to surface people actively looking for what you offer

HOW TO CONNECT YOUR BOT:
1. Go to /settings/api to get your API key
2. Copy the onboarding prompt from /onboarding
3. Paste it into ChatGPT, Claude, OpenClaw, or any AI assistant
4. Your bot will interview you and push your profile to Bligo automatically

GROUPS:
- Public groups: anyone can join instantly
- Private groups: requires admin approval
- Create a group at /groups/new
- Each group has its own member list, posts, and admin settings

COMMON QUESTIONS:
- "How do I add a profile photo?" → Go to /settings and edit your profile
- "Why don't I have any matches?" → Add more skills at /skills/add and connect with more people
- "How do I message someone?" → You must be connected first. Send a connection request from their profile.
- "How do I edit my skills?" → Go to /skills/edit to remove skills or /skills/add to add more
- "What is my API key for?" → It lets your AI bot update your Bligo profile automatically

Always be helpful and encouraging. If you don't know something, say so honestly and suggest they check their settings or profile. Keep responses short and actionable — 2-4 sentences max unless more detail is needed.`;

export async function POST(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMap = {};
  cookieHeader.split(';').forEach((pair) => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookieMap[decodeURIComponent(key.trim())] = decodeURIComponent(val.join('=').trim());
  });

  const baseKey = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
  if (!cookieMap[baseKey]) {
    const chunks = [];
    let i = 0;
    while (cookieMap[`${baseKey}.${i}`]) {
      chunks.push(cookieMap[`${baseKey}.${i}`]);
      i += 1;
    }
    if (chunks.length > 0) cookieMap[baseKey] = chunks.join('');
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { messages } = await request.json().catch(() => ({}));
  if (!messages?.length) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

  const cfContext = globalThis[Symbol.for('__cloudflare-context__')];
  const apiKey = process.env.ANTHROPIC_API_KEY
    || cfContext?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Assistant not configured' }, { status: 500 });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || 'API error' }, { status: 500 });
  }

  const text = data?.content?.[0]?.text || 'Sorry, I could not generate a response.';
  return NextResponse.json({ reply: text });
}
