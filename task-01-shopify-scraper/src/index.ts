import express, { Request, Response } from 'express';
import { scrapeShopify } from './scraper';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoint
app.post('/scrape', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send({ error: 'URL is required' });
  }

  try {
    console.log(`Processing URL: ${url}`);
    const result = await scrapeShopify(url);
    console.log('Scraping result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error in /scrape endpoint:', error);
    res.status(500).send({ error: 'Failed to scrape Shopify store' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
