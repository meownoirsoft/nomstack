import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearSubscriptions() {
  console.log('Fetching all subscriptions...');
  
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*');
  
  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }
  
  console.log('Found subscriptions:', subscriptions);
  
  if (subscriptions.length === 0) {
    console.log('No subscriptions found.');
    return;
  }
  
  // Commented out deletion for safety
  // console.log('\nDeleting all subscriptions...');
  // const { error: deleteError } = await supabase
  //   .from('user_subscriptions')
  //   .delete()
  //   .neq('id', '00000000-0000-0000-0000-000000000000');
  // if (deleteError) {
  //   console.error('Error deleting subscriptions:', deleteError);
  //   return;
  // }
  // console.log('All subscriptions cleared successfully!');
}

clearSubscriptions();
