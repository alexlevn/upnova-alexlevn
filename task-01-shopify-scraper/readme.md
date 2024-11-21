# Alex - Shopify Scraper

## Overview

**Shopify Scraper** is an API built with **TypeScript** and **Express.js**, using **Puppeteer** and **Cheerio** to extract font and primary button details from Shopify product pages.

---

## Setup

### Requirements:

- **Node.js** >= 16.x
- **npm** or **yarn**

### Steps:

```bash
npm install
```

---

## Run Project

### Development Mode:

```bash
npm run dev
```

- Runs `TypeScript` in `watch` mode and restarts the server on changes.

### Access API:

```sh
http://localhost:3000
```

---

## API Guide

### Endpoint:

**POST** `/scrape`

### Request:

Send a Shopify product URL in the request body:

```json
{
  "url": "https://growgrows.com/en-us/products/plentiful-planets-sleepsuit"
}
```

### Testing:

1. **Using `curl`:**

```bash
curl -X POST http://localhost:3000/scrape \
-H "Content-Type: application/json" \
-d '{"url": "https://growgrows.com/en-us/products/plentiful-planets-sleepsuit"}'
```

2. **Using Postman:**

   - Method: `POST`
   - URL: `http://localhost:3000/scrape`
   - Body:

   ```json
   {
     "url": "https://growgrows.com/en-us/products/plentiful-planets-sleepsuit"
   }
   ```

3. **Test other Shopify product URLs.**

---

## Response Format

Example JSON response:

```json
{
  "fonts": [
    {
      "family": "Nunito Sans",
      "variants": "400",
      "letterSpacings": "0.01em",
      "fontWeight": "400",
      "url": "https://growgrows.com/cdn/fonts/nunito_sans/nunitosans_n4.woff2"
    }
  ],
  "primaryButton": {
    "fontFamily": "Helvetica, Arial, sans-serif",
    "fontSize": "16px",
    "lineHeight": "1.5",
    "letterSpacing": "0.08em",
    "textTransform": "uppercase",
    "textDecoration": "none",
    "textAlign": "center",
    "backgroundColor": "rgb(255, 0, 0)",
    "color": "rgb(255, 255, 255)",
    "borderColor": "rgb(0, 0, 0)",
    "borderWidth": "1px",
    "borderRadius": "4px"
  }
}
```

---

## Notes

- Ensure the **Shopify URL** is valid.
- If the **primary button** is not found, default values are returned.

---

## Issues & Feedback

For support or issues, open an issue on the repository or contact via email.
