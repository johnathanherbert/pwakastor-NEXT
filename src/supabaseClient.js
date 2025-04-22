import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client with enhanced real-time options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Setup client status listener for debugging
const channel = supabase.channel('system')
  .on('system', { event: 'connected' }, () => {
    console.log('Realtime connection established');
  })
  .on('system', { event: 'disconnected' }, () => {
    console.log('Realtime connection closed');
  })
  .subscribe((status, err) => {
    if (status !== 'SUBSCRIBED') {
      console.error('Realtime connection error:', err);
    }
  });