import { NextResponse } from 'next/server';

export async function GET() {
  const cfContext = globalThis[Symbol.for('__cloudflare-context__')];
  return NextResponse.json({
    has_anthropic_process: !!process.env.ANTHROPIC_API_KEY,
    has_anthropic_cf: !!cfContext?.env?.ANTHROPIC_API_KEY,
    has_supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    node_env: process.env.NODE_ENV,
    cf_env_keys: cfContext?.env ? Object.keys(cfContext.env).filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('TOKEN')).join(', ') : 'no cf context',
    process_env_keys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('TOKEN')).join(', '),
  });
}
