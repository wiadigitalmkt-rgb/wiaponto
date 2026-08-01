import { Lock } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Lock className="text-red-500" size={28} />
      </div>
      <h2 className="text-lg font-bold text-slate-800">Acesso Restrito</h2>
      <p className="text-sm text-slate-500 mt-1">
        O módulo de Pró-Labore está disponível apenas para sócios e administradores.
      </p>
    </div>
  );
}