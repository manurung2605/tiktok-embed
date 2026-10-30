import { ResolvedLink, EmbedFormat } from '../types';

export function cleanTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url.split('?')[0];
  }
}

export function buildAndroidIntent(targetUrl: string, packageName = 'com.zhiliaoapp.musically'): string {
  try {
    const parsed = new URL(targetUrl);
    const hostAndPath = parsed.host + parsed.pathname + parsed.search;
    return `intent://${hostAndPath}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
  } catch {
    return `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=${packageName};end`;
  }
}

export function extractMediaId(url: string): { type: 'video' | 'photo' | 'unknown'; id: string | null; author: string | null } {
  const videoMatch = url.match(/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i);
  if (videoMatch) {
    return { type: 'video', author: videoMatch[1], id: videoMatch[2] };
  }
  const photoMatch = url.match(/@([a-zA-Z0-9_.-]+)\/photo\/(\d+)/i);
  if (photoMatch) {
    return { type: 'photo', author: photoMatch[1], id: photoMatch[2] };
  }
  const shortMatch = url.match(/\/t\/([a-zA-Z0-9_-]+)/i) || url.match(/vt\.tiktok\.com\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) {
    return { type: 'unknown', author: null, id: shortMatch[1] };
  }
  return { type: 'unknown', id: null, author: null };
}

export async function resolveSingleUrl(rawUrl: string, cleanTracking = true): Promise<ResolvedLink> {
  const trimmed = rawUrl.trim();
  let formatted = trimmed;
  if (formatted.startsWith('//')) formatted = 'https:' + formatted;
  else if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'https://' + formatted;
  }

  // 1. Try server-side resolver first (avoids CORS, follows redirects natively)
  try {
    const res = await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formatted, cleanTracking }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: Math.random().toString(36).substring(2, 9),
        originalUrl: trimmed,
        resolvedUrl: data.resolvedUrl || formatted,
        cleanUrl: data.cleanUrl || (cleanTracking ? cleanTrackingParams(data.resolvedUrl || formatted) : formatted),
        status: data.success ? 'resolved' : 'fallback',
        isSuccess: data.success,
        type: data.type,
        videoId: data.videoId,
        author: data.author,
        authorUrl: data.authorUrl,
        title: data.title,
        thumbnail: data.thumbnail,
        intentUrl: data.intentUrl || buildAndroidIntent(data.cleanUrl || formatted),
        method: data.method || 'server',
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Backend resolve error, falling back to client-side pipeline:', err);
  }

  // 2. Client-side fallback pipeline
  const shortCodeMatch = formatted.match(/vt\.tiktok\.com\/([a-zA-Z0-9_-]+)/i);
  const shortCode = shortCodeMatch ? shortCodeMatch[1] : null;

  let resolved = formatted;
  let isSuccess = false;

  // Try unshorten.me client relay
  try {
    const unshortenRes = await fetch(`https://unshorten.me/json/${encodeURIComponent(formatted)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (unshortenRes.ok) {
      const unshortenData = await unshortenRes.json();
      if (unshortenData?.resolved_url && unshortenData.resolved_url.includes('tiktok.com')) {
        resolved = unshortenData.resolved_url;
        isSuccess = true;
      }
    }
  } catch {
    // Continue
  }

  // Canonical fallback if still short URL
  if (!isSuccess && shortCode) {
    resolved = `https://www.tiktok.com/t/${shortCode}/`;
    isSuccess = true;
  }

  const finalClean = cleanTracking ? cleanTrackingParams(resolved) : resolved;
  const media = extractMediaId(finalClean);

  return {
    id: Math.random().toString(36).substring(2, 9),
    originalUrl: trimmed,
    resolvedUrl: resolved,
    cleanUrl: finalClean,
    status: isSuccess ? 'resolved' : 'fallback',
    isSuccess,
    type: media.type,
    videoId: media.id,
    author: media.author,
    authorUrl: media.author ? `https://www.tiktok.com/@${media.author}` : null,
    title: null,
    thumbnail: null,
    intentUrl: buildAndroidIntent(finalClean),
    method: 'client_fallback',
    timestamp: Date.now(),
  };
}

export function parseUrls(text: string): string[] {
  if (!text.trim()) return [];
  const regex = /(?:https?:)?\/\/[^\s,]+|vt\.tiktok\.com\/[a-zA-Z0-9_-]+/gi;
  const matches = text.match(regex) || [];
  return Array.from(new Set(matches.map(u => u.trim())));
}

export function generateEmbedCode(links: ResolvedLink[], format: EmbedFormat): string {
  if (links.length === 0) return '';

  if (format === 'option1') {
    // Option 1: Standard TikTok Blockquote Embed
    const snippets = links.map(link => {
      const targetUrl = link.cleanUrl || link.resolvedUrl;
      const videoId = link.videoId || '';
      return `<blockquote class="tiktok-embed" cite="${targetUrl}" data-video-id="${videoId}" style="max-width: 605px; min-width: 325px; margin: 0 auto;">
  <section>
    <a target="_blank" title="${link.author ? `@${link.author}` : 'Watch on TikTok'}" href="${targetUrl}">
      ${link.title ? link.title : targetUrl}
    </a>
  </section>
</blockquote>`;
    });
    return snippets.join('\n\n') + '\n\n<script async src="https://www.tiktok.com/embed.js"></script>';
  }

  if (format === 'option2') {
    // Option 2: Responsive Player iFrame
    const snippets = links.map(link => {
      const idOrCode = link.videoId || (link.cleanUrl.match(/\/t\/([a-zA-Z0-9_-]+)/i)?.[1]) || '7400000000000000000';
      return `<div style="position: relative; padding-bottom: 177.78%; height: 0; overflow: hidden; max-width: 360px; width: 100%; margin: 12px auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
  <iframe 
    src="https://www.tiktok.com/player/v1/${idOrCode}?music_info=1&description=1" 
    title="TikTok Video Player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 16px;">
  </iframe>
</div>`;
    });
    return snippets.join('\n\n');
  }

  // Option 3: Dynamic Fallback Wrapper (JS Blockquote -> iFrame -> Direct Android/Web Link)
  const snippets = links.map((link, idx) => {
    const targetUrl = link.cleanUrl || link.resolvedUrl;
    const videoId = link.videoId || '';
    const uniqueId = idx + 1;
    return `<!-- TikTok Embed Card #${uniqueId} -->
<div class="tiktok-card-wrapper" id="card-${uniqueId}" style="max-width: 360px; margin: 16px auto; background: #161b22; border-radius: 16px; padding: 12px; border: 1px solid #30363d;">
  <div id="tiktok-js-wrapper-${uniqueId}">
    <blockquote class="tiktok-embed" cite="${targetUrl}" data-video-id="${videoId}" style="width: 100%; margin: 0 auto;">
      <section>
        <a target="_blank" href="${targetUrl}">${link.title || targetUrl}</a>
      </section>
    </blockquote>
  </div>

  <div id="tiktok-iframe-wrapper-${uniqueId}" style="display: none;">
    <div style="position: relative; width: 100%; padding-top: 177.77%; overflow: hidden; border-radius: 12px;">
      <iframe src="https://www.tiktok.com/embed/v2/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" loading="lazy" allowfullscreen></iframe>
    </div>
  </div>

  <div id="tiktok-link-fallback-${uniqueId}" style="display: none; text-align: center; margin-top: 12px;">
    <a href="${link.intentUrl}" style="display: inline-block; background: #00f2fe; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: bold; text-decoration: none;">
      ▶ Open in TikTok Android App
    </a>
  </div>
</div>

<script>
(function() {
  var jsWrap = document.getElementById('tiktok-js-wrapper-${uniqueId}');
  var ifrWrap = document.getElementById('tiktok-iframe-wrapper-${uniqueId}');
  var ifr = ifrWrap ? ifrWrap.querySelector('iframe') : null;
  var linkFall = document.getElementById('tiktok-link-fallback-${uniqueId}');
  setTimeout(function() {
    if (jsWrap && !jsWrap.querySelector('iframe')) {
      jsWrap.style.display = 'none';
      if (ifrWrap) ifrWrap.style.display = 'block';
      if (ifr) {
        ifr.onerror = function() {
          ifrWrap.style.display = 'none';
          if (linkFall) linkFall.style.display = 'block';
        };
      }
    }
  }, 2200);
})();
</script>`;
  });

  return snippets.join('\n\n') + '\n\n<script async src="https://www.tiktok.com/embed.js"></script>';
}
