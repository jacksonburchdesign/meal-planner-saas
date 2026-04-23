"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeRecipeTextAndImage = scrapeRecipeTextAndImage;
exports.extractPinterestBoardLinks = extractPinterestBoardLinks;
const cheerio = __importStar(require("cheerio"));
/**
 * Strips HTML to basic text while isolating the OpenGraph Image.
 */
async function scrapeRecipeTextAndImage(url) {
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
    }
    catch (error) {
        console.error(`Error scraping ${url}:`, error);
        throw new Error('Failed to scrape the provided URL.');
    }
}
/**
 * Extracts outbound links securely from a Pinterest Board using the internal __PWS_DATA__ configuration
 */
async function extractPinterestBoardLinks(boardUrl) {
    try {
        const res = await fetch(boardUrl);
        const html = await res.text();
        // 1. Extract all URLs from the raw HTML payload (Pinterest dynamically hydrates strings)
        const rawUrls = html.match(/https?:\/\/[^\"]+/g) || [];
        // 2. Filter out internal domains, assets, and standard tracking origins
        const uniqueRaw = Array.from(new Set(rawUrls)).filter((u) => {
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
        const externalLinks = uniqueRaw.map((u) => u.replace(/\\u0026/g, '&'));
        return externalLinks;
    }
    catch (error) {
        console.error(`Error processing Pinterest board ${boardUrl}:`, error);
        return [];
    }
}
//# sourceMappingURL=scrapers.js.map