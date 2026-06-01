// @ts-nocheck
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    const targetUrl = 'https://t.me/s/pov_et';
    let elements: any[] = [];

    try {
        // 1. Fetch only the front page containing the latest ~20 messages
        const response = await fetch(targetUrl, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Telegram preview channel unreachable: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 2. Parse the latest frame items
        $('.tgme_widget_message').each((_, el) => {
            const styleAttr = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
            const imageMatch = styleAttr?.match(/background-image:url\('(.+?)'\)/);
            const imageUrl = imageMatch ? imageMatch[1] : null;

            const rawCaption = $(el).find('.tgme_widget_message_text').text() || '';

            if (imageUrl && rawCaption) {
                // 🎯 Extract photographer handle after "by @"
                const authorMatch = rawCaption.match(/by\s+@([\w_]+)/i);
                const authorCredit = authorMatch ? `@${authorMatch[1]}` : '@archive';

                // 🧼 Strip out channel clutter and spam tags
                let cleanedCaption = rawCaption
                    .replace(/📷\s*by\s*@[\w_]+/i, '') // Removes "📷 by @username"
                    .replace(/@pov_et/g, '')           // Removes channel tags
                    .replace(/\s+/g, ' ')              // Collapses spaces
                    .trim();

                elements.push({
                    image_url: imageUrl,
                    caption: cleanedCaption || "Addis Street Frame",
                    author_credit: authorCredit,
                    status: 'approved'
                });
            }
        });

        // 3. Smart Upsert Pipeline
        let newRecordsCount = 0;
        if (elements.length > 0) {
            // Upsert checks 'image_url' conflicts automatically and only injects fresh frames
            const { data, error } = await supabase
                .from('photos')
                .upsert(elements, { onConflict: 'image_url' })
                .select();

            if (error) throw error;
            newRecordsCount = data?.length || 0;
        }

        return NextResponse.json({
            success: true,
            message: "Incremental sync successful",
            processedInStream: elements.length
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}