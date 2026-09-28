import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { Readable } from 'stream';
import { defineConfig, Plugin } from 'vite';
import { getRandomRgbAnime } from './src/server/rgbAnimeService';
import { handlePomPomSearch, handlePomPomStream } from './src/server/pompomService';
import { fetchTelegramProfile, fetchTelegramAvatar, fetchTelegramUserAvatar } from './src/server/telegramProfileService';
import { trackVisit, trackApiCall, submitRealRating, fetchAllRealRatings, fetchAnalyticsData } from './src/server/mongoService';
import { getOrCreateProfile, updateProfile, listMessages, createMessage, reactToMessage, startCommunityVerification, getCommunityVerification, processTelegramVerificationUpdate } from './src/server/communityService';
import { initAuthSession, getAuthSession, checkAllChannels, completeAuthSession, REQUIRED_CHANNELS, startTelegramPoller, validateUserMembership } from './src/server/telegramAuthService';

// Helper to resolve OnlyFiles direct download link from HTML page (from file-uploader-bot-vercel)
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

// Helper to resolve tmpfiles download link (from file-uploader-bot-vercel)
async function freshTempLink(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const abs = html.match(/https?:\/\/tmpfiles\.org\/dl\/[^"'\s<>]+/i);
    if (abs) return abs[0].replace(/&amp;/g, '&').replace(/^http:/, 'https:');
    const rel = html.match(/["'](\/dl\/[^"'\s<>]+)["']/i);
    if (rel) return 'https://tmpfiles.org' + rel[1].replace(/&amp;/g, '&');
    return null;
  } catch {
    return null;
  }
}

function maskedProxyPlugin(): Plugin {
  const STRIP_KEYS = new Set(['creator', 'author', 'credit', 'credits', 'by', 'made_by']);

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

  function sanitizeJson(val: any, origin: string = ''): any {
    if (Array.isArray(val)) return val.map((item) => sanitizeJson(item, origin));
    if (val && typeof val === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (STRIP_KEYS.has(k.toLowerCase())) {
          continue; // completely remove creator/author fields
        }
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

  async function handleStreamDownload(key: string, res: any) {
    if (!key) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Bad Request', message: 'File ID or key is required.' }));
      return;
    }

    let dlLink = await freshStorageLink(key);
    if (!dlLink) {
      dlLink = await freshTempLink(`https://tmpfiles.org/${key}`);
    }

    if (!dlLink) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: false,
        error: 'File Not Found',
        message: 'The requested file could not be found or has expired.',
      }));
      return;
    }

    try {
      const fileRes = await fetch(dlLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Referer: `https://onlyfiles.com/${key}`,
        },
      });

      if (!fileRes.ok) {
        res.statusCode = fileRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: false,
          error: 'Download Failed',
          message: `Storage server returned HTTP ${fileRes.status}`,
        }));
        return;
      }

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
      }
    } catch (err: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Stream Error', message: err?.message || 'Failed to stream file' }));
    }
  }

  return {
    name: 'masked-proxy-plugin',
    configureServer(server) {
      startTelegramPoller();
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
        const proto = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
        const origin = host ? `${proto}://${host}` : '';

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
          try { const userId = new URL(rawUrl, 'http://localhost').searchParams.get('user_id') || ''; const { buffer, contentType } = await fetchTelegramUserAvatar(userId); res.statusCode = 200; res.setHeader('Content-Type', contentType); res.setHeader('Cache-Control', 'public, max-age=120'); res.end(buffer); return; } catch { res.statusCode = 404; res.end(); return; }
        }
        if (rawUrl.startsWith('/api/telegram/webhook')) {
          try { let body = ''; for await (const chunk of req) body += chunk; await processTelegramVerificationUpdate(JSON.parse(body || '{}')); res.statusCode = 200; res.end('ok'); } catch { res.statusCode = 200; res.end('ok'); } return;
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

            // 1. Initialize new session
            if (parsed.pathname === '/api/telegram-auth/init') {
              const session = initAuthSession();
              sendAuthJson(200, { ok: true, session });
              return;
            }

            // 2. Check session status
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

            // 3. Channels list
            if (parsed.pathname === '/api/telegram-auth/channels') {
              sendAuthJson(200, { ok: true, channels: REQUIRED_CHANNELS });
              return;
            }

            // 3.5 Check active membership (Auto-Logout if user left any channel)
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

            // 4. Verify channels & unlock
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

              // Bot start is mandatory: user must start bot on Telegram first
              if (!session.user) {
                sendAuthJson(400, {
                  ok: false,
                  error: 'Pehle Telegram bot ko start karein! Bot start hone ke baad hi verification ho sakti hai.',
                });
                return;
              }

              const checkResult = await checkAllChannels(session.user.id);
              if (!checkResult.allJoined) {
                sendAuthJson(400, {
                  ok: false,
                  error: 'Aapne sabhi channels join nahi kiye hain! Pehle teeno channels join karein phir bot me verification karein.',
                  details: checkResult.details,
                });
                return;
              }

              const verifiedSession = completeAuthSession(session, session.user);

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
        // Live community chat API.
        if (rawUrl.startsWith('/api/community')) {
          const ip = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
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
              sendJson(200, { ok: true, profile, messages: await listMessages(), serverTime: Date.now() });
              return;
            }
            let body = '';
            for await (const chunk of req) body += chunk;
            const input = JSON.parse(body || '{}');
            if (parsed.pathname === '/api/community/profile' && req.method === 'PUT') { sendJson(200, { ok: true, profile: await updateProfile(String(input.profileId || ''), ip, { name: input.name, avatar: input.avatar }) }); return; }
            if (parsed.pathname === '/api/community/verify/start' && req.method === 'POST') { const verification = await startCommunityVerification(String(input.profileId || ''), ip, `${proto}://${host}`); sendJson(200, { ok: true, ...verification }); return; }
            if (parsed.pathname === '/api/community/verify/status' && req.method === 'POST') { const result = await getCommunityVerification(String(input.profileId || ''), String(input.token || ''), ip); sendJson(200, { ok: true, ...result }); return; }
            if (parsed.pathname === '/api/community/messages' && req.method === 'POST') { sendJson(201, { ok: true, message: await createMessage(String(input.profileId || ''), ip, input.text, input.image, input.replyToId) }); return; }
            const reactionMatch = parsed.pathname.match(/^\/api\/community\/messages\/([^/]+)\/reaction$/);
            if (reactionMatch && req.method === 'POST') { sendJson(200, { ok: true, ...(await reactToMessage(reactionMatch[1], String(input.profileId || ''), String(input.emoji || ''))) }); return; }
            sendJson(404, { ok: false, error: 'Community route not found' });
          } catch (e: any) { sendJson(400, { ok: false, error: e?.message || 'Community request failed' }); }
          return;
        }
        // MongoDB Analytics Dashboard API: /api/analytics
        if (rawUrl.startsWith('/api/analytics')) {
          if (rawUrl.startsWith('/api/analytics/visit')) {
            try {
              const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
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
              const saveResult = await submitRealRating(endpoint, stars);
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

        // 1. RGB Anime Database API: /rgb/anime or /api/rgb/anime
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

        // 2. PomPom 18+ Adult Anime Search & Stream API: /api/pompom/*
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

        // 3. Movie Downloader API proxy: /api/movie/*
        if (rawUrl.startsWith('/api/movie')) {
          try {
            const movieBase = origin ? `${origin}/api/movie` : '/api/movie';
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

        // 5. Direct File Download & Short URL Routes: /file/:key
        if (rawUrl.startsWith('/file/') || rawUrl === '/file') {
          const parsed = new URL(rawUrl, 'http://localhost');
          const segments = parsed.pathname.replace(/^\/file\/?/, '').split('/');
          const key = segments[0]?.replace(/\.[a-zA-Z0-9]+$/, '') || '';
          await handleStreamDownload(key, res);
          return;
        }

        // 6. File Storage API Routes: /api/file/*
        if (rawUrl.startsWith('/api/file')) {
          const parsed = new URL(rawUrl, 'http://localhost');
          const fileBase = origin ? `${origin}/api/file` : '/api/file';

          // Download: /api/file/download?id=...
          if (parsed.pathname === '/api/file/download') {
            const key = parsed.searchParams.get('id') || parsed.searchParams.get('key') || '';
            await handleStreamDownload(key, res);
            return;
          }

          // Info: /api/file/info?id=...
          if (parsed.pathname === '/api/file/info') {
            const id = parsed.searchParams.get('id') || '';
            const upstream = await fetch(`https://api.onlyfiles.com/v1/file/info?id=${encodeURIComponent(id)}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; KaalixStorage/1.0)',
                Referer: 'https://onlyfiles.com/',
              },
            });
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const text = await upstream.text();
            try {
              const json = JSON.parse(text);
              if (json?.data?.file) {
                json.data.file.url = {
                  full: `${fileBase}/download?id=${id}`,
                  short: `${origin ? `${origin}/file/${id}` : `/file/${id}`}`,
                  download: `${fileBase}/download?id=${id}`,
                  direct: `${origin ? `${origin}/file/${id}/${json.data.file.metadata?.name || ''}` : `/file/${id}/${json.data.file.metadata?.name || ''}`}`,
                  info: `${fileBase}/info?id=${id}`,
                };
              }
              const cleaned = sanitizeJson(json, origin);
              res.end(JSON.stringify(cleaned));
            } catch {
              res.end(cleanString(text, origin));
            }
            return;
          }

          // Upload route: /api/file/upload or /api/upload
          const isUploadRoute =
            parsed.pathname === '/api/file/upload' ||
            parsed.pathname === '/api/upload' ||
            parsed.pathname === '/api/onlyfiles/upload';

          if (isUploadRoute) {
            let reqBody: Buffer | undefined = undefined;
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              reqBody = Buffer.concat(chunks);
            }

            const upstreamTarget = `https://api.onlyfiles.com/v1/upload${parsed.search}`;
            const upstream = await fetch(upstreamTarget, {
              method: req.method || 'POST',
              body: reqBody ? new Uint8Array(reqBody) : undefined,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; KaalixFileStorage/1.0)',
                Referer: 'https://onlyfiles.com/',
                ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] as string } : {}),
              },
            });

            const contentType = upstream.headers.get('content-type') || 'application/json';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = upstream.status;

            const text = await upstream.text();
            try {
              const parsedData = JSON.parse(text);
              if (parsedData?.data?.file) {
                const id = parsedData.data.file.metadata?.id || '';
                const name = parsedData.data.file.metadata?.name || '';
                parsedData.data.file.url = {
                  full: `/api/file/download?id=${id}`,
                  short: `/file/${id}`,
                  download: `/api/file/download?id=${id}`,
                  direct: `/file/${id}/${name}`,
                  info: `/api/file/info?id=${id}`,
                };
              }
              res.end(JSON.stringify(sanitizeJson(parsedData, origin)));
            } catch {
              res.end(cleanString(text, origin));
            }
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

        // 8. General API proxy with 100% Guaranteed "Samuel-Rebix" Sanitization
        if (rawUrl.startsWith('/api/')) {
          try {
            // Rewrite /api/v1/* and /api/zone/*
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

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), maskedProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // Pollinations image API
        '/api/pollinations': {
          target: 'https://image.pollinations.ai',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/pollinations/, ''),
        },
      },
    },
  };
});
