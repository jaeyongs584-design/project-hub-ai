import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
        console.error('Supabase error:', error);
    } else {
        console.log('Supabase success:', data);
    }
}

test();
