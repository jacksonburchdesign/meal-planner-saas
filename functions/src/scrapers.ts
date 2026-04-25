import * as cheerio from 'cheerio';

/**
 * Strips HTML to basic text while isolating the OpenGraph Image.
 */
export async function scrapeRecipeTextAndImage(url: string): Promise<{ text: string, imageUrl?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract OpenGraph Image
    const ogImage = $('meta[property="og:image"]').attr('content');

    // Remove noisy text elements
    $('script, style, nav, footer, header, aside, .ad, .ads, .sidebar, iframe, noscript').remove();
    const cleanText = $('body').text().replace(/\s+/g, ' ').trim();

    return { text: cleanText, imageUrl: ogImage };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw new Error('Failed to scrape the provided URL.');
  }
}

/**
 * Extracts outbound links securely from a Pinterest Board using the internal __PWS_DATA__ configuration
 */
export async function extractPinterestBoardLinks(boardUrl: string): Promise<string[]> {
  try {
    const res = await fetch(boardUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    const html = await res.text();

    // 1. Try to parse the modern __PWS_INITIAL_PROPS__ JSON payload
    let rawUrls: string[] = [];
    try {
      const match = html.match(/<script id="__PWS_INITIAL_PROPS__" type="application\/json">([\s\S]*?)<\/script>/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        const pins = data.initialReduxState?.pins || {};
        for (const key of Object.keys(pins)) {
          if (pins[key]?.link) {
            rawUrls.push(pins[key].link);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse __PWS_INITIAL_PROPS__, falling back to regex.");
    }

    // 2. Fallback regex if JSON parsing fails (handles JSON escaped slashes and quotes)
    if (rawUrls.length === 0) {
      const regexUrls = html.match(/https?:\\?\/\\?\/[^\s"'><\\]+/g) || [];
      rawUrls = regexUrls.map(u => u.replace(/\\/g, ''));
    }

    // 3. Filter out internal domains, assets, and standard tracking origins
    const uniqueRaw = Array.from(new Set(rawUrls)).filter((u: string) => {
       const L = u.toLowerCase();
       return !L.includes('pinterest.') &&
              !L.includes('pinimg.') &&
              !L.includes('w3.org') &&
              !L.includes('apple.com') &&
              !L.includes('google.com') &&
              !L.includes('amazon-adsystem') &&
              !L.includes('schema.org') &&
              !L.includes('github.com');
    });

    // 4. Clean up any escaped JSON entities from the Regex match
    const externalLinks = uniqueRaw.map((u: string) => u.replace(/\\u0026/g, '&').replace(/u0026/g, '&'));

    return externalLinks;
  } catch (error) {
    console.error(`Error processing Pinterest board ${boardUrl}:`, error);
    return [];
  }
}
