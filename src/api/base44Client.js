import { createClient } from '@supabase/supabase-js';

// As variáveis do Supabase (Insira suas chaves do painel do Supabase se tiver)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima-aqui';

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Camada de compatibilidade (Mock/Adaptador) para não quebrar chamadas antigas do Base44
export const base44 = {
  auth: supabase.auth,
  entities: {
    // Redireciona buscas de tabelas/entidades para o Supabase
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
