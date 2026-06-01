import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const channelUrl = 'https://t.me/s/pov_et';

    try {
        const response = await fetch(channelUrl, { cache: 'no-store' });
        const html = await response.text();
        const $ = cheerio.load(html);

        const posts: any[] = [];

        $('.tgme_widget_message').each((i, el) => {
            // Extract background image from the style attribute
            const style = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
            const bgMatch = style?.match(/background-image:url\('(.+?)'\)/);
            const imageUrl = bgMatch ? bgMatch[1] : null;

            const captionText = $(el).find('.tgme_widget_message_text').text();

            if (imageUrl) {
                posts.push({
                    image_url: imageUrl,
                    caption: captionText || 'Untitled',
                    author_credit: 'Telegram Contributor', // Parse handle from caption if needed
                    status: 'pending' // Goes to CMS first
                });
            }
        });

        // Insert new posts into Supabase, avoiding duplicates (make image_url unique in DB)
        if (posts.length > 0) {
            const { error } = await supabase
                .from('photos')
                .upsert(posts, { onConflict: 'image_url' });

            if (error) console.error('Supabase Error:', error);
        }

        return NextResponse.json({ success: true, newPosts: posts.length });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 });
    }
}