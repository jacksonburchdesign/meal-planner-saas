import * as cheerio from 'cheerio';

/**
 * Strips HTML to basic text while isolating the OpenGraph Image.
 */
export async function scrapeRecipeTextAndImage(url: string): Promise<{ text: string, imageUrl?: string }> {
  try {
    const res = await fetch(url);
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
    const res = await fetch(boardUrl);
    const html = await res.text();

    // 1. Extract all URLs from the raw HTML payload (Pinterest dynamically hydrates strings)
    const rawUrls = html.match(/https?:\/\/[^\"]+/g) || [];

    // 2. Filter out internal domains, assets, and standard tracking origins
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

    // 3. Clean up any escaped JSON entities from the Regex match
    const externalLinks = uniqueRaw.map((u: string) => u.replace(/\\u0026/g, '&'));

    return externalLinks;
  } catch (error) {
    console.error(`Error processing Pinterest board ${boardUrl}:`, error);
    return [];
  }
}
