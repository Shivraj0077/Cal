// app/api/event-types/route.js
import { supabase } from '@/lib/supabaseClient';
import { verifyToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (user.role !== 'HOST') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      duration, 
      bufferBefore = 0, 
      bufferAfter = 0, 
      minNoticeHours = 0,
    } = body;

    if (!title || !duration) {
      return Response.json({ error: 'Title and duration required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_types')
      .insert({
        id: randomUUID(),
        host_id: user.userId,
        title,
        description: description || '',
        duration: Number(duration),
        buffer_before_min: Number(bufferBefore),
        buffer_after_min: Number(bufferAfter),
        min_notice_hours: Number(minNoticeHours),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get('hostId');

    if (!hostId) {
      return Response.json({ error: 'hostId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .eq('host_id', hostId)
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = verifyToken(req);
    if (user.role !== 'HOST') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json({ error: 'Event type ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_types')
      .update(updates)
      .eq('id', id)
      .eq('host_id', user.userId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}