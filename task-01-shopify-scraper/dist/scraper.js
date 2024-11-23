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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeShopify = scrapeShopify;
const cheerio = __importStar(require("cheerio"));
const puppeteer_1 = __importDefault(require("puppeteer"));
function scrapeShopify(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let browser;
        try {
            // Launch a Puppeteer browser instance in headless mode
            browser = yield puppeteer_1.default.launch({ headless: true, args: ['--no-sandbox'] });
            const page = yield browser.newPage();
            // Navigate to the provided URL and wait until the DOM content is fully loaded
            yield page.goto(url, { waitUntil: 'domcontentloaded' });
            // Retrieve the HTML content of the page
            const html = yield page.content();
            const $ = cheerio.load(html);
            // Collect font information from <style> and <link> tags
            const fonts = [];
            $('style, link[rel="stylesheet"]').each((_, element) => {
                const content = $(element).html() || $(element).attr('href');
                if (!content)
                    return;
                // Regular expression to find @font-face declarations
                const fontFaceRegex = /@font-face[^}]*{[^}]*font-family:\s*['"]?([^;"']+)['"]?[^}]*src:\s*url\(([^)]+)\)[^;}]*;/g;
                let match;
                while ((match = fontFaceRegex.exec(content)) !== null) {
                    fonts.push({
                        family: match[1],
                        url: match[2].replace(/^\/\//, 'https://').replace(/["']/g, ''),
                        fontWeight: '400',
                        variants: '400',
                        letterSpacings: '0.01em',
                    });
                }
            });
            // Filter fonts to remove duplicates based on family name and URL
            const uniqueFonts = fonts.filter((font, index, self) => index === self.findIndex((f) => f.family === font.family && f.url === font.url));
            // Extract styles of the primary button (e.g., Add to Cart button)
            const primaryButtonStyles = yield page.evaluate(() => {
                const primaryButton = document.querySelector('button.add-to-cart, a.add-to-cart, button, a');
                if (!primaryButton)
                    return null;
                // Get computed styles of the primary button
                const computedStyle = window.getComputedStyle(primaryButton);
                return {
                    fontFamily: computedStyle.fontFamily || 'Default',
                    fontSize: computedStyle.fontSize || '16px',
                    backgroundColor: computedStyle.backgroundColor || '#000',
                    color: computedStyle.color || '#fff',
                    borderColor: computedStyle.borderColor || '#ccc',
                    borderWidth: computedStyle.borderWidth || '1px',
                    borderRadius: computedStyle.borderRadius || '0px',
                    lineHeight: computedStyle.lineHeight || 'normal',
                    textTransform: computedStyle.textTransform || 'none',
                    letterSpacing: computedStyle.letterSpacing || 'normal',
                    textAlign: computedStyle.textAlign || 'left',
                    textDecoration: computedStyle.textDecoration || 'none',
                };
            });
            // Use default styles if the primary button is not found
            const primaryButton = primaryButtonStyles || {
                fontFamily: 'Unknown',
                fontSize: '16px',
                lineHeight: '1.5',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                textAlign: 'left',
                backgroundColor: 'rgb(144, 197, 139)',
                color: 'rgb(255, 255, 255)',
                borderColor: 'rgb(144, 197, 139)',
                borderWidth: '1px',
                borderRadius: '3px',
            };
            // Close the browser instance
            yield browser.close();
            // Return the collected fonts and primary button styles
            return { fonts: uniqueFonts, primaryButton };
        }
        catch (error) {
            // Log the error message and rethrow the error
            console.error('Error scraping Shopify:', error.message);
            throw new Error('Failed to scrape Shopify store.');
        }
        finally {
            // Ensure the browser instance is closed even if an error occurs
            if (browser)
                yield browser.close();
        }
    });
}
