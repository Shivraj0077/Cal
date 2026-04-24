import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { data: hosts, error } = await supabase
            .from('users')
            .select('id, username, role, timezone')
            .eq('role', 'HOST');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ hosts });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
