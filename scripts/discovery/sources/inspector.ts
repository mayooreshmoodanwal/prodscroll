export interface PageMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  ogVideo?: string;
  favicon?: string;
  careersUrl?: string;
  docsUrl?: string;
  pricingUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  contactEmail?: string;
  isReachable: boolean;
}

export async function inspectUrl(url: string): Promise<PageMetadata> {
  const result: PageMetadata = { isReachable: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 ProdgramDiscovery/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return result;
    result.isReachable = true;

    const html = await res.text();
    const cleanHtml = html.slice(0, 150000); // Only inspect head/body start

    // Extract title
    const titleMatch = cleanHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.title = titleMatch[1].trim();

    // Extract meta description
    const descMatch =
      cleanHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
      cleanHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) result.description = descMatch[1].trim();

    // Extract OG Image
    const ogImgMatch =
      cleanHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImgMatch) {
      const img = ogImgMatch[1].trim();
      result.ogImage = img.startsWith("http") ? img : new URL(img, url).toString();
    }

    // Extract OG Video
    const ogVidMatch =
      cleanHtml.match(/<meta[^>]*property=["']og:video(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
      cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i);
    if (ogVidMatch) {
      const vid = ogVidMatch[1].trim();
      result.ogVideo = vid.startsWith("http") ? vid : new URL(vid, url).toString();
    }

    // Extract Favicon
    const iconMatch =
      cleanHtml.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
      cleanHtml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (iconMatch) {
      const icon = iconMatch[1].trim();
      result.favicon = icon.startsWith("http") ? icon : new URL(icon, url).toString();
    }

    // Extract GitHub repo link
    const repoMatch = cleanHtml.match(/href=["'](https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)["']/i);
    if (repoMatch) result.repoUrl = repoMatch[1];

    // Extract Documentation link
    const docsMatch = cleanHtml.match(/href=["']((?:https?:\/\/[^"']*docs[^"']*)|(?:\/docs[^"']*))["']/i);
    if (docsMatch) {
      const d = docsMatch[1];
      result.docsUrl = d.startsWith("http") ? d : new URL(d, url).toString();
    }

    // Extract Pricing link
    const pricingMatch = cleanHtml.match(/href=["']((?:https?:\/\/[^"']*pricing[^"']*)|(?:\/pricing[^"']*))["']/i);
    if (pricingMatch) {
      const p = pricingMatch[1];
      result.pricingUrl = p.startsWith("http") ? p : new URL(p, url).toString();
    }

    // Extract Careers link
    const careersMatch = cleanHtml.match(/href=["']((?:https?:\/\/[^"']*(?:careers|jobs)[^"']*)|(?:\/(?:careers|jobs)[^"']*))["']/i);
    if (careersMatch) {
      const c = careersMatch[1];
      result.careersUrl = c.startsWith("http") ? c : new URL(c, url).toString();
    }

    // Extract LinkedIn link
    const linkedinMatch = cleanHtml.match(/href=["'](https:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_.-]+)["']/i);
    if (linkedinMatch) result.linkedinUrl = linkedinMatch[1];

    // Extract mailto email
    const mailtoMatch = cleanHtml.match(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/i);
    if (mailtoMatch) result.contactEmail = mailtoMatch[1];
  } catch {
    // URL inspection failed or timed out
  }
  return result;
}
