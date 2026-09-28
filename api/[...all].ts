import { Readable } from 'stream';
import { getRandomRgbAnime } from '../src/server/rgbAnimeService';
import { handlePomPomSearch, handlePomPomStream } from '../src/server/pompomService';
import { fetchTelegramProfile, fetchTelegramAvatar, fetchTelegramUserAvatar } from '../src/server/telegramProfileService';
import { trackVisit, trackApiCall, submitRealRating, fetchAllRealRatings, fetchAnalyticsData } from '../src/server/mongoService';
import { getOrCreateProfile, updateProfile, listMessages, createMessage, reactToMessage, startCommunityVerification, getCommunityVerification, processTelegramVerificationUpdate } from '../src/server/communityService';
import { initAuthSession, getAuthSession, checkAllChannels, completeAuthSession, REQUIRED_CHANNELS, validateUserMembership } from '../src/server/telegramAuthService';

const STRIP_KEYS = new Set(['creator', 'author', 'credit', 'credits', 'by', 'made_by']);

async function freshStorageLink(id: string): Promise<string | null> {
  try {
    const pageRes = await fetch(`https://onlyfiles.com/${encodeURIComponent(id)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: 'https://onlyfiles.com/',
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    const abs = html.match(/https?:\/\/onlyfiles\.com\/dl\/[^"'\s<>]+/i);
    if (abs) return abs[0].replace(/&amp;/g, '&').replace(/^http:/, 'https:');
    const rel = html.match(/["'](\/dl\/[^"'\s<>]+)["']/i);
    if (rel) return 'https://onlyfiles.com' + rel[1].replace(/&amp;/g, '&');
    return null;
  } catch {
    return null;
  }
}

async function freshTempLink(pageUrl: string): Promise<string | null> {
  try {
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://tmpfiles.org/',
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    const directMatch = html.match(/https?:\/\/[a-zA-Z0-9.-]*tmpfiles\.org\/dl\/[^\s"'<>]+/i);
    if (directMatch) return directMatch[0];
    const slashDl = html.match(/["'](\/dl\/[^\s"'<>]+)["']/i);
    if (slashDl) return 'https://tmpfiles.org' + slashDl[1];
    return null;
  } catch {
    return null;
  }
}

function cleanString(str: string, origin: string = ''): string {
  const movieBase = origin ? `${origin}/api/movie` : '/api/movie';
  const fileBase = origin ? `${origin}/api/file` : '/api/file';
  const pompomBase = origin ? `${origin}/api/pompom/stream` : '/api/pompom/stream';
  return str
    .replace(/https:\/\/fulux-downloader-api\.vercel\.app\/api\/search/gi, origin ? `${origin}/api/pompom/search` : '/api/pompom/search')
    .replace(/https:\/\/fulux-downloader-api\.vercel\.app\/api/gi, origin ? `${origin}/api/pompom` : '/api/pompom')
    .replace(/https:\/\/fulux-downloader-api\.vercel\.app/gi, pompomBase)
    .replace(/fulux-downloader-api\.vercel\.app/gi, 'kaalix-apis')
    .replace(/https:\/\/movie-downloader-api\.vercel\.app\/api/gi, movieBase)
    .replace(/https:\/\/movie-downloader-api\.vercel\.app/gi, movieBase)
    .replace(/movie-downloader-api\.vercel\.app/gi, 'kaalix-apis')
    .replace(/https:\/\/api\.onlyfiles\.com\/v1/gi, fileBase)
    .replace(/https:\/\/onlyfiles\.com/gi, fileBase)
    .replace(/api\.onlyfiles\.com/gi, 'kaalix-apis')
    .replace(/onlyfiles\.com/gi, 'kaalix-apis')
    .replace(/onlyfiles/gi, 'kaalix-storage')
    .replace(/OnlyFiles/gi, 'Kaalix Storage')
    .replace(/tmpfiles\.org/gi, 'kaalix-apis')
    .replace(/tmpfiles/gi, 'kaalix-storage')
    .replace(/https:\/\/s\.xysushi\.in/gi, 'kaalix-apis')
    .replace(/s\.xysushi\.in/gi, 'kaalix-apis')
    .replace(/https:\/\/isha-50-like-api-new\.vercel\.app/gi, 'kaalix-apis')
    .replace(/isha-50-like-api-new\.vercel\.app/gi, 'kaalix-apis')
    .replace(/key=ISHA/gi, '')
    .replace(/&key=[^&\s"]+/gi, '')
    .replace(/\?key=[^&\s"]+/gi, '')
    .replace(/"key":\s*"[^"]*"/gi, '')
    .replace(/Samuel[-_]?Rebix/gi, 'Kaalix')
    .replace(/Samuel\s*[-_]?\s*Rebix/gi, 'Kaalix')
    .replace(/Lord[-_]?Samuel/gi, 'kaalix-dev')
    .replace(/Samuel/gi, 'Kaalix')
    .replace(/Rebix/gi, 'Kaalix');
}

function sanitizeJson(val: any, origin = ''): any {
  if (Array.isArray(val)) return val.map((item) => sanitizeJson(item, origin));
  if (val && typeof val === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (STRIP_KEYS.has(k.toLowerCase())) continue;
      if (k.toLowerCase() === 'source') {
        result[k] = origin ? `${origin}/api/movie` : '/api/movie';
      } else {
        result[k] = sanitizeJson(v, origin);
      }
    }
    return result;
  }
  if (typeof val === 'string') {
    return cleanString(val, origin);
  }
  return val;
}

export default async function handler(req: any, res: any) {
  const rawUrl = req.url || '';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const proto = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
  const origin = host ? `${proto}://${host}` : '';
  const movieBase = origin ? `${origin}/api/movie` : '/api/movie';
  const fileBase = origin ? `${origin}/api/file` : '/api/file';

  // 0. Telegram Dynamic Profile & Avatar API
  if (rawUrl.startsWith('/api/telegram/profile')) {
    try {
      const urlObj = new URL(rawUrl, 'http://localhost');
      const force = urlObj.searchParams.get('refresh') === 'true' || urlObj.searchParams.get('force') === 'true';
      const profile = await fetchTelegramProfile(force);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(profile, null, 2));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: e?.message }));
      return;
    }
  }

  if (rawUrl.startsWith('/api/telegram/avatar')) {
    try {
      const urlObj = new URL(rawUrl, 'http://localhost');
      const force = urlObj.searchParams.get('refresh') === 'true' || urlObj.searchParams.get('force') === 'true';
      const { buffer, contentType } = await fetchTelegramAvatar(force);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
      res.end(buffer);
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.end();
      return;
    }
  }

  if (rawUrl.startsWith('/api/telegram/verified-avatar')) {
    try {
      const userId = new URL(rawUrl, 'http://localhost').searchParams.get('user_id') || '';
      const { buffer, contentType } = await fetchTelegramUserAvatar(userId);
      res.statusCode = 200; res.setHeader('Content-Type', contentType); res.setHeader('Cache-Control', 'public, max-age=120'); res.end(buffer); return;
    } catch { res.statusCode = 404; res.end(); return; }
  }
  if (rawUrl.startsWith('/api/telegram/webhook')) {
    try { let body = ''; for await (const chunk of req) body += chunk; await processTelegramVerificationUpdate(JSON.parse(body || '{}')); res.statusCode = 200; res.end('ok'); return; }
    catch { res.statusCode = 200; res.end('ok'); return; }
  }

  // Private-by-default community API. The browser receives only profile/message data.
  if (rawUrl.startsWith('/api/community')) {
    const ip = ((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const ua = (req.headers['user-agent'] as string) || '';
    const sendJson = (status: number, payload: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(payload));
    };
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      if (req.method === 'GET') {
        const profile = await getOrCreateProfile(parsed.searchParams.get('profileId') || undefined, ip, ua);
        const messages = await listMessages();
        sendJson(200, { ok: true, profile, messages, serverTime: Date.now() });
        return;
      }
      let body = '';
      for await (const chunk of req) body += chunk;
      const input = JSON.parse(body || '{}');
      if (parsed.pathname === '/api/community/profile' && req.method === 'PUT') {
        const profile = await updateProfile(String(input.profileId || ''), ip, { name: input.name, avatar: input.avatar });
        sendJson(200, { ok: true, profile });
        return;
      }
      if (parsed.pathname === '/api/community/verify/start' && req.method === 'POST') {
        const forwardedProto = (req.headers['x-forwarded-proto'] as string) || proto;
        const verification = await startCommunityVerification(String(input.profileId || ''), ip, `${forwardedProto}://${host}`);
        sendJson(200, { ok: true, ...verification });
        return;
      }
      if (parsed.pathname === '/api/community/verify/status' && req.method === 'POST') {
        const result = await getCommunityVerification(String(input.profileId || ''), String(input.token || ''), ip);
        sendJson(200, { ok: true, ...result });
        return;
      }
      if (parsed.pathname === '/api/community/messages' && req.method === 'POST') {
        const message = await createMessage(String(input.profileId || ''), ip, input.text, input.image, input.replyToId);
        sendJson(201, { ok: true, message });
        return;
      }
      const reactionMatch = parsed.pathname.match(/^\/api\/community\/messages\/([^/]+)\/reaction$/);
      if (reactionMatch && req.method === 'POST') {
        const result = await reactToMessage(reactionMatch[1], String(input.profileId || ''), String(input.emoji || ''));
        sendJson(200, { ok: true, ...result });
        return;
      }
      sendJson(404, { ok: false, error: 'Community route not found' });
      return;
    } catch (e: any) {
      sendJson(400, { ok: false, error: e?.message || 'Community request failed' });
      return;
    }
  }

  // Telegram Compulsory Force-Join & Auth Gate API: /api/telegram-auth
  if (rawUrl.startsWith('/api/telegram-auth')) {
    const sendAuthJson = (status: number, payload: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(payload));
    };

    try {
      const parsed = new URL(rawUrl, 'http://localhost');

      if (parsed.pathname === '/api/telegram-auth/init') {
        const session = initAuthSession();
        sendAuthJson(200, { ok: true, session });
        return;
      }

      if (parsed.pathname === '/api/telegram-auth/status') {
        const token = parsed.searchParams.get('token') || parsed.searchParams.get('code') || '';
        const session = getAuthSession(token);
        if (!session) {
          sendAuthJson(404, { ok: false, error: 'Session not found' });
          return;
        }
        sendAuthJson(200, { ok: true, session });
        return;
      }

      if (parsed.pathname === '/api/telegram-auth/channels') {
        sendAuthJson(200, { ok: true, channels: REQUIRED_CHANNELS });
        return;
      }

      if (parsed.pathname === '/api/telegram-auth/check-membership') {
        const userId = parsed.searchParams.get('userId') || '';
        if (!userId) {
          sendAuthJson(200, { ok: true, valid: true, leftChannels: [] });
          return;
        }
        const result = await validateUserMembership(userId);
        sendAuthJson(200, { ok: true, ...result });
        return;
      }

      if (parsed.pathname === '/api/telegram-auth/verify' && req.method === 'POST') {
        let bodyStr = '';
        for await (const chunk of req) bodyStr += chunk;
        const input = JSON.parse(bodyStr || '{}');
        const session = getAuthSession(input.token || input.code || '');
        if (!session) {
          sendAuthJson(404, { ok: false, error: 'Session not found or expired' });
          return;
        }

        if (session.status === 'verified' && session.user) {
          sendAuthJson(200, { ok: true, verified: true, user: session.user, session });
          return;
        }

        const userId = input.telegramId || session.user?.id || (input.username ? input.username.replace(/^@/, '') : '');
        const firstName = input.name || session.user?.first_name || 'Telegram User';
        const username = input.username || session.user?.username || '';

        const checkResult = userId ? await checkAllChannels(userId) : { allJoined: true, details: { '@TheFelixModz': true, '@autolikegc': true, '@FelixOfcGroup': true } };

        const verifiedSession = completeAuthSession(session, {
          id: userId || `${Date.now()}`,
          first_name: firstName,
          username,
        });

        sendAuthJson(200, {
          ok: true,
          verified: true,
          user: verifiedSession.user,
          session: verifiedSession,
          channelsStatus: checkResult.details,
        });
        return;
      }

      sendAuthJson(404, { ok: false, error: 'Telegram auth endpoint not found' });
      return;
    } catch (err: any) {
      sendAuthJson(500, { ok: false, error: err?.message || 'Telegram auth failed' });
      return;
    }
  }

  // MongoDB Analytics Dashboard API: /api/analytics
  if (rawUrl.startsWith('/api/analytics')) {
    if (rawUrl.startsWith('/api/analytics/visit')) {
      try {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
        const ua = (req.headers['user-agent'] as string) || '';
        const stats = await trackVisit(ip.split(',')[0].trim(), ua);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ ok: true, ...stats }));
        return;
      } catch (e: any) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ ok: false, views: 0, visitors: 0 }));
        return;
      }
    }

    try {
      const analytics = await fetchAnalyticsData();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ ok: true, ...analytics }, null, 2));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: e?.message }));
      return;
    }
  }

  // MongoDB Real Ratings API: /api/ratings
  if (rawUrl.startsWith('/api/ratings')) {
    if (req.method === 'POST') {
      try {
        let bodyStr = '';
        for await (const chunk of req) {
          bodyStr += chunk;
        }
        const parsed = JSON.parse(bodyStr || '{}');
        const endpoint = parsed.endpoint || '';
        const stars = Number(parsed.stars || 5);
        const ip = ((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
        const saveResult = await submitRealRating(endpoint, stars, ip);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(saveResult));
        return;
      } catch (e: any) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: e?.message }));
        return;
      }
    }

    try {
      const ratingsMap = await fetchAllRealRatings();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ ok: true, ratings: ratingsMap }, null, 2));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: e?.message }));
      return;
    }
  }

  // TmpFiles Anonymous Upload Proxy: /api/upload/tmpfiles or /api/tmpfiles/upload
  if (rawUrl.startsWith('/api/upload/tmpfiles') || rawUrl.startsWith('/api/tmpfiles/upload')) {
    try {
      let reqBody: Buffer | undefined = undefined;
      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        reqBody = Buffer.concat(chunks);
      }

      const upstream = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: reqBody ? new Uint8Array(reqBody) : undefined,
        headers: {
          ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] as string } : {}),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const data: any = await upstream.json();
      if (data?.status === 'success' && data?.data?.url) {
        const pageUrl = data.data.url;
        const directUrl = pageUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        data.data.direct_url = directUrl;
        data.data.download_url = `/api/file/download?url=${encodeURIComponent(directUrl)}`;
      }
      res.end(JSON.stringify(data, null, 2));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: e?.message }));
      return;
    }
  }

  // Track API call in MongoDB in background
  if (rawUrl.startsWith('/api/')) {
    trackApiCall(rawUrl, req.method || 'GET', 200).catch(() => {});
  }

  // 1. RGB Anime Database: /rgb/anime or /api/rgb/anime
  if (rawUrl.startsWith('/rgb/anime') || rawUrl.startsWith('/api/rgb/anime')) {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const data = await getRandomRgbAnime(origin);
      res.statusCode = 200;
      res.end(JSON.stringify(data, null, 2));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'RGB Anime Error', message: e?.message }));
      return;
    }
  }

  // 2. PomPom 18+ Media Search: /api/pompom/*
  if (rawUrl.startsWith('/api/pompom')) {
    if (
      rawUrl.startsWith('/api/pompom/stream') ||
      rawUrl.startsWith('/api/pompom/download') ||
      rawUrl.startsWith('/api/pompom/media') ||
      rawUrl.startsWith('/api/pompom/thumb')
    ) {
      await handlePomPomStream(req, res);
      return;
    }
    await handlePomPomSearch(req, res, origin);
    return;
  }

  // 3. Movie API Proxy
  if (rawUrl.startsWith('/api/movie')) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      const subPath = parsed.pathname.replace(/^\/api\/movie/, '');
      const targetUrl = `https://movie-downloader-api.vercel.app/api${subPath}${parsed.search}`;
      const upstream = await fetch(targetUrl, {
        method: req.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          ...(req.headers['range'] ? { Range: req.headers['range'] as string } : {}),
        },
      });

      res.statusCode = upstream.status;
      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');

      if (contentType.includes('application/json')) {
        let text = await upstream.text();
        text = cleanString(text, origin);
        try {
          const parsedData = JSON.parse(text);
          const cleaned = sanitizeJson(parsedData, origin);
          res.end(JSON.stringify(cleaned));
        } catch {
          res.end(text);
        }
        return;
      } else {
        const upstreamDisposition = upstream.headers.get('content-disposition');
        if (upstreamDisposition) {
          res.setHeader('Content-Disposition', upstreamDisposition);
        } else {
          const queryFilename = parsed.searchParams.get('filename') || parsed.pathname.split('/').pop() || 'movie-download.mp4';
          const safeFilename = queryFilename.endsWith('.mp4') || queryFilename.endsWith('.mkv') ? queryFilename : `${queryFilename}.mp4`;
          res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        }

        const contentLength = upstream.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        const acceptRanges = upstream.headers.get('accept-ranges');
        if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

        const contentRange = upstream.headers.get('content-range');
        if (contentRange) res.setHeader('Content-Range', contentRange);

        if (upstream.body) {
          Readable.fromWeb(upstream.body as any).pipe(res);
          return;
        } else {
          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.end(buffer);
          return;
        }
      }
    } catch (e: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Movie Proxy Error', message: e?.message }));
      return;
    }
  }

  // 4. Free Fire API Proxy (/api/ff/profile, /api/ff/info, /api/ff/like)
  if (rawUrl.startsWith('/api/ff')) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      const sub = parsed.pathname.replace(/^\/api\/ff\/?/, '').toLowerCase();

      // 4a. FF Profile Info: /api/ff/profile or /api/ff/info
      if (sub === 'profile' || sub === 'info' || sub === '') {
        const uid = parsed.searchParams.get('uid') || '';
        if (!uid) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: false, error: 'UID is required', example: '/api/ff/profile?uid=1231557272' }));
          return;
        }
        const upstream = await fetch(`https://s.xysushi.in/ff/?uid=${encodeURIComponent(uid)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
          },
        });
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const text = await upstream.text();
        try {
          const parsedData = JSON.parse(text);
          res.end(JSON.stringify(sanitizeJson(parsedData, origin)));
        } catch {
          res.end(cleanString(text, origin));
        }
        return;
      }

      // 4b. FF Like API: /api/ff/like
      if (sub === 'like') {
        const uid = parsed.searchParams.get('uid') || '';
        const region = (parsed.searchParams.get('region') || parsed.searchParams.get('server_name') || 'IND').toUpperCase();
        if (!uid) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: false, error: 'UID is required', example: '/api/ff/like?uid=2093756996&region=IND' }));
          return;
        }

        const targetUrl = `https://isha-50-like-api-new.vercel.app/like?uid=${encodeURIComponent(uid)}&server_name=${encodeURIComponent(region)}&key=ISHA`;
        try {
          const upstream = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept': 'application/json',
            },
          });

          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          let text = await upstream.text();
          text = cleanString(text, origin);

          try {
            const parsedData = JSON.parse(text);
            delete parsedData.key;
            res.end(JSON.stringify(sanitizeJson(parsedData, origin)));
          } catch {
            res.end(text);
          }
          return;
        } catch (likeErr: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: false, error: 'Free Fire Like Service Offline', message: likeErr?.message }));
          return;
        }
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Unknown Free Fire Endpoint', available: ['/api/ff/profile', '/api/ff/like'] }));
      return;
    } catch (e: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'FreeFire Proxy Error', message: e?.message }));
      return;
    }
  }

  // 5. Direct File Download & Short URL Routes: /file/:key or /api/file/download
  if (rawUrl.startsWith('/file/') || rawUrl.startsWith('/api/file/download')) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      let key = parsed.searchParams.get('id') || parsed.searchParams.get('key') || '';
      if (!key) {
        const segments = parsed.pathname.replace(/^\/(?:file|api\/file\/download)\/?/, '').split('/');
        key = segments[0]?.replace(/\.[a-zA-Z0-9]+$/, '') || '';
      }

      let dlLink = await freshStorageLink(key);
      if (!dlLink) dlLink = await freshTempLink(`https://tmpfiles.org/${key}`);

      if (!dlLink) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: false, error: 'File Not Found', message: 'File not found or expired.' }));
        return;
      }

      const fileRes = await fetch(dlLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Referer: `https://onlyfiles.com/${key}`,
        },
      });

      res.statusCode = fileRes.status;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const cType = fileRes.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', cType);

      const cDisp = fileRes.headers.get('content-disposition');
      if (cDisp) res.setHeader('Content-Disposition', cDisp);

      const cLen = fileRes.headers.get('content-length');
      if (cLen) res.setHeader('Content-Length', cLen);

      const acceptRanges = fileRes.headers.get('accept-ranges');
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

      if (fileRes.body) {
        Readable.fromWeb(fileRes.body as any).pipe(res);
        return;
      } else {
        const buf = Buffer.from(await fileRes.arrayBuffer());
        res.end(buf);
        return;
      }
    } catch (err: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Stream Error', message: err?.message }));
      return;
    }
  }

  // 6. File Upload Proxy: /api/file/upload or /api/upload
  if (rawUrl.startsWith('/api/file/upload') || rawUrl.startsWith('/api/upload')) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const reqBody = Buffer.concat(chunks);

      const upstream = await fetch(`https://api.onlyfiles.com/v1/upload${parsed.search}`, {
        method: req.method || 'POST',
        body: reqBody.length > 0 ? new Uint8Array(reqBody) : undefined,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KaalixFileStorage/1.0)',
          Referer: 'https://onlyfiles.com/',
          ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] as string } : {}),
        },
      });

      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const text = await upstream.text();
      try {
        const parsedData = JSON.parse(text);
        if (parsedData?.data?.file) {
          const id = parsedData.data.file.metadata?.id || '';
          const name = parsedData.data.file.metadata?.name || '';
          parsedData.data.file.url = {
            full: `${fileBase}/download?id=${id}`,
            short: `${origin ? `${origin}/file/${id}` : `/file/${id}`}`,
            download: `${fileBase}/download?id=${id}`,
            direct: `${origin ? `${origin}/file/${id}/${name}` : `/file/${id}/${name}`}`,
            info: `${fileBase}/info?id=${id}`,
          };
        }
        res.end(JSON.stringify(sanitizeJson(parsedData, origin)));
      } catch {
        res.end(cleanString(text, origin));
      }
      return;
    } catch (err: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Upload Proxy Error', message: err?.message }));
      return;
    }
  }

  // 7. NSFW API Proxy with resilient automatic fallback (/api/nsfw/*)
  if (rawUrl.startsWith('/api/nsfw/')) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      const tag = parsed.pathname.replace(/^\/api\/nsfw\/?/, '').toLowerCase().trim();
      const upstreamTarget = `https://api-rebix.vercel.app/api/nsfw/${tag}`;

      const upstream = await fetch(upstreamTarget, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      }).catch(() => null);

      const contentType = upstream?.headers.get('content-type') || '';
      if (upstream && upstream.ok && contentType.startsWith('image/')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.end(buffer);
        return;
      }

      // Fallback for NSFW tag to guaranteed high-quality anime image
      let fallbackTag = tag || 'pussy';
      if (fallbackTag === 'cuckold') fallbackTag = 'sex';
      else if (fallbackTag === 'blowjob') fallbackTag = 'fellatio';
      else if (fallbackTag === 'milf') fallbackTag = 'mature';

      let searchUrl = `https://yande.re/post.json?tags=${encodeURIComponent(fallbackTag)}+rating:explicit&limit=25`;
      let searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);

      let posts = searchRes && searchRes.ok ? await searchRes.json().catch(() => []) : [];
      if (!Array.isArray(posts) || posts.length === 0) {
        const altRes = await fetch('https://yande.re/post.json?tags=rating:explicit&limit=25', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(6000),
        }).catch(() => null);
        if (altRes && altRes.ok) posts = await altRes.json().catch(() => []);
      }

      if (Array.isArray(posts) && posts.length > 0) {
        const rand = posts[Math.floor(Math.random() * posts.length)];
        const imgUrl = rand.sample_url || rand.file_url || rand.jpeg_url;
        if (imgUrl) {
          const imgRes = await fetch(imgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000),
          }).catch(() => null);
          if (imgRes && imgRes.ok) {
            const imgType = imgRes.headers.get('content-type') || 'image/jpeg';
            res.statusCode = 200;
            res.setHeader('Content-Type', imgType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            res.end(imgBuf);
            return;
          }
        }
      }

      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to load image' }));
      return;
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to load image' }));
      return;
    }
  }

  // 8. General API proxy with strict "Samuel-Rebix" removal
  if (rawUrl.startsWith('/api/')) {
    try {
      let targetPath = rawUrl;
      if (rawUrl.startsWith('/api/v1/')) {
        targetPath = rawUrl.replace(/^\/api\/v1/, '');
      } else if (rawUrl.startsWith('/api/zone/')) {
        targetPath = rawUrl.replace(/^\/api\/zone/, '');
      }

      const upstreamTarget = `https://api-rebix.vercel.app${targetPath}`;
      let reqBody: Buffer | undefined = undefined;
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        reqBody = Buffer.concat(chunks);
      }

      const upstream = await fetch(upstreamTarget, {
        method: req.method || 'GET',
        body: reqBody ? new Uint8Array(reqBody) : undefined,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] as string } : {}),
          ...(req.headers['range'] ? { Range: req.headers['range'] as string } : {}),
        },
      });

      res.statusCode = upstream.status;
      res.setHeader('Access-Control-Allow-Origin', '*');
      const contentType = upstream.headers.get('content-type') || 'application/json';
      res.setHeader('Content-Type', contentType);

      if (contentType.includes('application/json') || contentType.includes('text/')) {
        let text = await upstream.text();
        text = cleanString(text, origin);
        try {
          const parsedData = JSON.parse(text);
          const cleaned = sanitizeJson(parsedData, origin);
          res.end(JSON.stringify(cleaned));
        } catch {
          res.end(text);
        }
        return;
      } else {
        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.end(buffer);
        return;
      }
    } catch (apiErr: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Upstream Proxy Error', message: apiErr?.message }));
      return;
    }
  }

  // 8. Default 404
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
}
