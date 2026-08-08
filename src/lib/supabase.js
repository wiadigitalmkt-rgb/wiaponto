import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezmibiuwkdrbiyynkdrb.supabase.co';
const supabaseAnonKey = 'sb_publishable_3VkkCI86G1VZ7B_iTQaYBQ_MIhEARVK'; // Cole aqui a chave sb_publishable_... que você copiou

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
