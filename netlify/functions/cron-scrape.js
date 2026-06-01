// netlify/functions/cron-scrape.js
import { schedule } from '@netlify/functions';

// This handles the 6-hour cron interval natively on Netlify
export const handler = schedule('0 */6 * * *', async (event) => {
    try {
        // Netlify automatically provides the live site URL via process.env.URL
        const baseUrl = process.env.URL || 'http://localhost:3000';

        console.log(`Pinging scraper endpoint at: ${baseUrl}/api/scrape`);
        const response = await fetch(`${baseUrl}/api/scrape`);

        return {
            statusCode: response.status,
            body: `Scraper pinged successfully. Status: ${response.status}`,
        };
    } catch (error) {
        console.error('Failed to trigger automated scrape:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
});