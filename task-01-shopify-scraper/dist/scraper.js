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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
        console.log("Call me: scrapeShopify");
        try {
            const browser = yield puppeteer_1.default.launch();
            const page = yield browser.newPage();
            console.log(`Navigating to: ${url}`);
            yield page.goto(url, { waitUntil: 'domcontentloaded' });
            const html = yield page.content();
            console.log(`\nFetched HTML length: ${html.length}`);
            console.log(`\nHTML content preview: ${html.substring(0, 200)}`);
            const $ = cheerio.load(html);
            console.log(`\nPage title: ${$('title').text()}`);
            const fonts = [];
            $('style').each((_, element) => {
                const cssContent = $(element).html();
                const fontFaceRegex = /@font-face\s*{[^}]*font-family:\s*["']?([^;"']+)["']?;[^}]*src:\s*url\(([^)]+)\)[^;}]*;/g;
                let match;
                while ((match = fontFaceRegex.exec(cssContent)) !== null) {
                    fonts.push({
                        family: match[1],
                        variants: '400',
                        letterSpacings: '0.01em',
                        fontWeight: '400',
                        url: match[2].replace(/^\/\//, 'https://').replace(/["']/g, '')
                    });
                }
            });
            const uniqueFonts = fonts.filter((font, index, self) => index === self.findIndex((f) => f.family === font.family && f.url === font.url));
            const primaryButtonStyles = yield page.evaluate(() => {
                var _a;
                const buttons = Array.from(document.querySelectorAll('button, a'));
                let primaryButton = null;
                for (const button of buttons) {
                    const text = ((_a = button.textContent) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || '';
                    const className = button.className || '';
                    if ((text.includes('add to cart') || text.includes('buy now')) &&
                        (className.includes('add-to-cart') || className.includes('button'))) {
                        primaryButton = button;
                        break;
                    }
                }
                if (!primaryButton)
                    return null;
                const computedStyle = window.getComputedStyle(primaryButton);
                return {
                    fontFamily: computedStyle.fontFamily,
                    fontSize: computedStyle.fontSize,
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color,
                    borderColor: computedStyle.borderColor,
                    borderWidth: computedStyle.borderWidth,
                    borderRadius: computedStyle.borderRadius,
                    lineHeight: computedStyle.lineHeight,
                    textTransform: computedStyle.textTransform,
                    letterSpacing: computedStyle.letterSpacing,
                    textAlign: computedStyle.textAlign,
                    textDecoration: computedStyle.textDecoration,
                };
            });
            if (!primaryButtonStyles) {
                console.warn("Primary button not found.");
            }
            else {
                console.log("Primary Button Computed Styles:", primaryButtonStyles);
            }
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
                borderRadius: '3px'
            };
            yield browser.close();
            return { fonts: uniqueFonts, primaryButton };
        }
        catch (error) {
            console.error('Error scraping Shopify:', error.message);
            throw new Error('Failed to scrape Shopify store.');
        }
    });
}
