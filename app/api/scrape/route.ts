import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const baseChannelUrl = 'https://t.me/s/pov_et';
    let elements: any[] = [];
    let currentBeforeId: string | null = null;
    const maxSteps = 80; // Deep crawl to catch 200-300+ historical photos

    try {
        for (let step = 0; step < maxSteps; step++) {
            const targetUrl = currentBeforeId ? `${baseChannelUrl}?before=${currentBeforeId}` : baseChannelUrl;
            const response = await fetch(targetUrl, {
                cache: 'no-store',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) break;

            const html = await response.text();
            const $ = cheerio.load(html);

            // FIX: Explicitly typed as any to prevent strict production type-narrowing bugs
            let batchEarliestId: any = null;

            $('.tgme_widget_message').each((_, el) => {
                const dataPost = $(el).attr('data-post');
                if (dataPost) {
                    const idStr = dataPost.split('/').pop();
                    const id = idStr ? parseInt(idStr, 10) : null;
                    if (id && (batchEarliestId === null || id < batchEarliestId)) {
                        batchEarliestId = id;
                    }
                }

                const styleAttr = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
                const imageMatch = styleAttr?.match(/background-image:url\('(.+?)'\)/);
                const imageUrl = imageMatch ? imageMatch[1] : null;

                const rawCaption = $(el).find('.tgme_widget_message_text').text() || '';

                if (imageUrl && rawCaption) {
                    // 🎯 MAGIC REGEX: Extract the photographer handle after "by @"
                    const authorMatch = rawCaption.match(/by\s+@([\w_]+)/i);
                    const authorCredit = authorMatch ? `@${authorMatch[1]}` : '@archive';

                    // 🧼 CLEAN ENGINE: Strip out the attribution text and telegram handles from the final display caption
                    let cleanedCaption = rawCaption
                        .replace(/📷\s*by\s*@[\w_]+/i, '') // Removes "📷 by @username"
                        .replace(/@pov_et/g, '')           // Removes channel spam tags
                        .replace(/\s+/g, ' ')              // Collapses extra spaces
                        .trim();

                    elements.push({
                        image_url: imageUrl,
                        caption: cleanedCaption || "Addis Street Frame",
                        author_credit: authorCredit,
                        status: 'approved'
                    });
                }
            });

            // FIX: Fully safe string evaluation that passes the compiler safely
            if (batchEarliestId !== null && batchEarliestId !== undefined) {
                currentBeforeId = String(batchEarliestId);
            } else {
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 150));
        }

        if (elements.length > 0) {
            await supabase.from('photos').upsert(elements, { onConflict: 'image_url' });
        }

        return NextResponse.json({ success: true, totalScraped: elements.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}