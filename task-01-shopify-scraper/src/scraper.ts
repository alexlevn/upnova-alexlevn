import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { FontStyle, ButtonStyle, ScraperResponse } from './types';

export async function scrapeShopify(url: string): Promise<ScraperResponse> {
  let browser;

  try {
    // Launch a Puppeteer browser instance in headless mode
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Navigate to the provided URL and wait until the DOM content is fully loaded
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Retrieve the HTML content of the page
    const html = await page.content();
    const $ = cheerio.load(html);

    // Collect font information from <style> and <link> tags
    const fonts: FontStyle[] = [];
    $('style, link[rel="stylesheet"]').each((_, element) => {
      const content = $(element).html() || $(element).attr('href');
      if (!content) return;

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
    const uniqueFonts = fonts.filter((font, index, self) =>
      index === self.findIndex((f) => f.family === font.family && f.url === font.url)
    );

    // Extract styles of the primary button (e.g., Add to Cart button)
    const primaryButtonStyles = await page.evaluate(() => {
      const primaryButton = document.querySelector('button.add-to-cart, a.add-to-cart, button, a');
      if (!primaryButton) return null;

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
      borderRadius: '3px',
    };

    // Close the browser instance
    await browser.close();

    // Return the collected fonts and primary button styles
    return { fonts: uniqueFonts, primaryButton };
  } catch (error) {
    // Log the error message and rethrow the error
    console.error('Error scraping Shopify:', (error as Error).message);
    throw new Error('Failed to scrape Shopify store.');
  } finally {
    // Ensure the browser instance is closed even if an error occurs
    if (browser) await browser.close();
  }
}
