import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezmibiuwkdrbiyynkdrb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interceptador para fingir respostas do Base44 que costumam dar 404
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Intercepta chamadas de configurações/estado do Base44
    if (url.includes('/public-settings-by-id/') || url.includes('/api/apps/public/')) {
      return new Response(
        JSON.stringify({
          id: 'wiaponto',
          name: 'Wiaponto',
          settings: {},
          status: 'active'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return originalFetch.apply(this, args);
  };
}

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
  // Simula o método .request(...) que algumas rotas do Base44 chamam diretamente
  request: async (endpoint, options) => {
    return { status: 'success', data: {} };
  },

  auth: {
    loginViaEmailPassword: async (arg1, arg2) => {
      const { email, password } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return {
        user: data.user,
        session: data.session,
        token: data.session?.access_token,
        ...data.user
      };
    },
    login: async (arg1, arg2) => {
      const { email, password } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return {
        user: data.user,
        session: data.session,
        token: data.session?.access_token,
        ...data.user
      };
    },

    register: async (arg1, arg2, arg3) => {
      const { email, password, metadata } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return {
        user: data.user,
        session: data.session,
        ...data.user
      };
    },
    signUp: async (arg1, arg2, arg3) => {
      const { email, password, metadata } = parseAuthCredentials(arg1, arg2);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return {
        user: data.user,
        session: data.session,
        ...data.user
      };
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
      if (error && error.name !== 'AuthSessionMissingError') throw error;
      return user || null;
    },
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.name !== 'AuthSessionMissingError') throw error;
      return user || null;
    }
  },

  entities: {
    get: async (tableName) => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) return [];
      return data;
    },
    find: async (tableName, query = {}) => {
      const { data, error } = await supabase.from(tableName).select('*').match(query);
      if (error) return [];
      return data;
    },
    create: async (tableName, recordData) => {
      const { data, error } = await supabase.from(tableName).insert([recordData]).select();
      if (error) throw error;
      return data ? data[0] : recordData;
    },
    update: async (tableName, id, recordData) => {
      const { data, error } = await supabase.from(tableName).update(recordData).eq('id', id).select();
      if (error) throw error;
      return data ? data[0] : recordData;
    },
    delete: async (tableName, id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  }
};
