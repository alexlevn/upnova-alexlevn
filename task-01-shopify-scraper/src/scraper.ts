import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { FontStyle, ButtonStyle, ScraperResponse } from './types';

export async function scrapeShopify(url: string): Promise<ScraperResponse> {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const fonts: FontStyle[] = [];
    $('style').each((_, element) => {
      const cssContent = $(element).html();
      const fontFaceRegex = /@font-face\s*{[^}]*font-family:\s*["']?([^;"']+)["']?;[^}]*src:\s*url\(([^)]+)\)[^;}]*;/g;

      let match;
      while ((match = fontFaceRegex.exec(cssContent as string)) !== null) {
        fonts.push({
          family: match[1],
          variants: '400',
          letterSpacings: '0.01em',
          fontWeight: '400',
          url: match[2].replace(/^\/\//, 'https://').replace(/["']/g, '')
        });
      }
    });

    const uniqueFonts = fonts.filter((font, index, self) =>
      index === self.findIndex((f) => f.family === font.family && f.url === font.url)
    );

    const primaryButtonStyles = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      let primaryButton: HTMLElement | null = null;

      for (const button of buttons) {
        const text = button.textContent?.trim().toLowerCase() || '';
        const className = button.className || '';
        if (
          (text.includes('add to cart') || text.includes('buy now')) &&
          (className.includes('add-to-cart') || className.includes('button'))
        ) {
          primaryButton = button as HTMLElement;
          break;
        }
      }

      if (!primaryButton) return null;

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
    } else {
      console.log("Primary Button Computed Styles:", primaryButtonStyles);
    }

    const primaryButton: ButtonStyle = primaryButtonStyles || {
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

    await browser.close();

    return { fonts: uniqueFonts, primaryButton };

  } catch (error) {
    console.error('Error scraping Shopify:', (error as Error).message);
    throw new Error('Failed to scrape Shopify store.');
  }
}
