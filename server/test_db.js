import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, is_active, roles(name)')
    .eq('id', 'b29034db-3996-4bf7-89e9-f38e7d382ae2')
    .single();
    
  console.log('User data:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

run();
