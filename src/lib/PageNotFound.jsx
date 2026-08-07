import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="inline-flex p-4 bg-red-50 text-red-500 rounded-full mb-2">
          <AlertCircle size={48} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Página Não Encontrada</h2>
          <p className="text-sm text-slate-500">
            A página que você está tentando acessar não existe ou foi movida.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2c6a] text-white rounded-xl text-xs font-bold hover:bg-[#121f4c] transition shadow-sm w-full"
        >
          <Home size={16} />
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
}
