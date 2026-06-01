import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovyczubtrnaqxaajfjge.supabase.co';
const supabaseKey = 'sb_publishable_TWsJmRCKd6AiJUFxARWvDw_IWhFfyNm';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // Prevents server-side session socket leaks
    },
    global: {
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                cache: 'no-store', // Forces a fresh, clean connection connection block every time
            });
        },
    },
});