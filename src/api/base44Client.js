import { createClient } from '@supabase/supabase-js';

// Pega as variáveis configuradas na Vercel / .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ponte de compatibilidade para simular o Base44 usando o Supabase
export const base44 = {
  auth: {
    // Mapeia chamadas antigas de cadastro
    register: async (email, password, metadata = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return data;
    },
    // Mapeia chamadas antigas de login
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },
    // Mapeia logout
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },
    // Mapeia busca do usuário atual
    getUser: async () => {
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
