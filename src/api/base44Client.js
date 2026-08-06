import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezmibiuwkdrbiyynkdrb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função auxiliar para tratar entradas de email/senha (objeto vs argumentos)
const parseAuthCredentials = (arg1, arg2) => {
  let email = '';
  let password = '';
  let metadata = {};

  if (typeof arg1 === 'object' && arg1 !== null) {
    email = arg1.email || arg1.username || '';
    password = arg1.password || '';
    metadata = arg1.metadata || {};
  } else {
    email = arg1 || '';
    password = arg2 || '';
  }

  return { email, password, metadata };
};

export const base44 = {
  auth: {
    loginViaEmailPassword: async (arg1, arg2) => {
      const { email, password } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    login: async (arg1, arg2) => {
      const { email, password } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    register: async (arg1, arg2, arg3) => {
      const { email, password, metadata } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return data;
    },
    signUp: async (arg1, arg2, arg3) => {
      const { email, password, metadata } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return data;
    },

    loginWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return data;
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },

    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }
  },

  entities: {
    get: async (tableName) => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return data;
    },
    find: async (tableName, query = {}) => {
      const { data, error } = await supabase.from(tableName).select('*').match(query);
      if (error) throw error;
      return data;
    },
    create: async (tableName, recordData) => {
      const { data, error } = await supabase.from(tableName).insert([recordData]).select();
      if (error) throw error;
      return data[0];
    },
    update: async (tableName, id, recordData) => {
      const { data, error } = await supabase.from(tableName).update(recordData).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (tableName, id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  }
};
