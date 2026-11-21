const origin = 'https://atlas.letz.ai/api/public/atlas/effects/';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/atlas/')) return env.ASSETS.fetch(request);
    const match = /^\/api\/atlas\/([a-z0-9-]{1,120})$/.exec(pathname);
    if (!match) return new Response('Not found', { status: 404 });
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
    }

    try {
      const result = await fetch(origin + match[1], {
        redirect: 'manual',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(11000),
      });
      if (result.status === 404) return new Response('Effect not found', { status: 404 });
      if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) {
        return new Response('Atlas unavailable', { status: 502 });
      }
      return new Response(result.body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return new Response('Atlas unavailable', { status: 502 });
    }
  },
};
