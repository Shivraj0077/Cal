import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
    try {
        const user = verifyToken(req);
        if (user.role !== 'HOST') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('availability_rules')
            .select('*')
            .eq('host_id', user.userId)
            .order('day_of_week')
            .order('start_time');

        if (error) {
            console.error('Supabase error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json(data);
    } catch (err) {
        console.error('GET /api/availability/rules error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}