import { Readable } from 'stream';

export async function handlePomPomSearch(req: any, res: any, origin: string = '') {
  try {
    const rawUrl = req.url || '';
    const parsed = new URL(rawUrl, 'http://localhost');
    const q = parsed.searchParams.get('q') || 'anime';

    const upstreamUrl = `https://fulux-downloader-api.vercel.app/api/search?q=${encodeURIComponent(q)}`;
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let text = await upstream.text();
    // Cleanse any Samuel-Rebix or upstream references
    text = text
      .replace(/Samuel[-_]?Rebix/gi, 'Kaalix')
      .replace(/Lord[-_]?Samuel/gi, 'kaalix-dev')
      .replace(/Samuel/gi, 'Kaalix')
      .replace(/Rebix/gi, 'Kaalix');

    const baseStream = origin ? `${origin.replace(/\/$/, '')}/api/pompom/stream` : '/api/pompom/stream';

    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.items)) {
        json.items = json.items.map((item: any) => {
          const rawDl = item.downloadUrl || '';
          const rawThumb = item.thumbnailUrl || '';

          // Extract path from upstream URL if it starts with https://fulux-downloader-api.vercel.app/
          let proxiedDl = rawDl;
          if (rawDl.includes('fulux-downloader-api.vercel.app/')) {
            const relPath = rawDl.replace(/^https?:\/\/fulux-downloader-api\.vercel\.app\/?/, '');
            proxiedDl = `${baseStream}/${relPath}`;
          } else if (rawDl) {
            proxiedDl = `${baseStream}?file=${encodeURIComponent(rawDl)}`;
          }

          let proxiedThumb = rawThumb;
          if (rawThumb.includes('fulux-downloader-api.vercel.app/')) {
            const relThumbPath = rawThumb.replace(/^https?:\/\/fulux-downloader-api\.vercel\.app\/?/, '');
            proxiedThumb = `${baseStream}/${relThumbPath}`;
          } else if (rawThumb) {
            proxiedThumb = `${baseStream}?file=${encodeURIComponent(rawThumb)}`;
          }

          return {
            title: item.title,
            quality: item.quality,
            size: item.size,
            thumbnailUrl: proxiedThumb,
            downloadUrl: proxiedDl,
          };
        });
      }

      if (json.note) {
        json.note = json.note
          .replace(/https?:\/\/fulux-downloader-api\.vercel\.app/gi, baseStream)
          .replace(/fulux-downloader-api\.vercel\.app/gi, 'kaalix-apis');
      }

      res.end(JSON.stringify(json, null, 2));
    } catch {
      res.end(text);
    }
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: false, error: 'PomPom Search Proxy Error', message: err?.message }));
  }
}

export async function handlePomPomStream(req: any, res: any) {
  try {
    const rawUrl = req.url || '';
    const parsed = new URL(rawUrl, 'http://localhost');

    let subPath = '';
    const match = parsed.pathname.match(/^\/api\/pompom\/(?:stream|download|media|thumb)\/(.+)$/);
    if (match && match[1]) {
      subPath = match[1];
    } else {
      subPath = parsed.searchParams.get('file') || parsed.searchParams.get('path') || '';
    }

    let targetMediaUrl = '';
    const queryUrl = parsed.searchParams.get('url');

    if (queryUrl) {
      if (queryUrl.startsWith('http://') || queryUrl.startsWith('https://')) {
        targetMediaUrl = queryUrl;
      } else {
        targetMediaUrl = `https://fulux-downloader-api.vercel.app/${queryUrl.replace(/^\/+/, '')}`;
      }
    } else if (subPath) {
      targetMediaUrl = `https://fulux-downloader-api.vercel.app/${subPath}`;
    }

    if (!targetMediaUrl) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, error: 'Target media path or url is required' }));
      return;
    }

    const upstream = await fetch(targetMediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ...(req.headers['range'] ? { Range: req.headers['range'] as string } : {}),
      },
    });

    res.statusCode = upstream.status;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');

    let contentType = upstream.headers.get('content-type');
    if (!contentType || contentType === 'application/octet-stream') {
      const lower = targetMediaUrl.toLowerCase();
      if (lower.endsWith('.png')) contentType = 'image/png';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (lower.endsWith('.webp')) contentType = 'image/webp';
      else if (lower.endsWith('.mp4')) contentType = 'video/mp4';
      else if (lower.endsWith('.mkv')) contentType = 'video/x-matroska';
      else contentType = 'video/mp4';
    }
    res.setHeader('Content-Type', contentType);

    const isImage = contentType.startsWith('image/');
    const queryTitle = parsed.searchParams.get('title');
    const filename = parsed.pathname.split('/').pop() || (isImage ? 'image.png' : 'video.mp4');

    if (isImage) {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      const safeTitle = queryTitle ? queryTitle.replace(/[^a-zA-Z0-9_-]/g, '_') + '.mp4' : filename;
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}"`);
    }

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    if (upstream.body) {
      Readable.fromWeb(upstream.body as any).pipe(res);
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    }
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: false, error: 'PomPom Stream Error', message: err?.message }));
  }
}
