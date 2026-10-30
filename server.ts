import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to strip tracking query parameters
function cleanTrackingParams(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.search = '';
    return parsed.toString();
  } catch {
    return urlStr.split('?')[0];
  }
}

// Helper to extract Video ID or Photo ID
function extractMediaId(urlStr: string): { type: 'video' | 'photo' | 'unknown'; id: string | null; author: string | null } {
  const videoMatch = urlStr.match(/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i);
  if (videoMatch) {
    return { type: 'video', author: videoMatch[1], id: videoMatch[2] };
  }
  const photoMatch = urlStr.match(/@([a-zA-Z0-9_.-]+)\/photo\/(\d+)/i);
  if (photoMatch) {
    return { type: 'photo', author: photoMatch[1], id: photoMatch[2] };
  }
  const shortMatch = urlStr.match(/\/t\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) {
    return { type: 'unknown', author: null, id: shortMatch[1] };
  }
  return { type: 'unknown', id: null, author: null };
}

// Construct Android Intent URI to launch directly into the TikTok Android App
function buildAndroidIntentUrl(targetUrl: string): string {
  // TikTok Android package: com.zhiliaoapp.musically
  // Scheme URL: intent://www.tiktok.com/...#Intent;scheme=https;package=com.zhiliaoapp.musically;end
  try {
    const parsed = new URL(targetUrl);
    const hostAndPath = parsed.host + parsed.pathname + parsed.search;
    return `intent://${hostAndPath}#Intent;scheme=https;package=com.zhiliaoapp.musically;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
  } catch {
    return `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.zhiliaoapp.musically;end`;
  }
}

// Follow HTTP redirects safely server-side
async function followRedirects(initialUrl: string, maxHops = 8): Promise<string> {
  let currentUrl = initialUrl;
  let hops = 0;

  while (hops < maxHops) {
    hops++;
    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(6000),
      });

      const location = response.headers.get('location');
      if ((response.status >= 300 && response.status < 400) && location) {
        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;
        // If we reached full tiktok.com URL, we can stop or continue if still redirecting
        if (nextUrl.includes('tiktok.com/@') && (nextUrl.includes('/video/') || nextUrl.includes('/photo/'))) {
          return nextUrl;
        }
      } else {
        // No redirect header; check if response.url has moved or if body has canonical
        if (response.url && response.url !== initialUrl && response.url.includes('tiktok.com')) {
          return response.url;
        }
        // If 200, check if HTML contains canonical link
        if (response.ok) {
          const text = await response.text();
          const canonicalMatch = text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
          if (canonicalMatch && canonicalMatch[1]) {
            return canonicalMatch[1];
          }
          const ogUrlMatch = text.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
          if (ogUrlMatch && ogUrlMatch[1]) {
            return ogUrlMatch[1];
          }
        }
        return currentUrl;
      }
    } catch {
      break;
    }
  }
  return currentUrl;
}

// Resolve single URL with oEmbed enrichment
async function resolveTikTokLink(inputUrl: string, cleanTracking = true) {
  let formatted = inputUrl.trim();
  if (formatted.startsWith('//')) formatted = 'https:' + formatted;
  else if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'https://' + formatted;
  }

  let finalUrl = formatted;
  let method = 'direct';

  // 1. Follow server-side redirects
  try {
    const resolved = await followRedirects(formatted);
    if (resolved && resolved !== formatted) {
      finalUrl = resolved;
      method = 'server_redirect';
    }
  } catch (err) {
    console.warn(`Redirect resolution error for ${formatted}:`, err);
  }

  // 2. If short code exists and unresolved, fallback to canonical format
  const shortMatch = formatted.match(/vt\.tiktok\.com\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch && (!finalUrl || finalUrl === formatted)) {
    finalUrl = `https://www.tiktok.com/t/${shortMatch[1]}/`;
    method = 'shortcode_canonical';
  }

  const cleanUrl = cleanTracking ? cleanTrackingParams(finalUrl) : finalUrl;
  const mediaInfo = extractMediaId(cleanUrl);
  const intentUrl = buildAndroidIntentUrl(cleanUrl);

  // 3. Try to fetch oEmbed metadata for video title, author, and thumbnail
  let title: string | null = null;
  let author: string | null = mediaInfo.author;
  let authorUrl: string | null = mediaInfo.author ? `https://www.tiktok.com/@${mediaInfo.author}` : null;
  let thumbnail: string | null = null;
  let oembedHtml: string | null = null;

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
    const oembedRes = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data) {
        title = data.title || null;
        if (data.author_name) author = data.author_name;
        if (data.author_url) authorUrl = data.author_url;
        thumbnail = data.thumbnail_url || null;
        oembedHtml = data.html || null;
      }
    }
  } catch {
    // Non-blocking oEmbed fail
  }

  const isSuccess = cleanUrl.includes('tiktok.com/@') || cleanUrl.includes('/t/') || cleanUrl.includes('/video/');

  return {
    success: isSuccess,
    originalUrl: inputUrl,
    resolvedUrl: finalUrl,
    cleanUrl,
    type: mediaInfo.type,
    videoId: mediaInfo.id,
    author,
    authorUrl,
    title,
    thumbnail,
    oembedHtml,
    intentUrl,
    method,
  };
}

// API Routes
app.post('/api/resolve', async (req: Request, res: Response) => {
  try {
    const { url, cleanTracking = true } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Valid URL is required' });
      return;
    }
    const result = await resolveTikTokLink(url, cleanTracking);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal resolver error' });
  }
});

app.post('/api/resolve-batch', async (req: Request, res: Response) => {
  try {
    const { urls, cleanTracking = true } = req.body;
    if (!Array.isArray(urls)) {
      res.status(400).json({ error: 'urls array is required' });
      return;
    }

    // Process with concurrency limit of 4
    const limit = 4;
    const results: any[] = [];
    const queue = [...urls];

    async function worker() {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        try {
          const resObj = await resolveTikTokLink(item, cleanTracking);
          results.push(resObj);
        } catch {
          results.push({
            success: false,
            originalUrl: item,
            resolvedUrl: item,
            cleanUrl: item,
            videoId: null,
            author: null,
            title: null,
            thumbnail: null,
            intentUrl: buildAndroidIntentUrl(item),
            method: 'error_fallback',
          });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, worker));

    // Sort to match original order
    const ordered = urls.map(u => results.find(r => r.originalUrl === u) || results[0]);
    res.json({ results: ordered });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal batch resolver error' });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', platform: 'Android TikTok Resolver', timestamp: new Date().toISOString() });
});

// Vite middleware in dev or static files in production
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Android TikTok Resolver Server running on port ${PORT}`);
  });
}

setupVite();
