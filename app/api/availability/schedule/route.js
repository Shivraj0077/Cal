import { supabase } from '@/lib/supabaseClient';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  const user = verifyToken(req);
  if (user.role !== 'HOST') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: weekly } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('host_id', user.userId)
    .order('day_of_week')
    .order('start_time');

  const { data: overrides } = await supabase
    .from('date_overrides')
    .select('*')
    .eq('host_id', user.userId)
    .order('date')
    .order('start_time');

  return Response.json({
    weekly,
    overrides
  });
}
